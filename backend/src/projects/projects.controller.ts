import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectsService } from './projects.service';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async findAll(@Request() req: any) {
    const projects = await this.projectsService.findAllForUser(req.user.userId);
    return { projects };
  }

  @Post()
  async create(
    @Request() req: any,
    @Body() body: { name: string; description?: string },
  ) {
    return this.projectsService.create(req.user.userId, body);
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.projectsService.findById(id, req.user.userId);
  }
}
