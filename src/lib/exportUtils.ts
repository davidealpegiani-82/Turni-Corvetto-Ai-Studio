import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Worker, ShiftRecord, LeaveEntry, AppSettings } from '../types';
import { getShift, isMorning, isAfternoon } from '../constants/shifts';
import { getWeekDetails, formatDateFull, formatDateShort, GIORNI_SETTIMANA } from './dateUtils';

export function exportWeekPDF(
  weekKey: string,
  workers: Worker[],
  shifts: ShiftRecord[],
  leaves: LeaveEntry[],
  settings: AppSettings
) {
  const weekDetails = getWeekDetails(weekKey);
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const teamName = settings.teamName || 'FILIALE CORVETTO';

  // Intestazione
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`PIANIFICAZIONE TURNI — ${teamName.toUpperCase()}`, 14, 15);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Settimana ${weekDetails.weekNumber} — Da ${formatDateFull(weekDetails.startDate)} a ${formatDateFull(weekDetails.endDate)}`,
    14,
    22
  );

  // Colonne tabella
  const tableHeaders = [
    'Operatore',
    'Ruolo',
    ...weekDetails.days.map((d, i) => `${GIORNI_SETTIMANA[i]} ${formatDateShort(d)}`),
    'Tot. Ore'
  ];

  // Mappa turni
  const shiftMap = new Map<string, string>();
  shifts.forEach(s => shiftMap.set(`${s.worker_id}:${s.day_index}`, s.shift_code));

  // Righe
  const sortedWorkers = [...workers].sort((a, b) => a.sort_order - b.sort_order);
  const tableRows = sortedWorkers.map(w => {
    let totalHours = 0;
    const dayCells = [0, 1, 2, 3, 4, 5, 6].map(dayIdx => {
      const dayDate = weekDetails.days[dayIdx].toISOString().split('T')[0];
      const matchLeave = leaves.find(l =>
        l.worker_id === w.id &&
        l.status !== 'rejected' &&
        dayDate >= l.start_date &&
        dayDate <= l.end_date
      );

      if (matchLeave) {
        return matchLeave.type === 'malattia' ? 'MC' : matchLeave.type === 'rol' ? 'ROL' : matchLeave.type === 'permesso' ? 'PE' : 'FERIE';
      }

      const code = shiftMap.get(`${w.id}:${dayIdx}`) || 'R';
      const def = getShift(code);
      totalHours += def.hours;
      return def.shortLabel || code;
    });

    return [
      w.name,
      w.role || '',
      ...dayCells,
      `${totalHours.toFixed(1)}h`
    ];
  });

  // Riga totali copertura
  const morningCoverageRow = [
    'Copertura Mattina',
    'Effettivo / Richiesto',
    ...[0, 1, 2, 3, 4, 5, 6].map(day => {
      let count = 0;
      sortedWorkers.forEach(w => {
        const code = shiftMap.get(`${w.id}:${day}`);
        if (isMorning(code)) count++;
      });
      const req = settings.coverageRequirements?.[day]?.morning || 0;
      return `${count} / ${req}`;
    }),
    ''
  ];

  const afternoonCoverageRow = [
    'Copertura Pomeriggio',
    'Effettivo / Richiesto',
    ...[0, 1, 2, 3, 4, 5, 6].map(day => {
      let count = 0;
      sortedWorkers.forEach(w => {
        const code = shiftMap.get(`${w.id}:${day}`);
        if (isAfternoon(code)) count++;
      });
      const req = settings.coverageRequirements?.[day]?.afternoon || 0;
      return `${count} / ${req}`;
    }),
    ''
  ];

  autoTable(doc, {
    startY: 28,
    head: [tableHeaders],
    body: [...tableRows, morningCoverageRow, afternoonCoverageRow],
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
      halign: 'center',
      valign: 'middle'
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 42 },
      1: { halign: 'left', cellWidth: 38 },
      9: { fontStyle: 'bold', halign: 'center' }
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [30, 41, 59],
      fontStyle: 'bold'
    }
  });

  // Footer
  const finalY = (doc as any).lastAutoTable?.finalY || 180;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Documento generato da Gestione Turni ${teamName} il ${new Date().toLocaleDateString('it-IT')}`, 14, finalY + 10);

  doc.save(`Turni_${teamName.replace(/\s+/g, '_')}_${weekKey}.pdf`);
}

// Facsimile Richiesta Ferie e Permessi
export function exportFacsimileLeavePDF(leave: LeaveEntry, worker?: Worker) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const workerName = worker?.name || 'COLLABORATORE';

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('MODULO RICHIESTA FERIE / PERMESSI', 105, 20, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Filiale Corvetto', 105, 26, { align: 'center' });
  doc.line(20, 29, 190, 29);

  doc.setFontSize(11);
  doc.text(`Data richiesta: ${leave.request_date || new Date().toISOString().split('T')[0]}`, 20, 42);
  doc.text(`Dipendente: ${workerName}`, 20, 50);
  doc.text(`Ruolo: ${worker?.role || 'Addetto'}`, 20, 58);
  doc.text(`Tipologia assenza: ${leave.type.toUpperCase()}`, 20, 66);
  doc.text(`Periodo: dal ${leave.start_date} al ${leave.end_date}`, 20, 74);
  if (leave.notes) {
    doc.text(`Note / Motivazione: ${leave.notes}`, 20, 82);
  }

  doc.text(`Stato attuale: ${leave.status.toUpperCase()}`, 20, 96);

  // Firme
  doc.line(20, 140, 90, 140);
  doc.text('Firma Dipendente', 20, 146);

  doc.line(120, 140, 190, 140);
  doc.text('Firma Responsabile Filiale', 120, 146);

  doc.save(`Richiesta_${leave.type}_${workerName.replace(/\s+/g, '_')}.pdf`);
}

export function exportWeekCSV(weekKey: string, workers: Worker[], shifts: ShiftRecord[]) {
  const weekDetails = getWeekDetails(weekKey);
  const shiftMap = new Map<string, string>();
  shifts.forEach(s => shiftMap.set(`${s.worker_id}:${s.day_index}`, s.shift_code));

  const headers = ['Operatore', 'Ruolo', ...weekDetails.days.map((d, i) => `${GIORNI_SETTIMANA[i]} ${formatDateShort(d)}`), 'Tot. Ore'];
  const rows = workers.map(w => {
    let tot = 0;
    const cells = [0, 1, 2, 3, 4, 5, 6].map(day => {
      const code = shiftMap.get(`${w.id}:${day}`) || 'R';
      tot += getShift(code).hours;
      return code;
    });
    return [w.name, w.role || '', ...cells, tot];
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Turni_${weekKey}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportBackupJSON(data: any) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_turni_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
