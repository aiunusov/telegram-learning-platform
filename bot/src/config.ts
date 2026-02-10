import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  botToken: process.env.BOT_TOKEN || '',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
  backendBotSecret: process.env.BACKEND_BOT_SECRET || '',
  miniAppUrl: process.env.MINI_APP_URL || '',
  defaultProjectId: process.env.DEFAULT_PROJECT_ID || '',
};
