'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'catatan-diki-theme';

function getPreferredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';

  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute('data-theme', theme);
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

interface ThemeToggleProps {
  compact?: boolean;
}

export default function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeMode>(() => getPreferredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border transition-colors ${
        compact
          ? 'h-10 w-10 border-gray-300 text-gray-700 hover:bg-gray-100'
          : 'px-3 py-2 border-gray-300 text-gray-700 hover:bg-gray-100 text-sm'
      }`}
      aria-label="Ganti tema"
      title="Ganti tema"
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      {!compact && <span>{theme === 'dark' ? 'Mode Light' : 'Mode Dark'}</span>}
    </button>
  );
}
