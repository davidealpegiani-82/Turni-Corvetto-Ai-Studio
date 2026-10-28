import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  Share2,
  Download,
  Trash2,
  Edit3,
  Check,
  FileText,
  Palmtree,
  Briefcase,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Printer,
  Sparkles
} from 'lucide-react';
import { AppData, BranchEvent, DayShift, LeaveRequest } from '../types/turni';
import { formatEventWhatsAppText, downloadICS, buildCalendarICS } from '../services/ics';
import { localDateKey, shiftMinutes, getWorkerNastroForDate, getWeekKey } from '../services/engine';

export interface RolModalData {
  workerId: string;
  workerName: string;
  workerRole?: string;
  workerGroup?: string;
  date: Date;
  dayIdx: number;
  leaveLabel: string;
  leaveHours?: number;
  leaveTimeRange?: string;
  workedTimes?: string;
  workedHours?: number;
  totalCountableHours?: number;
  note?: string;
  status?: string;
  leaveRequestId?: string;
  cell?: DayShift;
}

interface SpecificheImpegnoModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Modalità Evento / Impegno
  event?: BranchEvent | null;
  // Modalità ROL / Permesso
  rolData?: RolModalData | null;
  appData: AppData;
  onSaveEvent: (event: Partial<BranchEvent>) => void;
  onDeleteEvent: (id: string) => void;
  onEditShiftDay?: (workerId: string, dayIdx: number, dateObj: Date) => void;
  onOpenLeaveFacsimile?: (req: LeaveRequest, workerName: string) => void;
  onExportFacsimilePDF?: (reqId: string) => void;
  onClearDayRol?: (workerId: string, dayIdx: number) => void;
}

