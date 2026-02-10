import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  async getSummary(@Query('projectId') projectId: string) {
    return this.analyticsService.getSummary(projectId);
  }

  @Get('leaderboard')
  async getLeaderboard(
    @Query('projectId') projectId: string,
    @Query('period') period: 'week' | 'month' = 'week',
  ) {
    return this.analyticsService.getLeaderboard(projectId, period);
  }
}
