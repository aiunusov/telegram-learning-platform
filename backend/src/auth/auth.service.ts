import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHmac } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Validates Telegram initData and returns JWT token + user.
   */
  async authenticateTelegram(initData: string) {
    const user = this.validateInitData(initData);

    const dbUser = await this.prisma.user.upsert({
      where: { telegramId: user.id.toString() },
      update: {
        username: user.username,
        firstName: user.first_name,
      },
      create: {
        telegramId: user.id.toString(),
        username: user.username,
        firstName: user.first_name,
        role: 'USER',
      },
    });

    const projects = await this.prisma.project.findMany({
      where: {
        OR: [
          { ownerId: dbUser.id },
          { members: { some: { userId: dbUser.id } } },
        ],
      },
    });

    const token = this.jwtService.sign({
      sub: dbUser.id,
      telegramId: dbUser.telegramId,
      role: dbUser.role,
    });

    return { token, user: dbUser, projects };
  }

  /**
   * Validates Telegram Web App initData signature.
   * @see https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
   */
  private validateInitData(initData: string): TelegramUser {
    try {
      const params = new URLSearchParams(initData);
      const hash = params.get('hash');
      if (!hash) throw new UnauthorizedException('Missing hash');

      params.delete('hash');
      const entries = Array.from(params.entries());
      entries.sort(([a], [b]) => a.localeCompare(b));
      const dataCheckString = entries
        .map(([key, val]) => `${key}=${val}`)
        .join('\n');

      const botToken = process.env.BOT_TOKEN;
      if (!botToken) throw new Error('BOT_TOKEN not configured');

      const secretKey = createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();
      const computedHash = createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      if (computedHash !== hash) {
        this.logger.warn('Invalid Telegram initData signature');
        throw new UnauthorizedException('Invalid initData signature');
      }

      const userJson = params.get('user');
      if (!userJson) throw new UnauthorizedException('Missing user data');

      return JSON.parse(userJson) as TelegramUser;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error('initData validation failed', error);
      throw new UnauthorizedException('Invalid initData');
    }
  }

  /**
   * Validates bot token header for bot-to-backend communication.
   */
  validateBotToken(token: string): boolean {
    return token === process.env.BACKEND_BOT_SECRET;
  }

  /**
   * Ensures or creates a user from Telegram ID (for bot interactions).
   */
  async ensureUserFromTelegram(telegramId: string, firstName?: string, username?: string) {
    return this.prisma.user.upsert({
      where: { telegramId },
      update: { firstName, username },
      create: {
        telegramId,
        firstName,
        username,
        role: 'USER',
      },
    });
  }
}
