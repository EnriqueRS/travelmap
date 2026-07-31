import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { AiConfig } from '../ai.config';
import {
  AiProvider,
  ChatCompletionOptions,
  ChatCompletionResponse,
} from './ai-provider.interface';

@Injectable()
export class LiteLLMProvider implements AiProvider {
  private readonly logger = new Logger(LiteLLMProvider.name);
  private readonly client: AxiosInstance;

  constructor(private config: AiConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
    });
  }

  async chatCompletion(
    options: ChatCompletionOptions,
  ): Promise<ChatCompletionResponse> {
    const payload: Record<string, unknown> = {
      model: this.config.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
    };

    if (options.responseFormat === 'json_object') {
      payload.response_format = { type: 'json_object' };
    }

    this.logger.debug(
      `LiteLLM request: model=${this.config.model}, messages=${options.messages.length}`,
    );

    try {
      const { data } = await this.client.post('/chat/completions', payload);
      const choice = data.choices?.[0];
      return {
        content: choice?.message?.content || '',
        finishReason: choice?.finish_reason || 'stop',
        usage: data.usage
          ? {
              promptTokens: data.usage.prompt_tokens,
              completionTokens: data.usage.completion_tokens,
              totalTokens: data.usage.total_tokens,
            }
          : undefined,
      };
    } catch (error: any) {
      const status = error?.response?.status;
      const detail = error?.response?.data?.error?.message || error.message;
      this.logger.error(`LiteLLM error (${status}): ${detail}`);
      throw new Error(`AI service error: ${detail}`);
    }
  }
}