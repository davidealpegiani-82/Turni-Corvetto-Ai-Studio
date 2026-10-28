import React, { useState } from 'react';
import { X, Check, Trash2, Thermometer } from 'lucide-react';
import { AppData, LeaveRequest } from '../types/turni';
import { localDateKey } from '../services/engine';

interface MalattiaModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveId?: string | null;
  appData: AppData;
  onSaveMalattia: (req: Partial<LeaveRequest>) => void;
  onDeleteMalattia: (id: string) => void;
}

export const MalattiaModal: React.FC<MalattiaModalProps> = ({
  isOpen,
  onClose,
  leaveId,
  appData,
  onSaveMalattia,
  onDeleteMalattia
}) => {
  if (!isOpen) return null;

  const existing = leaveId ? appData.leaveRequests.find(r => r.id === leaveId) : null;

  const [workerId, setWorkerId] = useState(existing?.workerId || appData.workers[0]?.id || '');
  const [tipo, setTipo] = useState<'Malattia' | 'Ricovero'>((existing?.tipo as any) || 'Malattia');
  const [fromDay, setFromDay] = useState(existing?.fromDay || existing?.day || localDateKey(new Date()));
  const [openEnded, setOpenEnded] = useState(existing?.openEnded ?? true);
  const [toDay, setToDay] = useState(existing?.toDay || '');
  const [note, setNote] = useState(existing?.note || '');
  const [status, setStatus] = useState<'approvata' | 'richiesta' | 'rifiutata'>(existing?.status || 'approvata');

  const handleSave = () => {
    onSaveMalattia({
      id: existing?.id,
      workerId,
      tipo,
      mode: 'range',
      fromDay,
      toDay: openEnded ? undefined : toDay,
      openEnded,
      isMalattia: true,
      note: note || (openEnded ? 'in corso fino a dimissione/fine prognosi' : ''),
      status,
      place: 'Milano',
      requestDate: localDateKey(new Date()),
      syncTurns: true
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-5 text-white my-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-600/20 text-red-400">
              <Thermometer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Malattia / Ricovero Ospedaliero</h3>
              <span className="text-xs text-slate-400">Certificato medico INPS o ricovero</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Collaboratore */}
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Collaboratore</label>
          <select
            value={workerId}
            onChange={(e) => setWorkerId(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm font-semibold text-white focus:outline-none"
          >
            {appData.workers.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        {/* Tipo: Malattia vs Ricovero */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTipo('Malattia')}
            className={`p-2.5 rounded-xl text-xs font-bold border transition ${
              tipo === 'Malattia' ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            Malattia (Certificato)
          </button>
          <button
            type="button"
            onClick={() => setTipo('Ricovero')}
            className={`p-2.5 rounded-xl text-xs font-bold border transition ${
              tipo === 'Ricovero' ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            Ricovero Ospedaliero
          </button>
        </div>

        {/* Dal Giorno */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400 uppercase">Dal Giorno</label>
          <input
            type="date"
            value={fromDay}
            onChange={(e) => setFromDay(e.target.value)}
            className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-semibold text-white focus:outline-none"
          />
        </div>

        {/* Checkbox In Corso / Open-ended */}
        <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/60 border border-slate-700 text-xs font-semibold cursor-pointer">
          <input
            type="checkbox"
            checked={openEnded}
            onChange={(e) => setOpenEnded(e.target.checked)}
            className="rounded border-slate-600 text-red-600 focus:ring-0"
          />
          <span>In corso / senza data fine nota (fino a dimissione/fine prognosi)</span>
        </label>

        {/* Al Giorno (se non open-ended) */}
        {!openEnded && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Al Giorno (Fine Prognosi)</label>
            <input
              type="date"
              value={toDay}
              onChange={(e) => setToDay(e.target.value)}
              className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-semibold text-white focus:outline-none"
            />
          </div>
        )}

        {/* Protocollo INPS / Note */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400 uppercase">Protocollo INPS / Note</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Es. Certificato prot. 123456789..."
            className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
          />
        </div>

        {/* Stato */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400 uppercase">Stato Registrazione</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white"
          >
            <option value="approvata">Registrata (Sincronizza Turni)</option>
            <option value="richiesta">In Attesa di Ricezione Certificato</option>
            <option value="rifiutata">Annullata</option>
          </select>
        </div>

        {/* Azioni */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          {existing ? (
            <button
              type="button"
              onClick={() => { onDeleteMalattia(existing.id); onClose(); }}
              className="p-2 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 transition"
              title="Elimina"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30 flex items-center gap-1.5 transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Salva Malattia</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
