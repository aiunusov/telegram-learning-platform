import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const THEME_KEY = 'app_theme';

function getStoredTheme(): Theme {
  return (localStorage.getItem(THEME_KEY) as Theme) || 'system';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  let effective: 'light' | 'dark';

  if (theme === 'system') {
    const tgColorScheme = (window as any).Telegram?.WebApp?.colorScheme;
    effective = tgColorScheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } else {
    effective = theme;
  }

  root.setAttribute('data-theme', effective);
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
