import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Calendar, Clock, MapPin, Users, Share2 } from 'lucide-react';
import { AppData, BranchEvent } from '../types/turni';
import { localDateKey } from '../services/engine';

interface BranchEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId?: string | null;
  defaultTitle?: string | null;
  defaultDate?: string | null;
  defaultParticipantId?: string | null;
  defaultType?: string | null;
  appData: AppData;
  onSaveEvent: (event: Partial<BranchEvent>) => void;
  onDeleteEvent: (id: string) => void;
}

export const BranchEventModal: React.FC<BranchEventModalProps> = ({
  isOpen,
  onClose,
  eventId,
  defaultTitle,
  defaultDate,
  defaultParticipantId,
  defaultType,
  appData,
  onSaveEvent,
  onDeleteEvent
}) => {
  if (!isOpen) return null;

  const existing = eventId ? appData.events.find(e => e.id === eventId) : null;

  const [type, setType] = useState(existing?.type || defaultType || 'Corso');
  const [title, setTitle] = useState(existing?.title || defaultTitle || '');
  const [date, setDate] = useState(existing?.date || defaultDate || localDateKey(new Date()));
  const [allDay, setAllDay] = useState(existing?.allDay ?? false);
  const [fromTime, setFromTime] = useState(existing?.fromTime || '09:00');
  const [toTime, setToTime] = useState(existing?.toTime || '12:00');
  const [location, setLocation] = useState(existing?.location || 'Filiale Corvetto');
  const [participantIds, setParticipantIds] = useState<string[]>(
    existing?.participantIds || (defaultParticipantId ? [defaultParticipantId] : [])
  );
  const [notes, setNotes] = useState(existing?.notes || '');
  const [reminderMinutes, setReminderMinutes] = useState(existing?.reminderMinutes ?? 60);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setType(existing.type || 'Corso');
      setTitle(existing.title || '');
      setDate(existing.date || localDateKey(new Date()));
      setAllDay(existing.allDay ?? false);
      setFromTime(existing.fromTime || '09:00');
      setToTime(existing.toTime || '12:00');
      setLocation(existing.location || 'Filiale Corvetto');
      setParticipantIds(existing.participantIds || []);
      setNotes(existing.notes || '');
      setReminderMinutes(existing.reminderMinutes ?? 60);
    } else {
      setType(defaultType || 'Corso');
      setTitle(defaultTitle || '');
      setDate(defaultDate || localDateKey(new Date()));
      setAllDay(false);
      setFromTime('09:00');
      setToTime('12:00');
      setLocation('Filiale Corvetto');
      setParticipantIds(defaultParticipantId ? [defaultParticipantId] : []);
      setNotes('');
      setReminderMinutes(60);
    }
    setErrorMsg(null);
  }, [eventId, defaultTitle, defaultDate, defaultParticipantId, defaultType, existing]);

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

  const handleSave = () => {
    if (!title.trim() || !date) {
      setErrorMsg('Inserisci il titolo e la data dell’impegno prima di salvare.');
      return;
    }
    if (!participantIds.length) {
      setErrorMsg('Seleziona almeno un collaboratore partecipante.');
      return;
    }
    setErrorMsg(null);

    onSaveEvent({
      id: existing?.id,
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
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-5 text-white my-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">
              {existing ? 'Modifica Impegno / Corso' : 'Nuovo Impegno / Corso'}
            </h3>
            <span className="text-xs text-slate-400">Pianifica corsi di formazione, visite o trasferte</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-bold flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tipo & Titolo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white mt-1 focus:outline-none"
            >
              <option value="Corso">Corso Formazione</option>
              <option value="Riunione">Riunione</option>
              <option value="Visita medica">Visita medica</option>
              <option value="Appuntamento">Appuntamento</option>
              <option value="Trasferta">Trasferta</option>
              <option value="Altro">Altro</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Titolo Impegno</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Es. Corso antincendio, Visita cantiere..."
              className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white mt-1"
            />
          </div>
        </div>

        {/* Data e Orario */}
        <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/80 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white mt-1"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="rounded border-slate-600 text-blue-600"
                />
                <span>Giornata Intera</span>
              </label>
            </div>
          </div>

          {!allDay && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Dalle</label>
                <input
                  type="time"
                  value={fromTime}
                  onChange={(e) => setFromTime(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Alle</label>
                <input
                  type="time"
                  value={toTime}
                  onChange={(e) => setToTime(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Luogo e Promemoria */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Luogo / Sede</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Es. Filiale Corvetto, Sede Agrate..."
              className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Promemoria Notifica</label>
            <select
              value={reminderMinutes}
              onChange={(e) => setReminderMinutes(Number(e.target.value))}
              className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white mt-1"
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
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Partecipanti ({participantIds.length})
            </label>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              {participantIds.length === appData.workers.length ? 'Deseleziona tutti' : 'Seleziona tutti'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1.5 rounded-xl bg-slate-800/40 border border-slate-700">
            {appData.workers.map(w => (
              <label
                key={w.id}
                className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer transition flex items-center gap-2 ${
                  participantIds.includes(w.id)
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                    : 'border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={participantIds.includes(w.id)}
                  onChange={() => toggleParticipant(w.id)}
                  className="rounded border-slate-600 text-blue-600 focus:ring-0"
                />
                <span className="truncate">{w.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400 uppercase">Note / Indicazioni</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Materiale da portare, referente..."
            className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
          />
        </div>

        {/* Azioni */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          {existing ? (
            <button
              type="button"
              onClick={() => { onDeleteEvent(existing.id); onClose(); }}
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
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Salva Impegno</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
