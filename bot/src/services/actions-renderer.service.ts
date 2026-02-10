import { Context, Markup } from 'telegraf';
import { BotAction } from '../types';

export class ActionsRendererService {
  async render(ctx: Context, actions: BotAction[]): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'send_message':
            await ctx.reply(action.text || '', {
              parse_mode: action.parse_mode as any,
            });
            break;

          case 'show_buttons':
            if (action.buttons && action.buttons.length > 0) {
              const buttons = action.buttons.map((btn) =>
                Markup.button.callback(btn.text, btn.payload),
              );
              await ctx.reply(
                action.text || 'Выберите:',
                Markup.inlineKeyboard(this.chunkArray(buttons, 2)),
              );
            }
            break;

          case 'show_test':
            if (action.spec) {
              await this.renderTest(ctx, action.testId!, action.spec);
            }
            break;

          case 'request_homework':
            await ctx.reply(action.prompt || 'Сдайте домашнее задание:');
            if (action.miniAppUrl) {
              await ctx.reply(
                'Откройте форму для отправки:',
                Markup.inlineKeyboard([
                  Markup.button.webApp('📝 Сдать домашку', action.miniAppUrl),
                ]),
              );
            }
            break;
        }
      } catch (error) {
        console.error(`Error rendering action ${action.type}:`, error);
      }
    }
  }

  private async renderTest(
    ctx: Context,
    testId: string,
    spec: any,
  ): Promise<void> {
    let msg = `📝 *Тест: ${spec.topic}*\n`;
    msg += `Уровень: ${spec.difficulty}\n`;
    msg += `Проходной балл: ${spec.passingScore || 70}%\n\n`;

    spec.questions.forEach((q: any, i: number) => {
      msg += `*${i + 1}. ${q.text}*\n`;
      if (q.options && q.options.length > 0) {
        q.options.forEach((opt: string, j: number) => {
          msg += `  ${j + 1}) ${opt}\n`;
        });
      } else {
        msg += `  _(Напишите ответ)_\n`;
      }
      msg += '\n';
    });

    msg +=
      'Отправьте ответы в формате:\n' +
      '`1: ваш_ответ\n2: ваш_ответ`\n\n' +
      'Для вопросов с выбором укажите номер(а) ответа.';

    await ctx.reply(msg, { parse_mode: 'Markdown' });
  }

  private chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }
}
