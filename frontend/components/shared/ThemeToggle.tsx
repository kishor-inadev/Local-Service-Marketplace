'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();



  const icons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  };

  const Icon = icons[theme];

  return (
    <div className="relative">
      <button
        onClick={() => {
          const newTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
          setTheme(newTheme);
        }}
        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Toggle theme"
      >
        <Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </button>
    </div>
  );
}
