/**
 * ThemeColorPicker - Theme Color Picker
 * Allows you to customize the main color of the theme
 * Persists selection in localStorage
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type ThemeColor = 'orange' | 'blue' | 'raspberry' | 'purple' | 'pink' | 'teal' | 'copper' | 'magenta';

interface ColorOption {
  id: ThemeColor;
  name: string;
  preview: string; // Color for preview dot
  description: string;
}

const colorOptions: ColorOption[] = [
  { 
    id: 'orange', 
    name: 'Naranja', 
    preview: '#E05A00',
    description: 'Cálido y energético'
  },
  { 
    id: 'blue', 
    name: 'Azul', 
    preview: '#2563EB',
    description: 'Profesional y confiable'
  },
  { 
    id: 'teal', 
    name: 'Turquesa', 
    preview: '#0D9488',
    description: 'Fresco y moderno'
  },
  { 
    id: 'raspberry', 
    name: 'Frambuesa', 
    preview: '#cc2649',
    description: 'Vibrante y sofisticado'
  },
  { 
    id: 'purple', 
    name: 'Morado', 
    preview: '#7C3AED',
    description: 'Creativo y elegante'
  },
  { 
    id: 'pink', 
    name: 'Rosa', 
    preview: '#DB2777',
    description: 'Vibrante y moderno'
  },
  { 
    id: 'magenta', 
    name: 'Magenta', 
    preview: '#C026D3',
    description: 'Vibrante y audaz'
  },
  { 
    id: 'copper', 
    name: 'Cobre', 
    preview: '#B45309',
    description: 'Cálido y terroso'
  },
];

function applyThemeColor(color: ThemeColor) {
  const root = document.documentElement;
  // Remove all theme color classes
  colorOptions.forEach(opt => root.classList.remove(`theme-${opt.id}`));
  // Add the new theme color class (default 'orange' doesn't need a class)
  if (color !== 'orange') {
    root.classList.add(`theme-${color}`);
  }
}

export function ThemeColorPicker() {
  const [color, setColor] = useState<ThemeColor>('orange');
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  // Load saved color on mount
  useEffect(() => {
    setMounted(true);
    const savedColor = localStorage.getItem('boxlunch-theme-color') as ThemeColor | null;
    const initialColor = savedColor || 'orange';
    setColor(initialColor);
    applyThemeColor(initialColor);
  }, []);

  const changeColor = (newColor: ThemeColor) => {
    setColor(newColor);
    localStorage.setItem('boxlunch-theme-color', newColor);
    applyThemeColor(newColor);
    setOpen(false);
  };

  // Prevent flash while loading
  if (!mounted) {
    return (
      <Button variant="outline" size="icon-sm" className="h-9 w-9 border-border/50" disabled>
        <Palette className="h-4 w-4" />
      </Button>
    );
  }

  const currentColor = colorOptions.find(c => c.id === color) || colorOptions[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-9 w-9 relative overflow-hidden border border-border/40 bg-background/50 hover:bg-[#fff4e8] hover:border-[#e1755a]/40 active:bg-[#ffe8d9] transition-colors duration-150 dark:hover:bg-[#3d2a20] dark:hover:border-[#e1755a]/50"
        >
          <motion.div
            whileHover={{ rotate: 15 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Palette className="h-4 w-4 text-primary" />
          </motion.div>
          {/* Color indicator dot */}
          <span 
            className="absolute bottom-1 right-1 h-2 w-2 rounded-full ring-1 ring-background"
            style={{ backgroundColor: currentColor.preview }}
          />
          <span className="sr-only">Cambiar color del tema</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-72 p-3 bg-popover border-border shadow-xl"
        sideOffset={8}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <Palette className="h-4 w-4 text-muted-foreground" />
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
                  transition={{ delay: index * 0.03 }}
                  onClick={() => changeColor(option.id)}
                  className={cn(
                    'group relative flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all duration-200',
                    'hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                    color === option.id && 'bg-muted/80'
                  )}
                  title={option.description}
                >
                  {/* Color Circle */}
                  <motion.div
                    className={cn(
                      'relative h-8 w-8 rounded-full transition-all duration-200',
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
                          <Check className="h-4 w-4 text-white drop-shadow-md" />
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

          {/* Current Selection Info */}
          <motion.div 
            key={currentColor.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-2 border-t border-border/50"
          >
            <div className="flex items-center gap-2">
              <div 
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: currentColor.preview }}
              />
              <span className="text-xs text-muted-foreground">
                {currentColor.description}
              </span>
            </div>
          </motion.div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default ThemeColorPicker;
