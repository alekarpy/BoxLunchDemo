/**
 * ThemeToggle - Component to toggle between light and dark theme
 * With smooth animation and persistence in localStorage
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;
  
  if (effectiveTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // Cargar tema guardado al montar
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('boxlunch-theme') as Theme | null;
    const initialTheme = savedTheme || 'system';
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  // Listen for changes in system preferences
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme('system');
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('boxlunch-theme', newTheme);
    applyTheme(newTheme);
  };

  // Prevenir flash mientras carga
  if (!mounted) {
    return (
      <Button variant="outline" size="icon-sm" className="h-9 w-9 border-border/50" disabled>
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon-sm" 
          className="h-9 w-9 relative overflow-hidden border border-border/40 bg-background/50 hover:bg-[#fff4e8] hover:border-[#e1755a]/40 active:bg-[#ffe8d9] transition-colors duration-150 dark:hover:bg-[#3d2a20] dark:hover:border-[#e1755a]/50"
        >
          <AnimatePresence mode="wait">
            {effectiveTheme === 'light' ? (
              <motion.div
                key="sun"
                initial={{ rotate: -90, scale: 0, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: 90, scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Sun className="h-4 w-4 text-amber-500" />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ rotate: 90, scale: 0, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: -90, scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Moon className="h-4 w-4 text-indigo-400" />
              </motion.div>
            )}
          </AnimatePresence>
          <span className="sr-only">Cambiar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 bg-popover border-border shadow-lg">
        <DropdownMenuItem
          onClick={() => changeTheme('light')}
          className={cn(
            'cursor-pointer gap-2 text-popover-foreground hover:bg-muted/60 focus:bg-muted/60',
            theme === 'light' && 'bg-muted/50'
          )}
        >
          <Sun className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-popover-foreground">Claro</span>
          {theme === 'light' && (
            <motion.div
              layoutId="theme-indicator"
              className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
            />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeTheme('dark')}
          className={cn(
            'cursor-pointer gap-2 text-popover-foreground hover:bg-muted/60 focus:bg-muted/60',
            theme === 'dark' && 'bg-muted/50'
          )}
        >
          <Moon className="h-4 w-4 text-indigo-500 dark:text-indigo-300" />
          <span className="text-popover-foreground">Oscuro</span>
          {theme === 'dark' && (
            <motion.div
              layoutId="theme-indicator"
              className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
            />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeTheme('system')}
          className={cn(
            'cursor-pointer gap-2 text-popover-foreground hover:bg-muted/60 focus:bg-muted/60',
            theme === 'system' && 'bg-muted/50'
          )}
        >
          <Monitor className="h-4 w-4 text-foreground/70" />
          <span className="text-popover-foreground">Sistema</span>
          {theme === 'system' && (
            <motion.div
              layoutId="theme-indicator"
              className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
            />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ThemeToggle;
