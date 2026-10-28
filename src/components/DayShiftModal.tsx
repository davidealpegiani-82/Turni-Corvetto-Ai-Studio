import React, { useState, useEffect } from 'react';
import { X, Copy, Trash2, Check, Clock, Briefcase, CalendarOff, Palmtree, AlertCircle } from 'lucide-react';
import { AppData, DayShift } from '../types/turni';
import { getWeekKey, getWorkerNastroForDate, shiftMinutes, localDateKey } from '../services/engine';

interface DayShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerId: string | null;
  dayIdx: number | null;
  dateObj: Date | null;
  appData: AppData;
  onSaveDay: (workerId: string, dayIdx: number, data: DayShift) => void;
  onClearDay: (workerId: string, dayIdx: number) => void;
  onCopyPreviousDay: (workerId: string, dayIdx: number) => void;
  onOpenEventDetails?: (eventId: string) => void;
  onOpenRolDetails?: (rolData: any) => void;
}

type ModalMode = 'work' | 'partial_leave' | 'absence';

export const DayShiftModal: React.FC<DayShiftModalProps> = ({
  isOpen,
  onClose,
  workerId,
  dayIdx,
  dateObj,
  appData,
  onSaveDay,
  onClearDay,
  onCopyPreviousDay,
  onOpenEventDetails,
  onOpenRolDetails
}) => {
  if (!isOpen || !workerId || dayIdx === null || !dateObj) return null;

  const daysNames = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
  const worker = appData.workers.find(w => w.id === workerId);
  const weekKey = getWeekKey(dateObj);
  const nastroHours = getWorkerNastroForDate(workerId, dateObj, appData);

  const currentData = appData.weeks[weekKey]?.[workerId]?.[dayIdx] || {};

  // Determina modalità iniziale in base ai dati della cella
  const getInitialMode = (data: DayShift): ModalMode => {
    const st = String(data.status || '').toUpperCase();
    const hasWorked = !!((data.mIn && data.mOut) || (data.pIn && data.pOut));
    const isAbsenceStatus = st && st !== 'LAVORO' && st !== 'RIPOSO';

    if (data.leaveFullDay === false || (data.leaveFromTime && data.leaveToTime) || (isAbsenceStatus && hasWorked)) {
      return 'partial_leave';
    }
    if (isAbsenceStatus || st === 'RIPOSO' || st === 'CHIUSO') {
      return 'absence';
    }
    return 'work';
  };

  const [mode, setMode] = useState<ModalMode>(() => getInitialMode(currentData));
  const [mIn, setMIn] = useState(currentData.mIn || '');
  const [mOut, setMOut] = useState(currentData.mOut || '');
  const [pIn, setPIn] = useState(currentData.pIn || '');
  const [pOut, setPOut] = useState(currentData.pOut || '');
  const [status, setStatus] = useState(currentData.status || 'LAVORO');
  const [note, setNote] = useState(currentData.note || '');

  // Campi Permesso Parziale
  const [leaveType, setLeaveType] = useState(currentData.leaveType || 'ROL');
  const [leaveFromTime, setLeaveFromTime] = useState(currentData.leaveFromTime || '');
  const [leaveToTime, setLeaveToTime] = useState(currentData.leaveToTime || '');
  const [leaveHours, setLeaveHours] = useState<number>(currentData.leaveHours || 0);

  useEffect(() => {
    const initialMode = getInitialMode(currentData);
    setMode(initialMode);
    setMIn(currentData.mIn || '');
    setMOut(currentData.mOut || '');
    setPIn(currentData.pIn || '');
    setPOut(currentData.pOut || '');
    setStatus(currentData.status || 'LAVORO');
    setNote(currentData.note || '');

    const lt = currentData.leaveType || (['ROL', 'PERMESSO'].includes(currentData.status || '') ? currentData.status : 'ROL');
    setLeaveType(lt || 'ROL');
    setLeaveFromTime(currentData.leaveFromTime || '');
    setLeaveToTime(currentData.leaveToTime || '');
    setLeaveHours(currentData.leaveHours || 0);
  }, [workerId, dayIdx, currentData]);

  // Clic su preset orario rapido: imposta SEMPRE modalità Lavoro ed elimina causali/permessi indesiderati!
  const handleSetPreset = (p: { mIn: string; mOut: string; pIn: string; pOut: string }) => {
    setMode('work');
    setStatus('LAVORO');
    setMIn(p.mIn);
    setMOut(p.mOut);
    setPIn(p.pIn);
    setPOut(p.pOut);
    setLeaveFromTime('');
    setLeaveToTime('');
    setLeaveHours(0);
  };

  // Imposta assenza intera giornata
  const handleSelectAbsenceStatus = (statusName: string) => {
    setMode('absence');
    setStatus(statusName);
    setLeaveType(statusName);
    setMIn('');
    setMOut('');
    setPIn('');
    setPOut('');
    setLeaveFromTime('');
    setLeaveToTime('');
    setLeaveHours(nastroHours);
  };

  // Preimpostazione permesso parziale: lavora la mattina
  const handleSetPartialMorningWorked = () => {
    setMode('partial_leave');
    setStatus('LAVORO');
    setLeaveType('ROL');
    setMIn('08:30');
    setMOut('13:00');
    setPIn('');
    setPOut('');
    setLeaveFromTime('14:00');
    setLeaveToTime('17:30');
    setLeaveHours(3.5);
  };

  // Preimpostazione permesso parziale: lavora il pomeriggio
  const handleSetPartialAfternoonWorked = () => {
    setMode('partial_leave');
    setStatus('LAVORO');
    setLeaveType('ROL');
    setMIn('');
    setMOut('');
    setPIn('14:00');
    setPOut('17:30');
    setLeaveFromTime('08:30');
    setLeaveToTime('13:00');
    setLeaveHours(4.5);
  };

  // Preimpostazione permesso parziale: turno apertura 7h sabatista (es. lavora 06:30-12:00 + permesso 13:00-14:30)
  const handleSetPartialOpeningWorked = () => {
    setMode('partial_leave');
    setStatus('LAVORO');
    setLeaveType('ROL');
    setMIn('06:30');
    setMOut('12:00');
    setPIn('');
    setPOut('');
    setLeaveFromTime('13:00');
    setLeaveToTime('14:30');
    setLeaveHours(1.5);
  };

  const handleAppendNote = (text: string) => {
    if (!note.trim()) setNote(text);
    else setNote(`${note} - ${text}`);
  };

  // Calcolo ore lavorate e ore assenza
  const workedMins = shiftMinutes({ mIn, mOut, pIn, pOut });
  const workedHours = workedMins / 60;

  const handleSave = () => {
    const cleanedShift: DayShift = {
      note: note.trim() || undefined,
      generated: false,
      movedByEngine: false
    };

    if (mode === 'absence') {
      // 1. ASSENZA INTERA GIORNATA (Ferie, Malattia, Riposo, Chiuso...)
      cleanedShift.status = status;
      cleanedShift.mIn = '';
      cleanedShift.mOut = '';
      cleanedShift.pIn = '';
      cleanedShift.pOut = '';
      if (status !== 'RIPOSO' && status !== 'CHIUSO') {
        cleanedShift.leaveType = leaveType || status;
        cleanedShift.leaveFullDay = true;
        cleanedShift.leaveHours = nastroHours;
      }
    } else if (mode === 'partial_leave') {
      // 2. PERMESSO PARZIALE (Lavoro Effettivo + Permesso ad ore)
      cleanedShift.mIn = mIn;
      cleanedShift.mOut = mOut;
      cleanedShift.pIn = pIn;
      cleanedShift.pOut = pOut;
      cleanedShift.status = 'LAVORO';
      cleanedShift.leaveType = leaveType || 'ROL';
      cleanedShift.leaveFullDay = false;
      cleanedShift.leaveFromTime = leaveFromTime || undefined;
      cleanedShift.leaveToTime = leaveToTime || undefined;
      const calcLeaveH = leaveHours > 0 ? leaveHours : Math.max(0, nastroHours - workedHours);
      cleanedShift.leaveHours = calcLeaveH;
    } else {
      // 3. TURNO DI LAVORO ORDINARIO (Nessun permesso inserito!)
      cleanedShift.mIn = mIn;
      cleanedShift.mOut = mOut;
      cleanedShift.pIn = pIn;
      cleanedShift.pOut = pOut;
      cleanedShift.status = 'LAVORO';
      // PULIZIA ASSOLUTA: nessun campo permesso viene conservato o iniettato!
      cleanedShift.leaveType = undefined;
      cleanedShift.leaveFullDay = undefined;
      cleanedShift.leaveFromTime = undefined;
      cleanedShift.leaveToTime = undefined;
      cleanedShift.leaveHours = undefined;
      cleanedShift.leaveRequestId = undefined;
    }

    onSaveDay(workerId, dayIdx, cleanedShift);
    onClose();
  };

  const handleClear = () => {
    onClearDay(workerId, dayIdx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-5 text-white max-h-[92vh] overflow-y-auto my-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">
              {worker?.name} — {daysNames[dayIdx]} {dateObj.getDate()}
            </h3>
            <span className="text-xs text-slate-400">Modifica turno e causale presenza</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner Eventi / Impegni del Giorno per questo collaboratore */}
        {(() => {
          const dayStr = dateObj ? localDateKey(dateObj) : '';
          const dayEvents = (appData.events || []).filter(
            e => e.date === dayStr && (e.participantIds?.includes(workerId) || !e.participantIds || e.participantIds.length === 0 || e.participantIds.length === appData.workers.length)
          );
          if (dayEvents.length === 0) return null;
          return (
            <div className="space-y-1.5">
              {dayEvents.map(e => (
                <div
                  key={e.id}
                  onClick={() => {
                    onClose();
                    if (onOpenEventDetails) onOpenEventDetails(e.id);
                  }}
                  className="p-3 rounded-2xl bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border border-blue-500/50 text-blue-200 text-xs flex items-center justify-between cursor-pointer hover:border-blue-400 hover:scale-[1.01] transition shadow-md"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{e.type === 'Riunione' || (e.title || '').toLowerCase().includes('riunione') ? '💼' : '📌'}</span>
                    <div>
                      <strong className="block text-white font-extrabold">{e.title}</strong>
                      <span className="text-[11px] text-blue-300">
                        {e.allDay ? 'Tutto il giorno' : `${e.fromTime || (e as any).from || ''} – ${e.toTime || (e as any).to || ''}`}
                        {e.location ? ` • ${e.location}` : ''}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-blue-300 underline shrink-0 bg-blue-600/30 px-2 py-1 rounded-lg border border-blue-400/40">
                    Specifiche Impegno →
                  </span>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Banner ROL del Giorno per questo collaboratore */}
        {(() => {
          const isCurrentRol =
            (leaveType || '').toUpperCase().includes('ROL') ||
            (leaveType || '').toUpperCase().includes('PERM') ||
            status?.toUpperCase().includes('ROL') ||
            status?.toUpperCase().includes('PERM') ||
            (note || '').toUpperCase().includes('ROL') ||
            currentData.leaveType?.toUpperCase().includes('ROL') ||
            currentData.status?.toUpperCase().includes('ROL') ||
            mode === 'partial_leave';

          if (!isCurrentRol || !onOpenRolDetails) return null;

          const rHours = leaveHours || currentData.leaveHours || 4;
          const rRange = (leaveFromTime && leaveToTime)
            ? `${leaveFromTime}-${leaveToTime}`
            : (currentData.leaveFromTime && currentData.leaveToTime ? `${currentData.leaveFromTime}-${currentData.leaveToTime}` : '');

          return (
            <div
              onClick={() => {
                onClose();
                onOpenRolDetails({
                  workerId,
                  workerName: worker?.name || workerId,
                  workerRole: worker?.role,
                  workerGroup: worker?.group,
                  date: dateObj,
                  dayIdx,
                  leaveLabel: leaveType || 'ROL',
                  leaveHours: rHours,
                  leaveTimeRange: rRange,
                  workedHours,
                  totalCountableHours: nastroHours,
                  note: note || currentData.note,
                  status,
                  leaveRequestId: currentData.leaveRequestId,
                  cell: currentData
                });
              }}
              className="p-3 rounded-2xl bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-500/50 text-purple-200 text-xs flex items-center justify-between cursor-pointer hover:border-purple-400 hover:scale-[1.01] transition shadow-md"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🏖️</span>
                <div>
                  <strong className="block text-white font-extrabold">Specifiche ROL / Permesso</strong>
                  <span className="text-[11px] text-purple-300">
                    {rHours}h ROL {rRange ? `(${rRange})` : ''} • Lavoro: {workedHours}h
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-black text-purple-200 underline shrink-0 bg-purple-600/30 px-2 py-1 rounded-lg border border-purple-400/40">
                Visualizza Specifiche ROL →
              </span>
            </div>
          );
        })()}

        {/* Copia dal giorno precedente */}
        {dayIdx > 0 && (
          <button
            type="button"
            onClick={() => onCopyPreviousDay(workerId, dayIdx)}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <Copy className="w-3.5 h-3.5 text-blue-400" />
            <span>Copia orario dal giorno precedente ({daysNames[dayIdx - 1]})</span>
          </button>
        )}

        {/* Selettore Modalità Principale (3 Tab Chiare) */}
        <div className="p-1 rounded-2xl bg-slate-800/80 border border-slate-700/80 grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => {
              setMode('work');
              setStatus('LAVORO');
              setLeaveFromTime('');
              setLeaveToTime('');
              setLeaveHours(0);
            }}
            className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
              mode === 'work'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Solo Lavoro</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('partial_leave');
              setStatus('LAVORO');
              if (!leaveType) setLeaveType('ROL');
            }}
            className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
              mode === 'partial_leave'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Palmtree className="w-4 h-4" />
            <span>Permesso a Ore</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('absence');
              if (status === 'LAVORO') setStatus('FERIE');
            }}
            className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
              mode === 'absence'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <CalendarOff className="w-4 h-4" />
            <span>Intera Giornata</span>
          </button>
        </div>

        {/* ===================== MODALITÀ 1: SOLO LAVORO EFFETTIVO ===================== */}
        {mode === 'work' && (
          <div className="space-y-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <span className="text-base">✅</span>
              <div>
                <strong>Turno di Lavoro Ordinario</strong>
                <p className="text-[11px] text-emerald-200/80">
                  Nessun permesso o causale verrà inserito. Vengono registrati unicamente gli orari effettivi lavorati.
                </p>
              </div>
            </div>

            {/* Orari Rapidi Presenza */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Orari Rapidi Presenza
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {appData.presets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSetPreset(p)}
                    className="p-2 rounded-xl bg-slate-800 border border-slate-700 hover:border-blue-500 text-left text-xs font-medium text-slate-200 transition"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Campi Orario Mattina / Pomeriggio */}
            <div className="space-y-2 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80">
              <div className="flex items-center justify-between pb-1 text-xs text-slate-300 font-semibold">
                <span>Orari Lavoro Effettivo</span>
                {workedHours > 0 && (
                  <span className="text-blue-400 font-bold">Totale: {workedHours.toFixed(1).replace(/\.0$/, '')}h lavorate</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Mattina Inizio</label>
                  <input
                    type="time"
                    value={mIn}
                    onChange={(e) => setMIn(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-blue-500 mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Mattina Fine</label>
                  <input
                    type="time"
                    value={mOut}
                    onChange={(e) => setMOut(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-blue-500 mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Pomeriggio Inizio</label>
                  <input
                    type="time"
                    value={pIn}
                    onChange={(e) => setPIn(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-blue-500 mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Pomeriggio Fine</label>
                  <input
                    type="time"
                    value={pOut}
                    onChange={(e) => setPOut(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-blue-500 mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== MODALITÀ 2: PERMESSO PARZIALE ===================== */}
        {mode === 'partial_leave' && (
          <div className="space-y-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-200 text-xs flex items-center gap-2">
              <span className="text-base">🏖️</span>
              <div>
                <strong>Lavoro Effettivo + Permesso Parziale</strong>
                <p className="text-[11px] text-purple-300/80">
                  Mostrerà gli orari effettivamente lavorati in alto e il riferimento del permesso (ROL/Visita) sotto.
                </p>
              </div>
            </div>

            {/* Preimpostazioni Rapide Permesso Parziale */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                ⚡ Scorciatoie Permesso Parziale
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={handleSetPartialMorningWorked}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left text-[11px] text-slate-200 transition"
                >
                  🏖️ <strong>Lavora Mattina</strong> (08:30-13:00) + ROL Pom. (14:00-17:30)
                </button>
                <button
                  type="button"
                  onClick={handleSetPartialAfternoonWorked}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left text-[11px] text-slate-200 transition"
                >
                  🏖️ <strong>Lavora Pomeriggio</strong> (14:00-17:30) + ROL Mat. (08:30-13:00)
                </button>
                <button
                  type="button"
                  onClick={handleSetPartialOpeningWorked}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left text-[11px] text-slate-200 transition sm:col-span-2"
                >
                  🏖️ <strong>Lavora Apertura</strong> (06:30-12:00) + ROL (13:00-14:30) [Sabatista 7h]
                </button>
              </div>
            </div>

            {/* Dettagli Permesso */}
            <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-800/40 space-y-2">
              <div className="text-xs font-bold text-purple-200 uppercase">Dettagli Permesso / Causale</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-300 uppercase">Tipo Permesso</label>
                  <input
                    type="text"
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    placeholder="ROL, Permesso retribuito..."
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-300 uppercase">Orario Assenza (dalle-alle)</label>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="time"
                      value={leaveFromTime}
                      onChange={(e) => setLeaveFromTime(e.target.value)}
                      className="w-1/2 p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="time"
                      value={leaveToTime}
                      onChange={(e) => setLeaveToTime(e.target.value)}
                      className="w-1/2 p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Campi Orario Mattina / Pomeriggio */}
            <div className="space-y-2 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80">
              <div className="text-xs font-bold text-slate-300 uppercase">Orari Effettivamente Lavorati</div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Mattina Inizio</label>
                  <input
                    type="time"
                    value={mIn}
                    onChange={(e) => setMIn(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-blue-500 mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Mattina Fine</label>
                  <input
                    type="time"
                    value={mOut}
                    onChange={(e) => setMOut(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-blue-500 mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Pomeriggio Inizio</label>
                  <input
                    type="time"
                    value={pIn}
                    onChange={(e) => setPIn(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-blue-500 mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Pomeriggio Fine</label>
                  <input
                    type="time"
                    value={pOut}
                    onChange={(e) => setPOut(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-blue-500 mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== MODALITÀ 3: ASSENZA INTERA GIORNATA ===================== */}
        {mode === 'absence' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Seleziona Causale Intera Giornata
              </label>
              <div className="flex flex-wrap gap-1.5">
                {appData.statuses.map((st) => (
                  <button
                    key={st.name}
                    type="button"
                    onClick={() => handleSelectAbsenceStatus(st.name)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                      status === st.name
                        ? 'ring-2 ring-white shadow-md scale-105'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: st.color, color: '#ffffff' }}
                  >
                    {st.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Nastro giornaliero riconosciuto:</span>
                <strong className="text-white text-sm">{nastroHours}h</strong>
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                L'assenza copre l'intera giornata per {nastroHours} ore senza orari di presenza.
              </p>
            </div>
          </div>
        )}

        {/* Note e Motivazioni Rapide */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Note / Dettaglio Turno
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Es. Visita medica, Corso sicurezza, ecc."
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />

          <div className="flex flex-wrap gap-1.5 pt-1">
            {appData.notePresets.map((np, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAppendNote(np.text)}
                className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-500 text-[11px] text-slate-300 font-medium transition"
              >
                + {np.text}
              </button>
            ))}
          </div>
        </div>

        {/* Azioni Modale */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClear}
            className="px-3.5 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Svuota Cella</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Salva Turno</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
