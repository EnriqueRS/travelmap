import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiConfig } from './ai.config';
import { LiteLLMProvider } from './providers/litellm.provider';
import { SystemPromptBuilder } from './prompts/system-prompt';

@Module({
  controllers: [AiController],
  providers: [AiConfig, LiteLLMProvider, SystemPromptBuilder, AiService],
  exports: [AiService],
})
export class AiModule {}