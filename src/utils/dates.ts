export const DN     = ['So','Mo','Di','Mi','Do','Fr','Sa'] as const;
export const MONTHS = ['Jänner','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'] as const;

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function fmtDate(d: string | null): string {
  if (!d) return '';
  const [, m, day] = d.split('-');
  return `${day}.${m}.`;
}

export function getMonday(offsetWeeks: number): Date {
  const today = new Date();
  const dow   = today.getDay();
  const diff  = dow === 0 ? -6 : 1 - dow;
  const mon   = new Date(today);
  mon.setDate(today.getDate() + diff + offsetWeeks * 7);
  return mon;
}

export function dKey(d: Date): string {
  return d.toISOString().split('T')[0];
}
