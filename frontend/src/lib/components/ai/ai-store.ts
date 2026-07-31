import { writable, get } from "svelte/store";
import { browser } from "$app/environment";
import axios from "axios";
import { API_URL, getToken } from "$lib/services/auth";

// ─── Types ───────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestedActions?: string[];
  timestamp: number;
}

export interface PreloadedGreeting {
  greeting: string;
  curiosity: string;
  suggestedQuestions: string[];
}

export type RyuMode = "closed" | "loading" | "chatting";

export interface AiState {
  mode: RyuMode;
  messages: ChatMessage[];
  conversationId: string | null;
  error: string | null;
  preloadedGreeting: PreloadedGreeting | null;
}

// ─── Initial State ───────────────────────────────────────────────────

const initialState: AiState = {
  mode: "closed",
  messages: [],
  conversationId: null,
  error: null,
  preloadedGreeting: null,
};

// ─── Store ───────────────────────────────────────────────────────────

function createAiStore() {
  const { subscribe, set, update } = writable<AiState>(initialState);

  function isAuthenticated(): boolean {
    return !!getToken();
  }

  function authHeader(): Record<string, string> {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Preload greeting from the LLM without opening the chat.
   * Called on mount so the data is ready when the user clicks.
   */
  async function preloadGreeting(language: string = "es"): Promise<void> {
    // Only preload once per page load: skip if already preloaded OR if chat has been used
    const current = get({ subscribe });
    if (current.preloadedGreeting || current.messages.length > 0) return;

    const greeting = await fetchGreeting(language);
    if (greeting) {
      update((s) => ({ ...s, preloadedGreeting: greeting }));
    } else {
      // Fallback greeting
      update((s) => ({
        ...s,
        preloadedGreeting: {
          greeting: "Saludos, viajero.",
          curiosity: "¿En qué puedo ayudarte a explorar tus recuerdos?",
          suggestedQuestions: [
            "Cuéntame una curiosidad sobre mis viajes",
            "Recomiéndame mi próximo destino",
            "Analiza mi estilo de viajero",
            "¿Qué país fue el más lejano que visité?",
            "¿Cuántos países he visitado?",
            "¿En qué época del año viajo más?",
          ],
        },
      }));
    }
  }

  /**
   * Open the chat using the preloaded greeting (or fetch if not available).
   */
  async function openWithGreeting(language: string = "es"): Promise<void> {
    update((s) => ({ ...s, mode: "loading" }));

    const state = get({ subscribe });
    let greeting = state.preloadedGreeting;

    if (!greeting) {
      greeting = await fetchGreeting(language);
    }

    if (!greeting) {
      update((s) => ({
        ...s,
        mode: "chatting",
        messages: [
          {
            id: crypto.randomUUID(),
            role: "assistant" as const,
            content: "Saludos, viajero. ¿En qué puedo ayudarte a explorar tus recuerdos?",
            suggestedActions: [
              "Cuéntame una curiosidad sobre mis viajes",
              "Recomiéndame mi próximo destino",
              "Analiza mi estilo de viajero",
            ],
            timestamp: Date.now(),
          },
        ],
        error: null,
      }));
      return;
    }

    const firstMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: `${greeting.greeting} ${greeting.curiosity}`,
      suggestedActions: greeting.suggestedQuestions,
      timestamp: Date.now(),
    };

    update((s) => ({
      ...s,
      mode: "chatting",
      messages: [firstMsg],
      preloadedGreeting: null, // consumed
      error: null,
    }));
  }

  /**
   * Fetch greeting from backend or demo.
   */
  async function fetchGreeting(language: string): Promise<{
    greeting: string;
    curiosity: string;
    suggestedQuestions: string[];
  } | null> {
    if (!isAuthenticated()) {
      await new Promise((r) => setTimeout(r, 800));

      const demos = [
        {
          greeting: "Saludos, joven viajero.",
          country: "Japón",
          curiosity: "Tus viajes de ejemplo guardan historias fascinantes. ¿Sabías que en Japón hay más de 6.800 islas? Aunque la mayoría conoce Honshu, Hokkaido, Kyushu y Shikoku, el archipiélago guarda miles de islas menores con culturas únicas.",
          questions: [
            "Recomiéndame mi próximo destino",
            "¿Cuál es mi estilo de viajero?",
            "¿Qué países me faltan por explorar?",
            "¿En qué época del año viajo más?",
            "¿Qué presupuesto necesito para mi próximo viaje?",
            "¿Cuál fue el viaje más lejano que hice?",
          ],
        },
        {
          greeting: "Bienvenido, wanderer.",
          country: "Italia",
          curiosity: "Veo que has viajado a Italia en tus ejemplos. ¿Sabías que Italia tiene más patrimonio de la UNESCO que cualquier otro país del mundo? Con 58 sitios declarados, cada ciudad es un museo viviente.",
          questions: [
            "¿Cuál es mi estilo de viajero?",
            "Recomiéndame mi próximo destino",
            "¿Qué tipos de destinos prefiero?",
            "¿Qué países me faltan por explorar?",
            "Analiza mi perfil de viajero",
            "¿En qué época del año viajo más?",
          ],
        },
        {
          greeting: "Ah, un explorador.",
          country: "Egipto",
          curiosity: "Egipto brilla en tu historial de ejemplo. Un dato curioso: los antiguos egipcios inventaron la pasta de dientes hace más de 5.000 años, mucho antes que los cepillos modernos.",
          questions: [
            "Recomiéndame mi próximo destino",
            "¿Qué continentes me faltan por visitar?",
            "¿Cuál es mi estilo de viajero?",
            "¿Qué presupuesto necesito para mi próximo viaje?",
            "Analiza mi perfil de viajero",
            "¿Qué tipo de destinos elijo con más frecuencia?",
          ],
        },
        {
          greeting: "¡Hola, trotamundos!",
          country: "Australia",
          curiosity: "Australia aparece en tus viajes de prueba. ¿Sabías que la Gran Barrera de Coral es tan grande que puede verse desde el espacio? Tiene más de 2.300 km de longitud.",
          questions: [
            "¿Cuál es mi estilo de viajero?",
            "Recomiéndame mi próximo destino",
            "¿En qué época del año viajo más?",
            "¿Qué países me faltan por explorar?",
            "¿Cuál fue el viaje más lejano que hice?",
            "Analiza mi perfil de viajero",
          ],
        },
        {
          greeting: "Saludos, viajero.",
          country: "México",
          curiosity: "México está en tus viajes de ejemplo. Un dato fascinante: los mexicas (aztecas) crearon chinampas, islas artificiales para cultivar, hace más de 700 años. Hoy siguen usándose en Xochimilco.",
          questions: [
            "Recomiéndame mi próximo destino",
            "¿Cuál es mi estilo de viajero?",
            "¿Qué continentes me faltan por visitar?",
            "¿Qué presupuesto necesito para mi próximo viaje?",
            "¿En qué época del año viajo más?",
            "Analiza mi perfil de viajero",
          ],
        },
      ];

      const demo = demos[Math.floor(Math.random() * demos.length)];
      // Shuffle the questions so the order varies each time
      const shuffledQuestions = [...demo.questions].sort(() => Math.random() - 0.5);
      return {
        greeting: demo.greeting,
        curiosity: demo.curiosity,
        suggestedQuestions: shuffledQuestions,
      };
    }

    try {
      const { data } = await axios.get<{
        greeting: string;
        curiosity: string;
        suggestedQuestions: string[];
      }>(`${API_URL}/ai/insights?language=${language}`, {
        headers: authHeader(),
      });
      return data;
    } catch {
      return null;
    }
  }

  /**
   * Send a chat message and get AI reply.
   */
  async function sendMessage(text: string): Promise<void> {
    const state = get({ subscribe });

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    update((s) => ({
      ...s,
      mode: "loading",
      messages: [...s.messages, userMsg],
    }));

    if (!isAuthenticated()) {
      const mockReply = simulateDemoReply(text);
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: mockReply.reply,
        suggestedActions: mockReply.actions,
        timestamp: Date.now(),
      };
      await new Promise((r) => setTimeout(r, 1200));
      update((s) => ({
        ...s,
        mode: "chatting",
        messages: [...s.messages, assistantMsg],
      }));
      return;
    }

    try {
      const { data } = await axios.post<{
        reply: string;
        suggestedActions: string[];
        conversationId?: string;
      }>(
        `${API_URL}/ai/chat`,
        {
          message: text,
          conversationId: state.conversationId,
          language: "es",
        },
        { headers: authHeader() },
      );

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        suggestedActions: data.suggestedActions,
        timestamp: Date.now(),
      };

      update((s) => ({
        ...s,
        mode: "chatting",
        messages: [...s.messages, assistantMsg],
        conversationId: data.conversationId || s.conversationId,
        error: null,
      }));
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || err.message || "Error de conexión";
      update((s) => ({
        ...s,
        mode: "chatting",
        error: errorMsg,
      }));
    }
  }

  /** Toggle chat open/closed */
  function toggle(language?: string) {
    const state = get({ subscribe });
    if (state.mode === "chatting" || state.mode === "loading") {
      // Close — keep messages for next reopen
      update((s) => ({ ...s, mode: "closed" }));
    } else {
      // Reopen
      if (state.messages.length > 0) {
        // Resume existing conversation
        update((s) => ({ ...s, mode: "chatting" }));
      } else {
        // First open — fetch greeting
        openWithGreeting(language || "es");
      }
    }
  }

  return {
    subscribe,
    toggle,
    openWithGreeting,
    preloadGreeting,
    sendMessage,
  };
}

