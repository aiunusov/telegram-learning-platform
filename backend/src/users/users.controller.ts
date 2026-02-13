import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@Request() req: any) {
    return this.usersService.getProfile(req.user.userId);
  }

  @Put('profile')
  async updateProfile(
    @Request() req: any,
    @Body() body: { firstName?: string; lastName?: string; position?: string },
  ) {
    return this.usersService.updateProfile(req.user.userId, body);
  }

  @Get('all')
  @UseGuards(AdminGuard)
  async listAllUsers() {
    const users = await this.usersService.listAllUsers();
    return { users };
  }

  @Get(':userId/stats')
  @UseGuards(AdminGuard)
  async getStudentStats(
    @Param('userId') userId: string,
    @Query('projectId') projectId: string,
  ) {
    return this.usersService.getStudentStats(userId, projectId);
  }

  @Post(':userId/assign/:projectId')
  @UseGuards(AdminGuard)
  async assignToProject(
    @Param('userId') userId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.usersService.assignStudentToProject(userId, projectId);
  }

  @Delete(':userId/assign/:projectId')
  @UseGuards(AdminGuard)
  async removeFromProject(
    @Param('userId') userId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.usersService.removeStudentFromProject(userId, projectId);
  }
}
