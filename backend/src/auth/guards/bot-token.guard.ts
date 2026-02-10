import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class BotTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-bot-token'];

    if (!token || token !== process.env.BACKEND_BOT_SECRET) {
      throw new UnauthorizedException('Invalid bot token');
    }

    return true;
  }
}
