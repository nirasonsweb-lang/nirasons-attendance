import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ON_TIME: 'bg-accent-primary text-dark-900',
    LATE: 'bg-status-warning text-dark-900',
    ABSENT: 'bg-dark-500 text-gray-300',
    HALF_DAY: 'bg-status-info text-white',
    pending: 'bg-status-warning/20 text-status-warning',
    in_progress: 'bg-status-info/20 text-status-info',
    completed: 'bg-status-success/20 text-status-success',
  };
  return colors[status] || 'bg-dark-500 text-gray-300';
}

export function calculateWorkHours(
  checkIn: Date | null,
  checkOut: Date | null
): number {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
}

export function getTodayDate(): Date {
  const today = getISTDate();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Get current date and time in IST (Indian Standard Time, UTC+5:30)
 */
export function getISTDate(): Date {
  const now = new Date();
  const istOffset = 5.5 * 60; // IST is UTC+5:30 in minutes
  const localTime = new Date(now.getTime() + (istOffset * 60 * 1000) - (now.getTimezoneOffset() * 60 * 1000));
  return localTime;
}

/**
 * Get today's date (midnight) in IST
 */
export function getISTToday(): Date {
  const today = getISTDate();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function getDateRangeForMonth(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start, end };
}

export function getDaysInMonth(date: Date): Date[] {
  const { start, end } = getDateRangeForMonth(date);
  const days: Date[] = [];
  const current = new Date(start);

  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function generateInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
