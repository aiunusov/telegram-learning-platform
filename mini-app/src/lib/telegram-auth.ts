const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export class TelegramAuth {
  static async authenticate() {
    // Dynamic import to avoid SSR issues
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
