import React, { useState } from 'react';
import {
  Clock,
  Users,
  ShieldCheck,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { AppData, Worker, DayShift } from '../types/turni';
import { localDateKey, timeToMin, minToTime } from '../services/engine';
import { playGlassTap } from '../services/soundFx';

interface TurniTimelineViewProps {
  appData: AppData;
  weekDates: Date[];
  weekKey: string;
  onOpenDayModal: (workerId: string, dayIdx: number, dateObj: Date) => void;
  onOpenWorkerModal: (workerId: string) => void;
}

// Intervallo temporale filiale Corvetto: dalle 06:30 alle 18:00 (690 minuti totali)
const TIMELINE_START_MIN = 6 * 60 + 30; // 06:30 (390 min)
const TIMELINE_END_MIN = 18 * 60;       // 18:00 (1080 min)
const TIMELINE_TOTAL_MIN = TIMELINE_END_MIN - TIMELINE_START_MIN; // 690 min

export const TurniTimelineView: React.FC<TurniTimelineViewProps> = ({
  appData,
  weekDates,
  weekKey,
  onOpenDayModal,
  onOpenWorkerModal
}) => {
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const now = new Date();
  const todayStr = localDateKey(now);

  const curDate = weekDates[selectedDayIdx] || weekDates[0] || new Date();
  const curDayStr = localDateKey(curDate);
  const daysNames = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

  // Ore della timeline per l'asse orizzontale
  const timelineHours = [
    { label: '06:30', min: 6 * 60 + 30 },
    { label: '07:30', min: 7 * 60 + 30 },
    { label: '08:30', min: 8 * 60 + 30, peak: true },
    { label: '09:30', min: 9 * 60 + 30, peak: true },
    { label: '10:30', min: 10 * 60 + 30, peak: true },
    { label: '11:30', min: 11 * 60 + 30, peak: true },
    { label: '12:30', min: 12 * 60 + 30 },
    { label: '13:30', min: 13 * 60 + 30 },
    { label: '14:30', min: 14 * 60 + 30 },
    { label: '15:30', min: 15 * 60 + 30 },
    { label: '16:30', min: 16 * 60 + 30 },
    { label: '17:30', min: 17 * 60 + 30 },
    { label: '18:00', min: 18 * 60 }
  ];

  const getPercent = (timeStr?: string): number => {
    if (!timeStr) return 0;
    const m = timeToMin(timeStr);
    const clamped = Math.max(TIMELINE_START_MIN, Math.min(TIMELINE_END_MIN, m));
    return ((clamped - TIMELINE_START_MIN) / TIMELINE_TOTAL_MIN) * 100;
  };

  // Raggruppamento collaboratori attivi
  const activeWorkers = appData.workers.filter(w => w.selected !== false);
  const magazzinoWorkers = activeWorkers.filter(w => w.group === 'MAGAZZINO');
  const ufficioWorkers = activeWorkers.filter(w => w.group !== 'MAGAZZINO');

  // Calcolo presidi orari (ogni 30 min) per la curva di presenza
  const stepMinutes = 30;
  const timeSlotsCount = Math.floor(TIMELINE_TOTAL_MIN / stepMinutes);
  const presenceCurve: Array<{ time: string; total: number; forkliftCount: number; loaderCount: number }> = [];

  for (let s = 0; s < timeSlotsCount; s++) {
    const slotMin = TIMELINE_START_MIN + s * stepMinutes;
    let total = 0;
    let forkliftCount = 0;
    let loaderCount = 0;

    activeWorkers.forEach(w => {
      const cell = appData.weeks[weekKey]?.[w.id]?.[selectedDayIdx];
      if (!cell || cell.status === 'RIPOSO' || cell.status === 'FERIE' || cell.status === 'MALATTIA') return;

      const hasMorning = cell.mIn && cell.mOut && slotMin >= timeToMin(cell.mIn) && slotMin < timeToMin(cell.mOut);
      const hasAfternoon = cell.pIn && cell.pOut && slotMin >= timeToMin(cell.pIn) && slotMin < timeToMin(cell.pOut);

      if (hasMorning || hasAfternoon) {
        total++;
        if (w.group === 'MAGAZZINO') {
          if (w.profile?.qualifications?.forklift?.status === 'valid') forkliftCount++;
          if (w.profile?.qualifications?.loader?.status === 'valid') loaderCount++;
        }
      }
    });

    presenceCurve.push({
      time: minToTime(slotMin),
      total,
      forkliftCount,
      loaderCount
    });
  }

  // Controllo muletto e ruspa a inizio giornata (06:30)
  const openingForkliftCount = presenceCurve[0]?.forkliftCount ?? 0;
  const openingLoaderCount = presenceCurve[0]?.loaderCount ?? 0;

  // Trova eventuali operatori in ufficio abilitati come opzione di riserva
  const officeBackups = ufficioWorkers.filter(w => {
    const cell = appData.weeks[weekKey]?.[w.id]?.[selectedDayIdx];
    if (!cell || cell.status === 'RIPOSO') return false;
    return w.profile?.qualifications?.forklift?.status === 'valid' || w.profile?.qualifications?.loader?.status === 'valid';
  });

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Selettore Giorni Settimana a Cristalli Fluttuanti */}
      <div className="flex items-center justify-between gap-2 p-2 rounded-2xl glass-panel shadow-lg overflow-x-auto">
        <div className="flex items-center gap-1.5 w-full justify-between sm:justify-start">
          {weekDates.map((d, idx) => {
            const isSelected = selectedDayIdx === idx;
            const dStr = localDateKey(d);
            const isToday = dStr === todayStr;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  playGlassTap();
                  setSelectedDayIdx(idx);
                }}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-0.5 cursor-pointer min-w-[70px] sm:min-w-[90px] ${
                  isSelected
                    ? 'glass-btn-primary shadow-lg shadow-blue-500/30 scale-105'
                    : isToday
                    ? 'glass-card border-blue-400/40 text-blue-400'
                    : 'glass-card text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                <span className="uppercase text-[10px] tracking-wider">{daysNames[idx]}</span>
                <span className="text-sm font-mono">{d.getDate()}</span>
                {isToday && (
                  <span className="text-[8px] font-extrabold uppercase tracking-widest text-amber-300">
                    Oggi
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Pulsanti Freccia Navigazione Rapida */}
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          <button
            type="button"
            disabled={selectedDayIdx === 0}
            onClick={() => { playGlassTap(); setSelectedDayIdx(i => Math.max(0, i - 1)); }}
            className="p-2 rounded-xl glass-btn-ghost disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={selectedDayIdx === 5}
            onClick={() => { playGlassTap(); setSelectedDayIdx(i => Math.min(5, i + 1)); }}
            className="p-2 rounded-xl glass-btn-ghost disabled:opacity-30 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI & Badge Stato Sicurezza Carrellisti del Giorno */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Muletto Carrello Elevatore */}
        <div className={`p-4 rounded-2xl glass-panel border transition-all ${
          openingForkliftCount > 0
            ? 'border-emerald-500/40 shadow-emerald-500/10'
            : 'border-amber-500/40 shadow-amber-500/10'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🚜</span> Muletto Magazzino (06:30)
            </span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
              openingForkliftCount > 0
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              {openingForkliftCount > 0 ? `${openingForkliftCount} abilitati OK` : 'Attenzione'}
            </span>
          </div>
          <div className="text-lg font-black text-white mt-1">
            {openingForkliftCount > 0 ? 'Copertura Garantita' : 'Nessun magazziniere abilitato'}
          </div>
          {openingForkliftCount === 0 && officeBackups.length > 0 && (
            <div className="text-[11px] text-amber-300/90 mt-1 leading-snug">
              💡 Opzione ufficio di riserva: <strong>{officeBackups.map(w => w.name).join(', ')}</strong> (solo opzione di supporto, non vincolante).
            </div>
          )}
        </div>

        {/* Ruspa / Pala Caricatrice Inerti */}
        <div className={`p-4 rounded-2xl glass-panel border transition-all ${
          openingLoaderCount > 0
            ? 'border-emerald-500/40 shadow-emerald-500/10'
            : 'border-slate-700/60'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🏗️</span> Ruspa / Pala Caricatrice
            </span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
              openingLoaderCount > 0
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
            }`}>
              {openingLoaderCount > 0 ? `${openingLoaderCount} operatori OK` : 'Non attivo a 06:30'}
            </span>
          </div>
          <div className="text-lg font-black text-white mt-1">
            {openingLoaderCount > 0 ? 'Abilitati presenti in filiale' : 'Pala non impiegata o su richiesta'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Gestione carico inerti e piazzale esterno
          </div>
        </div>

        {/* Picco Affluenza Mattina */}
        <div className="p-4 rounded-2xl glass-panel border border-blue-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🔥</span> Picco Clienti Mattutino
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              08:30 – 12:30
            </span>
          </div>
          <div className="text-lg font-black text-white mt-1 tabular-nums">
            {Math.max(...presenceCurve.map(p => p.total))} Operatori Massimi
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Piena forza lavoro concentrata all'arrivo degli artigiani
          </div>
        </div>
      </div>

      {/* Timeline Spaziale Container */}
      <div className="p-4 sm:p-5 rounded-3xl glass-panel shadow-2xl space-y-4 overflow-x-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 min-w-[760px]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-black uppercase tracking-wider text-white">
              Nastro Orario Interattivo — {daysNames[selectedDayIdx]} {curDate.getDate()} ({curDayStr})
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> Magazzino
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-cyan-400" /> Ufficio & Vendite
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-purple-400" /> Assenze / ROL
            </span>
          </div>
        </div>

        <div className="min-w-[760px] space-y-4">
          {/* Asse Temporale Ore */}
          <div className="relative h-6 flex items-center text-[10px] font-mono text-slate-400 font-bold border-b border-white/10">
            <div className="w-48 shrink-0 text-slate-500 uppercase tracking-wider text-[9px]">Collaboratore</div>
            <div className="relative flex-1 h-full">
              {timelineHours.map((h, i) => {
                const pct = ((h.min - TIMELINE_START_MIN) / TIMELINE_TOTAL_MIN) * 100;
                return (
                  <div
                    key={i}
                    className="absolute -translate-x-1/2 flex flex-col items-center"
                    style={{ left: `${pct}%` }}
                  >
                    <span className={h.peak ? 'text-amber-300 font-extrabold' : ''}>{h.label}</span>
                    <span className="h-1.5 w-[1px] bg-white/20 mt-0.5" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sezione 1: Logistica & Magazzino */}
          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <span>📦</span>
              <span>Logistica & Magazzino Corvetto ({magazzinoWorkers.length} addetti)</span>
            </div>

            {magazzinoWorkers.map(w => renderWorkerRow(w))}
          </div>

          {/* Sezione 2: Uffici Vendite & Direzione */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <span>💼</span>
              <span>Ufficio Vendite, Direzione & Finiture ({ufficioWorkers.length} addetti)</span>
            </div>

            {ufficioWorkers.map(w => renderWorkerRow(w))}
          </div>
        </div>
      </div>
    </div>
  );

  function renderWorkerRow(w: Worker) {
    const cell: DayShift | undefined = appData.weeks[weekKey]?.[w.id]?.[selectedDayIdx];
    const isRest = cell?.status === 'RIPOSO' || cell?.status === 'CHIUSO';
    const isFullDayLeave = cell?.status === 'FERIE' || cell?.status === 'MALATTIA' || cell?.status === 'RICOVERO';

    const hasMorning = cell?.mIn && cell?.mOut && cell.mIn !== cell.mOut;
    const hasAfternoon = cell?.pIn && cell?.pOut && cell.pIn !== cell.pOut;

    const mLeft = hasMorning ? getPercent(cell?.mIn) : 0;
    const mWidth = hasMorning ? Math.max(4, getPercent(cell?.mOut) - mLeft) : 0;

    const pLeft = hasAfternoon ? getPercent(cell?.pIn) : 0;
    const pWidth = hasAfternoon ? Math.max(4, getPercent(cell?.pOut) - pLeft) : 0;

    return (
      <div
        key={w.id}
        onClick={() => onOpenDayModal(w.id, selectedDayIdx, curDate)}
        className="group relative flex items-center h-10 p-1 rounded-xl glass-card hover:border-blue-500/50 hover:bg-white/10 transition-all cursor-pointer"
      >
        {/* Info Collaboratore */}
        <div className="w-48 shrink-0 pr-2 flex items-center justify-between">
          <div className="truncate">
            <span className="text-xs font-black text-slate-200 group-hover:text-blue-400 transition truncate block">
              {w.name}
            </span>
            <span className="text-[9px] text-slate-500 font-medium truncate block">
              {w.role || w.group}
            </span>
          </div>
        </div>

        {/* Barra Oraria Spaziale */}
        <div className="relative flex-1 h-7 rounded-lg bg-black/25 overflow-hidden border border-white/5">
          {/* Griglia oraria di sfondo */}
          <div className="absolute inset-0 flex justify-between pointer-events-none opacity-15">
            {timelineHours.map((_, i) => (
              <div key={i} className="w-[1px] h-full bg-white" />
            ))}
          </div>

          {isRest ? (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-500 tracking-wider">
              — RIPOSO PROGRAMMATO —
            </div>
          ) : isFullDayLeave ? (
            <div className="absolute inset-0 bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-[10px] font-black text-purple-300 tracking-wider">
              🏖️ {cell?.status} {cell?.note ? `(${cell.note})` : ''}
            </div>
          ) : (
            <>
              {/* Blocco Mattina */}
              {hasMorning && (
                <div
                  className={`absolute top-0.5 bottom-0.5 rounded-md flex items-center justify-center text-[10px] font-extrabold text-white shadow-md transition-all ${
                    w.group === 'MAGAZZINO'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 border border-amber-300/40 shadow-amber-500/20'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 border border-cyan-300/40 shadow-blue-500/20'
                  }`}
                  style={{ left: `${mLeft}%`, width: `${mWidth}%` }}
                >
                  <span className="truncate px-1 font-mono text-[9px] drop-shadow-sm">
                    {cell?.mIn} – {cell?.mOut}
                  </span>
                </div>
              )}

              {/* Blocco Pomeriggio */}
              {hasAfternoon && (
                <div
                  className={`absolute top-0.5 bottom-0.5 rounded-md flex items-center justify-center text-[10px] font-extrabold text-white shadow-md transition-all ${
                    w.group === 'MAGAZZINO'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-600 border border-orange-300/40 shadow-orange-500/20'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 border border-blue-300/40 shadow-indigo-500/20'
                  }`}
                  style={{ left: `${pLeft}%`, width: `${pWidth}%` }}
                >
                  <span className="truncate px-1 font-mono text-[9px] drop-shadow-sm">
                    {cell?.pIn} – {cell?.pOut}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
};
