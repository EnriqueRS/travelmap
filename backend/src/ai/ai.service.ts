import { Injectable, Logger } from '@nestjs/common';
import { Trip } from '../trips/entities/trip.entity';
import { Location } from '../locations/entities/location.entity';
import { Country } from '../geo/entities/country.entity';
import { User } from '../users/user.entity';
import { LiteLLMProvider } from './providers/litellm.provider';
import {
  SystemPromptBuilder,
  UserTravelContext,
} from './prompts/system-prompt';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto, InsightsResponseDto } from './dto/chat-response.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly llmProvider: LiteLLMProvider,
    private readonly promptBuilder: SystemPromptBuilder,
  ) {}

  /**
   * Build the travel context for a given user.
   */
  async buildUserContext(
    userId: number,
    language: string = 'es',
  ): Promise<UserTravelContext> {
    const trips = await Trip.query().where('user_id', userId);
    const locations = await Location.query().where('user_id', userId);

    const completed = trips.filter((t) => t.status === 'Completado');
    const planned = trips.filter((t) => t.status === 'Planificado');
    const ongoing = trips.filter((t) => t.status === 'En curso');

    // Extract unique visited countries from completed+ongoing trips
    const visitedCountryCodes = [
      ...new Set(
        trips
          .filter((t) => t.status === 'Completado' || t.status === 'En curso')
          .flatMap((t) => t.countries || []),
      ),
    ].filter(Boolean);

    // Map country codes to full names
    const countryMap = new Map<string, string>();
    if (visitedCountryCodes.length > 0) {
      const countries = await Country.query()
        .select('iso_alpha2', 'name')
        .whereIn('iso_alpha2', visitedCountryCodes);
      for (const c of countries) {
        countryMap.set(c.isoAlpha2, c.name);
      }
    }
    const visitedCountries = visitedCountryCodes.map(
      (code) => countryMap.get(code) || code,
    );

    // Fetch user home country and name
    let homeCountry: string | undefined;
    let userName: string | undefined;
    const user = await User.query().findById(userId).select('home_country', 'first_name', 'username');
    if (user) {
      if (user.homeCountry) {
        homeCountry = countryMap.get(user.homeCountry) || user.homeCountry;
      }
      // Use firstName if available, fallback to username
      userName = (user as any).firstName || (user as any).username || undefined;
    }

    // Extract continents from locations
    const continents = [
      ...new Set(locations.map((l) => this.guessContinentFromCountry(l.adminArea1))),
    ];

    // Top categories by location count
    const categoryCount = new Map<string, number>();
    for (const loc of locations) {
      categoryCount.set(loc.category, (categoryCount.get(loc.category) || 0) + 1);
    }
    const topCategories = [...categoryCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));

    // Recent trips (last 5 completed)
    const recentTrips = [...trips]
      .filter((t) => t.status === 'Completado')
      .sort(
        (a, b) =>
          new Date(b.endDate || 0).getTime() -
          new Date(a.endDate || 0).getTime(),
      )
      .slice(0, 5)
      .map((t) => ({
        name: t.name,
        status: t.status,
        countries: t.countries || [],
        startDate: t.startDate,
        endDate: t.endDate,
      }));

    // Upcoming trips
    const upcomingTrips = [...trips]
      .filter((t) => t.status === 'Planificado')
      .sort(
        (a, b) =>
          new Date(a.startDate || 0).getTime() -
          new Date(b.startDate || 0).getTime(),
      )
      .slice(0, 3)
      .map((t) => ({
        name: t.name,
        countries: t.countries || [],
        startDate: t.startDate,
      }));

    // Average rating
    const ratedLocations = locations.filter((l) => l.rating != null);
    const averageRating =
      ratedLocations.length > 0
        ? ratedLocations.reduce((sum, l) => sum + (l.rating || 0), 0) /
          ratedLocations.length
        : 0;

    return {
      totalTrips: trips.length,
      completedTrips: completed.length,
      plannedTrips: planned.length,
      ongoingTrips: ongoing.length,
      totalLocations: locations.length,
      visitedCountries: visitedCountries.sort(),
      totalCountries: visitedCountries.length,
      continents,
      topCategories,
      recentTrips,
      upcomingTrips,
      averageRating,
      language,
      homeCountry,
      userName,
    };
  }

  /**
   * Attempt to extract JSON from LLM response.
   * Handles markdown code blocks, leading/trailing text, and malformed JSON.
   */
  private extractJson(raw: string): Record<string, unknown> | null {
    if (!raw) {
      this.logger.warn('extractJson: received empty string');
      return null;
    }

    let cleaned = raw.trim();

    // Strip markdown code block fences
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      cleaned = codeBlockMatch[1].trim();
    }

    // Find the first { and last } to extract the JSON object
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    if (startIdx !== -1 && endIdx > startIdx) {
      cleaned = cleaned.slice(startIdx, endIdx + 1);
    } else {
      this.logger.warn(`extractJson: no JSON object found in response. Raw: "${raw.slice(0, 300)}"`);
      return null;
    }

    // Attempt to parse
    try {
      const parsed = JSON.parse(cleaned);
      return this.sanitizeParsedJson(parsed);
    } catch (err) {
      this.logger.warn(`extractJson: first parse failed. First 200 chars: "${cleaned.slice(0, 200)}"`);
      // If that fails, try to fix common issues: unescaped quotes inside strings
      try {
        const fixed = cleaned.replace(
          /:\s*"([^"]*?)"([^,\]}\)])/g,
          (_match: string, p1: string, p2: string) => `: "${p1.replace(/"/g, "'")}"${p2}`,
        );
        const parsed = JSON.parse(fixed);
        return this.sanitizeParsedJson(parsed);
      } catch (err2) {
        this.logger.warn(`extractJson: fallback parse also failed. Error: ${(err2 as Error).message}`);
        return null;
      }
    }
  }

  /**
   * After parsing JSON, check if any string field contains nested JSON
   * and extract the plain text from it.
   */
  private sanitizeParsedJson(parsed: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string') {
        // If the string starts with { it might be nested JSON
        const trimmed = value.trim();
        if (trimmed.startsWith('{')) {
          try {
            const nested = JSON.parse(trimmed);
            // Extract the first meaningful text field from the nested object
            const textValue =
              (nested.reply as string) ||
              (nested.curiosity as string) ||
              (nested.greeting as string) ||
              (nested.text as string) ||
              Object.values(nested).find((v) => typeof v === 'string' && v.length > 20) as string;
            if (textValue) {
              result[key] = textValue;
              continue;
            }
          } catch {
            // Not valid JSON, keep as-is
          }
        }
        result[key] = value;
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  /**
   * Generate initial greeting and curiosity for a user.
   */
  async getInsights(
    userId: number,
    language: string = 'es',
  ): Promise<InsightsResponseDto> {
    const context = await this.buildUserContext(userId, language);
    const prompt = this.promptBuilder.buildInsightPrompt(context);

    const response = await this.llmProvider.chatCompletion({
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.9,
      maxTokens: 600,
      responseFormat: 'json_object',
    });

    const parsed = this.extractJson(response.content);
    if (parsed) {
      return {
        greeting: (parsed.greeting as string) || '¡Saludos, viajero!',
        curiosity:
          (parsed.curiosity as string) ||
          'Tus viajes guardan historias fascinantes.',
        suggestedQuestions: Array.isArray(parsed.suggestedQuestions)
          ? (parsed.suggestedQuestions as string[])
          : this.generateFallbackQuestions(context),
      };
    }

    this.logger.warn(
      `Failed to parse LLM JSON response for insights. Raw response (first 500 chars): "${response.content.slice(0, 500)}"`,
    );
    return {
      greeting: '¡Saludos, viajero!',
      curiosity: response.content.slice(0, 200),
      suggestedQuestions: this.generateFallbackQuestions(context),
    };
  }

  /**
   * Process a chat message with full travel context.
   */
  async chat(
    userId: number,
    dto: ChatRequestDto,
  ): Promise<ChatResponseDto> {
    const language = dto.language || 'es';
    const context = await this.buildUserContext(userId, language);
    const systemPrompt = this.promptBuilder.buildSystemPrompt(context);

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    messages.push({ role: 'user', content: dto.message });

    const response = await this.llmProvider.chatCompletion({
      messages,
      temperature: 0.7,
      maxTokens: 1024,
      responseFormat: 'json_object',
    });

    const parsed = this.extractJson(response.content);
    if (parsed) {
      return {
        reply: (parsed.reply as string) || response.content,
        suggestedActions: Array.isArray(parsed.suggestedActions)
          ? (parsed.suggestedActions as string[])
          : this.generateFallbackActions(context),
        conversationId: dto.conversationId,
      };
    }

    this.logger.warn('Failed to parse LLM JSON response for chat — sending raw');
    // Strip any obvious JSON wrapper from raw output so user sees clean text
    const cleaned = response.content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .replace(/^{"reply":\s*"/, '')
      .replace(/",\s*"suggestedActions":\s*\[.*\]\s*}$/, '')
      .trim();
    return {
      reply: cleaned || response.content,
      suggestedActions: this.generateFallbackActions(context),
      conversationId: dto.conversationId,
    };
  }

  /**
   * Generate fallback actions based on user context (template-based).
   * Returns 5-6 varied suggestions, shuffled randomly.
   */
  private generateFallbackActions(context: UserTravelContext): string[] {
    const pool: string[] = [];

    // Expert advisor questions (no specific country names to avoid language/hallucination issues)
    if (context.visitedCountries.length > 0) {
      pool.push('¿Cuál es mi estilo de viajero?');
      pool.push('¿En qué época del año viajo más?');
      pool.push('¿Qué países me faltan por explorar?');
      pool.push('¿Qué presupuesto necesito para mi próximo viaje?');
      pool.push('¿Cuál fue el viaje más lejano que hice?');
      pool.push('¿Qué tipo de destinos elijo con más frecuencia?');
    }

    // Recommendation questions
    pool.push('Recomiéndame mi próximo destino');
    pool.push('¿Qué destino me recomiendas para el próximo año?');
    pool.push('¿Qué país me recomiendas visitar por primera vez?');
    pool.push('¿Quécontinentes me faltan por visitar?');

    // Travel style / analysis
    pool.push('Analiza mi perfil de viajero');
    pool.push('¿Soy más de ciudad o de naturaleza?');
    pool.push('¿Qué categorías de lugares visiting más?');

    // Practical advice
    pool.push('¿Qué consejos me das para planificar mi próximo viaje?');
    pool.push('¿Cuántos países he visitado hasta ahora?');
    pool.push('¿Qué país fue el más lejano que visité?');

    // Upcoming trips
    if (context.ongoingTrips > 0) {
      pool.push('¿Qué consejos me das para mi viaje actual?');
    }
    if (context.upcomingTrips.length > 0) {
      pool.push('¿Qué debo saber antes de mi próximo viaje?');
    }

    return pool.sort(() => Math.random() - 0.5).slice(0, 6);
  }

  /**
   * Generate fallback questions for insights.
   * Expert travel advisor questions, no country names.
   */
  private generateFallbackQuestions(context: UserTravelContext): string[] {
    const pool: string[] = [];

    if (context.visitedCountries.length > 0) {
      pool.push('¿Cuál es mi estilo de viajero?');
      pool.push('Recomiéndame mi próximo destino');
      pool.push('¿Qué países me faltan por explorar?');
      pool.push('¿En qué época del año viajo más?');
      pool.push('¿Qué presupuesto necesito para mi próximo viaje?');
      pool.push('¿Cuál fue el viaje más lejano que hice?');
      pool.push('¿Qué tipo de destinos prefiero?');
      pool.push('Analiza mi perfil de viajero');
    } else {
      pool.push('¿Qué país me recomiendas visitar primero?');
      pool.push('¿Por dónde debería empezar a viajar?');
      pool.push('¿Qué presupuesto necesito para mi primer viaje?');
      pool.push('¿Qué destinos son buenos para principiantes?');
    }

    return pool.sort(() => Math.random() - 0.5).slice(0, 6);
  }

  /**
   * Simple continent guessing based on country ISO code.
   */
  private guessContinentFromCountry(_adminArea?: string): string {
    // Placeholder — a full implementation would use a country-to-continent map
    return 'Unknown';
  }
}