import { Context } from 'telegraf';
import { BackendApiService } from '../services/backend-api.service';
import { ActionsRendererService } from '../services/actions-renderer.service';
import { config } from '../config';

const backendApi = new BackendApiService();
const actionsRenderer = new ActionsRendererService();

export async function messageHandler(ctx: Context): Promise<void> {
  if (!ctx.message || !('text' in ctx.message)) return;

  const userId = ctx.from!.id.toString();
  const message = ctx.message.text;
  const projectId = config.defaultProjectId;

  if (!projectId) {
    await ctx.reply('Проект не настроен. Обратитесь к администратору.');
    return;
  }

  try {
    await ctx.sendChatAction('typing');

    const response = await backendApi.sendMessage({
      projectId,
      userId,
      message,
    });

    await actionsRenderer.render(ctx, response.actions);
  } catch (error: any) {
    console.error('Message handler error:', error?.response?.data || error);
    await ctx.reply(
      'Произошла ошибка при обработке сообщения. Попробуйте позже.',
    );
  }
}