export const aiStore = createAiStore();

// ─── Demo fallback replies ──────────────────────────────────────────

function simulateDemoReply(text: string): { reply: string; actions: string[] } {
  const lower = text.toLowerCase();

  if (lower.includes("curiosidad") || lower.includes("sabías") || lower.includes("dato")) {
    return {
      reply:
        "Escucha bien, wanderer. ¿Sabías que Japón tiene más de 6.800 islas? Aunque la mayoría conoce Honshu, Hokkaido, Kyushu y Shikoku, el archipiélago guarda miles de islas menores, cada una con su propia cultura y paisajes. Un dato que pocos conocen: la isla de Okunoshima está habitada por cientos de conejos que deambulan libremente.",
      actions: [
        "Cuéntame sobre la comida japonesa",
        "¿Qué más curiosidades hay sobre Japón?",
        "Recomiéndame mi próximo viaje",
      ],
    };
  }

  if (lower.includes("próximo") || lower.includes("recomienda") || lower.includes("siguiente")) {
    return {
      reply:
        "He observado tus viajes, joven explorador. Veo que te atraen los destinos con historia y cultura. Permíteme sugerirte el sudeste asiático. Vietnam, en particular, es un tesoro: combina una historia milenaria, paisajes de ensueño en la bahía de Ha Long y una gastronomía que despierta los sentidos. Además, tus habilidades de viajero se adaptarán bien a su energía.",
      actions: [
        "Cuéntame más sobre Vietnam",
        "¿Qué países del sudeste asiático me recomiendas?",
        "Analiza mi estilo de viajero",
      ],
    };
  }

  if (lower.includes("estilo") || lower.includes("viajero") || lower.includes("analiza")) {
    return {
      reply:
        "He estado observando tus pasos por el mundo, y un patrón emerge. Eres un viajero cultural, un buscador de ciudades con alma. Tus visitas se concentran en lugares donde la historia susurra desde cada esquina. Te gusta combinar monumentos emblemáticos con experiencias auténticas. Tu curiosidad es tu mejor brújula.",
      actions: [
        "¿Qué destino encaja con mi estilo?",
        "Cuéntame una curiosidad sobre Italia",
        "¿Cómo puedo diversificar mis viajes?",
      ],
    };
  }

  return {
    reply:
      "Ah, interesante pregunta. Los viajes son como las estrellas: cada uno brilla con luz propia. Si deseas, puedo hablarte de curiosidades sobre los países que has visitado, recomendarte tu próximo destino o analizar tu espíritu viajero. ¿Qué camino prefieres tomar?",
    actions: [
      "Cuéntame una curiosidad sobre Japón",
      "Recomiéndame mi próximo viaje",
      "Analiza mi estilo de viajero",
    ],
  };
}