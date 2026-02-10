import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { BotResponse, TestAttemptResponse, TestSubmitResponse } from '../types';

export class BackendApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.backendUrl,
      headers: {
        'X-Bot-Token': config.backendBotSecret,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async sendMessage(params: {
    projectId: string;
    userId: string;
    message: string;
  }): Promise<BotResponse> {
    const { data } = await this.client.post('/api/runtime/message', params);
    return data;
  }

  async startTest(params: {
    projectId: string;
    userId: string;
    testId?: string;
  }): Promise<TestAttemptResponse> {
    const { data } = await this.client.post('/api/runtime/start-test', params);
    return data;
  }

  async submitTest(params: {
    attemptId: string;
    answers: Record<string, any>;
  }): Promise<TestSubmitResponse> {
    const { data } = await this.client.post('/api/runtime/submit-test', params);
    return data;
  }

  async getSession(projectId: string, userId: string) {
    const { data } = await this.client.get(
      `/api/runtime/session/${projectId}/${userId}`,
    );
    return data;
  }
}
