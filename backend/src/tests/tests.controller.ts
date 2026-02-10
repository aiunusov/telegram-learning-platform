import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TestsService } from './tests.service';

@Controller('tests')
@UseGuards(JwtAuthGuard)
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Post('generate')
  async generateTests(
    @Request() req: any,
    @Body()
    body: {
      projectId: string;
      topics: string[];
      difficulty: string;
      count: number;
    },
  ) {
    return this.testsService.generateTests(req.user.userId, body);
  }

  @Get()
  async listTests(
    @Query('projectId') projectId: string,
    @Query('status') status?: string,
  ) {
    const tests = await this.testsService.listTests(projectId, status);
    return { tests };
  }

  @Get(':id')
  async getTest(@Param('id') id: string) {
    return this.testsService.getTest(id);
  }

  @Post(':id/publish')
  async publishTest(@Request() req: any, @Param('id') id: string) {
    return this.testsService.publishTest(id, req.user.userId);
  }
}
