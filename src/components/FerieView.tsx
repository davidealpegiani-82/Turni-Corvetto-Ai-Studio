import React, { useState } from 'react';
import {
  Plus,
  FileText,
  Trash2,
  Edit,
  Clock,
  ChevronLeft,
  ChevronRight,
  Thermometer
} from 'lucide-react';
import { AppData, LeaveRequest } from '../types/turni';
import { localDateKey, calculateAbsenceWorkingHours, getWorkerNastroForDate } from '../services/engine';

interface FerieViewProps {
  appData: AppData;
  onOpenLeaveModal: (id?: string) => void;
  onOpenMalattiaModal: (id?: string) => void;
  onUpdateStatus: (id: string, status: 'richiesta' | 'approvata' | 'rifiutata') => void;
  onDeleteRequest: (id: string) => void;
  onExportLeavePDF: (year: number) => void;
  onExportFacsimilePDF: (reqId: string) => void;
  onEditSpettanti: (workerId: string, year: number) => void;
  onOpenRolDetails?: (rolData: any) => void;
}

export const FerieView: React.FC<FerieViewProps> = ({
  appData,
  onOpenLeaveModal,
  onOpenMalattiaModal,
  onUpdateStatus,
  onDeleteRequest,
  onExportLeavePDF,
  onExportFacsimilePDF,
  onEditSpettanti,
  onOpenRolDetails
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [calMode, setCalMode] = useState<'year' | 'month'>('month');
  const [workerFilter, setWorkerFilter] = useState<string>('');
  const [showArchive, setShowArchive] = useState<boolean>(false);

  const months = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const todayStr = localDateKey(new Date());

  // Conta giorni di ferie usati nel corso dell'anno (solo feriali Lun-Ven)
  function countWorkerLeaveDays(wId: string, year: number): number {
    let daysCount = 0;
    (appData.leaveRequests || []).forEach((req) => {
      if (req.workerId !== wId || req.status === 'rifiutata') return;
      if (req.tipo !== 'Ferie') return;

      if (req.mode === 'single' && req.day) {
        const d = new Date(req.day + 'T12:00:00');
        if (d.getFullYear() === year && d.getDay() >= 1 && d.getDay() <= 5) {
          daysCount++;
        }
      } else if (req.mode === 'range' && req.fromDay && req.toDay) {
        let cur = new Date(req.fromDay + 'T12:00:00');
        const end = new Date(req.toDay + 'T12:00:00');
        while (cur <= end) {
          if (cur.getFullYear() === year && cur.getDay() >= 1 && cur.getDay() <= 5) {
            daysCount++;
          }
          cur.setDate(cur.getDate() + 1);
        }
      }
    });
    return daysCount;
  }

  // Mappa delle assenze per il calendario
  function getLeaveMapForCalendar(year: number) {
    const map: Record<string, Array<{ reqId: string; workerName: string; tipo: string; status: string }>> = {};

    (appData.leaveRequests || []).forEach((req) => {
      if (req.status === 'rifiutata') return;
      if (workerFilter && req.workerId !== workerFilter) return;

      const w = appData.workers.find(x => x.id === req.workerId);
      const name = w ? w.name.split(' ').slice(-1)[0] : req.workerId;

      if (req.mode === 'single' && req.day) {
        if (!map[req.day]) map[req.day] = [];
        map[req.day].push({ reqId: req.id, workerName: name, tipo: req.tipo, status: req.status });
      } else if (req.mode === 'range' && req.fromDay) {
        let cur = new Date(req.fromDay + 'T12:00:00');
        const end = req.toDay ? new Date(req.toDay + 'T12:00:00') : new Date(cur.getTime() + 90 * 86400000);
        while (cur <= end) {
          if (cur.getFullYear() === year) {
            const key = localDateKey(cur);
            if (!map[key]) map[key] = [];
            map[key].push({ reqId: req.id, workerName: name, tipo: req.tipo, status: req.status });
          }
          cur.setDate(cur.getDate() + 1);
        }
      }
    });

    return map;
  }

  const leaveMap = getLeaveMapForCalendar(selectedYear);

  // Filtro richieste attive vs concluse
  const now = new Date();
  const allReqs = (appData.leaveRequests || []).filter(
    r => !workerFilter || r.workerId === workerFilter
  );

  const activeReqs = allReqs.filter(r => {
    const endStr = r.mode === 'single' ? r.day : r.toDay || r.fromDay;
    if (!endStr) return true;
    return new Date(endStr + 'T23:59:59') >= now;
  }).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  const pastReqs = allReqs.filter(r => {
    const endStr = r.mode === 'single' ? r.day : r.toDay || r.fromDay;
    if (!endStr) return false;
    return new Date(endStr + 'T23:59:59') < now;
  }).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  const filteredWorkers = workerFilter
    ? appData.workers.filter(w => w.id === workerFilter)
    : appData.workers;

  const monthsToRender = calMode === 'month' ? [selectedMonth] : Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="space-y-4">
      {/* Barra Superiore Ferie */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-3xl glass-panel shadow-xl transition-all">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (calMode === 'month') {
                if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
                else { setSelectedMonth(m => m - 1); }
              } else {
                setSelectedYear(y => y - 1);
              }
            }}
            className="p-2 rounded-xl glass-btn-ghost cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="px-3.5 py-1.5 rounded-xl glass-card border border-white/10 font-extrabold text-xs sm:text-sm text-center min-w-[130px]">
            {calMode === 'month' ? `${months[selectedMonth]} ${selectedYear}` : selectedYear}
          </div>

          <button
            onClick={() => {
              if (calMode === 'month') {
                if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
                else { setSelectedMonth(m => m + 1); }
              } else {
                setSelectedYear(y => y + 1);
              }
            }}
            className="p-2 rounded-xl glass-btn-ghost cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="flex items-center p-1 rounded-xl glass-dock text-xs font-bold">
            <button
              onClick={() => setCalMode('month')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${calMode === 'month' ? 'glass-btn-primary shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Mese
            </button>
            <button
              onClick={() => setCalMode('year')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${calMode === 'year' ? 'glass-btn-primary shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Anno
            </button>
          </div>
        </div>

        {/* Filtro Collaboratore & Azioni */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={workerFilter}
            onChange={(e) => setWorkerFilter(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl glass-input text-xs font-semibold focus:outline-none"
          >
            <option value="">Tutti i collaboratori</option>
            {appData.workers.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => onOpenLeaveModal()}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 border border-emerald-400/30 backdrop-blur-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ferie / Permesso</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenMalattiaModal()}
            className="px-3.5 py-2 rounded-xl bg-red-600/90 hover:bg-red-600 text-white font-bold text-xs shadow-lg shadow-red-600/25 border border-red-400/30 backdrop-blur-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <Thermometer className="w-4 h-4" />
            <span>Malattia / Ricovero</span>
          </button>

          <button
            type="button"
            onClick={() => onExportLeavePDF(selectedYear)}
            className="glass-btn-ghost px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>PDF Anno</span>
          </button>
        </div>
      </div>

      {/* Schede Residui Ferie */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {filteredWorkers.map((w) => {
          const used = countWorkerLeaveDays(w.id, selectedYear);
          const spettanti = appData.leaveBalances?.[w.id]?.[selectedYear]?.spettanti ?? 26;
          const residuo = spettanti - used;

          return (
            <div
              key={w.id}
              className="p-3.5 rounded-3xl glass-card border border-white/10 shadow-lg flex flex-col justify-between backdrop-blur-md transition-all hover:border-blue-400/30"
            >
              <div>
                <div className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">{w.name}</div>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span className={`text-2xl font-black tabular-nums ${residuo < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {residuo}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">giorni residui</span>
                </div>
                <div className="text-[10px] text-slate-400 font-semibold mt-1 tabular-nums">
                  Spettanti: {spettanti} · Usati: {used}
                </div>
              </div>

              <button
                onClick={() => onEditSpettanti(w.id, selectedYear)}
                className="mt-3 text-[10px] text-blue-400 hover:text-blue-300 font-bold text-left cursor-pointer transition"
              >
                Modifica spettanti
              </button>
            </div>
          );
        })}
      </div>

      {/* Calendario Visivo Ferie */}
      <div className={`grid gap-4 ${calMode === 'month' ? 'grid-cols-1 max-w-xl mx-auto' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {monthsToRender.map((mIdx) => {
          const firstDay = new Date(selectedYear, mIdx, 1);
          let startDayOfWeek = firstDay.getDay() - 1;
          if (startDayOfWeek < 0) startDayOfWeek = 6; // lun=0, dom=6

          const daysInMonth = new Date(selectedYear, mIdx + 1, 0).getDate();
          const isCurrentMonth = now.getFullYear() === selectedYear && now.getMonth() === mIdx;

          return (
            <div
              key={mIdx}
              className={`p-3.5 rounded-2xl glass-panel transition ${
                isCurrentMonth ? 'ring-2 ring-blue-500/60 shadow-lg shadow-blue-500/10' : ''
              }`}
            >
              <div className="text-center font-extrabold text-xs text-blue-600 dark:text-blue-400 mb-2 tracking-wide">
                {months[mIdx]} {selectedYear}
              </div>

              {/* Intestazione Giorni Settimana */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1">
                <span>L</span><span>M</span><span>M</span><span>G</span><span>V</span><span>S</span><span>D</span>
              </div>

              {/* Griglia Giorni */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {/* Spazi vuoti iniziali */}
                {Array.from({ length: startDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-9" />
                ))}

                {/* Giorni del Mese */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const curDate = new Date(selectedYear, mIdx, dayNum);
                  const dateStr = localDateKey(curDate);
                  const entries = leaveMap[dateStr] || [];
                  const isToday = dateStr === todayStr;

                  return (
                    <div
                      key={dayNum}
                      className={`h-9 rounded-xl p-0.5 flex flex-col items-center justify-start transition ${
                        isToday
                          ? 'glass-tile ring-2 ring-blue-500 bg-blue-500/20 font-bold'
                          : entries.length > 0
                          ? 'glass-tile bg-blue-500/10'
                          : 'glass-tile opacity-85 hover:opacity-100'
                      }`}
                    >
                      <span className={`text-[10px] font-bold ${isToday ? 'text-blue-600 dark:text-blue-400 font-extrabold' : 'text-slate-800 dark:text-slate-200'}`}>
                        {dayNum}
                      </span>

                      {/* Chips delle assenze */}
                      <div className="flex flex-col gap-0.5 w-full mt-0.5 overflow-hidden">
                        {entries.slice(0, 2).map((en, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              if (en.tipo === 'Malattia' || en.tipo === 'Ricovero') {
                                onOpenMalattiaModal(en.reqId);
                              } else {
                                onOpenLeaveModal(en.reqId);
                              }
                            }}
                            className={`text-[8px] font-black px-1 rounded truncate text-white cursor-pointer shadow-sm ${
                              en.tipo === 'Ferie'
                                ? 'bg-emerald-500/90 hover:bg-emerald-500'
                                : en.tipo === 'Malattia' || en.tipo === 'Ricovero'
                                ? 'bg-red-500/90 hover:bg-red-500'
                                : en.status === 'richiesta'
                                ? 'bg-amber-500/90 hover:bg-amber-500'
                                : 'bg-purple-500/90 hover:bg-purple-500'
                            }`}
                            title={`${en.workerName} — ${en.tipo} (${en.status})`}
                          >
                            {en.workerName}
                          </div>
                        ))}
                        {entries.length > 2 && (
                          <span className="text-[7px] text-slate-500 dark:text-slate-400 font-bold">+{entries.length - 2}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lista Richieste di Assenza Registrate */}
      <div className="p-4 rounded-2xl glass-panel space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Richieste Registrate & In Corso ({activeReqs.length})
          </h3>
          <button
            onClick={() => setShowArchive(s => !s)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold"
          >
            {showArchive ? 'Nascondi Archivio' : `📁 Archivio Concluse (${pastReqs.length})`}
          </button>
        </div>

        {activeReqs.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-2">Nessuna richiesta futura o in corso registrata.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeReqs.map((req) => renderRequestCard(req))}
          </div>
        )}

        {/* Archivio Concluse */}
        {showArchive && (
          <div className="pt-4 border-t border-white/10 dark:border-white/10 space-y-2">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Archivio Richieste Passate</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-80">
              {pastReqs.map((req) => renderRequestCard(req, true))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function renderRequestCard(req: LeaveRequest, isPast = false) {
    const worker = appData.workers.find(w => w.id === req.workerId);
    const workerName = worker ? worker.name : req.workerId;

    const nastroHours = req.day ? getWorkerNastroForDate(req.workerId, req.day, appData) : 8;
    const finalHours = req.hours !== undefined && req.hours !== null
      ? req.hours
      : (req.fullDay ? nastroHours : (req.fromTime && req.toTime ? calculateAbsenceWorkingHours(req.fromTime, req.toTime, false, req.workerId, req.day, appData) : nastroHours));

    const dateLabel = req.mode === 'single'
      ? `${req.day} ${req.fullDay ? `(Tutto il giorno · ${finalHours}h)` : `(${req.fromTime}–${req.toTime} · ${finalHours}h)`}`
      : `${req.fromDay} → ${req.toDay || (req.openEnded ? 'in corso' : '...')}`;

    return (
      <div
        key={req.id}
        className={`p-3.5 rounded-2xl glass-card flex flex-col justify-between gap-2.5 transition ${
          isPast ? 'opacity-70' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm text-slate-900 dark:text-white">{workerName}</span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                req.tipo === 'Ferie' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' :
                req.tipo === 'Malattia' || req.tipo === 'Ricovero' ? 'bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30' :
                'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30'
              }`}>
                {req.tipo}
              </span>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              <span>{dateLabel}</span>
            </div>
            {req.note && (
              <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 italic font-medium">
                Note: {req.note}
              </div>
            )}
          </div>

          <div className="text-right">
            <select
              value={req.status}
              onChange={(e) => onUpdateStatus(req.id, e.target.value as any)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold border focus:outline-none backdrop-blur-md ${
                req.status === 'approvata'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                  : req.status === 'rifiutata'
                  ? 'bg-red-500/15 border-red-500/40 text-red-800 dark:text-red-300'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300'
              }`}
            >
              <option value="richiesta">⏳ In Attesa</option>
              <option value="approvata">✅ Approvata</option>
              <option value="rifiutata">❌ Rifiutata</option>
            </select>
          </div>
        </div>

        {/* Azioni Scheda */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onExportFacsimilePDF(req.id)}
              className="text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold"
              title="Scarica il modulo PDF conforme CENTROEDILE con firme"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Modulo PDF</span>
            </button>

            {onOpenRolDetails && (req.tipo === 'Permesso retribuito' || (req.note || '').toUpperCase().includes('ROL')) && (
              <button
                type="button"
                onClick={() => {
                  const worker = appData.workers.find(w => w.id === req.workerId);
                  const reqDate = req.day ? new Date(`${req.day}T00:00:00`) : new Date();
                  const dayIdx = (reqDate.getDay() + 6) % 7;
                  onOpenRolDetails({
                    workerId: req.workerId,
                    workerName: worker ? worker.name : req.workerId,
                    workerRole: worker?.role,
                    workerGroup: worker?.group,
                    date: reqDate,
                    dayIdx,
                    leaveLabel: 'ROL / Permesso',
                    leaveHours: finalHours,
                    leaveTimeRange: req.fromTime && req.toTime ? `${req.fromTime}-${req.toTime}` : undefined,
                    workedHours: Math.max(0, nastroHours - finalHours),
                    totalCountableHours: nastroHours,
                    note: req.note,
                    status: req.status,
                    leaveRequestId: req.id
                  });
                }}
                className="text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/40 hover:bg-purple-200 dark:hover:bg-purple-800/60 px-2 py-1 rounded-lg flex items-center gap-1 font-bold text-[11px] transition"
                title="Visualizza tutte le specifiche del ROL"
              >
                <span>🏖️</span>
                <span>Specifiche ROL</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (req.tipo === 'Malattia' || req.tipo === 'Ricovero' || req.isMalattia) {
                  onOpenMalattiaModal(req.id);
                } else {
                  onOpenLeaveModal(req.id);
                }
              }}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
              title="Modifica richiesta"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDeleteRequest(req.id)}
              className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition"
              title="Elimina"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }
};
