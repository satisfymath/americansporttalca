// Utility functions for date operations
import { format, parseISO, isAfter, isBefore, addDays, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'

// Format date for display
export function formatDate(isoString: string): string {
  return format(parseISO(isoString), 'd MMM yyyy', { locale: es })
}

// Format date-time for display
export function formatDateTime(isoString: string): string {
  return format(parseISO(isoString), "d MMM yyyy HH:mm", { locale: es })
}

// Format time only
export function formatTime(isoString: string): string {
  return format(parseISO(isoString), 'HH:mm')
}

// Get current period string (yyyy-MM)
export function getCurrentPeriod(): string {
  return format(new Date(), 'yyyy-MM')
}

// Get period label for display (e.g., "Enero 2026")
export function getPeriodLabel(period: string): string {
  const [year, month] = period.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
  return format(date, "MMMM yyyy", { locale: es })
}

// Check if date is in current month
export function isCurrentMonth(isoString: string): boolean {
  const date = parseISO(isoString)
  const now = new Date()
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
}

// Get start and end of month
export function getMonthRange(period: string): { start: Date; end: Date } {
  const [year, month] = period.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  }
}

// Check if payment is due soon (within 5 days)
export function isDueSoon(dueDate: Date): boolean {
  const now = new Date()
  const fiveDaysFromNow = addDays(now, 5)
  return isAfter(dueDate, now) && isBefore(dueDate, fiveDaysFromNow)
}

// Check if payment is overdue
export function isOverdue(dueDate: Date): boolean {
  return isBefore(dueDate, new Date())
}

// Get next due date based on member's due day and last paid period
export function getNextDueDate(dueDay: number, lastPaidPeriod: string | null): Date {
  const now = new Date()
  let year = now.getFullYear()
  let month = now.getMonth()

  if (lastPaidPeriod) {
    const [pYear, pMonth] = lastPaidPeriod.split('-').map(Number)
    // Next period is the month after the last paid period
    if (pMonth === 12) {
      year = pYear + 1
      month = 0
    } else {
      year = pYear
      month = pMonth // pMonth is 1-indexed, so no need to add 1
    }
  }

  // Ensure due day is valid for the month
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const validDueDay = Math.min(dueDay, daysInMonth)

  return new Date(year, month, validDueDay)
}
