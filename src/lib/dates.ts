import { formatInTimeZone, toDate } from 'date-fns-tz';
import { format, parseISO } from 'date-fns';

export const TIMEZONE = 'Asia/Kolkata';

/**
 * Returns today's date string in Asia/Kolkata timezone (YYYY-MM-DD).
 */
export function todayIST(): string {
  return formatInTimeZone(new Date(), TIMEZONE, 'yyyy-MM-dd');
}

/**
 * Returns the current date-time formatted in Asia/Kolkata.
 */
export function nowIST(): Date {
  return toDate(new Date(), { timeZone: TIMEZONE });
}

/**
 * Formats a date or ISO string into a human-readable IST string.
 * Example: "22 Nov 2026"
 */
export function formatISTDisplay(date: string | Date, pattern = 'dd MMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(d, TIMEZONE, pattern);
}

/**
 * Formats date and time into a friendly string.
 * Example: "22 Nov 2026, 06:45 PM"
 */
export function formatISTDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(d, TIMEZONE, 'dd MMM yyyy, hh:mm a');
}

