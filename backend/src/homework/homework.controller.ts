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
import { AdminGuard } from '../auth/guards/admin.guard';
import { HomeworkService } from './homework.service';

@Controller('homework')
@UseGuards(JwtAuthGuard)
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) {}

  @Post('submit')
  async submit(@Request() req: any, @Body() body: any) {
    return this.homeworkService.submit(req.user.userId, body);
  }

  @Get('student')
  async listStudentSubmissions(
    @Request() req: any,
    @Query('projectId') projectId: string,
  ) {
    const submissions = await this.homeworkService.listStudentSubmissions(
      req.user.userId,
      projectId,
    );
    return { submissions };
  }

  @Get('admin')
  async listAdminSubmissions(
    @Query('projectId') projectId: string,
    @Query('status') status?: string,
  ) {
    const submissions = await this.homeworkService.listAdminSubmissions(
      projectId,
      status,
    );
    return { submissions };
  }

  @Post('assignments')
  @UseGuards(AdminGuard)
  async createAssignment(
    @Body() body: { projectId: string; title: string; instructions: string; dueAt?: string },
  ) {
    return this.homeworkService.createAssignment(body.projectId, body);
  }

  @Get('assignments')
  async listAssignments(@Query('projectId') projectId: string) {
    const assignments = await this.homeworkService.listAssignments(projectId);
    return { assignments };
  }

  @Post(':submissionId/review')
  async review(
    @Request() req: any,
    @Param('submissionId') submissionId: string,
    @Body() body: any,
  ) {
    return this.homeworkService.review(
      submissionId,
      req.user.userId,
      body,
    );
  }
}
