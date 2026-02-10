import { Context, Markup } from 'telegraf';
import { config } from '../config';

export async function homeworkHandler(ctx: Context): Promise<void> {
  if (!config.miniAppUrl) {
    await ctx.reply(
      'Функция сдачи домашних заданий пока недоступна.\n' +
        'Обратитесь к администратору.',
    );
    return;
  }

  await ctx.reply(
    '📝 *Домашнее задание*\n\n' +
      'Вы можете сдать домашнее задание через форму в мини-приложении.\n' +
      'Поддерживаются:\n' +
      '• Текстовые ответы\n' +
      '• Ссылки на работы\n' +
      '• Файлы',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [
          Markup.button.webApp(
            '📝 Открыть форму',
            `${config.miniAppUrl}/homework/submit`,
          ),
        ],
      ]),
    },
  );
}
