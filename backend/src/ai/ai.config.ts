import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiConfig {
  public readonly baseUrl: string;
  public readonly apiKey: string;
  public readonly model: string;
  public readonly timeout: number;

  constructor(private configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('LITELLM_BASE_URL') ||
      'https://litellm.custombots.es';
    this.apiKey = this.configService.get<string>('LITELLM_API_KEY') || '';
    this.model =
      this.configService.get<string>('LITELLM_MODEL') ||
      'nan/deepseek-v4-flash';
    this.timeout = this.configService.get<number>('LITELLM_TIMEOUT') || 30000;
  }
}