import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Users,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Sparkles,
  ArrowRightLeft,
  UserX,
  MessageSquare,
  ChevronRight,
  Sun,
  Sunset,
  Truck,
  CheckCircle2,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { AppData, Worker, DayShift, BranchEvent, LeaveRequest } from '../types/turni';
import {
  localDateKey,
  getWeekKey,
  timeToMin,
  coveredAt,
  formatTimeRange,
  isHardUnavailableCell,
  weekKeyToMonday
} from '../services/engine';

interface TodayBranchDashboardProps {
  appData: AppData;
  onOpenShiftModal: (workerId: string, dayIdx: number) => void;
  onOpenLeaveModal: (workerId?: string) => void;
  onOpenEventModal: (eventId?: string) => void;
  onQuickSwap: (dayIdx: number) => void;
  onOpenAICopilot: () => void;
}

export const TodayBranchDashboard: React.FC<TodayBranchDashboardProps> = ({
  appData,
  onOpenShiftModal,
  onOpenLeaveModal,
  onOpenEventModal,
  onQuickSwap,
  onOpenAICopilot
}) => {
  const [now, setNow] = useState<Date>(new Date());
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(() => {
    const d = new Date().getDay();
    // In JavaScript: 0 = Sun, 1 = Mon, ..., 6 = Sat
    return d === 0 ? 0 : d - 1; // 0..5 (Lun..Sab)
  });

  // Aggiorna l'orologio ogni 30 secondi
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const weekKey = getWeekKey(now);
  const monday = weekKeyToMonday(weekKey);
  const daysNames = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  const shortDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

  // Data del giorno selezionato
  const targetDate = useMemo(() => {
    const d = new Date(monday);
    d.setDate(d.getDate() + selectedDayIdx);
    return d;
  }, [monday, selectedDayIdx]);

  const targetDateStr = localDateKey(targetDate);
  const isActuallyToday = targetDateStr === localDateKey(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Collaboratori e turni del giorno selezionato
  const activeWorkers = useMemo(() => {
    return (appData.workers || []).filter(w => w.selected !== false);
  }, [appData.workers]);

  const weekShifts = appData.weeks[weekKey] || {};

  // Ripartizione collaboratori
  const officeWorkers = activeWorkers.filter(w => w.group !== 'MAGAZZINO' && !w.brain?.warehouse);
  const warehouseWorkers = activeWorkers.filter(w => w.group === 'MAGAZZINO' || w.brain?.warehouse);

  // Eventi del giorno
  const todayEvents = useMemo(() => {
    return (appData.events || []).filter(e => e.date === targetDateStr);
  }, [appData.events, targetDateStr]);

  // Dettagli turni e presenze
  const workerStatusList = useMemo(() => {
    return activeWorkers.map(w => {
      const cell = weekShifts[w.id]?.[selectedDayIdx];
      const isAbsent = isHardUnavailableCell(cell);
      const isWorking = cell && (cell.mIn || cell.pIn) && !isAbsent;

      // Eventi associati al collaboratore oggi
      const wEvents = todayEvents.filter(e =>
        !e.participantIds || e.participantIds.length === 0 || e.participantIds.includes(w.id)
      );

      // Calcola se è attualmente in turno
      let isPresentNow = false;
      let statusDetail = 'Non in turno';
      let statusBadge = 'gray';

      if (isAbsent) {
        statusDetail = cell?.leaveType || cell?.status || 'Assente';
        statusBadge = 'red';
      } else if (isWorking) {
        const mStart = cell.mIn ? timeToMin(cell.mIn) : null;
        const mEnd = cell.mOut ? timeToMin(cell.mOut) : null;
        const pStart = cell.pIn ? timeToMin(cell.pIn) : null;
        const pEnd = cell.pOut ? timeToMin(cell.pOut) : null;

        if (isActuallyToday) {
          if (mStart !== null && mEnd !== null && currentMinutes >= mStart && currentMinutes < mEnd) {
            isPresentNow = true;
            statusDetail = 'In servizio (Mattina)';
            statusBadge = 'green';
          } else if (mEnd !== null && pStart !== null && currentMinutes >= mEnd && currentMinutes < pStart) {
            statusDetail = 'Pausa Pranzo';
            statusBadge = 'blue';
          } else if (pStart !== null && pEnd !== null && currentMinutes >= pStart && currentMinutes < pEnd) {
            isPresentNow = true;
            statusDetail = 'In servizio (Pomeriggio)';
            statusBadge = 'green';
          } else if (pEnd !== null && currentMinutes >= pEnd) {
            statusDetail = 'Turno completato';
            statusBadge = 'gray';
          } else if (mStart !== null && currentMinutes < mStart) {
            statusDetail = `Inizio alle ${cell.mIn}`;
            statusBadge = 'amber';
          }
        } else {
          statusDetail = formatTimeRange(cell);
          statusBadge = 'blue';
        }

        // Se ha eventi fuori sede in questo momento
        const currentEvent = wEvents.find(e => {
          if (e.allDay) return true;
          const ef = timeToMin(e.fromTime || '00:00');
          const et = timeToMin(e.toTime || '23:59');
          return currentMinutes >= ef && currentMinutes < et;
        });

        if (currentEvent && isActuallyToday) {
          statusDetail = `Fuori sede: ${currentEvent.title}`;
          statusBadge = 'purple';
        }
      }

      return {
        worker: w,
        cell,
        isAbsent,
        isWorking,
        isPresentNow,
        statusDetail,
        statusBadge,
        events: wEvents
      };
    });
  }, [activeWorkers, weekShifts, selectedDayIdx, todayEvents, isActuallyToday, currentMinutes]);

  // Indicatori di presidio e sicurezza
  const metrics = useMemo(() => {
    const isSat = selectedDayIdx === 5;
    const openCheckMin = isSat ? timeToMin('07:30') : timeToMin('07:00');
    const closeCheckMin = isSat ? timeToMin('11:30') : timeToMin('17:15');

    // Apertura e Chiusura Ufficio
    const officePresent = workerStatusList.filter(s => s.worker.group !== 'MAGAZZINO' && !s.worker.brain?.warehouse);
    const officeOpenCount = officePresent.filter(s => s.cell && coveredAt(s.cell, openCheckMin)).length;
    const officeCloseCount = officePresent.filter(s => s.cell && coveredAt(s.cell, closeCheckMin)).length;

    // Apertura e Chiusura Magazzino
    const magPresent = workerStatusList.filter(s => s.worker.group === 'MAGAZZINO' || s.worker.brain?.warehouse);
    const magOpenCount = magPresent.filter(s => s.cell && coveredAt(s.cell, openCheckMin)).length;
    const magCloseCount = magPresent.filter(s => s.cell && coveredAt(s.cell, closeCheckMin)).length;

    // 1. Presidio Carrelli Elevatori (Muletto Magazzino al mattino)
    const magForkliftDrivers = magPresent.filter(s => {
      if (!s.cell || !coveredAt(s.cell, openCheckMin)) return false;
      return s.worker.profile?.qualifications?.forklift?.status === 'valid';
    });
    const hasForkliftCoverage = magForkliftDrivers.length >= 1;

    // Backup Opzionale da Ufficio per Muletto (solo comunicazione opzione)
    const officeForkliftBackups = officePresent.filter(s => {
      if (!s.cell || !coveredAt(s.cell, openCheckMin)) return false;
      return s.worker.profile?.qualifications?.forklift?.status === 'valid';
    }).map(s => s.worker.name);

    // 2. Presidio Ruspa / Pala Caricatrice (Magazzino al mattino)
    const magLoaderDrivers = magPresent.filter(s => {
      if (!s.cell || !coveredAt(s.cell, openCheckMin)) return false;
      return s.worker.profile?.qualifications?.loader?.status === 'valid';
    });
    const hasLoaderCoverage = magLoaderDrivers.length >= 1;

    // Backup Opzionale da Ufficio per Ruspa/Pala (solo comunicazione opzione)
    const officeLoaderBackups = officePresent.filter(s => {
      if (!s.cell || !coveredAt(s.cell, openCheckMin)) return false;
      return s.worker.profile?.qualifications?.loader?.status === 'valid';
    }).map(s => s.worker.name);

    // 3. Primo Soccorso (NON vincolante, informativo)
    const firstAidOnDuty = workerStatusList.filter(s => {
      if (!s.cell || !coveredAt(s.cell, timeToMin('10:00'))) return false;
      return s.worker.profile?.qualifications?.firstAid?.status === 'valid';
    });
    const hasFirstAidCoverage = firstAidOnDuty.length >= 1;

    // 4. Antincendio (NON vincolante, informativo)
    const fireSafetyOnDuty = workerStatusList.filter(s => {
      if (!s.cell || !coveredAt(s.cell, timeToMin('10:00'))) return false;
      return s.worker.profile?.qualifications?.fireSafety?.status === 'valid';
    });
    const hasFireSafetyCoverage = fireSafetyOnDuty.length >= 1;

    // Totale presenti adesso
    const totalPresentNow = workerStatusList.filter(s => s.isPresentNow).length;

    return {
      officeOpenCount,
      officeCloseCount,
      magOpenCount,
      magCloseCount,
      hasForkliftCoverage,
      forkliftCount: magForkliftDrivers.length,
      officeForkliftBackups,
      hasLoaderCoverage,
      loaderCount: magLoaderDrivers.length,
      officeLoaderBackups,
      hasFirstAidCoverage,
      firstAidCount: firstAidOnDuty.length,
      hasFireSafetyCoverage,
      fireSafetyCount: fireSafetyOnDuty.length,
      totalPresentNow,
      isSat
    };
  }, [workerStatusList, selectedDayIdx]);

  // Copia riassunto WhatsApp per il giorno
  const [copiedWA, setCopiedWA] = useState(false);
  const handleCopyWhatsApp = () => {
    let msg = `📍 *CENTROEDILE CORVETTO — ${daysNames[selectedDayIdx].toUpperCase()} ${targetDate.getDate()}*\n`;
    msg += `─────────────────────────\n`;

    msg += `🏢 *BANCO EDILE & UFFICIO:*\n`;
    workerStatusList
      .filter(s => s.worker.group !== 'MAGAZZINO' && !s.worker.brain?.warehouse)
      .forEach(s => {
        const timeStr = s.isAbsent ? `❌ ${s.cell?.leaveType || 'Assente'}` : `⏰ ${formatTimeRange(s.cell)}`;
        const evStr = s.events.length > 0 ? ` [📌 ${s.events.map(e => e.title).join(', ')}]` : '';
        msg += `• *${s.worker.name}*: ${timeStr}${evStr}\n`;
      });

    msg += `\n📦 *LOGISTICA & MAGAZZINO:*\n`;
    workerStatusList
      .filter(s => s.worker.group === 'MAGAZZINO' || s.worker.brain?.warehouse)
      .forEach(s => {
        const timeStr = s.isAbsent ? `❌ ${s.cell?.leaveType || 'Assente'}` : `⏰ ${formatTimeRange(s.cell)}`;
        const forkStr = s.worker.profile?.qualifications?.forklift?.status === 'valid' ? ' 🚜' : '';
        const evStr = s.events.length > 0 ? ` [📌 ${s.events.map(e => e.title).join(', ')}]` : '';
        msg += `• *${s.worker.name}*: ${timeStr}${forkStr}${evStr}\n`;
      });

    if (todayEvents.length > 0) {
      msg += `\n📌 *CORSI & TRASFERTE:*\n`;
      todayEvents.forEach(e => {
        msg += `• ${e.title} (${e.allDay ? 'Tutto il giorno' : `${e.fromTime}-${e.toTime}`}) @ ${e.location || 'Sede'}\n`;
      });
    }

    navigator.clipboard.writeText(msg);
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Giorno & Selettore Rapido */}
      <div className="p-4 sm:p-5 rounded-3xl glass-panel shadow-2xl transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-orange-500/25 border border-white/20 shrink-0 backdrop-blur-md">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {daysNames[selectedDayIdx]} {targetDate.getDate()} {targetDate.toLocaleString('it-IT', { month: 'long' })}
                </h2>
                {isActuallyToday && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-extrabold text-[10px] tracking-wide uppercase border border-emerald-500/30 backdrop-blur-md">
                    Oggi Live
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 mt-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Ore attuali: <strong className="tabular-nums text-slate-900 dark:text-white">{now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</strong></span>
                <span>·</span>
                <span className="tabular-nums">{metrics.totalPresentNow} colleghi attualmente in servizio</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Header */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onQuickSwap(selectedDayIdx)}
              className="glass-btn-ghost px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Scambia il turno fra due colleghi con 1 tap"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
              <span>Scambio Turno</span>
            </button>

            <button
              onClick={() => onOpenLeaveModal()}
              className="px-3.5 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 font-bold text-xs border border-red-500/30 backdrop-blur-md flex items-center gap-1.5 transition cursor-pointer"
              title="Registra una malattia o assenza improvvisa"
            >
              <UserX className="w-3.5 h-3.5 text-red-400" />
              <span>Segna Assenza</span>
            </button>

            <button
              onClick={handleCopyWhatsApp}
              className="px-3.5 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 border border-emerald-400/30 backdrop-blur-md transition active:scale-95 cursor-pointer"
              title="Copia il riepilogo orari formattato per la chat WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{copiedWA ? 'Copiato!' : 'WhatsApp 1-Tap'}</span>
            </button>
          </div>
        </div>

        {/* Mini Selettore Giorni Settimana */}
        <div className="grid grid-cols-6 gap-2 pt-3.5">
          {shortDays.map((name, idx) => {
            const isSelected = selectedDayIdx === idx;
            const d = new Date(monday);
            d.setDate(d.getDate() + idx);
            const isTodayDay = localDateKey(d) === localDateKey(now);

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedDayIdx(idx)}
                className={`py-2 px-1 rounded-2xl text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                  isSelected
                    ? 'glass-btn-primary shadow-lg shadow-blue-600/30 font-black'
                    : isTodayDay
                    ? 'glass-card border border-blue-400/50 text-blue-400 font-bold'
                    : 'glass-btn-ghost opacity-80 hover:opacity-100'
                }`}
              >
                <span className="text-[10px] uppercase font-bold opacity-80">{name}</span>
                <span className="text-xs sm:text-sm font-extrabold tabular-nums">{d.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Semafori di Presidio & Sicurezza D.Lgs 81/08 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Apertura Ufficio */}
        <div className="p-3.5 rounded-3xl glass-card border border-white/10 shadow-lg flex items-center gap-3 backdrop-blur-md">
          <div className={`p-2.5 rounded-2xl ${metrics.officeOpenCount >= 2 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}>
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Apertura Ufficio</div>
            <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5 tabular-nums">
              <span>{metrics.officeOpenCount}/2 op.</span>
              {metrics.officeOpenCount >= 2 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
          </div>
        </div>

        {/* Chiusura Ufficio */}
        <div className="p-3.5 rounded-3xl glass-card border border-white/10 shadow-lg flex items-center gap-3 backdrop-blur-md">
          <div className={`p-2.5 rounded-2xl ${metrics.officeCloseCount >= 1 ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'}`}>
            <Sunset className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chiusura Ufficio</div>
            <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5 tabular-nums">
              <span>{metrics.officeCloseCount} op. (17:30)</span>
              {metrics.officeCloseCount >= 1 && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
            </div>
          </div>
        </div>

        {/* Muletto Magazzino (Patentino Carrello) */}
        <div className="p-3.5 rounded-3xl glass-card border border-white/10 shadow-lg flex items-center gap-3 backdrop-blur-md">
          <div className={`p-2.5 rounded-2xl ${
            metrics.hasForkliftCoverage
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : metrics.officeForkliftBackups.length > 0
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              : 'bg-red-500/15 text-red-400 border border-red-500/30'
          }`}>
            <Truck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Muletto Magazzino</div>
            <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5 tabular-nums">
              {metrics.hasForkliftCoverage ? (
                <>
                  <span>{metrics.forkliftCount} Magazzinieri</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </>
              ) : metrics.officeForkliftBackups.length > 0 ? (
                <span className="text-amber-400 text-xs font-bold truncate" title={`Opzione supporto: ${metrics.officeForkliftBackups.join(', ')}`}>
                  0 Mag. · Opz: {metrics.officeForkliftBackups[0]}
                </span>
              ) : (
                <span className="text-red-400 text-xs font-bold">0 Patentati</span>
              )}
            </div>
          </div>
        </div>

        {/* Ruspa / Pala Magazzino (Patentino Ruspa/Pala) */}
        <div className="p-3.5 rounded-3xl glass-card border border-white/10 shadow-lg flex items-center gap-3 backdrop-blur-md">
          <div className={`p-2.5 rounded-2xl ${
            metrics.hasLoaderCoverage
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : metrics.officeLoaderBackups.length > 0
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              : 'bg-red-500/15 text-red-400 border border-red-500/30'
          }`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Ruspa / Pala Mag.</div>
            <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5 tabular-nums">
              {metrics.hasLoaderCoverage ? (
                <>
                  <span>{metrics.loaderCount} Magazzinieri</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </>
              ) : metrics.officeLoaderBackups.length > 0 ? (
                <span className="text-amber-400 text-xs font-bold truncate" title={`Opzione supporto: ${metrics.officeLoaderBackups.join(', ')}`}>
                  0 Mag. · Opz: {metrics.officeLoaderBackups[0]}
                </span>
              ) : (
                <span className="text-red-400 text-xs font-bold">0 Patentati</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Avviso Comunicazione Opzione di Supporto da Ufficio (Non considerata soluzione effettiva) */}
      {(!metrics.hasForkliftCoverage || !metrics.hasLoaderCoverage) && (
        <div className="p-4 rounded-3xl glass-card border border-amber-500/30 bg-amber-500/10 text-xs space-y-2">
          <div className="flex items-center gap-2 font-black text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Presidio Piazzale Magazzino: Comunicazione Opzioni di Supporto</span>
          </div>
          {!metrics.hasForkliftCoverage && (
            <div className="text-slate-300 pl-6 leading-relaxed">
              🚜 <strong>Muletto Magazzino:</strong> Nessun magazziniere con patentino carrello presente in turno.
              {metrics.officeForkliftBackups.length > 0 ? (
                <span className="ml-1 text-slate-200">
                  Operatori presenti in ufficio con abilitazione: <strong className="text-blue-400">{metrics.officeForkliftBackups.join(', ')}</strong>.
                  <em className="text-slate-400 ml-1 block sm:inline">
                    (Nota: da considerarsi solo una comunicazione di opzione eventuale, senza essere considerata una soluzione effettiva).
                  </em>
                </span>
              ) : (
                <span className="ml-1 text-red-400 font-bold">Nessun operatore abilitato presente né in magazzino né in ufficio.</span>
              )}
            </div>
          )}
          {!metrics.hasLoaderCoverage && (
            <div className="text-slate-300 pl-6 leading-relaxed">
              🚜 <strong>Ruspa / Pala Magazzino:</strong> Nessun magazziniere con patentino ruspa/pala presente in turno.
              {metrics.officeLoaderBackups.length > 0 ? (
                <span className="ml-1 text-slate-200">
                  Operatori presenti in ufficio con abilitazione: <strong className="text-blue-400">{metrics.officeLoaderBackups.join(', ')}</strong>.
                  <em className="text-slate-400 ml-1 block sm:inline">
                    (Nota: da considerarsi solo una comunicazione di opzione eventuale, senza essere considerata una soluzione effettiva).
                  </em>
                </span>
              ) : (
                <span className="ml-1 text-red-400 font-bold">Nessun operatore abilitato presente né in magazzino né in ufficio.</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Riferimento Presidi Informativi (Non vincolanti) */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 px-1">
        <span className="font-semibold">Presidi di Sicurezza (non vincolanti):</span>
        <span className={`px-2.5 py-0.5 rounded-xl font-bold border backdrop-blur-md ${metrics.hasFirstAidCoverage ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'glass-card text-slate-500'}`}>
          🚑 Primo Soccorso: {metrics.firstAidCount} addetti
        </span>
        <span className={`px-2.5 py-0.5 rounded-xl font-bold border backdrop-blur-md ${metrics.hasFireSafetyCoverage ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'glass-card text-slate-500'}`}>
          🧯 Antincendio: {metrics.fireSafetyCount} addetti
        </span>
      </div>

      {/* Sezione Corsi & Eventi del Giorno */}
      {todayEvents.length > 0 && (
        <div className="p-4 rounded-3xl glass-card border border-purple-500/30 bg-purple-500/10 space-y-2.5">
          <div className="text-xs font-bold text-purple-300 flex items-center gap-2">
            <span>📌</span>
            <span>Corsi, Riunioni & Trasferte Fuori Sede di Oggi ({todayEvents.length}):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {todayEvents.map(ev => {
              const participants = (ev.participantIds || [])
                .map(id => appData.workers.find(w => w.id === id)?.name)
                .filter(Boolean);

              return (
                <div
                  key={ev.id}
                  onClick={() => onOpenEventModal(ev.id)}
                  className="p-3 rounded-2xl glass-card border border-purple-500/25 cursor-pointer hover:border-purple-400 transition-all flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-black text-purple-200">{ev.title}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-purple-400" />
                      <span>{ev.allDay ? 'Tutto il giorno' : `${ev.fromTime} – ${ev.toTime}`}</span>
                      {ev.location && (
                        <>
                          <span>·</span>
                          <span className="truncate max-w-[150px]">{ev.location}</span>
                        </>
                      )}
                    </div>
                    {participants.length > 0 && (
                      <div className="text-[10px] font-semibold text-purple-300">
                        {participants.join(', ')}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-purple-400" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Griglia Schede Collaboratori: Ufficio vs Magazzino */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Colonna Ufficio & Vendite */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🏢</span> Banco Edile & Ufficio ({officeWorkers.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Apertura 06:30 · Chiusura 17:30</span>
          </div>

          <div className="space-y-2">
            {workerStatusList
              .filter(s => s.worker.group !== 'MAGAZZINO' && !s.worker.brain?.warehouse)
              .map(({ worker, cell, isAbsent, isWorking, statusDetail, statusBadge, events }) => {
                return (
                  <div
                    key={worker.id}
                    onClick={() => onOpenShiftModal(worker.id, selectedDayIdx)}
                    className="p-3.5 rounded-2xl glass-card border border-white/10 hover:border-blue-400/50 shadow-md hover:shadow-xl transition-all cursor-pointer flex items-center justify-between backdrop-blur-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border border-white/10 ${
                        isAbsent
                          ? 'bg-red-500/20 text-red-300'
                          : isWorking
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'glass-card text-slate-400'
                      }`}>
                        {worker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {worker.name}
                          </span>
                          {events.length > 0 && (
                            <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-1.5 py-0.2 rounded-md border border-purple-500/30">
                              📌 Fuori
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {worker.role}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {isAbsent ? (
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-black uppercase text-red-400 bg-red-500/20 border border-red-500/30">
                          {cell?.leaveType || 'Assente'}
                        </span>
                      ) : isWorking ? (
                        <div>
                          <div className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                            {formatTimeRange(cell)}
                          </div>
                          <div className={`text-[10px] font-bold ${
                            statusBadge === 'green' ? 'text-emerald-400' :
                            statusBadge === 'amber' ? 'text-amber-400' :
                            statusBadge === 'purple' ? 'text-purple-400' :
                            'text-slate-400'
                          }`}>
                            {statusDetail}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">Riposo</span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Colonna Magazzino & Logistica */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>📦</span> Piazzale & Magazzino ({warehouseWorkers.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Presidio Muletti D.Lgs 81/08</span>
          </div>

          <div className="space-y-2">
            {workerStatusList
              .filter(s => s.worker.group === 'MAGAZZINO' || s.worker.brain?.warehouse)
              .map(({ worker, cell, isAbsent, isWorking, statusDetail, statusBadge, events }) => {
                const hasMuletto = worker.profile?.qualifications?.forklift?.status === 'valid';

                return (
                  <div
                    key={worker.id}
                    onClick={() => onOpenShiftModal(worker.id, selectedDayIdx)}
                    className="p-3.5 rounded-2xl glass-card border border-white/10 hover:border-emerald-400/50 shadow-md hover:shadow-xl transition-all cursor-pointer flex items-center justify-between backdrop-blur-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border border-white/10 ${
                        isAbsent
                          ? 'bg-red-500/20 text-red-300'
                          : isWorking
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'glass-card text-slate-400'
                      }`}>
                        {worker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {worker.name}
                          </span>
                          {hasMuletto && (
                            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.2 rounded-md border border-emerald-500/30">
                              🚜 Muletto
                            </span>
                          )}
                          {events.length > 0 && (
                            <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-1.5 py-0.2 rounded-md border border-purple-500/30">
                              📌 Fuori
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {worker.role}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {isAbsent ? (
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-black uppercase text-red-400 bg-red-500/20 border border-red-500/30">
                          {cell?.leaveType || 'Assente'}
                        </span>
                      ) : isWorking ? (
                        <div>
                          <div className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                            {formatTimeRange(cell)}
                          </div>
                          <div className={`text-[10px] font-bold ${
                            statusBadge === 'green' ? 'text-emerald-400' :
                            statusBadge === 'amber' ? 'text-amber-400' :
                            statusBadge === 'purple' ? 'text-purple-400' :
                            'text-slate-400'
                          }`}>
                            {statusDetail}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">Riposo</span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
