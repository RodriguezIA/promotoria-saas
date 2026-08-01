import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = 'app-theme';

/**
 * El tema oscuro aún no está terminado visualmente. Mientras se completa,
 * la app se fuerza a tema claro sin borrar la lógica/tokens de dark.
 * Para reactivarlo: poner esto en true y revertir el forzado equivalente
 * en el script anti-flash de index.html.
 */
export const DARK_THEME_ENABLED = false;

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

const resolveTheme = (t: Theme): 'light' | 'dark' => {
  if (!DARK_THEME_ENABLED) return 'light';
  return t === 'system' ? getSystemTheme() : t;
};

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>(() =>
    resolveTheme(getStoredTheme()),
  );

  const changeTheme = (newTheme: Theme) => {
    if (!DARK_THEME_ENABLED) return;

    setTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);

    const resolved = resolveTheme(newTheme);
    setActualTheme(resolved);
    applyTheme(resolved);
  };

  const toggleTheme = () => {
    changeTheme(actualTheme === 'light' ? 'dark' : 'light');
  };

  // Seguir los cambios del sistema cuando el tema es 'system'
  useEffect(() => {
    if (!DARK_THEME_ENABLED || theme !== 'system') return;

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
    const resolved = resolveTheme(theme);
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
