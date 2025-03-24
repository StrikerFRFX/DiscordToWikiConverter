import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns singular or plural form of a word based on count
 * @param count The count to check
 * @param singular The singular form of the word
 * @param plural The plural form of the word
 * @returns The appropriate form based on count
 */
export function singularOrPlural(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}
