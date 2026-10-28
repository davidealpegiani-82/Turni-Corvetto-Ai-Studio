import React, { useState, useEffect } from 'react';
import { X, FileText, Check, Trash2, Calendar, Eye } from 'lucide-react';
import { AppData, LeaveRequest } from '../types/turni';
import { localDateKey, calculateAbsenceWorkingHours, getWorkerNastroForDate } from '../services/engine';
import { LeaveRequestPreviewModal } from './LeaveRequestFacsimile';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveId?: string | null;
  defaultWorkerId?: string | null;
  defaultDate?: string | null;
  defaultTipo?: string | null;
  defaultFromTime?: string | null;
  defaultToTime?: string | null;
  defaultNote?: string | null;
  appData: AppData;
  onSaveLeave: (req: Partial<LeaveRequest>) => void;
  onDeleteLeave: (id: string) => void;
  onExportPDF: (reqId: string) => void;
}

export const LeaveModal: React.FC<LeaveModalProps> = ({
  isOpen,
  onClose,
  leaveId,
  defaultWorkerId,
  defaultDate,
  defaultTipo,
  defaultFromTime,
  defaultToTime,
  defaultNote,
  appData,
  onSaveLeave,
  onDeleteLeave,
  onExportPDF
}) => {
  if (!isOpen) return null;

  const existing = leaveId ? appData.leaveRequests.find(r => r.id === leaveId) : null;

  const [workerId, setWorkerId] = useState(existing?.workerId || defaultWorkerId || appData.workers[0]?.id || '');
  const [tipo, setTipo] = useState(existing?.tipo || defaultTipo || 'Ferie');
  const [mode, setMode] = useState<'single' | 'range'>(existing?.mode || 'single');
  const [day, setDay] = useState(existing?.day || defaultDate || localDateKey(new Date()));
  const [fullDay, setFullDay] = useState(existing ? (existing.fullDay ?? true) : (!defaultFromTime && !defaultToTime));
  const [fromTime, setFromTime] = useState(existing?.fromTime || defaultFromTime || '08:30');
  const [toTime, setToTime] = useState(existing?.toTime || defaultToTime || '17:30');
  const [hours, setHours] = useState<number>(() => {
    if (existing?.hours !== undefined && existing?.hours !== null) return existing.hours;
    const nastro = getWorkerNastroForDate(existing?.workerId || defaultWorkerId || appData.workers[0]?.id || '', existing?.day || defaultDate || localDateKey(new Date()), appData);
    if (existing ? (existing.fullDay ?? true) : (!defaultFromTime && !defaultToTime)) return nastro;
    return calculateAbsenceWorkingHours(existing?.fromTime || defaultFromTime || '08:30', existing?.toTime || defaultToTime || '17:30', false);
  });
  const [fromDay, setFromDay] = useState(existing?.fromDay || defaultDate || localDateKey(new Date()));
  const [toDay, setToDay] = useState(existing?.toDay || '');
  const [note, setNote] = useState(existing?.note || defaultNote || '');
  const [status, setStatus] = useState<'richiesta' | 'approvata' | 'rifiutata'>(existing?.status || 'approvata');
  const [place, setPlace] = useState(existing?.place || 'Milano');
  const [requestDate, setRequestDate] = useState(existing?.requestDate || localDateKey(new Date()));
  const [syncTurns, setSyncTurns] = useState(existing?.syncTurns ?? true);

  // Sincronizza stato all'apertura o cambio id
  useEffect(() => {
    if (existing) {
      setWorkerId(existing.workerId || appData.workers[0]?.id || '');
      setTipo(existing.tipo || 'Ferie');
      setMode(existing.mode || 'single');
      setDay(existing.day || localDateKey(new Date()));
      setFullDay(existing.fullDay ?? true);
      setFromTime(existing.fromTime || '08:30');
      setToTime(existing.toTime || '17:30');
      setFromDay(existing.fromDay || localDateKey(new Date()));
      setToDay(existing.toDay || '');
      setNote(existing.note || '');
      setStatus(existing.status || 'richiesta');
      setPlace(existing.place || 'Milano');
      setRequestDate(existing.requestDate || localDateKey(new Date()));
      setSyncTurns(existing.syncTurns ?? true);
    } else {
      setWorkerId(defaultWorkerId || appData.workers[0]?.id || '');
      setTipo(defaultTipo || 'Ferie');
      setMode('single');
      setDay(defaultDate || localDateKey(new Date()));
      const isFull = !defaultFromTime && !defaultToTime;
      setFullDay(isFull);
      setFromTime(defaultFromTime || '08:30');
      setToTime(defaultToTime || '17:30');
      setFromDay(defaultDate || localDateKey(new Date()));
      setToDay('');
      setNote(defaultNote || '');
      setStatus('approvata');
      setPlace('Milano');
      setRequestDate(localDateKey(new Date()));
      setSyncTurns(true);
    }
  }, [leaveId, defaultWorkerId, defaultDate, defaultTipo, defaultFromTime, defaultToTime, defaultNote, existing]);

  // Stato per l'anteprima del modulo
  const [previewOpen, setPreviewOpen] = useState(false);

  // Calcolo automatico ore lavorative: per giornata intera prende il nastro, per orario parziale sottrae 1h di pranzo
  useEffect(() => {
    if (mode === 'single') {
      if (fullDay) {
        const nastro = getWorkerNastroForDate(workerId, day, appData);
        setHours(nastro);
      } else {
        const computed = calculateAbsenceWorkingHours(fromTime, toTime, false, workerId, day, appData);
        setHours(computed);
      }
    } else {
      setHours(8);
    }
  }, [mode, fullDay, fromTime, toTime, workerId, day, appData]);

  const tipiAssenza = [
    'Ferie',
    'Permesso retribuito',
    'Permesso Non retribuito',
    'Malattia',
    'Ricovero',
    'Congedo Matrimoniale',
    'Visita Medica',
    'Visita c/o cantiere',
    'Partecipazione corso',
    'Visita Fiera',
    'Donazione Sangue'
  ];

  const buildCurrentRequestData = (): LeaveRequest => {
    const finalHours = mode === 'single'
      ? (fullDay ? getWorkerNastroForDate(workerId, day, appData) : calculateAbsenceWorkingHours(fromTime, toTime, false, workerId, day, appData))
      : 8;
    return {
      id: existing?.id || 'preview_req',
      workerId,
      tipo,
      mode,
      day: mode === 'single' ? day : undefined,
      fullDay: mode === 'single' ? fullDay : true,
      fromTime: mode === 'single' && !fullDay ? fromTime : undefined,
      toTime: mode === 'single' && !fullDay ? toTime : undefined,
      hours: finalHours,
      fromDay: mode === 'range' ? fromDay : undefined,
      toDay: mode === 'range' ? toDay : undefined,
      note,
      status,
      place,
      requestDate,
      syncTurns,
      createdAt: existing?.createdAt || new Date().toISOString()
    };
  };

  const handleOpenPreview = () => {
    setPreviewOpen(true);
  };

  const handleSave = () => {
    const finalHours = mode === 'single'
      ? (fullDay ? getWorkerNastroForDate(workerId, day, appData) : calculateAbsenceWorkingHours(fromTime, toTime, false, workerId, day, appData))
      : 8;
    onSaveLeave({
      id: existing?.id,
      workerId,
      tipo,
      mode,
      day: mode === 'single' ? day : undefined,
      fullDay: mode === 'single' ? fullDay : true,
      fromTime: mode === 'single' && !fullDay ? fromTime : undefined,
      toTime: mode === 'single' && !fullDay ? toTime : undefined,
      hours: finalHours,
      fromDay: mode === 'range' ? fromDay : undefined,
      toDay: mode === 'range' ? toDay : undefined,
      note,
      status,
      place,
      requestDate,
      syncTurns
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-5 sm:p-6 text-white max-h-[92vh] overflow-y-auto my-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">RICHIESTA FERIE / PERMESSI</h3>
            <span className="text-xs text-slate-400">Modulo conforme fac-simile CENTROEDILE MILANO</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selezione Collaboratore */}
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Collaboratore</label>
          <select
            value={workerId}
            onChange={(e) => setWorkerId(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-blue-500"
          >
            {appData.workers.map(w => (
              <option key={w.id} value={w.id}>{w.name} ({w.role})</option>
            ))}
          </select>
        </div>

        {/* Tipo Assenza */}
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Tipo di Assenza</label>
          <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-800/40 rounded-xl border border-slate-800">
            {tipiAssenza.map((t) => (
              <label
                key={t}
                className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer transition flex items-center gap-2 ${
                  tipo === t
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                    : 'border-slate-700/60 text-slate-300 hover:border-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="tipoAssenza"
                  checked={tipo === t}
                  onChange={() => setTipo(t)}
                  className="text-blue-600 focus:ring-0"
                />
                <span className="truncate">{t}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Modalità: Giorno Singolo o Periodo */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`flex-1 py-1.5 rounded-lg transition ${mode === 'single' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
          >
            Giorno Singolo
          </button>
          <button
            type="button"
            onClick={() => setMode('range')}
            className={`flex-1 py-1.5 rounded-lg transition ${mode === 'range' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
          >
            Periodo (Dal / Al)
          </button>
        </div>

        {/* Campi Date in base alla modalità */}
        {mode === 'single' ? (
          <div className="space-y-2 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/70">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase">Il Giorno</label>
              <input
                type="date"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-semibold text-white mt-1 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="radio"
                  checked={fullDay}
                  onChange={() => setFullDay(true)}
                  className="text-blue-600"
                />
                <span>Intera Giornata ({getWorkerNastroForDate(workerId, day, appData)}h da nastro settimanale)</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="radio"
                  checked={!fullDay}
                  onChange={() => setFullDay(false)}
                  className="text-blue-600"
                />
                <span>Orario Parziale (Dalle / Alle)</span>
              </label>
            </div>

            {fullDay ? (
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/40 text-blue-200 text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>Intera Giornata</span>
                    <span className="px-1.5 py-0.2 rounded bg-blue-600 text-white font-extrabold text-[10px]">
                      {hours}h lavorative
                    </span>
                  </div>
                  <div className="text-[11px] text-blue-300/80 mt-1">
                    Non è necessario specificare orari: viene considerato direttamente il monte ore del nastro settimanale del collaboratore.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 pt-2 border-t border-slate-700">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Dalle</label>
                    <input
                      type="time"
                      value={fromTime}
                      onChange={(e) => setFromTime(e.target.value)}
                      className="w-full p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Alle</label>
                    <input
                      type="time"
                      value={toTime}
                      onChange={(e) => setToTime(e.target.value)}
                      className="w-full p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Ore Lavorative</label>
                    <input
                      type="text"
                      value={`${hours}h`}
                      readOnly
                      className="w-full p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-emerald-400 text-center"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-blue-400 dark:text-blue-300 font-medium">
                  ℹ️ Il calcolo include 1h di pausa pranzo (es. 08:30–17:30 = 8 ore lavorative, 06:30–14:30 = 7 ore lavorative)
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/70">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase">Dal Giorno</label>
              <input
                type="date"
                value={fromDay}
                onChange={(e) => setFromDay(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-semibold text-white mt-1 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase">Al Giorno</label>
              <input
                type="date"
                value={toDay}
                onChange={(e) => setToDay(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-semibold text-white mt-1 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Note e Stato Richiesta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Note / Motivazione</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Opzionale..."
              className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Stato Richiesta</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white mt-1"
            >
              <option value="richiesta">In Attesa di Approvazione</option>
              <option value="approvata">Approvata (Aggiorna Turni)</option>
              <option value="rifiutata">Rifiutata</option>
            </select>
          </div>
        </div>

        {/* Checkbox Sincronizzazione Turni */}
        <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer">
          <input
            type="checkbox"
            checked={syncTurns}
            onChange={(e) => setSyncTurns(e.target.checked)}
            className="rounded border-slate-600 text-blue-600 focus:ring-0"
          />
          <span>Aggiorna automaticamente i turni settimanali se la richiesta è approvata</span>
        </label>

        {/* Azioni Modale in fondo alla richiesta */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {existing && (
              <button
                type="button"
                onClick={() => { onDeleteLeave(existing.id); onClose(); }}
                className="p-2 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 transition cursor-pointer"
                title="Elimina richiesta"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Tasto Anteprima PDF stampabile */}
            <button
              type="button"
              onClick={handleOpenPreview}
              className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm hover:shadow"
              title="Visualizza anteprima del modulo PDF conforme CENTROEDILE pronto per la stampa"
            >
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>Anteprima PDF</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Salva Richiesta</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modale Anteprima Facsimile Ufficiale (Zero blocchi di Chrome) */}
      <LeaveRequestPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        req={buildCurrentRequestData()}
        workerName={appData.workers.find(w => w.id === workerId)?.name || 'Collaboratore'}
        title={appData.title || 'CORVETTO'}
        onSave={() => {
          setPreviewOpen(false);
          handleSave();
        }}
      />
    </div>
  );
};
