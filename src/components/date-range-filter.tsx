/**
 * DateRangeFilter - Component to filter by date range
 * Allows you to select predefined or custom ranges
 */
import { useState } from 'react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type PresetRange = 'today' | 'week' | 'month' | 'last7' | 'last30' | 'custom';

interface DateRangeFilterProps {
    selectedRange: DateRange | undefined;
    onRangeChange: (range: DateRange | undefined) => void;
    className?: string;
}

const presets: { key: PresetRange; label: string; getRange: () => DateRange }[] = [
    {
        key: 'today',
        label: 'Hoy',
        getRange: () => {
            const today = new Date();
            return { from: today, to: today };
        },
    },
    {
        key: 'week',
        label: 'Esta semana',
        getRange: () => ({
            from: startOfWeek(new Date(), { locale: es }),
            to: endOfWeek(new Date(), { locale: es }),
        }),
    },
    {
        key: 'month',
        label: 'Este mes',
        getRange: () => ({
            from: startOfMonth(new Date()),
            to: endOfMonth(new Date()),
        }),
    },
    {
        key: 'last7',
        label: 'Últimos 7 días',
        getRange: () => ({
            from: subDays(new Date(), 6),
            to: new Date(),
        }),
    },
    {
        key: 'last30',
        label: 'Últimos 30 días',
        getRange: () => ({
            from: subDays(new Date(), 29),
            to: new Date(),
        }),
    },
];

export function DateRangeFilter({
    selectedRange,
    onRangeChange,
    className,
}: DateRangeFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activePreset, setActivePreset] = useState<PresetRange | null>('today');

    const handlePresetSelect = (preset: typeof presets[number]) => {
        setActivePreset(preset.key);
        onRangeChange(preset.getRange());
        setIsOpen(false);
    };

    const handleCustomSelect = (range: DateRange | undefined) => {
        setActivePreset('custom');
        onRangeChange(range);
    };

    const displayText = () => {
        if (!selectedRange?.from) return 'Seleccionar fechas';

        if (activePreset && activePreset !== 'custom') {
            const preset = presets.find(p => p.key === activePreset);
            if (preset) return preset.label;
        }

        if (selectedRange.to) {
            return `${format(selectedRange.from, 'd MMM', { locale: es })} - ${format(selectedRange.to, 'd MMM', { locale: es })}`;
        }
        return format(selectedRange.from, 'd MMM yyyy', { locale: es });
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        'gap-2 h-[42px] min-w-[160px] justify-between font-normal',
                        !selectedRange && 'text-muted-foreground',
                        className
                    )}
                >
                    <span className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        <span>{displayText()}</span>
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" translate="no">
                <div className="flex">
                    {/* Presets */}
                    <div className="w-40 border-r py-2">
                        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Rápido
                        </p>
                        <div className="space-y-0.5 px-1">
                            {presets.map((preset) => (
                                <button
                                    key={preset.key}
                                    type="button"
                                    onClick={() => handlePresetSelect(preset)}
                                    className={cn(
                                        'w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors',
                                        activePreset === preset.key
                                            ? 'bg-primary/10 text-primary font-medium'
                                            : 'hover:bg-muted text-foreground'
                                    )}
                                >
                                    <span>{preset.label}</span>
                                    <AnimatePresence>
                                        {activePreset === preset.key && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                exit={{ scale: 0 }}
                                            >
                                                <Check className="h-4 w-4" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Calendar */}
                    <div className="p-3">
                        <p className="px-1 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Personalizado
                        </p>
                        <Calendar
                            mode="range"
                            selected={selectedRange}
                            onSelect={handleCustomSelect}
                            numberOfMonths={1}
                            defaultMonth={selectedRange?.from}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t px-4 py-3 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => {
                            setActivePreset(null);
                            onRangeChange(undefined);
                            setIsOpen(false);
                        }}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Limpiar
                    </button>
                    <Button
                        size="sm"
                        onClick={() => setIsOpen(false)}
                    >
                        Aplicar
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export default DateRangeFilter;
