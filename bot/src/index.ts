import { TelegramBot } from './bot';

async function main() {
  try {
    const bot = new TelegramBot();
    await bot.launch();
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

main();
