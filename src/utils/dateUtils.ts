/**
 * Formats a Date into YYYY-MM-DD in the user's local timezone (never UTC-shifted).
 */
export function toLocalDateIso(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addLocalDaysIso(offsetDays: number, baseDate: Date = new Date()): string {
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + offsetDays);
  return toLocalDateIso(d);
}
