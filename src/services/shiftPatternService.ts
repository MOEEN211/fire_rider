export type ShiftType = 'Day' | 'Night' | 'Off';

/**
 * 4-on-4-off shift pattern calculator.
 *
 * Cycle (8 days):
 *   Day 0  → Day
 *   Day 1  → Day
 *   Day 2  → Night
 *   Day 3  → Night
 *   Day 4  → Off
 *   Day 5  → Off
 *   Day 6  → Off
 *   Day 7  → Off
 *
 * @param date      The date to check
 * @param anchor    A known date that starts a fresh cycle at Day 0 (Day shift)
 */
export function getShiftForDate(date: Date, anchor: Date = new Date(2026, 4, 27)): ShiftType {
  // Strip time so we compare calendar days only
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const a = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());

  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((d.getTime() - a.getTime()) / msPerDay);
  const cycleDay = ((diffDays % 8) + 8) % 8; // handle negative dates

  if (cycleDay === 0 || cycleDay === 1) return 'Day';
  if (cycleDay === 2 || cycleDay === 3) return 'Night';
  return 'Off';
}

/**
 * Return a human-readable label for the shift cycle position.
 */
export function getShiftLabel(date: Date, anchor: Date = new Date(2026, 4, 27)): string {
  const shift = getShiftForDate(date, anchor);
  if (shift === 'Off') return 'Off Duty';
  return `${shift} Shift`;
}
