/**
 * DashboardMetrics - Advanced metrics component with trend charts
 * Show statistics with date range filter and order trends
 */
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format, subDays, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Calendar,
    BarChart3,
    Users,
    Target,
    CalendarDays,
} from 'lucide-react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    BarChart,
    Bar,
} from 'recharts';

import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import type { Pedido } from '@/generated/models/pedido-model';
import type { DateRange } from 'react-day-picker';

type DateRangePreset = 'last7days' | 'last30days' | 'custom';

interface DashboardMetricsProps {
    orders: Pedido[] | undefined;
    isLoading: boolean;
}

export function DashboardMetrics({ orders, isLoading }: DashboardMetricsProps) {
    const [datePreset, setDatePreset] = useState<DateRangePreset>('last7days');
    const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
    const [calendarOpen, setCalendarOpen] = useState(false);

    // Calculate date range based on preset
    const dateRange = useMemo(() => {
        const today = new Date();
        switch (datePreset) {
            case 'last7days':
                return { start: subDays(today, 6), end: today };
            case 'last30days':
                return { start: subDays(today, 29), end: today };
            case 'custom':
                if (customRange?.from && customRange?.to) {
                    return { start: customRange.from, end: customRange.to };
                }
                return { start: subDays(today, 6), end: today };
            default:
                return { start: subDays(today, 6), end: today };
        }
    }, [datePreset, customRange]);

    // Calculate data from the selected range
    const rangeData = useMemo(() => {
        if (!orders) return [];

        const daysInRange = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
        const today = new Date();

        return daysInRange.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayOrders = orders.filter(o => o.fechaentrega === dateStr);
            const entregados = dayOrders.filter(o => o.estatusKey === 'EstatusKey0').length;
            const pendientes = dayOrders.filter(o => o.estatusKey === 'EstatusKey1').length;
            const cancelados = dayOrders.filter(o => o.estatusKey === 'EstatusKey2').length;

            return {
                name: daysInRange.length <= 7 ? format(day, 'EEE', { locale: es }) : format(day, 'd', { locale: es }),
                fullDate: format(day, 'd MMM', { locale: es }),
                total: dayOrders.length,
                entregados,
                pendientes,
                cancelados,
                isToday: format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'),
            };
        });
    }, [orders, dateRange]);

    // Calculate trend comparing with previous equivalent period
    const trend = useMemo(() => {
        if (!orders) return { percentage: 0, direction: 'neutral' as const };

        const rangeDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const previousStart = subDays(dateRange.start, rangeDays);
        const previousEnd = subDays(dateRange.start, 1);

        const currentOrders = orders.filter(o => {
            const orderDate = new Date(o.fechaentrega);
            return isWithinInterval(orderDate, { start: dateRange.start, end: dateRange.end });
        }).length;

        const previousOrders = orders.filter(o => {
            const orderDate = new Date(o.fechaentrega);
            return isWithinInterval(orderDate, { start: previousStart, end: previousEnd });
        }).length;

        if (previousOrders === 0) {
            return { percentage: currentOrders > 0 ? 100 : 0, direction: currentOrders > 0 ? 'up' as const : 'neutral' as const };
        }

        const percentage = Math.round(((currentOrders - previousOrders) / previousOrders) * 100);
        const direction = percentage > 0 ? 'up' as const : percentage < 0 ? 'down' as const : 'neutral' as const;

        return { percentage: Math.abs(percentage), direction };
    }, [orders, dateRange]);

    // Calculate delivery rate of the selected range
    const deliveryRate = useMemo(() => {
        if (!orders) return 0;
        const rangeOrders = orders.filter(o => {
            const orderDate = new Date(o.fechaentrega);
            return isWithinInterval(orderDate, { start: dateRange.start, end: dateRange.end });
        });
        if (rangeOrders.length === 0) return 0;
        const delivered = rangeOrders.filter(o => o.estatusKey === 'EstatusKey0').length;
        return Math.round((delivered / rangeOrders.length) * 100);
    }, [orders, dateRange]);

    // Unique employees of the selected range
    const uniqueEmployees = useMemo(() => {
        if (!orders) return 0;

        const rangeOrders = orders.filter(o => {
            const orderDate = new Date(o.fechaentrega);
            return isWithinInterval(orderDate, { start: dateRange.start, end: dateRange.end });
        });

        const employeeIds = new Set(rangeOrders.map(o => o.empleado?.id).filter(Boolean));
        return employeeIds.size;
    }, [orders, dateRange]);

    // Date Range Presets (Simplified)
    const presets: { key: DateRangePreset; label: string }[] = [
        { key: 'last7days', label: '7 días' },
        { key: 'last30days', label: '30 días' },
    ];

    const getPresetLabel = () => {
        if (datePreset === 'custom' && customRange?.from && customRange?.to) {
            return `${format(customRange.from, 'd MMM', { locale: es })} - ${format(customRange.to, 'd MMM', { locale: es })}`;
        }
        return presets.find(p => p.key === datePreset)?.label ?? '7 días';
    };



    if (isLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-48 bg-card rounded-2xl border animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 items-stretch">
            {/* Trend Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-2 bg-card rounded-2xl border border-border p-5 overflow-hidden flex flex-col lg:min-h-0"
            >
                {/* Header with title, stats and filters - same line on tablet/desktop, separate row only on mobile */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    {/* Left side: icon + statistics */}
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 flex-shrink-0">
                            <BarChart3 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            {/* Main number with inline trend */}
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-foreground">
                                    {rangeData.reduce((sum, d) => sum + d.total, 0)}
                                </span>
                                <span className={cn(
                                    'flex items-center gap-0.5 text-xs font-medium',
                                    trend.direction === 'up' && 'text-success',
                                    trend.direction === 'down' && 'text-destructive',
                                    trend.direction === 'neutral' && 'text-muted-foreground'
                                )}>
                                    {trend.direction === 'up' && <span>▲</span>}
                                    {trend.direction === 'down' && <span>▼</span>}
                                    {trend.direction === 'neutral' && <span>—</span>}
                                    <span>{trend.percentage}%</span>
                                </span>
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">
                                <span>Total pedidos (</span>
                                <span>{datePreset === 'last7days' ? 'sem.' : datePreset === 'last30days' ? 'mes' : 'periodo'}</span>
                                <span>)</span>
                            </p>
                        </div>
                    </div>

                    {/* Right side: date range filters */}
                    <div className="flex flex-wrap bg-muted/50 rounded-xl border border-border/50 p-1 gap-1">
                        {presets.map((preset) => (
                            <button
                                key={preset.key}
                                onClick={() => setDatePreset(preset.key)}
                                className={cn(
                                    'px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200',
                                    datePreset === preset.key
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                )}
                            >
                                <span>{preset.label}</span>
                            </button>
                        ))}
                        {/* Calendar picker for custom range */}
                        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                            <PopoverTrigger asChild>
                                <button
                                    className={cn(
                                        'px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5',
                                        datePreset === 'custom'
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    )}
                                >
                                    <CalendarDays className="h-3 w-3" />
                                    <span>{datePreset === 'custom' ? getPresetLabel() : 'Personalizado'}</span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start" translate="no">
                                <CalendarComponent
                                    mode="range"
                                    selected={customRange}
                                    onSelect={(range) => {
                                        setCustomRange(range);
                                        if (range?.from && range?.to) {
                                            setDatePreset('custom');
                                            setCalendarOpen(false);
                                        }
                                    }}
                                    numberOfMonths={1}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* No data chart or message area - flex-1 to fill space */}
                {rangeData.every(d => d.total === 0) ? (
                    <div className="flex-1 min-h-[180px] flex flex-col items-center justify-center text-muted-foreground">
                        <Calendar className="h-10 w-10 mb-2 opacity-40" />
                        <p className="text-sm font-medium">Sin pedidos en este periodo</p>
                        <p className="text-xs opacity-70">Intenta seleccionar otro rango de fechas</p>
                    </div>
                ) : (
                    <div className="flex-1 min-h-[180px]" translate="no">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={rangeData} barCategoryGap="20%" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={rangeData.length > 14 ? Math.floor(rangeData.length / 7) : 0}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={25}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'var(--color-primary)', opacity: 0.1 }}
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
                                                <p className="font-semibold capitalize mb-1">{data.fullDate}</p>
                                                <div className="space-y-1 text-xs">
                                                    <p className="flex justify-between gap-4">
                                                        <span className="text-muted-foreground">Total:</span>
                                                        <span className="font-medium">{data.total}</span>
                                                    </p>
                                                    <p className="flex justify-between gap-4">
                                                        <span className="text-emerald-600 dark:text-emerald-400">Entregados:</span>
                                                        <span className="font-medium">{data.entregados}</span>
                                                    </p>
                                                    <p className="flex justify-between gap-4">
                                                        <span className="text-amber-600 dark:text-amber-400">Pendientes:</span>
                                                        <span className="font-medium">{data.pendientes}</span>
                                                    </p>
                                                    <p className="flex justify-between gap-4">
                                                        <span className="text-red-600 dark:text-red-400">Cancelados:</span>
                                                        <span className="font-medium">{data.cancelados}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    }}
                                />
                                <Bar
                                    dataKey="total"
                                    fill="var(--color-primary)"
                                    radius={[6, 6, 0, 0]}
                                    className="drop-shadow-sm"
                                    style={{ filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))' }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </motion.div>

            {/* Quick Metrics - stretch to equal graph height */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col gap-3"
            >
                {/* Delivery Rate */}
                <div className="flex-1 bg-card rounded-2xl border border-border p-4 pb-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-lg bg-primary/15">
                                <Target className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Tasa de Entrega</span>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-primary">{deliveryRate}%</span>
                            <span className="text-xs text-muted-foreground mb-1">completado</span>
                        </div>
                        {/* progress bar */}
                        <div className="mt-3 h-2 bg-primary/20 rounded-full overflow-hidden">
                            <motion.div
                                key={`delivery-${deliveryRate}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${deliveryRate}%` }}
                                transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Empleados Activos */}
                <div className="flex-1 bg-card rounded-2xl border border-border p-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-lg bg-primary/15">
                                <Users className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Empleados</span>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-gray-800 dark:text-gray-100">{uniqueEmployees}</span>
                            <span className="text-xs text-muted-foreground mb-1">personas</span>
                        </div>
                    </div>
                </div>

                {/* Total for the period */}
                <div className="flex-1 bg-card rounded-2xl border border-border p-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-lg bg-primary/15">
                                <Calendar className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Total Pedidos</span>
                        </div>
                        <div className="flex items-end gap-2">
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={`total-${rangeData.reduce((sum, d) => sum + d.total, 0)}`}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                    className="text-3xl font-bold text-gray-800 dark:text-gray-100"
                                >
                                    {rangeData.reduce((sum, d) => sum + d.total, 0)}
                                </motion.span>
                            </AnimatePresence>
                            <span className="text-xs text-muted-foreground mb-1">pedidos</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default DashboardMetrics;
