export function calculateWorkingDays(targetDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const target = new Date(targetDate)
  target.setHours(0, 0, 0, 0)

  let workingDays = 0
  const current = new Date(today)

  while (current < target) {
    const dayOfWeek = current.getDay()
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++
    }
    current.setDate(current.getDate() + 1)
  }

  return workingDays
}

export function formatWorkingDaysUntil(dateStr: string | null): string | null {
  if (!dateStr) return null

  const workingDays = calculateWorkingDays(dateStr)

  if (workingDays === 0) return 'Due today'
  if (workingDays === 1) return 'in 1 working day'
  if (workingDays < 0) return 'Overdue'

  return `in ${workingDays} working days`
}
