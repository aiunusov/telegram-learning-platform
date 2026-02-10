import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BotTokenGuard } from '../auth/guards/bot-token.guard';
import { RuntimeService } from './runtime.service';

@Controller('runtime')
@UseGuards(BotTokenGuard)
export class RuntimeController {
  constructor(private readonly runtimeService: RuntimeService) {}

  @Post('message')
  async processMessage(
    @Body()
    body: {
      projectId: string;
      userId: string;
      message: string;
      attachments?: any[];
    },
  ) {
    return this.runtimeService.processMessage(body);
  }

  @Post('start-test')
  async startTest(
    @Body()
    body: {
      projectId: string;
      userId: string;
      testId?: string;
    },
  ) {
    return this.runtimeService.startTest(body);
  }

  @Post('submit-test')
  async submitTest(
    @Body()
    body: {
      attemptId: string;
      answers: Record<string, any>;
    },
  ) {
    return this.runtimeService.submitTest(body);
  }

  @Get('session/:projectId/:userId')
  async getSession(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
  ) {
    return this.runtimeService.getSession(projectId, userId);
  }
}
