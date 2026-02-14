import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const THEME_KEY = 'app_theme';

function getStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return 'light';
}

const THEME_VARS: Record<Theme, Record<string, string>> = {
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

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);

  // Force CSS variables via inline style to override Telegram SDK injected styles
  const vars = THEME_VARS[theme];
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
