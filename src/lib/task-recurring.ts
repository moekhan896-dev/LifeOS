import { addDays, addWeeks, addMonths } from 'date-fns'

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly'

export interface TaskRecurring {
  frequency: RecurringFrequency
  nextDue: string
}

export function initialNextDue(frequency: RecurringFrequency, from: Date = new Date()): string {
  switch (frequency) {
    case 'daily':
      return addDays(from, 1).toISOString()
    case 'weekly':
      return addWeeks(from, 1).toISOString()
    case 'monthly':
      return addMonths(from, 1).toISOString()
  }
}

/** Next occurrence after completing the current instance (anchor on stored nextDue). */
export function advanceRecurringDue(r: TaskRecurring): string {
  const base = new Date(r.nextDue)
  return initialNextDue(r.frequency, base)
}
