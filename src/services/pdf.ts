import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { AppData, LeaveRequest, BranchEvent } from '../types/turni';
import { getWeekInfo, formatCellShort } from './engine';
import { CENTROEDILE_LOGO_BASE64 } from '../constants/logo';

// Helper per scaricare un Blob
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// Genera PDF della tabella turni settimanale
export function buildWeeklyTurniPDF(appData: AppData, weekDate: Date): jsPDF {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const weekInfo = getWeekInfo(weekDate);
  const weekKey = `${weekDate.getFullYear()}-W${weekInfo.weekNo}`;
  const daysNames = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

  const monday = new Date(weekInfo.monday);
  const dayHeaders = daysNames.map((dName, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    return `${dName} ${d.getDate()}`;
  });

  const headers = ["Collaboratore", ...dayHeaders, "Totale"];

  // Raggruppa collaboratori per gruppo
  const groupOrder = appData.rules.groupOrder || ["MANAGER", "EDILE", "FINITURE", "MAGAZZINO"];
  const rows: any[] = [];

  groupOrder.forEach((groupKey) => {
    const workersInGroup = appData.workers
      .filter(w => w.selected !== false && (w.group === groupKey || (!w.group && groupKey === 'MAGAZZINO')))
      .sort((a, b) => (a.order || 99) - (b.order || 99));

    if (!workersInGroup.length) return;

    workersInGroup.forEach((w) => {
      const workerLabel = w.role ? `${w.name}\n(${w.role})` : w.name;
      const row = [workerLabel];

      let totalMinutes = 0;

      for (let day = 0; day < 6; day++) {
        const cell = appData.weeks[weekKey]?.[w.id]?.[day];
        let cellText = formatCellShort(cell, w.id, day, weekKey, appData);

        // Aggiungi impegni del giorno se presenti
        const mon = new Date(monday);
        mon.setDate(monday.getDate() + day);
        const dayStr = mon.toISOString().slice(0, 10);
        const dayEvents = (appData.events || []).filter(e => e.date === dayStr && e.participantIds?.includes(w.id));
        if (dayEvents.length > 0) {
          const evText = dayEvents.map(e => `📌 ${e.title}`).join('\n');
          cellText = cellText === '—' ? evText : `${cellText}\n${evText}`;
        }

        row.push(cellText);

        if (cell?.mIn && cell?.mOut) {
          const [h1, m1] = cell.mIn.split(':').map(Number);
          const [h2, m2] = cell.mOut.split(':').map(Number);
          totalMinutes += Math.max(0, (h2 * 60 + m2) - (h1 * 60 + m1));
        }
        if (cell?.pIn && cell?.pOut) {
          const [h1, m1] = cell.pIn.split(':').map(Number);
          const [h2, m2] = cell.pOut.split(':').map(Number);
          totalMinutes += Math.max(0, (h2 * 60 + m2) - (h1 * 60 + m1));
        }
        if (cell?.leaveFullDay) {
          totalMinutes += (cell.leaveHours || 8) * 60;
        }
      }

      const totalHoursStr = `${(totalMinutes / 60).toFixed(1)}h`;
      row.push(totalHoursStr);
      rows.push(row);
    });
  });

  // Intestazione
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(`${appData.title} — Programmazione Turni`, 14, 14);

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Settimana n.${weekInfo.weekNo}: dal ${weekInfo.monStr} al ${weekInfo.satStr} (Sync Real-time)`, 14, 20);

  // Tabella principale
  (doc as any).autoTable({
    startY: 25,
    head: [headers],
    body: rows,
    theme: 'grid',
    margin: { left: 10, right: 10, top: 5, bottom: 5 },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.5
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      halign: 'center',
      valign: 'middle',
      textColor: [15, 23, 42],
      overflow: 'linebreak',
      lineWidth: 0.15
    },
    columnStyles: {
      0: {
        halign: 'left',
        fontStyle: 'bold',
        cellWidth: 44,
        fillColor: [248, 250, 252]
      },
      7: {
        fontStyle: 'bold',
        fillColor: [241, 245, 249],
        textColor: [37, 99, 235],
        cellWidth: 16
      }
    }
  });

  let finalY = (doc as any).lastAutoTable?.finalY || 140;

  // Note settimanali
  const weeklyNote = appData.notes[weekKey];
  if (weeklyNote) {
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(appData.notesTitle || "Note / Comunicazioni Filiale:", 10, finalY + 7);

    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const splitNotes = doc.splitTextToSize(weeklyNote, 277);
    doc.text(splitNotes, 10, finalY + 12);
    finalY += 12 + splitNotes.length * 3.5;
  }

  // Tabella impegni della settimana
  const weekEvents = (appData.events || []).filter((e) => {
    const d = new Date(e.date + 'T12:00:00');
    return d >= weekInfo.monday && d <= weekInfo.saturday;
  });

  if (weekEvents.length > 0 && finalY < 185) {
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Impegni e Corsi della Settimana:', 10, finalY + 6);

    const eventRows = weekEvents.map(e => [
      e.date,
      e.title,
      e.allDay ? 'Giornata intera' : `${e.fromTime || ''} - ${e.toTime || ''}`,
      e.location || 'Corvetto',
      (e.participantIds || []).map(id => appData.workers.find(w => w.id === id)?.name).filter(Boolean).join(', ')
    ]);

    (doc as any).autoTable({
      startY: finalY + 9,
      head: [['Data', 'Titolo', 'Orario', 'Luogo', 'Partecipanti']],
      body: eventRows,
      theme: 'grid',
      margin: { left: 10, right: 10, top: 2, bottom: 4 },
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontSize: 7 },
      styles: { fontSize: 6.8, cellPadding: 1.5, valign: 'middle' },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 50 },
        2: { cellWidth: 28 },
        3: { cellWidth: 40 },
        4: { cellWidth: 139 }
      }
    });
  }

  return doc;
}

export function formatDateItalian(dateStr?: string): string {
  if (!dateStr) return '___/___/______';
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const parts = dateStr.slice(0, 10).split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function formatHoursLabel(hours?: number | null): string {
  if (hours === undefined || hours === null) return '8';
  return String(hours).replace('.', ',');
}

// Modulo PDF Richiesta Ferie e Permessi Facsimile CENTROEDILE
export function buildLeaveRequestPDF(req: LeaveRequest, workerName: string, title = 'Corvetto'): jsPDF {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;

  // Logo CENTROEDILE MILANO (centrato, nessun bordo o linea blu superiore)
  const logoW = 50;
  const logoH = 23.6; // Proporzioni originali 212x100
  const logoX = (pageW - logoW) / 2;
  const logoY = 16;

  try {
    doc.addImage(CENTROEDILE_LOGO_BASE64, 'PNG', logoX, logoY, logoW, logoH);
  } catch (err) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('CENTROEDILE MILANO', pageW / 2, 22, { align: 'center' });
  }

  let y = logoY + logoH + 5;

  // Sotto al logo solo "Filiale di Corvetto"
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 100, 115);
  doc.text('Filiale di Corvetto', pageW / 2, y, { align: 'center' });
  y += 6;

  // Linea divisoria sottile grigio neutro (nessuna linea blu)
  doc.setDrawColor(220, 225, 230);
  doc.setLineWidth(0.4);
  doc.line(margin + 20, y, pageW - margin - 20, y);
  y += 12;

  // Titolo Modulo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text('RICHIESTA FERIE / PERMESSI', pageW / 2, y, { align: 'center' });
  y += 14;

  // Dipendente
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Il Sig. / La Sig.ra:', margin, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(workerName.toUpperCase(), margin + 35, y);
  y += 9;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('chiede di potersi assentare dal servizio per la seguente causale:', margin, y);
  y += 9;

  // Griglia causali su due colonne ordinate e bilanciate
  const causaliCol1 = [
    'Ferie',
    'Permesso retribuito',
    'Permesso Non retribuito',
    'Congedo Matrimoniale',
    'Visita Medica (segue certificato)'
  ];
  const causaliCol2 = [
    'Visita c/o cantiere',
    'Partecipazione corso',
    'Visita Fiera',
    'Donazione Sangue (segue certificato)',
    'Malattia / Ricovero'
  ];

  const col2X = margin + 86;
  const rowSpacing = 8;

  for (let i = 0; i < 5; i++) {
    const rowY = y + i * rowSpacing;

    // Colonna 1
    const label1 = causaliCol1[i];
    const isChecked1 = req.tipo === label1 || (Boolean(req.tipo) && label1.startsWith(req.tipo));
    doc.setDrawColor(40, 50, 65);
    doc.setLineWidth(0.4);
    doc.rect(margin, rowY - 3.5, 4.2, 4.2);

    if (isChecked1) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('X', margin + 0.9, rowY - 0.2);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(label1, margin + 7.5, rowY);

    // Colonna 2
    const label2 = causaliCol2[i];
    const isChecked2 = req.tipo === label2 || (Boolean(req.tipo) && label2.startsWith(req.tipo));
    doc.setDrawColor(40, 50, 65);
    doc.setLineWidth(0.4);
    doc.rect(col2X, rowY - 3.5, 4.2, 4.2);

    if (isChecked2) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('X', col2X + 0.9, rowY - 0.2);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(label2, col2X + 7.5, rowY);
  }

  y += 5 * rowSpacing + 5;

  // Dettagli date - linea neutra grigio chiara (nessuna linea blu)
  doc.setDrawColor(220, 225, 230);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageW - margin, y);
  y += 9;

  const hoursStr = formatHoursLabel(req.hours);

  if (req.mode === 'single') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Il Giorno:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDateItalian(req.day), margin + 22, y);

    if (req.fullDay) {
      doc.text(`(Intera Giornata - Totale ${hoursStr} ore lavorative)`, margin + 55, y);
    } else {
      doc.text(`Dalle ore: ${req.fromTime || '--:--'}   Alle ore: ${req.toTime || '--:--'}   (Totale ${hoursStr} ore lavorative)`, margin + 55, y);
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Dal Giorno:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDateItalian(req.fromDay), margin + 28, y);

    doc.setFont('helvetica', 'bold');
    doc.text('Al Giorno:', margin + 72, y);
    doc.setFont('helvetica', 'normal');
    doc.text(req.toDay ? formatDateItalian(req.toDay) : (req.openEnded ? 'In corso (fine prognosi da definire)' : '___/___/______'), margin + 96, y);
  }

  y += 10;
  if (req.note) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(70, 80, 95);
    doc.text(`Note / Protocollo: ${req.note}`, margin, y);
    y += 10;
  }

  y += 16;

  // Sezione Firme e Luogo/Data:
  // 1. Firma del Dipendente
  // 2. Firma del Responsabile (sotto alla firma del dipendente)
  // 3. Luogo e Data (spostato SOTTO alle firme debitamente distanziato)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);

  doc.text('Firma del Dipendente: _________________________________________', margin, y);
  y += 18;

  doc.text('Firma del Responsabile: _______________________________________', margin, y);
  y += 24; // Debitamente distanziato sotto alle firme

  const formattedRequestDate = formatDateItalian(req.requestDate || new Date().toISOString().slice(0, 10));
  doc.text(`Luogo e Data: ${req.place || 'Milano'}, ${formattedRequestDate}`, margin, y);

  return doc;
}
