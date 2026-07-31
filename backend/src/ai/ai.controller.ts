import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Query,
  Logger,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatRequestDto } from './dto/chat-request.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  /**
   * Get initial greeting + curiosity for the logged-in user.
   */
  @Get('insights')
  async getInsights(
    @Request() req: any,
    @Query('language') language?: string,
  ) {
    this.logger.debug(`AI insights requested for user ${req.user.userId}`);
    return this.aiService.getInsights(req.user.userId, language || 'es');
  }

  /**
   * Chat with the AI travel companion.
   */
  @Post('chat')
  async chat(@Request() req: any, @Body() dto: ChatRequestDto) {
    this.logger.debug(
      `AI chat from user ${req.user.userId}: "${dto.message?.slice(0, 50)}..."`,
    );
    return this.aiService.chat(req.user.userId, dto);
  }
}