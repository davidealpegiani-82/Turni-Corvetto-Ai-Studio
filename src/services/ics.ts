import { BranchEvent, AppData } from '../types/turni';
import { getWeekInfo } from './engine';

function icsEscape(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\n|\r/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function icsFoldLine(line: string): string {
  const chunks: string[] = [];
  let current = '';
  let bytes = 0;
  const encoder = new TextEncoder();

  for (const ch of String(line)) {
    const n = encoder.encode(ch).length;
    if (bytes + n > 73 && current) {
      chunks.push(current);
      current = ' ' + ch;
      bytes = 1 + n;
    } else {
      current += ch;
      bytes += n;
    }
  }
  chunks.push(current);
  return chunks.join('\r\n');
}

function icsUtcStamp(date = new Date()): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export function eventToICS(e: BranchEvent): string {
  if (!e || !/^\d{4}-\d{2}-\d{2}$/.test(String(e.date || ''))) {
    throw new Error('Data evento non valida per ICS: ' + e?.date);
  }

  const dt = e.date.replace(/-/g, '');
  const eventId = String(e.id || ('event-' + dt)).replace(/[^a-zA-Z0-9._-]/g, '_');
  const lines: string[] = [
    'BEGIN:VEVENT',
    `UID:${eventId}@turni-corvetto-live`,
    `DTSTAMP:${icsUtcStamp()}`
  ];

  if (e.allDay) {
    const next = new Date(e.date + 'T12:00:00');
    next.setDate(next.getDate() + 1);
    const nextStr = `${next.getFullYear()}${String(next.getMonth() + 1).padStart(2, '0')}${String(next.getDate()).padStart(2, '0')}`;
    lines.push(`DTSTART;VALUE=DATE:${dt}`, `DTEND;VALUE=DATE:${nextStr}`);
  } else {
    const from = (e.fromTime || '09:00').replace(':', '');
    const to = (e.toTime || '12:00').replace(':', '');
    lines.push(
      `DTSTART;TZID=Europe/Rome:${dt}T${from}00`,
      `DTEND;TZID=Europe/Rome:${dt}T${to}00`
    );
  }

  lines.push(
    `SUMMARY:${icsEscape(e.title || 'Impegno')}`,
    `DESCRIPTION:${icsEscape(e.notes || '')}`,
    `LOCATION:${icsEscape(e.location || 'Filiale Corvetto')}`,
    'END:VEVENT'
  );

  return lines.map(icsFoldLine).join('\r\n');
}

export function buildCalendarICS(events: BranchEvent[], calendarName = 'Impegni Turni Corvetto'): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gestione Turni Corvetto Live//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsEscape(calendarName)}`,
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Rome',
    'X-LIC-LOCATION:Europe/Rome',
    'BEGIN:DAYLIGHT',
    'DTSTART:19700329T020000',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'DTSTART:19701025T030000',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'END:STANDARD',
    'END:VTIMEZONE'
  ];

  events.forEach((e) => {
    try {
      lines.push(eventToICS(e));
    } catch (err) {
      console.warn('Errore rendering VEVENT:', err);
    }
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

export function downloadICS(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function formatEventWhatsAppText(e: BranchEvent, workerNamesMap: Record<string, string>): string {
  const names = (e.participantIds || []).map((id) => workerNamesMap[id] || id).filter(Boolean);
  const when = e.allDay ? 'Giornata intera' : `${e.fromTime || ''} – ${e.toTime || ''}`;
  const lines = [
    `📌 *${e.title || 'Impegno'}*`,
    `Tipo: ${e.type || 'Evento'}`,
    `📅 ${e.date}`,
    `⏰ ${when}`
  ];
  if (e.location) lines.push(`📍 ${e.location}`);
  if (names.length) lines.push(`👥 ${names.join(', ')}`);
  if (e.notes) lines.push(`📝 ${e.notes}`);
  lines.push('', '_Turni Corvetto Live_');
  return lines.join('\n');
}

export function buildWeeklyFullICS(appData: AppData, currentDate: Date): string {
  const weekInfo = getWeekInfo(currentDate);
  const weekKey = `${currentDate.getFullYear()}-W${weekInfo.weekNo}`;
  const monday = new Date(weekInfo.monday);

  const eventsThisWeek = (appData.events || []).filter(e => {
    const d = new Date(e.date + 'T12:00:00');
    return d >= weekInfo.monday && d <= weekInfo.saturday;
  });

  const calendarEvents: BranchEvent[] = [...eventsThisWeek];

  const weekTurni = appData.weeks[weekKey];
  if (weekTurni) {
    for (const worker of appData.workers) {
      if (worker.selected === false) continue;
      const workerDays = weekTurni[worker.id];
      if (!workerDays) continue;

      for (let dayIdx = 0; dayIdx <= 5; dayIdx++) {
        const cell = workerDays[dayIdx];
        if (!cell || cell.status === 'RIPOSO' || cell.status === 'CHIUSO') continue;
        const curDate = new Date(monday);
        curDate.setDate(monday.getDate() + dayIdx);
        const y = curDate.getFullYear();
        const m = String(curDate.getMonth() + 1).padStart(2, '0');
        const d = String(curDate.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        if (cell.status && cell.status !== 'LAVORO') {
          calendarEvents.push({
            id: `turn-${worker.id}-${dateStr}`,
            title: `${worker.name} — ${cell.status}`,
            date: dateStr,
            allDay: true,
            type: 'Altro',
            participantIds: [worker.id],
            notes: cell.note || cell.status,
            reminderMinutes: 0,
            updatedAt: new Date().toISOString()
          });
        } else if (cell.mIn && (cell.pOut || cell.mOut)) {
          calendarEvents.push({
            id: `turn-${worker.id}-${dateStr}`,
            title: `${worker.name} (${cell.mIn}-${cell.mOut || cell.pIn || ''} / ${cell.pIn || ''}-${cell.pOut || ''})`,
            date: dateStr,
            allDay: false,
            fromTime: cell.mIn,
            toTime: cell.pOut || cell.mOut,
            type: 'Altro',
            participantIds: [worker.id],
            notes: `Turno Filiale ${appData.title}${cell.note ? ' - ' + cell.note : ''}`,
            reminderMinutes: 30,
            updatedAt: new Date().toISOString()
          });
        }
      }
    }
  }

  return buildCalendarICS(calendarEvents, `Turni Filiale ${appData.title} - Settimana ${weekInfo.weekNo}`);
}
