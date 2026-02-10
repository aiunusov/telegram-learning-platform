import { Telegraf } from 'telegraf';
import { config } from './config';
import { startHandler } from './handlers/start.handler';
import { messageHandler } from './handlers/message.handler';
import {
  startTestHandler,
  hasActiveAttempt,
  submitTestHandler,
} from './handlers/test.handler';
import { homeworkHandler } from './handlers/homework.handler';

export class TelegramBot {
  private bot: Telegraf;

  constructor() {
    if (!config.botToken) {
      throw new Error('BOT_TOKEN is required');
    }
    this.bot = new Telegraf(config.botToken);
    this.setupHandlers();
  }

  private setupHandlers() {
    // /start command
    this.bot.command('start', startHandler);

    // /test command
    this.bot.command('test', async (ctx) => {
      await startTestHandler(ctx);
    });

    // /homework command
    this.bot.command('homework', homeworkHandler);

    // Callback queries (inline button presses)
    this.bot.action('action:start_learning', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.reply('💬 Задайте мне вопрос по теме курса...');
    });

    this.bot.action('action:start_test', async (ctx) => {
      await ctx.answerCbQuery();
      await startTestHandler(ctx);
    });

    this.bot.action('action:submit_homework', async (ctx) => {
      await ctx.answerCbQuery();
      await homeworkHandler(ctx);
    });

    this.bot.action('action:continue_learning', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.reply('💬 Задайте следующий вопрос...');
    });

    // Text messages
    this.bot.on('text', async (ctx) => {
      const userId = ctx.from.id.toString();
      const text = ctx.message.text;

      // If user has active test and message looks like answers
      if (hasActiveAttempt(userId) && /^\d+\s*[:.)]/m.test(text)) {
        await submitTestHandler(ctx, text);
        return;
      }

      // Regular message → backend
      await messageHandler(ctx);
    });

    // Error handler
    this.bot.catch((error: any) => {
      console.error('Bot error:', error);
    });
  }

  async launch() {
    await this.bot.launch();
    console.log('Bot is running!');

    // Graceful shutdown
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }
}
