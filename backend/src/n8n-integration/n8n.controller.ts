import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { N8nService } from './n8n.service';

@Injectable()
class N8nSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const secret = request.headers['x-n8n-secret'];
    if (!secret || secret !== process.env.N8N_SECRET) {
      throw new UnauthorizedException('Invalid n8n secret');
    }
    return true;
  }
}

@Controller('n8n')
@UseGuards(N8nSecretGuard)
export class N8nController {
  constructor(private readonly n8nService: N8nService) {}

  @Get('reminders/due')
  async getDueReminders() {
    return this.n8nService.getDueReminders();
  }

  @Post('metrics/recompute')
  async recomputeMetrics(
    @Body() body: { projectId?: string; date?: string },
  ) {
    return this.n8nService.recomputeMetrics(body.projectId, body.date);
  }

  @Post('leaderboard/recompute')
  async recomputeLeaderboard(
    @Body() body: { projectId?: string; period: 'week' | 'month' },
  ) {
    return this.n8nService.recomputeLeaderboard(body.projectId, body.period);
  }
}
