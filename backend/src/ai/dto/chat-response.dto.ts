export class ChatResponseDto {
  reply!: string;
  suggestedActions!: string[];
  conversationId?: string;
}

export class InsightsResponseDto {
  greeting!: string;
  curiosity!: string;
  suggestedQuestions!: string[];
}