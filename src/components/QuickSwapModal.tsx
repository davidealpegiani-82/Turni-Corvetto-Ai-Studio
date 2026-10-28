import React, { useState } from 'react';
import { X, ArrowRightLeft, Check, AlertCircle } from 'lucide-react';
import { AppData, Worker } from '../types/turni';
import { formatTimeRange, isHardUnavailableCell } from '../services/engine';

interface QuickSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayIdx: number;
  appData: AppData;
  weekKey: string;
  onConfirmSwap: (workerAId: string, workerBId: string, dayIdx: number) => void;
}

export const QuickSwapModal: React.FC<QuickSwapModalProps> = ({
  isOpen,
  onClose,
  dayIdx,
  appData,
  weekKey,
  onConfirmSwap
}) => {
  if (!isOpen) return null;

  const daysNames = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  const workers = (appData.workers || []).filter(w => w.selected !== false);
  const weekShifts = appData.weeks[weekKey] || {};

  const [workerA, setWorkerA] = useState<string>('');
  const [workerB, setWorkerB] = useState<string>('');

  const cellA = workerA ? weekShifts[workerA]?.[dayIdx] : null;
  const cellB = workerB ? weekShifts[workerB]?.[dayIdx] : null;

  const handleSwap = () => {
    if (!workerA || !workerB || workerA === workerB) return;
    onConfirmSwap(workerA, workerB, dayIdx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-5 text-white space-y-4 my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Scambio Turno Rapido</h3>
              <span className="text-xs text-slate-400">Giorno: {daysNames[dayIdx]}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300">
          Seleziona due collaboratori per scambiare i loro orari di <strong>{daysNames[dayIdx]}</strong> con un solo clic.
        </p>

        {/* Selezione Primo Collaboratore */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">1° Collaboratore:</label>
          <select
            value={workerA}
            onChange={(e) => setWorkerA(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">-- Seleziona collaboratore --</option>
            {workers.map(w => {
              const c = weekShifts[w.id]?.[dayIdx];
              const t = isHardUnavailableCell(c) ? `(${c?.leaveType || 'Assente'})` : `(${formatTimeRange(c)})`;
              return (
                <option key={w.id} value={w.id} disabled={w.id === workerB}>
                  {w.name} {t}
                </option>
              );
            })}
          </select>
        </div>

        {/* Icona di interscambio */}
        <div className="flex justify-center">
          <div className="p-2 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
            <ArrowRightLeft className="w-4 h-4 rotate-90 sm:rotate-0" />
          </div>
        </div>

        {/* Selezione Secondo Collaboratore */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">2° Collaboratore:</label>
          <select
            value={workerB}
            onChange={(e) => setWorkerB(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">-- Seleziona collaboratore --</option>
            {workers.map(w => {
              const c = weekShifts[w.id]?.[dayIdx];
              const t = isHardUnavailableCell(c) ? `(${c?.leaveType || 'Assente'})` : `(${formatTimeRange(c)})`;
              return (
                <option key={w.id} value={w.id} disabled={w.id === workerA}>
                  {w.name} {t}
                </option>
              );
            })}
          </select>
        </div>

        {/* Anteprima dello scambio */}
        {workerA && workerB && (
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs space-y-1.5">
            <div className="font-bold text-slate-200">Riepilogo Scambio:</div>
            <div className="text-slate-400 flex items-center justify-between">
              <span>{workers.find(w => w.id === workerA)?.name}:</span>
              <strong className="text-blue-400">{formatTimeRange(cellB)}</strong>
            </div>
            <div className="text-slate-400 flex items-center justify-between">
              <span>{workers.find(w => w.id === workerB)?.name}:</span>
              <strong className="text-blue-400">{formatTimeRange(cellA)}</strong>
            </div>
          </div>
        )}

        {/* Pulsanti Azione */}
        <div className="pt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleSwap}
            disabled={!workerA || !workerB || workerA === workerB}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
              workerA && workerB && workerA !== workerB
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-md'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Conferma Scambio</span>
          </button>
        </div>
      </div>
    </div>
  );
};
