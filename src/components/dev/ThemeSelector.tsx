// components/GraphQLPlayground/ThemeSelector.tsx
import React from 'react';
import { Switch } from '@headlessui/react';
import { MoonIcon, SunIcon } from 'lucide-react';


interface ThemeSelectorProps {
  currentTheme: string;
  onChangeTheme: (theme: string) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onChangeTheme }) => {
  const isDark = currentTheme === 'dark';
  
  return (
    <div className="flex items-center">
      <SunIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-1" />
      <Switch
        checked={isDark}
        onChange={() => onChangeTheme(isDark ? 'light' : 'dark')}
        className={`${
          isDark ? 'bg-indigo-600' : 'bg-gray-200'
        } relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
      >
        <span
          className={`${
            isDark ? 'translate-x-5' : 'translate-x-1'
          } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
        />
      </Switch>
      <MoonIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 ml-1" />
    </div>
  );
};

export default ThemeSelector;