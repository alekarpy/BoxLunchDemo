/**
 * ThemeSettings - Unified Theme Settings
 * Combine color selector and appearance mode (light/dark/system)
 * in a single elegant popover
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings2, Check, Sun, Moon, Monitor, Palette, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Theme color types
export type ThemeColor = 'orange' | 'blue' | 'raspberry' | 'purple' | 'pink' | 'teal' | 'copper' | 'magenta';
export type ThemeMode = 'light' | 'dark' | 'system';

interface ColorOption {
  id: ThemeColor;
  name: string;
  preview: string;
}

interface ModeOption {
  id: ThemeMode;
  name: string;
  icon: typeof Sun;
  description: string;
}

const colorOptions: ColorOption[] = [
  { id: 'orange', name: 'Naranja', preview: '#E05A00' },
  { id: 'blue', name: 'Azul', preview: '#2563EB' },
  { id: 'teal', name: 'Turquesa', preview: '#0D9488' },
  { id: 'raspberry', name: 'Frambuesa', preview: '#cc2649' },
  { id: 'purple', name: 'Morado', preview: '#7C3AED' },
  { id: 'pink', name: 'Rosa', preview: '#DB2777' },
  { id: 'magenta', name: 'Magenta', preview: '#C026D3' },
  { id: 'copper', name: 'Cobre', preview: '#B45309' },
];

const modeOptions: ModeOption[] = [
  { id: 'light', name: 'Claro', icon: Sun, description: 'Tema claro' },
  { id: 'dark', name: 'Oscuro', icon: Moon, description: 'Tema oscuro' },
  { id: 'system', name: 'Sistema', icon: Monitor, description: 'Usar preferencia del sistema' },
];

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeColor(color: ThemeColor, animate = true) {
  const root = document.documentElement;
  
  // Activate transition class if animated
  if (animate) {
    root.classList.add('theme-transitioning');
    createRippleEffect();
  }
  
  // Change theme classes
  colorOptions.forEach(opt => root.classList.remove(`theme-${opt.id}`));
  if (color !== 'orange') {
    root.classList.add(`theme-${color}`);
  }
  
  // Remove transition class after animation
  if (animate) {
    setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 400);
  }
}

function applyThemeMode(mode: ThemeMode, animate = true) {
  const root = document.documentElement;
  const effectiveTheme = mode === 'system' ? getSystemTheme() : mode;
  const currentTheme = root.classList.contains('dark') ? 'dark' : 'light';
  
  // Only encourage if there is real change
  const themeChanging = currentTheme !== effectiveTheme;
  
  if (animate && themeChanging) {
    root.classList.add('theme-transitioning');
    createModeTransitionOverlay();
  }
  
  if (effectiveTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  
  // Remove transition class after animation
  if (animate && themeChanging) {
    setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 400);
  }
}

// Create ripple effect from settings button
function createRippleEffect() {
  // Find the topic button to get its position
  const themeButton = document.querySelector('[data-theme-settings-trigger]');
  if (!themeButton) return;
  
  const rect = themeButton.getBoundingClientRect();
  const size = Math.max(window.innerWidth, window.innerHeight) * 0.6;
  
  const ripple = document.createElement('div');
  ripple.className = 'theme-ripple-effect';
  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${rect.left + rect.width / 2 - size / 2}px`;
  ripple.style.top = `${rect.top + rect.height / 2 - size / 2}px`;
  
  document.body.appendChild(ripple);
  
  // Clean up after animation
  setTimeout(() => {
    ripple.remove();
  }, 550);
}

// Create smooth overlay for light/dark mode transition
function createModeTransitionOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'theme-transition-overlay';
  document.body.appendChild(overlay);
  
  // Clean up after animation
  setTimeout(() => {
    overlay.remove();
  }, 450);
}

export function ThemeSettings() {
  const [color, setColor] = useState<ThemeColor>('orange');
  const [mode, setMode] = useState<ThemeMode>('system');
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  // Load saved settings on mount
  useEffect(() => {
    setMounted(true);
    const savedColor = localStorage.getItem('boxlunch-theme-color') as ThemeColor | null;
    const savedMode = localStorage.getItem('boxlunch-theme') as ThemeMode | null;
    
    const initialColor = savedColor || 'orange';
    const initialMode = savedMode || 'system';
    
    setColor(initialColor);
    setMode(initialMode);
    // No animation on initial load
    applyThemeColor(initialColor, false);
    applyThemeMode(initialMode, false);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (mode !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyThemeMode('system', true);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  const changeColor = (newColor: ThemeColor) => {
    if (newColor === color) return; // Do not change if it is the same
    setColor(newColor);
    localStorage.setItem('boxlunch-theme-color', newColor);
    applyThemeColor(newColor, true);
  };

  const changeMode = (newMode: ThemeMode) => {
    if (newMode === mode) return; // Do not change if it is the same
    setMode(newMode);
    localStorage.setItem('boxlunch-theme', newMode);
    applyThemeMode(newMode, true);
  };

  // Prevent flash while loading
  if (!mounted) {
    return (
      <Button variant="outline" size="icon-sm" className="h-9 w-9 border-border/50" disabled>
        <Settings2 className="h-4 w-4" />
      </Button>
    );
  }

  const currentColor = colorOptions.find(c => c.id === color) || colorOptions[0];
  const effectiveTheme = mode === 'system' ? getSystemTheme() : mode;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-9 w-9 relative overflow-hidden border border-primary/20 bg-background/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12),0_1px_3px_-1px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_-3px_rgba(0,0,0,0.15),0_2px_4px_-1px_rgba(0,0,0,0.1)] hover:border-primary/30 transition-all duration-200 theme-settings-trigger"
          data-theme-settings-trigger
        >
          <motion.div
            whileHover={{ rotate: 90 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            <Settings2 className="h-4 w-4 text-primary" />
          </motion.div>

          <span className="sr-only">Configuración del tema</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-80 p-0 bg-popover border-border shadow-xl overflow-hidden"
        sideOffset={8}
      >
        <div className="flex flex-col">
          {/* Appearance Mode Section */}
          <div className="p-4 pb-3 border-b border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-md bg-muted/60">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Apariencia</span>
            </div>

            {/* Mode Selector - Segmented Control */}
            <div className="flex gap-1 p-1 bg-muted/40 rounded-lg">
              {modeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = mode === option.id;
                
                return (
                  <motion.button
                    key={option.id}
                    onClick={() => changeMode(option.id)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                      isSelected 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                    )}
                    whileTap={{ scale: 0.97 }}
                    title={option.description}
                  >
                    <Icon className={cn(
                      'h-3.5 w-3.5 transition-colors',
                      isSelected && option.id === 'light' && 'text-amber-500',
                      isSelected && option.id === 'dark' && 'text-indigo-400',
                      isSelected && option.id === 'system' && 'text-foreground/70'
                    )} />
                    <span>{option.name}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Color Palette Section */}
          <div className="p-4 pt-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-md bg-muted/60">
                <Palette className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Color del tema</span>
            </div>

            {/* Color Grid */}
            <div className="grid grid-cols-4 gap-2">
              <AnimatePresence mode="wait">
                {colorOptions.map((option, index) => (
                  <motion.button
                    key={option.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.025 }}
                    onClick={() => changeColor(option.id)}
                    className={cn(
                      'group relative flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all duration-200',
                      'hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                      color === option.id && 'bg-muted/80'
                    )}
                    title={option.name}
                  >
                    {/* Color Circle */}
                    <motion.div
                      className={cn(
                        'relative h-7 w-7 rounded-full transition-all duration-200',
                        'ring-2 ring-offset-2 ring-offset-popover',
                        color === option.id ? 'ring-foreground/50 scale-110' : 'ring-transparent group-hover:ring-muted-foreground/30'
                      )}
                      style={{ backgroundColor: option.preview }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Check mark for selected */}
                      <AnimatePresence>
                        {color === option.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <Check className="h-3.5 w-3.5 text-white drop-shadow-md" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                    
                    {/* Color Name */}
                    <span className={cn(
                      'text-[10px] font-medium transition-colors',
                      color === option.id ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground/80'
                    )}>
                      {option.name}
                    </span>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer - Current Selection Info */}
          <motion.div 
            key={`${currentColor.id}-${mode}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 py-3 border-t border-border/50 bg-muted/20"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: currentColor.preview }}
                />
                <span className="text-xs text-muted-foreground">
                  {currentColor.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {effectiveTheme === 'light' ? (
                  <Sun className="h-3 w-3 text-amber-500/70" />
                ) : (
                  <Moon className="h-3 w-3 text-indigo-400/70" />
                )}
                <span>
                  {mode === 'system' 
                    ? `Sistema (${effectiveTheme === 'light' ? 'Claro' : 'Oscuro'})` 
                    : modeOptions.find(m => m.id === mode)?.name}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default ThemeSettings;
