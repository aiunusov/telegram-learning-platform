const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

function isTelegramEnv(): boolean {
  try {
    return !!(window as any).Telegram?.WebApp?.initData;
  } catch {
    return false;
  }
}

export class TelegramAuth {
  static async authenticate() {
    if (isTelegramEnv()) {
      return this.authenticateViaTelegram();
    }
    return this.authenticateViaBrowser();
  }

  private static async authenticateViaTelegram() {
    const { retrieveLaunchParams } = await import('@telegram-apps/sdk');
    const { initDataRaw } = retrieveLaunchParams();

    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/auth/telegram`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: initDataRaw }),
      },
    );

    if (!response.ok) {
      throw new Error(`Auth failed: ${response.status}`);
    }

    const data = await response.json();
    this.setToken(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data;
  }

  private static async authenticateViaBrowser() {
    // In browser: try to get user profile with existing token
    const token = this.getToken();
    if (token) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/users/me`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (response.ok) {
          const user = await response.json();
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          return { token, user };
        }
      } catch {
        // Token expired or invalid, clear it
      }
      this.clearToken();
    }

    throw new Error(
      'Откройте приложение через Telegram бота для первой авторизации. После этого оно будет работать и в браузере.',
    );
  }

  static getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  static setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  static getUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  static clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
