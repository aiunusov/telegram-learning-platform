import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const THEME_KEY = 'app_theme';

const THEME_VARS: Record<string, Record<string, string>> = {
  dark: {
    '--tg-theme-bg-color': '#1c1c1e',
    '--tg-theme-text-color': '#ffffff',
    '--tg-theme-hint-color': '#8e8e93',
    '--tg-theme-link-color': '#0a84ff',
    '--tg-theme-button-color': '#0a84ff',
    '--tg-theme-button-text-color': '#ffffff',
    '--tg-theme-secondary-bg-color': '#2c2c2e',
  },
  light: {
    '--tg-theme-bg-color': '#ffffff',
    '--tg-theme-text-color': '#000000',
    '--tg-theme-hint-color': '#999999',
    '--tg-theme-link-color': '#007aff',
    '--tg-theme-button-color': '#007aff',
    '--tg-theme-button-text-color': '#ffffff',
    '--tg-theme-secondary-bg-color': '#f5f5f5',
  },
};

function getStoredTheme(): Theme {
  return (localStorage.getItem(THEME_KEY) as Theme) || 'system';
}

function applyTheme(theme: Theme) {
  let effective: 'light' | 'dark';

  if (theme === 'system') {
    const tgColorScheme = (window as any).Telegram?.WebApp?.colorScheme;
    effective = tgColorScheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } else {
    effective = theme;
  }

  document.documentElement.setAttribute('data-theme', effective);

  // Force CSS variables on body to override Telegram SDK inline styles
  const vars = THEME_VARS[effective];
  Object.entries(vars).forEach(([key, value]) => {
    document.body.style.setProperty(key, value);
  });

  localStorage.setItem(THEME_KEY, theme);
}

export const useThemeStore = create<ThemeState>(() => {
  const initial = getStoredTheme();
  applyTheme(initial);

  return {
    theme: initial,
    setTheme: (theme: Theme) => {
      applyTheme(theme);
      useThemeStore.setState({ theme });
    },
  };
});
