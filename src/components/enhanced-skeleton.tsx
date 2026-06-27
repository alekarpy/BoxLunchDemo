/**
 * EnhancedSkeleton - Improved skeleton components with animations
 * Provides engaging visual feedback during charging
 */
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-card p-5',
        className
      )}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="h-4 w-24 rounded-md bg-skeleton animate-pulse" />
          <div className="h-9 w-14 rounded-lg bg-skeleton animate-pulse" />
        </div>
        <div className="h-10 w-10 rounded-xl bg-skeleton animate-pulse" />
      </div>
    </motion.div>
  );
}

export function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b"
    >
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <div 
            className="h-5 rounded-md bg-skeleton animate-pulse"
            style={{ 
              width: i === 0 ? '70%' : i === columns - 1 ? '40%' : '60%',
              animationDelay: `${i * 100}ms`
            }}
          />
        </td>
      ))}
    </motion.tr>
  );
}

export function SkeletonMetric({ className }: { className?: string }) {
  return (
    <div className={cn('bg-card rounded-2xl border p-4 space-y-3', className)}>
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-skeleton animate-pulse" />
        <div className="h-3 w-24 rounded bg-skeleton animate-pulse" />
      </div>
      <div className="h-8 w-16 rounded-lg bg-skeleton animate-pulse" />
    </div>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn('bg-card rounded-2xl border p-5', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-skeleton animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-skeleton animate-pulse" />
            <div className="h-3 w-24 rounded bg-skeleton animate-pulse" />
          </div>
        </div>
        <div className="h-6 w-32 rounded-full bg-skeleton animate-pulse" />
      </div>
      
      {/* Chart Bar Simulation */}
      <div className="flex items-end justify-around h-32 pt-4">
        {[40, 65, 45, 80, 55, 70, 50].map((height, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${height}%` }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="w-8 rounded-t-md bg-skeleton animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SkeletonChart className="lg:col-span-2" />
        <div className="flex flex-col gap-3">
          <SkeletonMetric className="flex-1" />
          <SkeletonMetric className="flex-1" />
          <SkeletonMetric className="flex-1" />
        </div>
      </div>
      
      {/* Status cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export default SkeletonDashboard;
