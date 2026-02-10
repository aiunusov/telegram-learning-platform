export interface BotAction {
  type: 'send_message' | 'show_buttons' | 'show_test' | 'request_homework';
  text?: string;
  parse_mode?: 'Markdown' | 'HTML';
  buttons?: Array<{ text: string; payload: string }>;
  inline?: boolean;
  testId?: string;
  spec?: any;
  prompt?: string;
  miniAppUrl?: string;
}

export interface BotResponse {
  actions: BotAction[];
  sessionState?: string;
}

export interface TestAttemptResponse {
  actions: BotAction[];
  attemptId: string;
}

export interface TestSubmitResponse {
  actions: BotAction[];
  checkResult: {
    score: number;
    passed: boolean;
    mistakes: any[];
    feedback: string;
    recommendation: string;
  };
}
