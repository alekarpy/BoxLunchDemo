import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatLocalDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseLocalDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTime(time: string | undefined | null): string {
  if (!time) return '--:--';
  
  let hours: number;
  let minutes: number;
  
  // Check if it's an ISO DateTime string (e.g., "2024-12-09T07:30:00Z" or "2024-12-09T07:30")
  if (time.includes('T')) {
    // Extract time part directly from the string to avoid timezone conversion issues
    // The delivery time should be displayed exactly as it was entered, not converted to local time
    const timePart = time.split('T')[1];
    if (timePart) {
      // Remove timezone info (Z, +00:00, -05:00, etc.) and seconds if present
      const cleanTime = timePart.replace(/([+-]\d{2}:\d{2}|Z)$/, '');
      const [h, m] = cleanTime.split(':').map(Number);
      hours = h;
      minutes = m;
    } else {
      return '--:--';
    }
  } else {
    // Handle simple time strings like "14:30" or "14:30:00"
    const [h, m] = time.split(':').map(Number);
    hours = h;
    minutes = m;
  }
  
  // Validate hours and minutes
  if (isNaN(hours) || isNaN(minutes)) {
    return '--:--';
  }
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

export function getStatusColor(status: string): string {
  // Balanced palette for status:
  // - Pending: warm amber (reference, slightly highlighted)
  // - Delivered: soft green (harmonious, does not compete with actions)
  // - Cancelled: muted red (indicates negative final state)
  switch (status.toLowerCase()) {
    case 'pendiente':
      // Visual reference: warm amber, slightly highlighted
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/25 dark:text-amber-300 dark:border-amber-700/40';
    case 'entregado':
      // Soft and harmonious green - not too vibrant so it doesn't compete with action buttons
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-300 dark:border-emerald-700/40';
    case 'cancelado':
      // Neutral and sober red - indicates negative state without pink tones
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/25 dark:text-red-300 dark:border-red-700/40';
    default:
      return 'bg-secondary text-secondary-foreground border-secondary';
  }
}
