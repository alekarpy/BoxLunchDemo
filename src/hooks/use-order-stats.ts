/**
 * useOrderStats - Hook to calculate order statistics.
 * Provides calculated metrics for the dashboard.
 */
import { useMemo } from 'react';
import { format, startOfWeek, endOfWeek, isWithinInterval, subDays, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Pedido } from '@/generated/models/pedido-model';

export interface OrderStats {
  /** Today's orders */
  today: {
    total: number;
    pending: number;
    delivered: number;
    cancelled: number;
    deliveryRate: number;
  };
  /** This week's orders */
  week: {
    total: number;
    pending: number;
    delivered: number;
    cancelled: number;
    avgPerDay: number;
    trend: number;
    trendDirection: 'up' | 'down' | 'neutral';
  };
  /** Unique employees */
  uniqueEmployees: number;
  /** Most frequent delivery locations */
  topLocations: Array<{ location: string; count: number }>;
  /** Most requested delivery hours */
  peakHours: Array<{ hour: string; count: number }>;
  /** Daily data for charts */
  dailyData: Array<{
    date: string;
    label: string;
    total: number;
    delivered: number;
    pending: number;
    cancelled: number;
  }>;
}

export function useOrderStats(orders: Pedido[] | undefined): OrderStats {
  return useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        today: { total: 0, pending: 0, delivered: 0, cancelled: 0, deliveryRate: 0 },
        week: { total: 0, pending: 0, delivered: 0, cancelled: 0, avgPerDay: 0, trend: 0, trendDirection: 'neutral' },
        uniqueEmployees: 0,
        topLocations: [],
        peakHours: [],
        dailyData: [],
      };
    }

    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const weekStart = startOfWeek(now, { locale: es });
    const weekEnd = endOfWeek(now, { locale: es });

    // Today's orders
    const todayOrders = orders.filter(o => o.fechaentrega === todayStr);
    const todayPending = todayOrders.filter(o => o.estatusKey === 'EstatusKey1').length;
    const todayDelivered = todayOrders.filter(o => o.estatusKey === 'EstatusKey0').length;
    const todayCancelled = todayOrders.filter(o => o.estatusKey === 'EstatusKey2').length;
    const todayDeliveryRate = todayOrders.length > 0 
      ? Math.round((todayDelivered / todayOrders.length) * 100) 
      : 0;

    // This week's orders
    const weekOrders = orders.filter(o => {
      const orderDate = parseISO(o.fechaentrega);
      return isWithinInterval(orderDate, { start: weekStart, end: weekEnd });
    });
    const weekPending = weekOrders.filter(o => o.estatusKey === 'EstatusKey1').length;
    const weekDelivered = weekOrders.filter(o => o.estatusKey === 'EstatusKey0').length;
    const weekCancelled = weekOrders.filter(o => o.estatusKey === 'EstatusKey2').length;
    const daysInWeek = differenceInDays(weekEnd, weekStart) + 1;
    const weekAvgPerDay = Math.round((weekOrders.length / daysInWeek) * 10) / 10;

    // Trend vs previous week
    const lastWeekStart = subDays(weekStart, 7);
    const lastWeekEnd = subDays(weekStart, 1);
    const lastWeekOrders = orders.filter(o => {
      const orderDate = parseISO(o.fechaentrega);
      return isWithinInterval(orderDate, { start: lastWeekStart, end: lastWeekEnd });
    });
    
    let trend = 0;
    let trendDirection: 'up' | 'down' | 'neutral' = 'neutral';
    if (lastWeekOrders.length > 0) {
      trend = Math.round(((weekOrders.length - lastWeekOrders.length) / lastWeekOrders.length) * 100);
      trendDirection = trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral';
    } else if (weekOrders.length > 0) {
      trend = 100;
      trendDirection = 'up';
    }

    // Unique employees this week
    const employeeIds = new Set(weekOrders.map(o => o.empleado?.id).filter(Boolean));

    // Most frequent locations
    const locationCounts = new Map<string, number>();
    orders.forEach(o => {
      const location = o.notas?.trim();
      if (location) {
        locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
      }
    });
    const topLocations = Array.from(locationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([location, count]) => ({ location, count }));

    // Peak hours
    const hourCounts = new Map<string, number>();
    orders.forEach(o => {
      if (o.horaentrega) {
        // Extract hour from datetime
        const hourMatch = o.horaentrega.match(/T(\d{2}):\d{2}/);
        if (hourMatch) {
          const hour = hourMatch[1];
          hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
        }
      }
    });
    const peakHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([hour, count]) => ({
        hour: `${parseInt(hour, 10) > 12 ? parseInt(hour, 10) - 12 : parseInt(hour, 10)}:00 ${parseInt(hour, 10) >= 12 ? 'PM' : 'AM'}`,
        count,
      }));

    // Daily data for chart (7 days)
    const dailyData = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(now, 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayOrders = orders.filter(o => o.fechaentrega === dateStr);
      
      return {
        date: dateStr,
        label: format(date, 'EEE', { locale: es }),
        total: dayOrders.length,
        delivered: dayOrders.filter(o => o.estatusKey === 'EstatusKey0').length,
        pending: dayOrders.filter(o => o.estatusKey === 'EstatusKey1').length,
        cancelled: dayOrders.filter(o => o.estatusKey === 'EstatusKey2').length,
      };
    });

    return {
      today: {
        total: todayOrders.length,
        pending: todayPending,
        delivered: todayDelivered,
        cancelled: todayCancelled,
        deliveryRate: todayDeliveryRate,
      },
      week: {
        total: weekOrders.length,
        pending: weekPending,
        delivered: weekDelivered,
        cancelled: weekCancelled,
        avgPerDay: weekAvgPerDay,
        trend: Math.abs(trend),
        trendDirection,
      },
      uniqueEmployees: employeeIds.size,
      topLocations,
      peakHours,
      dailyData,
    };
  }, [orders]);
}

export default useOrderStats;
