import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = 'app-theme';

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(THEME_KEY) as Theme | null;
  return stored || 'light';
};

/**
 * El tema se controla con la clase `dark` en <html> (convención Tailwind/shadcn).
 * Todos los tokens de color viven en src/index.css y reaccionan a esa clase.
 * index.html aplica la clase antes del primer render para evitar parpadeo.
 */
const applyTheme = (resolved: 'light' | 'dark') => {
  document.documentElement.classList.toggle('dark', resolved === 'dark');

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  metaTheme?.setAttribute('content', resolved === 'dark' ? '#121410' : '#ffffff');
};

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>(() => {
    const stored = getStoredTheme();
    return stored === 'system' ? getSystemTheme() : stored;
  });

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);

    const resolved = newTheme === 'system' ? getSystemTheme() : newTheme;
    setActualTheme(resolved);
    applyTheme(resolved);
  };

  const toggleTheme = () => {
    changeTheme(actualTheme === 'light' ? 'dark' : 'light');
  };

  // Seguir los cambios del sistema cuando el tema es 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const resolved = e.matches ? 'dark' : 'light';
      setActualTheme(resolved);
      applyTheme(resolved);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Aplicar el tema inicial
  useEffect(() => {
    const resolved = theme === 'system' ? getSystemTheme() : theme;
    setActualTheme(resolved);
    applyTheme(resolved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    theme,
    actualTheme,
    changeTheme,
    toggleTheme,
    isLight: actualTheme === 'light',
    isDark: actualTheme === 'dark',
  };
};
