import { Context, Markup } from 'telegraf';
import { config } from '../config';

export async function startHandler(ctx: Context): Promise<void> {
  const firstName = ctx.from?.first_name || 'друг';

  await ctx.reply(
    `Привет, ${firstName}! Добро пожаловать в обучающую платформу.\n\n` +
      'Здесь вы можете:\n' +
      '📚 Задавать вопросы по учебным материалам\n' +
      '✅ Проходить тесты для проверки знаний\n' +
      '📝 Сдавать домашние задания\n' +
      '📊 Следить за своим прогрессом',
  );

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('📚 Начать учиться', 'action:start_learning')],
    [Markup.button.callback('✅ Пройти тест', 'action:start_test')],
    [Markup.button.callback('📝 Сдать домашку', 'action:submit_homework')],
    ...(config.miniAppUrl
      ? [[Markup.button.webApp('⚙️ Админ-панель', config.miniAppUrl)]]
      : []),
  ]);

  await ctx.reply('Выберите действие:', keyboard);
}
