export const GIORNI_SETTIMANA = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
export const GIORNI_COMPLETI = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];
export const MESI = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

export interface WeekDetails {
  weekKey: string;
  weekNumber: number;
  year: number;
  startDate: Date;
  endDate: Date;
  days: Date[];
}

export function formatWeekKey(d: Date): string {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  // January 4 is always in week 1.
  const week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  const weekNo = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${date.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function getCurrentWeekKey(): string {
  return formatWeekKey(new Date());
}

export function getWeekDetails(weekKey: string): WeekDetails {
  const match = weekKey.match(/^(\d{4})-W(\d{2})$/);
  if (!match) {
    return getWeekDetails(getCurrentWeekKey());
  }

  const year = parseInt(match[1], 10);
  const weekNo = parseInt(match[2], 10);

  // ISO 8601: Jan 4 is always in week 1
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = (jan4.getDay() + 6) % 7; // Monday = 0
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setDate(jan4.getDate() - dayOfWeek);

  const startMonday = new Date(mondayWeek1);
  startMonday.setDate(mondayWeek1.getDate() + (weekNo - 1) * 7);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startMonday);
    d.setDate(startMonday.getDate() + i);
    days.push(d);
  }

  const endSunday = days[6];

  return {
    weekKey,
    weekNumber: weekNo,
    year,
    startDate: startMonday,
    endDate: endSunday,
    days
  };
}

export function getPrevWeekKey(weekKey: string): string {
  const details = getWeekDetails(weekKey);
  const prevDate = new Date(details.startDate);
  prevDate.setDate(details.startDate.getDate() - 7);
  return formatWeekKey(prevDate);
}

export function getNextWeekKey(weekKey: string): string {
  const details = getWeekDetails(weekKey);
  const nextDate = new Date(details.startDate);
  nextDate.setDate(details.startDate.getDate() + 7);
  return formatWeekKey(nextDate);
}

export function formatDateShort(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function formatDateFull(d: Date): string {
  const dayName = GIORNI_SETTIMANA[(d.getDay() + 6) % 7];
  return `${dayName} ${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`;
}

export function toIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
