import { motion, AnimatePresence } from 'motion/react';
import { Package, Clock, CheckCircle2, XCircle, Check } from 'lucide-react';
import { cn, formatLocalDateKey } from '@/lib/utils';
import { PedidoEstatusKeyToLabel } from '@/generated/models/pedido-model';
import type { Pedido } from '@/generated/models/pedido-model';

export type StatusFilterType = 'all' | 'EstatusKey0' | 'EstatusKey1' | 'EstatusKey2';

interface StatusCardsProps {
  orders: Pedido[] | undefined;
  isLoading: boolean;
  /** Date to filter orders by (uses orders with matching fechaentrega) */
  selectedDate: Date;
  /** Currently active filter */
  activeFilter?: StatusFilterType;
  /** Callback when a card is clicked */
  onFilterChange?: (filter: StatusFilterType) => void;
}

export function StatusCards({ orders, isLoading, selectedDate, activeFilter = 'all', onFilterChange }: StatusCardsProps) {
  // Format selectedDate to match fechaentrega format (YYYY-MM-DD)
  const dateStr = formatLocalDateKey(selectedDate);
  
  const dateOrders = orders?.filter((o: Pedido) => o.fechaentrega === dateStr) ?? [];
  
  // Helper to check cancelled status using estatusKey
  const isCancelled = (o: Pedido) => o.estatusKey === 'EstatusKey2';
  
  const stats = {
    total: dateOrders.length,
    totalBoxLunch: dateOrders.reduce((sum, o) => sum + (o.cantidad ?? 0), 0),
    pendientes: dateOrders.filter((o: Pedido) => 
      PedidoEstatusKeyToLabel[o.estatusKey]?.toLowerCase() === 'pendiente'
    ).length,
    entregados: dateOrders.filter((o: Pedido) => 
      PedidoEstatusKeyToLabel[o.estatusKey]?.toLowerCase() === 'entregado'
    ).length,
    cancelados: dateOrders.filter((o: Pedido) => isCancelled(o)).length,
  };

  const cards = [
    {
      title: 'Total Pedidos',
      value: stats.total,
      subtitle: `${stats.totalBoxLunch} box lunch${stats.totalBoxLunch !== 1 ? 'es' : ''}`,
      icon: Package,
      baseColor: 'primary',
      filterKey: 'all' as StatusFilterType,
    },
    {
      title: 'Pendientes',
      value: stats.pendientes,
      subtitle: undefined,
      icon: Clock,
      baseColor: 'warning',
      filterKey: 'EstatusKey0' as StatusFilterType,
    },
    {
      title: 'Entregados',
      value: stats.entregados,
      subtitle: undefined,
      icon: CheckCircle2,
      baseColor: 'success',
      filterKey: 'EstatusKey1' as StatusFilterType,
    },
    {
      title: 'Cancelados',
      value: stats.cancelados,
      subtitle: undefined,
      icon: XCircle,
      baseColor: 'destructive',
      filterKey: 'EstatusKey2' as StatusFilterType,
    },
  ];

  const isActive = (filterKey: StatusFilterType) => activeFilter === filterKey;

  // Color mappings for each card type
  // Uses CSS custom properties for theme-aware colors
  const getColorClasses = (baseColor: string) => {
    const colorMap: Record<string, {
      gradient: string;
      iconBg: string;
      iconColor: string;
      border: string;
      glowClass: string;
      activeBorder: string;
      activeGlowClass: string;
      activeGradient: string;
      checkBg: string;
    }> = {
      primary: {
        gradient: 'from-primary/12 via-primary/6 to-primary/2',
        iconBg: 'bg-primary/15',
        iconColor: 'text-primary',
        border: 'border-primary/25',
        glowClass: 'status-card-glow-primary',
        activeBorder: 'border-primary/50',
        activeGlowClass: 'status-card-glow-primary-active',
        activeGradient: 'from-primary/22 via-primary/12 to-primary/5',
        checkBg: 'bg-primary',
      },
      warning: {
        gradient: 'from-warning/15 via-warning/8 to-warning/3',
        iconBg: 'bg-warning/18',
        iconColor: 'text-warning',
        border: 'border-warning/30',
        glowClass: 'status-card-glow-warning',
        activeBorder: 'border-warning/60',
        activeGlowClass: 'status-card-glow-warning-active',
        activeGradient: 'from-warning/28 via-warning/15 to-warning/6',
        checkBg: 'bg-warning',
      },
      success: {
        gradient: 'from-success/14 via-success/7 to-success/2',
        iconBg: 'bg-success/15',
        iconColor: 'text-success',
        border: 'border-success/28',
        glowClass: 'status-card-glow-success',
        activeBorder: 'border-success/60',
        activeGlowClass: 'status-card-glow-success-active',
        activeGradient: 'from-success/26 via-success/14 to-success/5',
        checkBg: 'bg-success',
      },
      destructive: {
        gradient: 'from-destructive/14 via-destructive/7 to-destructive/2',
        iconBg: 'bg-destructive/15',
        iconColor: 'text-destructive',
        border: 'border-destructive/28',
        glowClass: 'status-card-glow-destructive',
        activeBorder: 'border-destructive/60',
        activeGlowClass: 'status-card-glow-destructive-active',
        activeGradient: 'from-destructive/26 via-destructive/14 to-destructive/5',
        checkBg: 'bg-destructive',
      },
    };
    return colorMap[baseColor] ?? colorMap.primary;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full">
      {cards.map((card, index) => {
        const active = isActive(card.filterKey);
        const colors = getColorClasses(card.baseColor);
        
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.4 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onFilterChange?.(card.filterKey)}
            className={cn(
              'relative overflow-hidden rounded-2xl border-2 bg-gradient-to-br p-5 min-w-0',
              'cursor-pointer select-none',
              'transition-all duration-300 ease-out',
              // Base styles
              active ? colors.activeGradient : colors.gradient,
              active ? colors.activeBorder : colors.border,
              active ? colors.activeGlowClass : colors.glowClass,
              // Hover state for non-active
              !active && 'hover:border-border hover:shadow-lg hover:scale-[1.01]',
              // Background
              active ? 'bg-card/80 backdrop-blur-md' : 'bg-card/70 backdrop-blur-sm'
            )}
          >
            {/* Animated glow effect on active */}
            <AnimatePresence>
              {active && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 pointer-events-none"
                >
                  {/* Inner glow */}
                  <div className={cn(
                    'absolute inset-0 rounded-2xl',
                    card.baseColor === 'primary' && 'bg-gradient-to-br from-primary/10 via-transparent to-primary/5',
                    card.baseColor === 'warning' && 'bg-gradient-to-br from-warning/15 via-transparent to-warning/8',
                    card.baseColor === 'success' && 'bg-gradient-to-br from-success/12 via-transparent to-success/6',
                    card.baseColor === 'destructive' && 'bg-gradient-to-br from-destructive/12 via-transparent to-destructive/6'
                  )} />
                  {/* Animated border shimmer */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)`,
                      backgroundSize: '200% 100%',
                    }}
                    animate={{
                      backgroundPosition: ['200% 0', '-200% 0'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className={cn(
                  'typo-card-title transition-colors duration-200',
                  active ? 'text-foreground/80' : 'text-muted-foreground'
                )}>
                  {card.title}
                </p>
                {isLoading ? (
                  <div className="mt-2 h-9 w-14 bg-skeleton rounded-lg animate-pulse" />
                ) : (
                  <>
                    <motion.p
                      key={`${card.filterKey}-${card.value}`}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className={cn(
                        'mt-2 typo-card-number font-display',
                        active && 'text-foreground'
                      )}
                    >
                      {card.value}
                    </motion.p>
                    {card.subtitle && (
                      <motion.p
                        key={`${card.filterKey}-subtitle-${card.subtitle}`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.3 }}
                        className={cn(
                          'mt-0.5 text-[11px] font-medium leading-tight',
                          active ? 'text-foreground/60' : 'text-muted-foreground/70'
                        )}
                      >
                        {card.subtitle}
                      </motion.p>
                    )}
                  </>
                )}
              </div>
              
              {/* Icon container with selection indicator */}
              <div className="relative">
                <motion.div
                  animate={{
                    scale: active ? 1.1 : 1,
                    rotate: active ? [0, -5, 5, 0] : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    'p-2.5 rounded-xl transition-all duration-300',
                    colors.iconBg,
                    active && 'ring-2 ring-offset-1 ring-offset-transparent',
                    active && card.baseColor === 'primary' && 'ring-primary/30',
                    active && card.baseColor === 'warning' && 'ring-warning/40',
                    active && card.baseColor === 'success' && 'ring-success/40',
                    active && card.baseColor === 'destructive' && 'ring-destructive/40'
                  )}
                >
                  <card.icon className={cn('h-5 w-5', colors.iconColor)} />
                </motion.div>
                
                {/* Checkmark badge */}
                <AnimatePresence>
                  {active && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0, y: 5 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0, opacity: 0, y: 5 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      className={cn(
                        'absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center shadow-lg',
                        colors.checkBg,
                        'ring-2 ring-card'
                      )}
                    >
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Decorative corner accent */}
            <div className={cn(
              'absolute -bottom-6 -right-6 h-24 w-24 rounded-full blur-2xl transition-opacity duration-300',
              active ? 'opacity-70' : 'opacity-40',
              card.baseColor === 'primary' && 'bg-primary/25',
              card.baseColor === 'warning' && 'bg-warning/30',
              card.baseColor === 'success' && 'bg-success/25',
              card.baseColor === 'destructive' && 'bg-destructive/25'
            )} />
            
            {/* Top accent line when active */}
            <AnimatePresence>
              {active && (
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  exit={{ scaleX: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className={cn(
                    'absolute top-0 left-4 right-4 h-0.5 rounded-full origin-left',
                    card.baseColor === 'primary' && 'bg-gradient-to-r from-primary/60 via-primary to-primary/60',
                    card.baseColor === 'warning' && 'bg-gradient-to-r from-warning/60 via-warning to-warning/60',
                    card.baseColor === 'success' && 'bg-gradient-to-r from-success/60 via-success to-success/60',
                    card.baseColor === 'destructive' && 'bg-gradient-to-r from-destructive/60 via-destructive to-destructive/60'
                  )}
                />
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
