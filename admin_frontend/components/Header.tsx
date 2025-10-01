'use client';

import { Moon, Sun,Menu } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

export default function Header({ darkMode, setDarkMode }: HeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
       
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-gray-300" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600" />
          )}
        </button>
        
      </div>
    </header>
  );
}