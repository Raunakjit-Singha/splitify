import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isYesterday, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  if (isToday(d)) {
    return `Today, ${format(d, 'h:mm a')}`;
  } else if (isYesterday(d)) {
    return `Yesterday, ${format(d, 'h:mm a')}`;
  } else {
    return format(d, 'MMM d, yyyy');
  }
}

export function getDateRange(period: 'day' | 'week' | 'month' | 'all', date = new Date()): { start: Date, end: Date } {
  const today = new Date(date);
  
  switch(period) {
    case 'day':
      return {
        start: new Date(today.setHours(0, 0, 0, 0)),
        end: new Date(today.setHours(23, 59, 59, 999))
      };
    case 'week':
      return {
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: endOfWeek(today, { weekStartsOn: 1 })
      };
    case 'month':
      return {
        start: startOfMonth(today),
        end: endOfMonth(today)
      };
    case 'all':
    default:
      // A large date range to get "all" expenses
      return {
        start: new Date(2000, 0, 1),
        end: new Date(2100, 11, 31)
      };
  }
}

export function generateExportURL(period: string, groupId?: number): string {
  const dateRange = getDateRange(period as 'day' | 'week' | 'month' | 'all');
  let url = `/api/export/expenses?period=${period}`;
  
  url += `&startDate=${dateRange.start.toISOString()}`;
  url += `&endDate=${dateRange.end.toISOString()}`;
  
  if (groupId) {
    url += `&groupId=${groupId}`;
  }
  
  return url;
}
