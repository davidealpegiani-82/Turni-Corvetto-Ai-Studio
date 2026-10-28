import React from 'react';
import { X, AlertTriangle, AlertCircle, Info, ShieldCheck } from 'lucide-react';
import { RuleViolation } from '../types';

interface ViolationModalProps {
  isOpen: boolean;
  onClose: () => void;
  violation: RuleViolation | null;
}

export const ViolationModal: React.FC<ViolationModalProps> = ({
  isOpen,
  onClose,
  violation
}) => {
  if (!isOpen || !violation) return null;

  const isError = violation.severity === 'error';
  const isWarning = violation.severity === 'warning';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isError
                  ? 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400'
                  : isWarning
                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                  : 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
              }`}
            >
              {isError ? (
                <AlertCircle className="w-5 h-5" />
              ) : isWarning ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Info className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {violation.ruleId}
                </span>
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  isError ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-blue-600'
                }`}>
                  {violation.severity === 'error' ? 'Errore Critico' : 'Avviso'}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base mt-0.5">
                {violation.ruleName}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messaggio principale */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-slate-200">
          {violation.message}
        </div>

        {/* Spiegazione delle regole del contratto collettivo e filiale */}
        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Cosa prevede la regola:
          </p>
          {violation.ruleId === 'M38' && (
            <p>
              I turni pomeridiani consecutivi non devono superare la soglia massima impostata (standard 5 giorni) per garantire un riposo psicofisico adeguato.
            </p>
          )}
          {violation.ruleId === 'M40' && (
            <p>
              La legge e il CCNL prevedono un massimo di 6 giorni lavorativi consecutivi seguiti obbligatoriamente da almeno 24 ore continuative di riposo settimanale.
            </p>
          )}
          {violation.ruleId === 'M45' && (
            <p>
              L&apos;orario di lavoro ordinario a tempo pieno è calcolato su base 40 ore settimanali (o secondo il profilo speciale part-time/finiture concordato).
            </p>
          )}
          {violation.ruleId === 'COV' && (
            <p>
              La filiale deve garantire la presenza minima di operatori per l&apos;apertura (dalle 06:30) e per la chiusura (fino alle 17:30) sia per il banco vendita che per il magazzino.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition"
          >
            Ho capito
          </button>
        </div>
      </div>
    </div>
  );
};
