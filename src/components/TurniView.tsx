import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  AlertTriangle,
  UserPlus,
  ArrowLeftRight,
  Zap,
  Calendar
} from 'lucide-react';
import { AppData, DayShift } from '../types/turni';
import {
  getWeekInfo,
  countableDayHours,
  isRestStatus,
  isFullDayAbsence,
  localDateKey,
  getCellDisplayDetails,
  analyzeCoverage
} from '../services/engine';
import { RolModalData } from './SpecificheImpegnoModal';
import { TurniTimelineView } from './TurniTimelineView';
import { playGlassTap } from '../services/soundFx';

interface TurniViewProps {
  appData: AppData;
  currentDate: Date;
  onChangeWeek: (offset: number) => void;
  onOpenDayModal: (workerId: string, dayIdx: number, dateObj: Date) => void;
  onOpenWorkerModal: (workerId: string) => void;
  onOpenAddWorker: () => void;
  onUpdateNotes: (notes: string) => void;
  onToggleWorkerSelection: (workerId: string) => void;
  onToggleSelectAll: () => void;
  onOpenEventDetails: (eventId: string, defaultDate?: string, defaultWorkerId?: string) => void;
  onOpenRolDetails: (rolData: RolModalData) => void;
  onOpenSwapModal?: () => void;
  onSwitchToToday?: () => void;
  onGoToCurrentWeek?: () => void;
}

