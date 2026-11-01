export interface ItalianHoliday {
  name: string;
  type: 'nazionale' | 'Milano' | 'aziendale';
}

function easterSunday(year: number): Date {
  // Computus gregoriano: algoritmo di Meeus/Jones/Butcher.
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export function getItalianHoliday(date: Date): ItalianHoliday | null {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const fixed: Record<string, ItalianHoliday> = {
    '1-1': { name: 'Capodanno', type: 'nazionale' },
    '6-1': { name: 'Epifania', type: 'nazionale' },
    '25-4': { name: 'Liberazione', type: 'nazionale' },
    '1-5': { name: 'Festa del Lavoro', type: 'nazionale' },
    '2-6': { name: 'Festa della Repubblica', type: 'nazionale' },
    '15-8': { name: 'Ferragosto', type: 'nazionale' },
    '16-8': { name: 'Festa del Commercio', type: 'aziendale' },
    '1-11': { name: 'Ognissanti', type: 'nazionale' },
    '7-12': { name: 'Sant’Ambrogio', type: 'Milano' },
    '8-12': { name: 'Immacolata', type: 'nazionale' },
    '25-12': { name: 'Natale', type: 'nazionale' },
    '26-12': { name: 'Santo Stefano', type: 'nazionale' }
  };
  const fixedHoliday = fixed[`${day}-${month}`];
  if (fixedHoliday) return fixedHoliday;

  const easterMonday = easterSunday(date.getFullYear());
  easterMonday.setDate(easterMonday.getDate() + 1);
  if (
    date.getFullYear() === easterMonday.getFullYear() &&
    date.getMonth() === easterMonday.getMonth() &&
    date.getDate() === easterMonday.getDate()
  ) {
    return { name: 'Pasquetta', type: 'nazionale' };
  }
  return null;
}
