import React, { useState } from 'react';
import { X, User, Save, Trash2 } from 'lucide-react';
import { Worker, WorkerBrainProfile } from '../types';

interface WorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker?: Worker | null;
  onSave: (workerData: Partial<Worker>) => void;
  onDelete?: (id: string) => void;
}

export const WorkerModal: React.FC<WorkerModalProps> = ({
  isOpen,
  onClose,
  worker,
  onSave,
  onDelete
}) => {
  const [name, setName] = useState(worker?.name || '');
  const [role, setRole] = useState(worker?.role || '');
  const [group, setGroup] = useState(worker?.group || 'EDILE');
  const [brain, setBrain] = useState<WorkerBrainProfile>(worker?.brain || {
    office: true,
    warehouse: false,
    saturdayEligible: true,
    sabatista: true
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim().toUpperCase(),
      role: role.trim(),
      group,
      brain
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {worker ? 'Modifica Operatore' : 'Nuovo Operatore'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome e Cognome
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="es. ROSSI MARIO"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ruolo
              </label>
              <input
                type="text"
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="es. Magazziniere"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Gruppo / Reparto
              </label>
              <select
                value={group}
                onChange={e => setGroup(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="MANAGER">MANAGER</option>
                <option value="EDILE">EDILE</option>
                <option value="FINITURE">FINITURE</option>
                <option value="MAGAZZINO">MAGAZZINO</option>
                <option value="ALTRO">ALTRO</option>
              </select>
            </div>
          </div>

          {/* Regole Brain e Abilitazioni */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Profilo Algoritmo Intelligente (Brain)
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={!!brain.office}
                  onChange={e => setBrain({ ...brain, office: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Ufficio / Banco</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={!!brain.warehouse}
                  onChange={e => setBrain({ ...brain, warehouse: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Magazzino</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={!!brain.saturdayEligible}
                  onChange={e => setBrain({ ...brain, saturdayEligible: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Abilitato Sabato</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={!!brain.fixed}
                  onChange={e => setBrain({ ...brain, fixed: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Orario Fisso</span>
              </label>
            </div>

            {/* Coppia magazzino se abilitato */}
            {brain.warehouse && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Coppia Magazzino:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBrain({ ...brain, pair: 'A' })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      brain.pair === 'A'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Coppia A
                  </button>
                  <button
                    type="button"
                    onClick={() => setBrain({ ...brain, pair: 'B' })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      brain.pair === 'B'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Coppia B
                  </button>
                </div>
              </div>
            )}

            {/* Profilo Ufficio speciale */}
            {brain.office && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Regola speciale:
                </label>
                <select
                  value={brain.officeProfile || 'standard'}
                  onChange={e => setBrain({ ...brain, officeProfile: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  <option value="standard">Standard (Rotazione normale)</option>
                  <option value="severin">Severin (SV1, SV2, SV3 Lun-Gio)</option>
                  <option value="finiture">Giuliano Sandrini (Mer 4h, Sab Agrate)</option>
                </select>
              </div>
            )}
          </div>

          {/* Footer bottoni */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
            {worker && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Rimuovere ${worker.name}?`)) {
                    onDelete(worker.id);
                    onClose();
                  }
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Elimina</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm flex items-center gap-1.5 transition"
              >
                <Save className="w-4 h-4" />
                <span>Salva</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