export const TurniView: React.FC<TurniViewProps> = ({
  appData,
  currentDate,
  onChangeWeek,
  onOpenDayModal,
  onOpenWorkerModal,
  onOpenAddWorker,
  onUpdateNotes,
  onToggleWorkerSelection,
  onToggleSelectAll,
  onOpenEventDetails,
  onOpenRolDetails,
  onOpenSwapModal,
  onSwitchToToday,
  onGoToCurrentWeek
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'timeline' | 'auto'>('table');

  const weekInfo = getWeekInfo(currentDate);
  const weekKey = `${currentDate.getFullYear()}-W${weekInfo.weekNo}`;
  const daysNames = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

  const coverageList = React.useMemo(() => {
    return analyzeCoverage(appData.weeks[weekKey] || {}, appData.rules, appData.workers, weekKey);
  }, [appData.weeks, appData.rules, appData.workers, weekKey]);

  // Calcolo date della settimana
  const weekDates: Date[] = [];
  const monday = new Date(weekInfo.monday);
  for (let i = 0; i < 6; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDates.push(d);
  }

  const todayStr = localDateKey(new Date());

  // Raggruppa collaboratori
  const groupOrder = appData.rules.groupOrder || ["MANAGER", "EDILE", "FINITURE", "MAGAZZINO"];
  const filteredWorkers = appData.workers.filter(w => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return w.name.toLowerCase().includes(term) || (w.role && w.role.toLowerCase().includes(term));
  });

  const allSelected = filteredWorkers.length > 0 && filteredWorkers.every(w => w.selected !== false);

  // Problemi della settimana
  const weekProblems: Array<{ type: 'warn' | 'danger' | 'info'; text: string }> = [];

  filteredWorkers.forEach(w => {
    if (w.selected === false) return;
    let totHours = 0;
    for (let day = 0; day <= 5; day++) {
      const cell = appData.weeks[weekKey]?.[w.id]?.[day];
      totHours += countableDayHours(w.id, day, cell, weekKey, appData);
    }
    if (totHours > 40.05) {
      weekProblems.push({
        type: 'danger',
        text: `${w.name}: totale settimanale ${totHours.toFixed(1)}h supera le 40h standard.`
      });
    }

    // Controllo scadenze legali D.Lgs 81/08
    const qs = w.profile?.qualifications;
    if (qs) {
      const todayDateStr = new Date().toISOString().split('T')[0];
      const qualLabels: Record<string, string> = {
        forklift: 'Patentino Muletto',
        loader: 'Abilitazione Pala Caricatrice',
        firstAid: 'Attestato Primo Soccorso',
        fireSafety: 'Attestato Antincendio'
      };
      Object.entries(qs).forEach(([k, q]) => {
        if (!q) return;
        const label = qualLabels[k] || k;
        if (q.status === 'expired' || (q.status === 'valid' && q.expiry && q.expiry < todayDateStr)) {
          weekProblems.push({
            type: 'danger',
            text: `🚨 ${w.name}: ${label} scaduto (${q.expiry || 'data non indicata'}). Rischio conformità D.Lgs 81/08.`
          });
        }
      });
    }
  });

  // Controllo presidi magazzino: muletto e ruspa (prioritari), con opzione di eventuale supporto da ufficio
  coverageList.forEach((cov, idx) => {
    if (cov.isHoliday) return;

    // 1. Muletto Carrello Elevatore in Magazzino
    if (cov.hasForkliftCoverage === false && idx <= 5) {
      if (cov.officeForkliftBackups && cov.officeForkliftBackups.length > 0) {
        weekProblems.push({
          type: 'warn',
          text: `🚜 ${daysNames[idx]}: Nessun magazziniere con patentino muletto presente. Opzione di supporto (non vincolante): ${cov.officeForkliftBackups.join(', ')} presente in ufficio (nota: da considerarsi solo opzione di supporto, non una soluzione effettiva).`
        });
      } else {
        weekProblems.push({
          type: 'danger',
          text: `🚜 ${daysNames[idx]}: Magazzino scoperto, nessun addetto abilitato al muletto presente né in magazzino né come opzione in ufficio.`
        });
      }
    }

    // 2. Ruspa / Pala Caricatrice in Magazzino
    if (cov.hasLoaderCoverage === false && idx <= 5) {
      if (cov.officeLoaderBackups && cov.officeLoaderBackups.length > 0) {
        weekProblems.push({
          type: 'warn',
          text: `🚜 ${daysNames[idx]}: Nessun magazziniere con patentino ruspa/pala presente. Opzione di supporto (non vincolante): ${cov.officeLoaderBackups.join(', ')} presente in ufficio (nota: da considerarsi solo opzione di supporto, non una soluzione effettiva).`
        });
      } else {
        weekProblems.push({
          type: 'danger',
          text: `🚜 ${daysNames[idx]}: Magazzino scoperto, nessun addetto abilitato a ruspa/pala per carico inerti né in magazzino né come opzione in ufficio.`
        });
      }
    }

    // Nota: Primo soccorso e antincendio non sono vincolanti in questa fase su richiesta utente
  });

  // Trova colore associato allo status, con contrasto alto per tema chiaro
  const getStatusColor = (statusName?: string): string | undefined => {
    if (!statusName || statusName === 'LAVORO') return undefined;
    const s = appData.statuses.find(item => item.name.toUpperCase() === statusName.toUpperCase());
    return s ? s.color : undefined;
  };

  return (
    <div className="space-y-4">
      {/* Barra Controlli Settimana & Filtri */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 rounded-3xl glass-panel shadow-xl transition-all">
        {/* Navigatore Settimane & Azioni Rapide */}
        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onChangeWeek(-1)}
              className="p-2 rounded-xl glass-btn-ghost transition cursor-pointer"
              title="Settimana precedente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-3.5 py-1.5 rounded-xl glass-card font-extrabold text-xs sm:text-sm text-center min-w-[130px] border border-white/10">
              {weekInfo.label}
            </div>

            <button
              type="button"
              onClick={() => onChangeWeek(1)}
              className="p-2 rounded-xl glass-btn-ghost transition cursor-pointer"
              title="Settimana successiva"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {onGoToCurrentWeek && (
            <button
              type="button"
              onClick={onGoToCurrentWeek}
              className="px-3 py-1.5 rounded-xl glass-btn-ghost text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Torna alla settimana corrente"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Oggi</span>
            </button>
          )}

          {onSwitchToToday && (
            <button
              type="button"
              onClick={onSwitchToToday}
              className="px-3 py-1.5 rounded-xl glass-card hover:border-blue-500/50 text-xs font-bold text-blue-400 flex items-center gap-1.5 transition cursor-pointer"
              title="Apri Dashboard Oggi in Filiale"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>⚡ Oggi in Filiale</span>
            </button>
          )}

          {onOpenSwapModal && (
            <button
              type="button"
              onClick={onOpenSwapModal}
              className="px-3 py-1.5 rounded-xl glass-card hover:border-indigo-500/50 text-xs font-bold text-indigo-400 flex items-center gap-1.5 transition cursor-pointer"
              title="Scambia turno tra due colleghi in 1 click"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
              <span>Scambio Turno</span>
            </button>
          )}
        </div>

        {/* Ricerca e Toggle Vista */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Cerca per nome o ruolo..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl glass-input text-xs placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center p-1 rounded-xl glass-dock text-xs font-bold">
            <button
              onClick={() => { playGlassTap(); setViewMode('table'); }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${viewMode === 'table' ? 'glass-btn-primary shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Tabella
            </button>
            <button
              onClick={() => { playGlassTap(); setViewMode('timeline'); }}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${viewMode === 'timeline' ? 'glass-btn-primary shadow-sm' : 'text-slate-400 hover:text-white'}`}
              title="Timeline Spaziale a nastri orari continui VisionOS"
            >
              <span>✨</span> Timeline
            </button>
            <button
              onClick={() => { playGlassTap(); setViewMode('cards'); }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${viewMode === 'cards' ? 'glass-btn-primary shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Card
            </button>
          </div>
        </div>
      </div>

      {/* Pannello Problemi / Avvisi Settimana */}
      {weekProblems.length > 0 && (
        <div className="p-4 rounded-3xl glass-card border border-amber-500/30 text-amber-200 text-xs space-y-1.5 shadow-lg shadow-amber-500/5">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <AlertTriangle className="w-4 h-4" />
            <span>Attenzione — Verifiche Settimana:</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-slate-300">
            {weekProblems.map((p, idx) => (
              <li key={idx}>{p.text}</li>
            ))}
          </ul>
        </div>
      )}



      {/* Vista Timeline Spaziale VisionOS */}
      {viewMode === 'timeline' && (
        <TurniTimelineView
          appData={appData}
          weekDates={weekDates}
          weekKey={weekKey}
          onOpenDayModal={onOpenDayModal}
          onOpenWorkerModal={onOpenWorkerModal}
        />
      )}

      {/* Vista Tabella (Desktop o se viewMode = 'table') */}
      <div className={`overflow-x-auto rounded-3xl glass-panel shadow-2xl border border-white/10 ${viewMode === 'timeline' || viewMode === 'cards' ? 'hidden' : viewMode === 'auto' ? 'hidden md:block' : 'block'}`}>
        <table className="w-full text-xs text-left border-collapse min-w-[950px]">
          <thead>
            <tr className="bg-slate-900/80 backdrop-blur-md text-slate-300 font-extrabold border-b border-white/10 uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-3.5 w-56 sticky left-0 z-10 border-r border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={onToggleSelectAll}
                      className="rounded border-slate-500 text-blue-600 focus:ring-0 cursor-pointer"
                      title="Seleziona / deseleziona tutti"
                    />
                    <span className="text-slate-900 dark:text-white">Collaboratore</span>
                  </div>
                  <button
                    onClick={onOpenAddWorker}
                    className="p-1 rounded-lg glass-btn-ghost text-blue-400 transition cursor-pointer"
                    title="Aggiungi nuovo collaboratore"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </th>

              {weekDates.map((d, dayIdx) => {
                const isToday = localDateKey(d) === todayStr;
                return (
                  <th
                    key={dayIdx}
                    className={`py-3 px-2 text-center border-r border-white/10 transition-colors ${
                      isToday ? 'bg-gradient-to-b from-blue-600 to-indigo-600 text-white font-extrabold shadow-lg shadow-blue-600/30' : ''
                    }`}
                  >
                    <div>{daysNames[dayIdx]}</div>
                    <div className="text-sm font-extrabold tabular-nums">{d.getDate()}</div>
                  </th>
                );
              })}

              <th className="py-3 px-3 text-center w-20 font-extrabold text-blue-400">
                Totale
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
            {groupOrder.map((groupKey) => {
              const workersInGroup = filteredWorkers.filter(
                w => (w.group === groupKey || (!w.group && groupKey === 'MAGAZZINO'))
              ).sort((a, b) => (a.order || 99) - (b.order || 99));

              if (!workersInGroup.length) return null;

              const groupLabels: Record<string, string> = {
                MANAGER: 'Ufficio Direzione & Store Manager',
                EDILE: 'Ufficio Vendite Banco Edile',
                FINITURE: 'Ufficio Finiture & Idalia',
                MAGAZZINO: 'Logistica & Magazzino'
              };

              return (
                <React.Fragment key={groupKey}>
                  {/* Divisore di Gruppo */}
                  <tr className="bg-slate-900/60 backdrop-blur-md text-[10px] font-black tracking-wider text-blue-400 uppercase">
                    <td colSpan={8} className="py-2 px-3.5 border-y border-white/10">
                      {groupLabels[groupKey] || groupKey}
                    </td>
                  </tr>

                  {workersInGroup.map((w) => {
                    let totalWeekMinutes = 0;
                    const isRowSelected = w.selected !== false;

                    return (
                      <tr
                        key={w.id}
                        className={`hover:bg-white/5 transition-all ${!isRowSelected ? 'opacity-40' : ''}`}
                      >
                        {/* Colonna Nome */}
                        <td className="py-2.5 px-3.5 sticky left-0 border-r border-white/10 z-10">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isRowSelected}
                              onChange={() => onToggleWorkerSelection(w.id)}
                              className="rounded border-slate-500 text-blue-600 focus:ring-0 cursor-pointer"
                            />
                            <div
                              onClick={() => onOpenWorkerModal(w.id)}
                              className="cursor-pointer hover:text-blue-400 transition"
                              title="Apri scheda anagrafica"
                            >
                              <div className="font-extrabold text-slate-900 dark:text-slate-100">{w.name}</div>
                              {w.role && <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{w.role}</div>}
                            </div>
                          </div>
                        </td>

                        {/* 6 Giorni Lun - Sab */}
                        {weekDates.map((dateObj, dayIdx) => {
                          const cell = appData.weeks[weekKey]?.[w.id]?.[dayIdx];
                          const cellHours = countableDayHours(w.id, dayIdx, cell, weekKey, appData);
                          totalWeekMinutes += cellHours * 60;

                          const statusColor = getStatusColor(cell?.status);
                          const isRest = isRestStatus(cell?.status);
                          const dayStr = localDateKey(dateObj);

                          // Eventi del giorno per questo lavoratore (inclusi eventi di intera filiale)
                          const dayEvents = (appData.events || []).filter(
                            e => e.date === dayStr && (e.participantIds?.includes(w.id) || !e.participantIds || e.participantIds.length === 0 || e.participantIds.length === appData.workers.length)
                          );

                          const details = getCellDisplayDetails(cell, w.id, dayIdx, weekKey, appData);

                          return (
                            <td
                              key={dayIdx}
                              onClick={() => onOpenDayModal(w.id, dayIdx, dateObj)}
                              className="p-1 text-center border-r border-b border-white/[0.08] cursor-pointer min-w-[125px] relative group"
                            >
                              <div
                                className={`h-full min-h-[58px] p-1.5 rounded-2xl glass-tile flex flex-col items-center justify-center relative ${
                                  cell?.generated ? 'ring-1 ring-blue-500/40 shadow-sm shadow-blue-500/10' : ''
                                }`}
                                style={
                                  statusColor && !details.isRest && details.isFullDayLeave
                                    ? { backgroundColor: `${statusColor}18`, borderColor: `${statusColor}50` }
                                    : undefined
                                }
                              >
                                {details.isRest ? (
                                <div className="flex flex-col items-center justify-center gap-0.5">
                                  <div className="text-slate-400 dark:text-slate-500 font-extrabold text-sm">—</div>
                                  {/* Eventi su riposo */}
                                  {dayEvents.map(e => {
                                    const isRiunione = e.type === 'Riunione' || (e.title || '').toLowerCase().includes('riunione');
                                    return (
                                      <div
                                        key={e.id}
                                        onClick={(ev) => {
                                          ev.stopPropagation();
                                          onOpenEventDetails(e.id);
                                        }}
                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate max-w-[110px] mt-0.5 flex items-center justify-center gap-1 cursor-pointer transition-all hover:scale-105 shadow-xs ${
                                          isRiunione
                                            ? 'text-blue-900 dark:text-blue-200 bg-blue-100 dark:bg-blue-600/30 border border-blue-300 dark:border-blue-500/40 hover:bg-blue-200 dark:hover:bg-blue-600/50'
                                            : 'text-purple-900 dark:text-purple-300 bg-purple-100 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30 hover:bg-purple-200 dark:hover:bg-purple-500/40'
                                        }`}
                                        title={`${e.title} (${e.allDay ? 'Tutto il giorno' : `${e.fromTime || (e as any).from || ''} - ${e.toTime || (e as any).to || ''}`}) – Clicca per vedere le specifiche`}
                                      >
                                        <span>{isRiunione ? '💼' : '📌'}</span>
                                        <span className="truncate">{e.title}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : details.isFullDayLeave ? (
                                <div className="flex flex-col items-center justify-center gap-0.5">
                                  {/* Causale Giornata Intera (Ferie, Malattia, Ricovero, ROL, ecc.) */}
                                  <div
                                    onClick={(ev) => {
                                      if (details.leaveLabel?.toUpperCase().includes('ROL') || details.leaveLabel?.toUpperCase().includes('PERM') || cell?.status === 'ROL') {
                                        ev.stopPropagation();
                                        onOpenRolDetails({
                                          workerId: w.id,
                                          workerName: w.name,
                                          workerRole: w.role,
                                          workerGroup: w.group,
                                          date: dateObj,
                                          dayIdx,
                                          leaveLabel: details.leaveLabel || 'ROL',
                                          leaveHours: cellHours,
                                          totalCountableHours: cellHours,
                                          note: cell?.note,
                                          status: cell?.status,
                                          leaveRequestId: cell?.leaveRequestId,
                                          cell
                                        });
                                      }
                                    }}
                                    className={`flex flex-col items-center justify-center gap-0.5 ${
                                      details.leaveLabel?.toUpperCase().includes('ROL') || details.leaveLabel?.toUpperCase().includes('PERM') || cell?.status === 'ROL'
                                        ? 'cursor-pointer hover:scale-105 transition-transform'
                                        : ''
                                    }`}
                                    title={details.leaveLabel?.toUpperCase().includes('ROL') || cell?.status === 'ROL' ? 'Clicca per vedere le specifiche del ROL' : undefined}
                                  >
                                    <span
                                      className="font-black text-[11px] uppercase tracking-wider"
                                      style={statusColor ? { color: statusColor } : { color: '#2563eb' }}
                                    >
                                      {details.leaveLabel}
                                    </span>

                                    {/* Ore di assenza pulite senza pillola ingombrante */}
                                    {cellHours > 0 && (
                                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                        {cellHours.toFixed(1).replace(/\.0$/, '')}h
                                      </span>
                                    )}
                                  </div>

                                  {/* Eventi in coincidenza su giornata di assenza */}
                                  {dayEvents.map(e => {
                                    const isRiunione = e.type === 'Riunione' || (e.title || '').toLowerCase().includes('riunione');
                                    return (
                                      <div
                                        key={e.id}
                                        onClick={(ev) => {
                                          ev.stopPropagation();
                                          onOpenEventDetails(e.id);
                                        }}
                                        className={`text-[9.5px] font-bold px-2 py-0.5 rounded-lg truncate max-w-[125px] mt-0.5 flex items-center justify-center gap-1 cursor-pointer transition hover:scale-105 ${
                                          isRiunione
                                            ? 'text-blue-900 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700/50'
                                            : 'text-purple-900 dark:text-purple-200 bg-purple-100 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-700/50'
                                        }`}
                                        title={`${e.title} (${e.allDay ? 'Tutto il giorno' : `${e.fromTime || (e as any).from || ''} - ${e.toTime || (e as any).to || ''}`}) – Clicca per vedere le specifiche`}
                                      >
                                        <span>{isRiunione ? '💼' : '📌'}</span>
                                        <span className="truncate">{e.title}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center gap-0.5">
                                  {/* Orari Lavorati ad alto contrasto e leggibilità immediata */}
                                  {details.workedTimes && (
                                    <div className="font-extrabold text-slate-900 dark:text-slate-100 text-[11px] tabular-nums tracking-tight">
                                      {details.workedTimes}
                                    </div>
                                  )}

                                  {/* Conteggio ore sottile ed elegante senza bolle colorate */}
                                  {cellHours > 0 && (
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                        {details.isPartialLeave && details.workedHours > 0
                                          ? `${details.workedHours.toFixed(1).replace(/\.0$/, '')}h`
                                          : `${cellHours.toFixed(1).replace(/\.0$/, '')}h`}
                                      </span>
                                      {details.isPartialLeave && details.leaveHours !== undefined && details.leaveHours > 0 && (
                                        <span
                                          onClick={(ev) => {
                                            ev.stopPropagation();
                                            onOpenRolDetails({
                                              workerId: w.id,
                                              workerName: w.name,
                                              workerRole: w.role,
                                              workerGroup: w.group,
                                              date: dateObj,
                                              dayIdx,
                                              leaveLabel: details.leaveLabel || 'ROL',
                                              leaveHours: details.leaveHours,
                                              leaveTimeRange: details.leaveTimeRange,
                                              workedTimes: details.workedTimes,
                                              workedHours: details.workedHours,
                                              totalCountableHours: details.totalCountableHours,
                                              note: cell?.note,
                                              status: cell?.status,
                                              leaveRequestId: cell?.leaveRequestId,
                                              cell
                                            });
                                          }}
                                          className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50 cursor-pointer hover:bg-amber-200 transition"
                                          title="Ore assenza per permesso/ROL – Clicca per vedere le specifiche ROL"
                                        >
                                          +{details.leaveHours.toFixed(1).replace(/\.0$/, '')}h perm
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Riferimento Permesso Sotto come per gli Impegni */}
                                  {details.isPartialLeave && (
                                    <div
                                      onClick={(ev) => {
                                        ev.stopPropagation();
                                        onOpenRolDetails({
                                          workerId: w.id,
                                          workerName: w.name,
                                          workerRole: w.role,
                                          workerGroup: w.group,
                                          date: dateObj,
                                          dayIdx,
                                          leaveLabel: details.leaveLabel || 'ROL',
                                          leaveHours: details.leaveHours,
                                          leaveTimeRange: details.leaveTimeRange,
                                          workedTimes: details.workedTimes,
                                          workedHours: details.workedHours,
                                          totalCountableHours: details.totalCountableHours,
                                          note: cell?.note,
                                          status: cell?.status,
                                          leaveRequestId: cell?.leaveRequestId,
                                          cell
                                        });
                                      }}
                                      className="text-[9px] font-bold text-purple-900 dark:text-purple-300 bg-purple-100 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30 px-1 py-0.5 rounded truncate max-w-[110px] mt-0.5 flex items-center justify-center gap-1 shadow-2xs cursor-pointer hover:bg-purple-200 dark:hover:bg-purple-500/40 hover:scale-105 transition-all"
                                      title={`${details.leaveLabel}${details.leaveTimeRange ? ` (${details.leaveTimeRange})` : ''}${cell?.note ? ` – ${cell.note}` : ''} – Clicca per vedere le specifiche ROL`}
                                    >
                                      <span>🏖️</span>
                                      <span className="truncate">{details.leaveLabel}</span>
                                      {details.leaveTimeRange && (
                                        <span className="text-[8px] font-mono opacity-90 truncate">
                                          ({details.leaveTimeRange})
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Note / ROL / Impegno manuale */}
                                  {cell?.note && !details.isPartialLeave && (
                                    <div
                                      onClick={(ev) => {
                                        const noteLower = (cell.note || '').toLowerCase();
                                        const matched = (appData.events || []).find(e =>
                                          (e.date === dayStr && e.title.toLowerCase().includes(noteLower)) ||
                                          (e.date === dayStr && noteLower.includes(e.title.toLowerCase())) ||
                                          (noteLower.includes('riunione') && e.title.toLowerCase().includes('riunione')) ||
                                          (noteLower.includes('corso') && e.title.toLowerCase().includes('corso')) ||
                                          (noteLower.includes('trasferta') && e.title.toLowerCase().includes('trasferta'))
                                        );
                                        if (matched) {
                                          ev.stopPropagation();
                                          onOpenEventDetails(matched.id);
                                        } else if (noteLower.includes('rol') || noteLower.includes('permesso') || noteLower.includes('perm')) {
                                          ev.stopPropagation();
                                          onOpenRolDetails({
                                            workerId: w.id,
                                            workerName: w.name,
                                            workerRole: w.role,
                                            workerGroup: w.group,
                                            date: dateObj,
                                            dayIdx,
                                            leaveLabel: 'ROL',
                                            leaveHours: details.leaveHours || 4,
                                            workedTimes: details.workedTimes,
                                            note: cell.note,
                                            status: cell.status,
                                            cell
                                          });
                                        } else {
                                          ev.stopPropagation();
                                          onOpenEventDetails(cell.note || '', dayStr, w.id);
                                        }
                                      }}
                                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate max-w-[110px] mt-0.5 flex items-center justify-center gap-1 cursor-pointer hover:scale-105 transition-all ${
                                        cell.noteColor
                                          ? 'border shadow-2xs'
                                          : 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                                      }`}
                                      style={
                                        cell.noteColor
                                          ? {
                                              backgroundColor: `${cell.noteColor}20`,
                                              borderColor: `${cell.noteColor}60`,
                                              color: cell.noteColor
                                            }
                                          : undefined
                                      }
                                      title={`${cell.note} – Clicca per vedere le specifiche dell'impegno`}
                                    >
                                      <span>📌</span>
                                      <span className="truncate">{cell.note}</span>
                                    </div>
                                  )}

                                  {/* Impegni/Corsi / Riunione Commerciale */}
                                  {dayEvents.map(e => {
                                    const isRiunione = e.type === 'Riunione' || (e.title || '').toLowerCase().includes('riunione');
                                    return (
                                      <div
                                        key={e.id}
                                        onClick={(ev) => {
                                          ev.stopPropagation();
                                          onOpenEventDetails(e.id);
                                        }}
                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate max-w-[110px] mt-0.5 flex items-center justify-center gap-1 cursor-pointer transition-all hover:scale-105 shadow-xs ${
                                          isRiunione
                                            ? 'text-blue-900 dark:text-blue-200 bg-blue-100 dark:bg-blue-600/30 border border-blue-300 dark:border-blue-500/40 hover:bg-blue-200 dark:hover:bg-blue-600/50'
                                            : 'text-purple-900 dark:text-purple-300 bg-purple-100 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30 hover:bg-purple-200 dark:hover:bg-purple-500/40'
                                        }`}
                                        title={`${e.title} (${e.allDay ? 'Tutto il giorno' : `${e.fromTime || (e as any).from || ''} - ${e.toTime || (e as any).to || ''}`}) – Clicca per vedere le specifiche`}
                                      >
                                        <span>{isRiunione ? '💼' : '📌'}</span>
                                        <span className="truncate">{e.title}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              </div>
                            </td>
                          );
                        })}

                        {/* Totale Settimanale */}
                        <td className="py-2 px-2 text-center font-extrabold text-xs border-l border-white/[0.08]">
                          {totalWeekMinutes > 0 ? (
                            <span
                              className={`px-2.5 py-1 rounded-xl glass-dock font-mono font-bold text-xs tabular-nums border border-white/10 ${
                                totalWeekMinutes / 60 > 40.05
                                  ? 'text-red-400 border-red-500/40 bg-red-500/15'
                                  : 'text-emerald-400 border-emerald-500/30'
                              }`}
                            >
                              {(totalWeekMinutes / 60).toFixed(1).replace(/\.0$/, '')}h
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Vista Card Mobile */}
      <div className={`space-y-3 ${viewMode === 'timeline' || viewMode === 'table' ? 'hidden' : viewMode === 'auto' ? 'block md:hidden' : 'block'}`}>
        {filteredWorkers.map((w) => {
          let totWeekMinutes = 0;
          for (let d = 0; d <= 5; d++) {
            const c = appData.weeks[weekKey]?.[w.id]?.[d];
            totWeekMinutes += countableDayHours(w.id, d, c, weekKey, appData) * 60;
          }

          return (
            <div
              key={w.id}
              className="p-4 rounded-3xl glass-card border border-white/10 shadow-xl space-y-3"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div onClick={() => onOpenWorkerModal(w.id)} className="cursor-pointer">
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">{w.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{w.role || w.group}</div>
                </div>
                <div className="px-2.5 py-1 rounded-xl glass-dock border border-white/10 text-xs font-bold text-blue-400 tabular-nums">
                  Tot: {(totWeekMinutes / 60).toFixed(1)}h
                </div>
              </div>

              {/* Griglia 6 giorni */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {weekDates.map((dateObj, dayIdx) => {
                  const cell = appData.weeks[weekKey]?.[w.id]?.[dayIdx];
                  const hours = countableDayHours(w.id, dayIdx, cell, weekKey, appData);
                  const statusColor = getStatusColor(cell?.status);
                  const isToday = localDateKey(dateObj) === todayStr;
                  const details = getCellDisplayDetails(cell, w.id, dayIdx, weekKey, appData);

                  return (
                    <div
                      key={dayIdx}
                      onClick={() => onOpenDayModal(w.id, dayIdx, dateObj)}
                      className={`p-2 rounded-2xl glass-card border border-white/10 text-center cursor-pointer hover:border-blue-400 transition-all ${
                        isToday ? 'ring-2 ring-blue-500/80 shadow-md shadow-blue-500/20' : ''
                      }`}
                      style={
                        statusColor && !details.isRest && details.isFullDayLeave
                          ? { borderColor: statusColor, color: statusColor }
                          : undefined
                      }
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-1">
                        <span>{daysNames[dayIdx]} {dateObj.getDate()}</span>
                        {hours > 0 && (
                          <span className="text-blue-700 dark:text-blue-400 font-extrabold">
                            {details.isPartialLeave && details.workedHours > 0
                              ? `${details.workedHours.toFixed(1).replace(/\.0$/, '')}h`
                              : `${hours.toFixed(1).replace(/\.0$/, '')}h`}
                          </span>
                        )}
                      </div>

                      {details.isRest ? (
                        <div className="space-y-1">
                          <div className="text-slate-400 dark:text-slate-600 font-bold text-xs">—</div>
                          {/* Eventi su riposo mobile */}
                          {(appData.events || []).filter(e => e.date === localDateKey(dateObj) && (e.participantIds?.includes(w.id) || !e.participantIds || e.participantIds.length === 0 || e.participantIds.length === appData.workers.length)).map(e => {
                            const isRiunione = e.type === 'Riunione' || (e.title || '').toLowerCase().includes('riunione');
                            return (
                              <div
                                key={e.id}
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  onOpenEventDetails(e.id);
                                }}
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate flex items-center justify-center gap-1 cursor-pointer transition-transform hover:scale-105 ${
                                  isRiunione
                                    ? 'text-blue-900 dark:text-blue-200 bg-blue-100 dark:bg-blue-600/30 border border-blue-300 dark:border-blue-500/40'
                                    : 'text-purple-900 dark:text-purple-300 bg-purple-100 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30'
                                }`}
                                title={`${e.title} – Clicca per vedere le specifiche`}
                              >
                                <span>{isRiunione ? '💼' : '📌'}</span>
                                <span className="truncate">{e.title}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : details.isFullDayLeave ? (
                        <div className="space-y-1">
                          <div
                            onClick={(ev) => {
                              if (details.leaveLabel?.toUpperCase().includes('ROL') || details.leaveLabel?.toUpperCase().includes('PERM') || cell?.status === 'ROL') {
                                ev.stopPropagation();
                                onOpenRolDetails({
                                  workerId: w.id,
                                  workerName: w.name,
                                  workerRole: w.role,
                                  workerGroup: w.group,
                                  date: dateObj,
                                  dayIdx,
                                  leaveLabel: details.leaveLabel || 'ROL',
                                  leaveHours: hours,
                                  totalCountableHours: hours,
                                  note: cell?.note,
                                  status: cell?.status,
                                  leaveRequestId: cell?.leaveRequestId,
                                  cell
                                });
                              }
                            }}
                            className={`text-[11px] font-black uppercase text-blue-700 dark:text-blue-400 ${
                              details.leaveLabel?.toUpperCase().includes('ROL') || details.leaveLabel?.toUpperCase().includes('PERM') || cell?.status === 'ROL'
                                ? 'cursor-pointer hover:underline'
                                : ''
                            }`}
                            title={details.leaveLabel?.toUpperCase().includes('ROL') || cell?.status === 'ROL' ? 'Clicca per vedere le specifiche del ROL' : undefined}
                          >
                            {details.leaveLabel}
                          </div>

                          {/* Eventi in coincidenza su giornata assenza mobile */}
                          {(appData.events || []).filter(e => e.date === localDateKey(dateObj) && (e.participantIds?.includes(w.id) || !e.participantIds || e.participantIds.length === 0 || e.participantIds.length === appData.workers.length)).map(e => {
                            const isRiunione = e.type === 'Riunione' || (e.title || '').toLowerCase().includes('riunione');
                            return (
                              <div
                                key={e.id}
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  onOpenEventDetails(e.id);
                                }}
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate flex items-center justify-center gap-1 cursor-pointer transition-transform hover:scale-105 ${
                                  isRiunione
                                    ? 'text-blue-900 dark:text-blue-200 bg-blue-100 dark:bg-blue-600/30 border border-blue-300 dark:border-blue-500/40'
                                    : 'text-purple-900 dark:text-purple-300 bg-purple-100 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30'
                                }`}
                                title={`${e.title} – Clicca per vedere le specifiche`}
                              >
                                <span>{isRiunione ? '💼' : '📌'}</span>
                                <span className="truncate">{e.title}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {details.workedTimes && (
                            <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                              {details.workedTimes}
                            </div>
                          )}
                          {details.isPartialLeave && (
                            <div
                              onClick={(ev) => {
                                ev.stopPropagation();
                                onOpenRolDetails({
                                  workerId: w.id,
                                  workerName: w.name,
                                  workerRole: w.role,
                                  workerGroup: w.group,
                                  date: dateObj,
                                  dayIdx,
                                  leaveLabel: details.leaveLabel || 'ROL',
                                  leaveHours: details.leaveHours,
                                  leaveTimeRange: details.leaveTimeRange,
                                  workedTimes: details.workedTimes,
                                  workedHours: details.workedHours,
                                  totalCountableHours: details.totalCountableHours,
                                  note: cell?.note,
                                  status: cell?.status,
                                  leaveRequestId: cell?.leaveRequestId,
                                  cell
                                });
                              }}
                              className="text-[9px] font-bold text-purple-900 dark:text-purple-300 bg-purple-100 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30 px-1 py-0.5 rounded truncate flex items-center justify-center gap-1 cursor-pointer hover:scale-105 transition-transform"
                              title="Clicca per vedere le specifiche ROL"
                            >
                              <span>🏖️</span>
                              <span className="truncate">{details.leaveLabel}</span>
                              {details.leaveTimeRange && (
                                <span className="text-[8px] font-mono opacity-90 truncate">({details.leaveTimeRange})</span>
                              )}
                            </div>
                          )}

                          {/* Note / ROL / Impegno manuale Mobile */}
                          {cell?.note && !details.isPartialLeave && (
                            <div
                              onClick={(ev) => {
                                const noteLower = (cell.note || '').toLowerCase();
                                const matched = (appData.events || []).find(e =>
                                  (e.date === localDateKey(dateObj) && e.title.toLowerCase().includes(noteLower)) ||
                                  (e.date === localDateKey(dateObj) && noteLower.includes(e.title.toLowerCase())) ||
                                  (noteLower.includes('riunione') && e.title.toLowerCase().includes('riunione')) ||
                                  (noteLower.includes('corso') && e.title.toLowerCase().includes('corso')) ||
                                  (noteLower.includes('trasferta') && e.title.toLowerCase().includes('trasferta'))
                                );
                                if (matched) {
                                  ev.stopPropagation();
                                  onOpenEventDetails(matched.id);
                                } else if (noteLower.includes('rol') || noteLower.includes('permesso') || noteLower.includes('perm')) {
                                  ev.stopPropagation();
                                  onOpenRolDetails({
                                    workerId: w.id,
                                    workerName: w.name,
                                    workerRole: w.role,
                                    workerGroup: w.group,
                                    date: dateObj,
                                    dayIdx,
                                    leaveLabel: 'ROL',
                                    leaveHours: details.leaveHours || 4,
                                    workedTimes: details.workedTimes,
                                    note: cell.note,
                                    status: cell.status,
                                    cell
                                  });
                                } else {
                                  ev.stopPropagation();
                                  onOpenEventDetails(cell.note || '', localDateKey(dateObj), w.id);
                                }
                              }}
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate flex items-center justify-center gap-1 cursor-pointer hover:scale-105 transition-all ${
                                cell.noteColor
                                  ? 'border shadow-2xs'
                                  : 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                              }`}
                              style={
                                cell.noteColor
                                  ? {
                                      backgroundColor: `${cell.noteColor}20`,
                                      borderColor: `${cell.noteColor}60`,
                                      color: cell.noteColor
                                    }
                                  : undefined
                              }
                              title={`${cell.note} – Clicca per vedere le specifiche`}
                            >
                              <span>📌</span>
                              <span className="truncate">{cell.note}</span>
                            </div>
                          )}

                          {/* Eventi del giorno Mobile */}
                          {(appData.events || []).filter(e => e.date === localDateKey(dateObj) && (e.participantIds?.includes(w.id) || !e.participantIds || e.participantIds.length === 0 || e.participantIds.length === appData.workers.length)).map(e => {
                            const isRiunione = e.type === 'Riunione' || (e.title || '').toLowerCase().includes('riunione');
                            return (
                              <div
                                key={e.id}
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  onOpenEventDetails(e.id);
                                }}
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate flex items-center justify-center gap-1 cursor-pointer transition-transform hover:scale-105 ${
                                  isRiunione
                                    ? 'text-blue-900 dark:text-blue-200 bg-blue-100 dark:bg-blue-600/30 border border-blue-300 dark:border-blue-500/40'
                                    : 'text-purple-900 dark:text-purple-300 bg-purple-100 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30'
                                }`}
                                title={`${e.title} – Clicca per vedere le specifiche`}
                              >
                                <span>{isRiunione ? '💼' : '📌'}</span>
                                <span className="truncate">{e.title}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Area Note Settimanali */}
      <div className="p-4 sm:p-5 rounded-3xl glass-panel shadow-xl space-y-2.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {appData.notesTitle || "Note / Comunicazioni Filiale:"}
        </label>
        <textarea
          rows={3}
          value={appData.notes[weekKey] || ''}
          onChange={(e) => onUpdateNotes(e.target.value)}
          placeholder="Inserisci qui informazioni utili per la settimana, corsi, direttive, orari speciali..."
          className="w-full p-3.5 rounded-2xl glass-input text-xs placeholder-slate-400 focus:outline-none leading-relaxed resize-y font-medium"
        />
      </div>
    </div>
  );
};