export const SpecificheImpegnoModal: React.FC<SpecificheImpegnoModalProps> = ({
  isOpen,
  onClose,
  event,
  rolData,
  appData,
  onSaveEvent,
  onDeleteEvent,
  onEditShiftDay,
  onOpenLeaveFacsimile,
  onExportFacsimilePDF,
  onClearDayRol
}) => {
  if (!isOpen) return null;

  const isRol = !!rolData;
  const isEvent = !!event && !isRol;

  const [activeTab, setActiveTab] = useState<'view' | 'edit'>('view');

  // Form state per modifica evento
  const [type, setType] = useState(event?.type || 'Riunione');
  const [title, setTitle] = useState(event?.title || '');
  const [date, setDate] = useState(event?.date || localDateKey(new Date()));
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const [fromTime, setFromTime] = useState(event?.fromTime || (event as any)?.from || '18:00');
  const [toTime, setToTime] = useState(event?.toTime || (event as any)?.to || '19:30');
  const [location, setLocation] = useState(event?.location || 'Filiale Corvetto');
  const [participantIds, setParticipantIds] = useState<string[]>(event?.participantIds || []);
  const [notes, setNotes] = useState(event?.notes || '');
  const [reminderMinutes, setReminderMinutes] = useState(event?.reminderMinutes ?? 60);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (event) {
      setType(event.type || 'Riunione');
      setTitle(event.title || '');
      setDate(event.date || localDateKey(new Date()));
      setAllDay(event.allDay ?? false);
      setFromTime(event.fromTime || (event as any).from || '18:00');
      setToTime(event.toTime || (event as any).to || '19:30');
      setLocation(event.location || 'Filiale Corvetto');
      setParticipantIds(event.participantIds || []);
      setNotes(event.notes || '');
      setReminderMinutes(event.reminderMinutes ?? 60);
      setActiveTab('view');
      setErrorMsg(null);
    }
  }, [event]);

  // Formatta data estesa italiana
  const formatItalianDate = (dateStrOrObj: string | Date): string => {
    try {
      const d = typeof dateStrOrObj === 'string' ? new Date(`${dateStrOrObj}T00:00:00`) : dateStrOrObj;
      return d.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return String(dateStrOrObj);
    }
  };

  // Calcola durata in ore/minuti
  const calculateDuration = (from: string, to: string): string => {
    if (!from || !to) return '';
    const [h1, m1] = from.split(':').map(Number);
    const [h2, m2] = to.split(':').map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  // WhatsApp share
  const handleShareWhatsApp = () => {
    if (!event) return;
    const workerNamesMap: Record<string, string> = {};
    appData.workers.forEach(w => { workerNamesMap[w.id] = w.name; });
    const text = formatEventWhatsAppText(event, workerNamesMap);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Download ICS
  const handleDownloadICS = () => {
    if (!event) return;
    const ics = buildCalendarICS([event], event.title);
    downloadICS(`impegno_${event.date}_${event.title.replace(/\s+/g, '_')}.ics`, ics);
  };

  // Salva Modifiche Evento
  const handleSaveEventChanges = () => {
    if (!title.trim() || !date) {
      setErrorMsg('Inserisci il titolo e la data prima di salvare.');
      return;
    }
    if (!participantIds.length) {
      setErrorMsg('Seleziona almeno un partecipante.');
      return;
    }
    setErrorMsg(null);

    onSaveEvent({
      id: event?.id,
      type,
      title: title.trim(),
      date,
      allDay,
      fromTime: allDay ? undefined : fromTime,
      toTime: allDay ? undefined : toTime,
      location: location.trim(),
      participantIds,
      notes: notes.trim(),
      reminderMinutes
    });
    setActiveTab('view');
  };

  const toggleParticipant = (id: string) => {
    setParticipantIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (participantIds.length === appData.workers.length) {
      setParticipantIds([]);
    } else {
      setParticipantIds(appData.workers.map(w => w.id));
    }
  };

  // Badge stile per tipo impegno
  const getBadgeStyle = (eventType: string) => {
    const t = (eventType || '').toLowerCase();
    if (t.includes('riunione')) {
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700',
        icon: '💼',
        label: 'Riunione Aziendale'
      };
    }
    if (t.includes('corso')) {
      return {
        bg: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700',
        icon: '🎓',
        label: 'Corso di Formazione'
      };
    }
    if (t.includes('trasferta')) {
      return {
        bg: 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700',
        icon: '🚚',
        label: 'Trasferta Operativa'
      };
    }
    if (t.includes('visita')) {
      return {
        bg: 'bg-red-100 dark:bg-red-900/60 text-red-900 dark:text-red-200 border-red-300 dark:border-red-700',
        icon: '🩺',
        label: 'Visita Medica / Sopralluogo'
      };
    }
    if (t.includes('appunt')) {
      return {
        bg: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
        icon: '📅',
        label: 'Appuntamento Commerciale'
      };
    }
    return {
      bg: 'bg-purple-100 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-700',
      icon: '📌',
      label: eventType || 'Impegno di Filiale'
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-2xl p-5 sm:p-6 text-slate-900 dark:text-white max-h-[92vh] overflow-y-auto my-auto space-y-4">
        
        {/* ======================================================== */}
        {/* HEADER MODALE */}
        {/* ======================================================== */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 text-lg">
              {isRol ? '🏖️' : getBadgeStyle(event?.type || '').icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {isRol ? 'Specifiche ROL / Permesso' : 'Specifiche dell\'Impegno'}
                </h3>
                {isEvent && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadgeStyle(event?.type || '').bg}`}>
                    {event?.type}
                  </span>
                )}
                {isRol && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-purple-100 dark:bg-purple-900/60 text-purple-900 dark:text-purple-300 border-purple-300 dark:border-purple-700">
                    ROL Retribuito
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {isRol
                  ? 'Dettagli fruizione oraria e coordinamento con il turno lavorativo'
                  : 'Dettagli completi, partecipanti, convocazione e orari'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ======================================================== */}
        {/* MODALITÀ EVENTO / RIUNIONE COMMERCIALE */}
        {/* ======================================================== */}
        {isEvent && event && (
          <div className="space-y-4">
            {/* Toggle tra Visualizzazione Specifiche e Modifica */}
            <div className="flex items-center justify-between p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() => setActiveTab('view')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'view'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>🔍 Specifiche & Dettagli</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'edit'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Modifica Specifiche</span>
              </button>
            </div>

            {/* VISTA 1: SPECIFICHE DETTAGLIATE */}
            {activeTab === 'view' && (
              <div className="space-y-4">
                {/* Scheda Principale Hero */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/70 dark:from-slate-800/90 dark:to-indigo-950/40 border border-blue-200 dark:border-slate-700 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span>{getBadgeStyle(event.type).icon}</span>
                        <span>{getBadgeStyle(event.type).label}</span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                        {event.title}
                      </h2>
                    </div>
                  </div>

                  {/* Griglia Data, Orario, Sede */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-blue-200/60 dark:border-slate-700/60">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="capitalize">{formatItalianDate(event.date)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>
                        {event.allDay
                          ? 'Tutto il giorno (Giornata Intera)'
                          : `${event.fromTime || (event as any).from || ''} – ${event.toTime || (event as any).to || ''}`}
                        {!event.allDay && event.fromTime && event.toTime && (
                          <span className="ml-1 text-[11px] text-blue-700 dark:text-blue-300 font-extrabold">
                            ({calculateDuration(event.fromTime, event.toTime)})
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 sm:col-span-2">
                      <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>{event.location || 'Filiale Corvetto (Sede Principale)'}</span>
                    </div>
                  </div>
                </div>

                {/* Barra Azioni Rapide (WhatsApp, Calendario, Elimina) */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleShareWhatsApp}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm transition"
                      title="Invia convocazione / dettagli su WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Invia su WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadICS}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-sm transition"
                      title="Scarica evento per Google Calendar, Apple o Outlook"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Aggiungi al Calendario (.ics)</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Sei sicuro di voler eliminare l'impegno "${event.title}"?`)) {
                        onDeleteEvent(event.id);
                        onClose();
                      }
                    }}
                    className="p-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition"
                    title="Elimina impegno"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Partecipanti Convocati con dettaglio Turno */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Collaboratori Convocati ({event.participantIds?.length || 0})</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(event.participantIds || []).map(pId => {
                      const worker = appData.workers.find(w => w.id === pId);
                      if (!worker) return null;

                      // Calcola orario del turno di quel giorno per il lavoratore
                      const eventDate = new Date(`${event.date}T00:00:00`);
                      const weekKey = getWeekKey(eventDate);
                      const dayIdx = (eventDate.getDay() + 6) % 7; // Lun = 0
                      const cell = appData.weeks?.[weekKey]?.[worker.id]?.[dayIdx];
                      const hasShift = cell && (cell.mIn || cell.pIn);
                      const shiftStr = hasShift
                        ? [cell.mIn && cell.mOut ? `${cell.mIn}-${cell.mOut}` : '', cell.pIn && cell.pOut ? `${cell.pIn}-${cell.pOut}` : ''].filter(Boolean).join(' / ')
                        : 'Nessun turno inserito';

                      // Controlla se l'impegno è serale dopo il turno
                      const isAfterShift = !event.allDay && event.fromTime && event.fromTime >= '17:30';

                      return (
                        <div
                          key={pId}
                          className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                              {worker.name}
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {worker.group}
                            </span>
                          </div>
                          {worker.role && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                              {worker.role}
                            </div>
                          )}
                          <div className="pt-1 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                            <span className="text-slate-600 dark:text-slate-400">Turno data:</span>
                            <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
                              {shiftStr}
                            </span>
                          </div>
                          {isAfterShift && (
                            <div className="text-[9px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <span>🌙</span>
                              <span>Riunione serale post-turno</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Note Operative / Convocazione */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Note & Ordine del Giorno
                  </label>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    {event.notes ? (
                      event.notes
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 italic">
                        Nessuna nota operativa aggiuntiva inserita per questo impegno.
                      </span>
                    )}
                  </div>
                </div>

                {/* Promemoria Notifiche */}
                <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 flex items-center justify-between text-xs text-blue-950 dark:text-blue-300 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔔</span>
                    <span>
                      Notifica promemoria: <strong>{event.reminderMinutes ? `${event.reminderMinutes} minuti prima` : 'Nessuna'}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    Sincronizzato Live
                  </span>
                </div>
              </div>
            )}

            {/* VISTA 2: FORM MODIFICA SPECIFICHE */}
            {activeTab === 'edit' && (
              <div className="space-y-3.5">
                {errorMsg && (
                  <div className="p-3 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Tipo & Titolo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Tipo</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white mt-1 focus:outline-none"
                    >
                      <option value="Riunione">Riunione Commerciale / Aziendale</option>
                      <option value="Corso">Corso Formazione</option>
                      <option value="Trasferta">Trasferta Operativa</option>
                      <option value="Visita medica">Visita medica</option>
                      <option value="Appuntamento">Appuntamento</option>
                      <option value="Altro">Altro</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Titolo Impegno</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Es. Riunione Commerciale, Corso Scrigno..."
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white mt-1"
                    />
                  </div>
                </div>

                {/* Data e Orario */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Data</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white mt-1"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allDay}
                          onChange={(e) => setAllDay(e.target.checked)}
                          className="rounded border-slate-400 dark:border-slate-600 text-blue-600"
                        />
                        <span>Tutto il giorno (Intera giornata)</span>
                      </label>
                    </div>
                  </div>

                  {!allDay && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Dalle ore</label>
                        <input
                          type="time"
                          value={fromTime}
                          onChange={(e) => setFromTime(e.target.value)}
                          className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Alle ore</label>
                        <input
                          type="time"
                          value={toTime}
                          onChange={(e) => setToTime(e.target.value)}
                          className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Luogo e Promemoria */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Luogo / Sede</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Es. Filiale Corvetto, Sede Agrate..."
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Promemoria Notifica</label>
                    <select
                      value={reminderMinutes}
                      onChange={(e) => setReminderMinutes(Number(e.target.value))}
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white mt-1"
                    >
                      <option value="0">Nessun promemoria</option>
                      <option value="15">15 minuti prima</option>
                      <option value="60">1 ora prima</option>
                      <option value="120">2 ore prima</option>
                      <option value="1440">1 giorno prima</option>
                    </select>
                  </div>
                </div>

                {/* Partecipanti */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Partecipanti ({participantIds.length})
                    </label>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold"
                    >
                      {participantIds.length === appData.workers.length ? 'Deseleziona tutti' : 'Seleziona tutti'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700">
                    {appData.workers.map(w => (
                      <label
                        key={w.id}
                        className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer transition flex items-center gap-2 ${
                          participantIds.includes(w.id)
                            ? 'bg-blue-100 dark:bg-blue-600/20 border-blue-400 dark:border-blue-500 text-blue-900 dark:text-blue-300'
                            : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={participantIds.includes(w.id)}
                          onChange={() => toggleParticipant(w.id)}
                          className="rounded border-slate-400 dark:border-slate-600 text-blue-600"
                        />
                        <span className="truncate">{w.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Note */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Note / Indicazioni Operative</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ordine del giorno, argomenti, materiali..."
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                {/* Pulsanti Azione Modifica */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveTab('view')}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold"
                  >
                    Annulla
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveEventChanges}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>Salva Specifiche Impegno</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* MODALITÀ ROL (RIDUZIONE ORARIO DI LAVORO / PERMESSO) */}
        {/* ======================================================== */}
        {isRol && rolData && (
          <div className="space-y-4">
            {/* Card Principale ROL */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50/70 dark:from-slate-800/90 dark:to-purple-950/40 border border-purple-200 dark:border-purple-800/50 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-extrabold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🏖️</span>
                    <span>Riduzione Orario di Lavoro / Permesso Retribuito</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                    {rolData.workerName}
                  </h2>
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
                    {rolData.workerRole || 'Collaboratore Filiale'} • Reparto {rolData.workerGroup || 'Filiale'}
                  </div>
                </div>

                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  Approvata
                </span>
              </div>

              {/* Data del permesso */}
              <div className="flex items-center gap-2 pt-2 border-t border-purple-200/60 dark:border-slate-700/60 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span className="capitalize">{formatItalianDate(rolData.date)}</span>
              </div>
            </div>

            {/* Quadro Orario e Ripartizione Ore */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-center space-y-1">
                <div className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300">
                  Ore ROL / Permesso
                </div>
                <div className="text-lg font-black text-purple-900 dark:text-purple-200">
                  {rolData.leaveHours ? `${rolData.leaveHours}h` : '—'}
                </div>
                {rolData.leaveTimeRange && (
                  <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 font-bold">
                    ({rolData.leaveTimeRange})
                  </div>
                )}
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-center space-y-1">
                <div className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300">
                  Ore Lavoro Effettive
                </div>
                <div className="text-lg font-black text-blue-900 dark:text-blue-200">
                  {rolData.workedHours !== undefined ? `${rolData.workedHours.toFixed(1).replace(/\.0$/, '')}h` : '—'}
                </div>
                {rolData.workedTimes && (
                  <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 font-bold">
                    {rolData.workedTimes}
                  </div>
                )}
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-center space-y-1">
                <div className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">
                  Totale Monte Giornata
                </div>
                <div className="text-lg font-black text-emerald-900 dark:text-emerald-200">
                  {rolData.totalCountableHours ? `${rolData.totalCountableHours}h` : '8.0h'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  100% Nastro Coperto
                </div>
              </div>
            </div>

            {/* Note / Motivazione */}
            {rolData.note && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                  Motivazione / Note Richiesta
                </label>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-medium">
                  {rolData.note}
                </div>
              </div>
            )}

            {/* Azioni ROL */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Azioni Ufficiali Documento & Turni:
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const req: LeaveRequest = {
                      id: rolData.leaveRequestId || `rol_${Date.now()}`,
                      workerId: rolData.workerId,
                      tipo: 'Permesso retribuito',
                      mode: 'single',
                      day: localDateKey(rolData.date),
                      fullDay: false,
                      fromTime: rolData.leaveTimeRange?.split('-')?.[0] || '14:00',
                      toTime: rolData.leaveTimeRange?.split('-')?.[1] || '17:30',
                      hours: rolData.leaveHours || 3.5,
                      note: rolData.note || 'ROL',
                      status: 'approvata',
                      place: 'Milano',
                      requestDate: localDateKey(new Date()),
                      createdAt: new Date().toISOString()
                    };
                    if (onOpenLeaveFacsimile) {
                      onOpenLeaveFacsimile(req, rolData.workerName);
                      onClose();
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Visualizza Modulo Ufficiale (Facsimile)</span>
                </button>

                {onEditShiftDay && (
                  <button
                    type="button"
                    onClick={() => {
                      onEditShiftDay(rolData.workerId, rolData.dayIdx, rolData.date);
                      onClose();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Modifica Orari ROL / Turno</span>
                  </button>
                )}

                {onClearDayRol && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Rimuovere il ROL per ${rolData.workerName} in data ${formatItalianDate(rolData.date)}?`)) {
                        onClearDayRol(rolData.workerId, rolData.dayIdx);
                        onClose();
                      }
                    }}
                    className="px-3 py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 text-xs font-bold transition ml-auto"
                  >
                    Rimuovi ROL
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer Chiusura */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
};
