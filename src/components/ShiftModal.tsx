import React, { useState } from 'react';
import { X, Clock, Trash2 } from 'lucide-react';
import { SHIFT_CODES, getShift } from '../constants/shifts';
import { Worker, ShiftDefinition } from '../types';
import { GIORNI_COMPLETI } from '../lib/dateUtils';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker?: Worker;
  dayIndex: number;
  date: Date;
  currentShiftCode: string;
  currentNote?: string;
  onSelectShift: (shiftCode: string, note?: string) => void;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({
  isOpen,
  onClose,
  worker,
  dayIndex,
  date,
  currentShiftCode,
  currentNote = '',
  onSelectShift
}) => {
  const [note, setNote] = useState(currentNote);

  if (!isOpen || !worker) return null;

  const currentDef = getShift(currentShiftCode);

  const morningShifts = ['M', 'M7', 'M8', 'SV1', 'SV2', 'SV3', 'TM', 'GIM', 'GIS', 'MSG'];
  const afternoonShifts = ['P', 'P7', 'P8', 'TP', 'PSG'];
  const nightShifts = ['N', 'N7', 'N8', 'TN'];
  const leaveAndRestShifts = ['R', 'F', 'MC', 'PE', 'ROL', 'RSG'];

  const renderShiftButton = (code: string) => {
    const s = getShift(code);
    const isSelected = currentShiftCode === code;
    return (
      <button
        key={code}
        type="button"
        onClick={() => onSelectShift(code, note)}
        style={{
          backgroundColor: isSelected ? s.bgColor : undefined,
          borderColor: isSelected ? s.color : undefined,
          color: isSelected ? s.textColor : undefined
        }}
        className={`flex flex-col text-left p-2.5 rounded-xl border transition-all text-xs hover:shadow-sm ${
          isSelected
            ? 'ring-2 ring-blue-500 font-bold border-blue-500'
            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span
            className="font-bold text-xs px-2 py-0.5 rounded-md"
            style={{ backgroundColor: s.bgColor, color: s.textColor }}
          >
            {s.shortLabel || s.code}
          </span>
          <span className="font-semibold opacity-80">{s.hours > 0 ? `${s.hours}h` : '0h'}</span>
        </div>
        <span className="font-medium truncate text-[11px]">{s.label}</span>
        {s.timeRange && (
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{s.timeRange}</span>
        )}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {worker.name}
              </h3>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold">
                {worker.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {GIORNI_COMPLETI[dayIndex]} {date.toLocaleDateString('it-IT')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo modale */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Turno Attuale */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <span
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs"
                style={{ backgroundColor: currentDef.bgColor, color: currentDef.textColor }}
              >
                {currentDef.shortLabel || '—'}
              </span>
              <div>
                <span className="text-xs text-slate-500 block">Turno selezionato</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">{currentDef.label}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelectShift('', '')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Rimuovi</span>
            </button>
          </div>

          {/* Categorie turni */}
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
                Turni Mattina
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {morningShifts.map(renderShiftButton)}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
                Turni Pomeriggio
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {afternoonShifts.map(renderShiftButton)}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-2">
                Turni Notte
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {nightShifts.map(renderShiftButton)}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
                Riposo, Ferie & Permessi
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {leaveAndRestShifts.map(renderShiftButton)}
              </div>
            </div>
          </div>

          {/* Note turno */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Note aggiuntive per questo giorno:
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="es. Sostituzione, ritardo concordato..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
};
