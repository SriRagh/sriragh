
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatInTimeZone } from 'date-fns-tz';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function convertToTimeZone(date: Date, location: string): string {
  const timeZone = location === 'Hyderabad' ? 'Asia/Kolkata' : 'Pacific/Honolulu';
  return formatInTimeZone(date, timeZone, "yyyy-MM-dd'T'HH:mm:ss");
}
