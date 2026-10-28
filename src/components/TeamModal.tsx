import React, { useState } from 'react';
import {
  X,
  UserPlus,
  ArrowUp,
  ArrowDown,
  Edit2,
  UserCheck,
  UserX,
  Shield,
  Wrench,
  AlertTriangle,
  Users
} from 'lucide-react';
import { Worker, QualificationStatus } from '../types/turni';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  workers: Worker[];
  onOpenWorkerEdit: (workerId: string) => void;
  onOpenAddWorker: () => void;
  onMoveOrder: (workerId: string, delta: number) => void;
  onToggleActive: (workerId: string) => void;
  onDeleteWorker: (workerId: string) => void;
}

export const TeamModal: React.FC<TeamModalProps> = ({
  isOpen,
  onClose,
  workers,
  onOpenWorkerEdit,
  onOpenAddWorker,
  onMoveOrder,
  onToggleActive
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'roster' | 'matrix'>('roster');

  const sortedWorkers = [...workers].sort((a, b) => (a.order || 99) - (b.order || 99));

  const getDaysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const exp = new Date(expiryDate + 'T00:00:00');
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffTime = exp.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getQualBadge = (status?: QualificationStatus, expiryDate?: string) => {
    if (!status || status === 'none') {
      return <span className="text-[10px] text-slate-500">—</span>;
    }
    const days = getDaysUntilExpiry(expiryDate);
    if (status === 'expired' || (days !== null && days <= 0)) {
      return (
        <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold text-[10px] border border-red-500/30 whitespace-nowrap">
          SCADUTO
        </span>
      );
    }
    if (days !== null && days <= 60) {
      return (
        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30 whitespace-nowrap">
          {days} gg
        </span>
      );
    }
    if (status === 'valid') {
      return (
        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[10px] border border-emerald-500/30 whitespace-nowrap">
          Valido
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-medium text-[10px] whitespace-nowrap">
        Verificare
      </span>
    );
  };

  const getAutonomyBadge = (level?: string) => {
    switch (level) {
      case 'mentor':
        return <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold text-[10px] border border-purple-500/30">Tutor / Esperto</span>;
      case 'autonomous':
        return <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold text-[10px] border border-blue-500/30">Autonomo</span>;
      case 'assisted':
        return <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold text-[10px] border border-amber-500/30">Affiancamento</span>;
      default:
        return <span className="text-[10px] text-slate-500">Da valutare</span>;
    }
  };

  // Statistiche riepilogative
  const activeWorkers = sortedWorkers.filter(w => w.selected !== false);
  const forkliftCount = activeWorkers.filter(w => w.profile?.qualifications?.forklift?.status === 'valid').length;
  const loaderCount = activeWorkers.filter(w => w.profile?.qualifications?.loader?.status === 'valid').length;
  const firstAidCount = activeWorkers.filter(w => w.profile?.qualifications?.firstAid?.status === 'valid').length;
  const fireSafetyCount = activeWorkers.filter(w => w.profile?.qualifications?.fireSafety?.status === 'valid').length;

  let expiringSoonCount = 0;
  activeWorkers.forEach(w => {
    const qs = w.profile?.qualifications;
    if (qs) {
      Object.values(qs).forEach(q => {
        if (q && q.status === 'valid' && q.expiry) {
          const d = getDaysUntilExpiry(q.expiry);
          if (d !== null && d <= 60 && d > 0) expiringSoonCount++;
        }
      });
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-5 sm:p-6 text-white my-auto max-h-[92vh] flex flex-col justify-between space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span>Gestione Squadra, Competenze & Abilitazioni (D.Lgs 81/08)</span>
            </h3>
            <span className="text-xs text-slate-400">
              Ordinamento turni, mansioni, rotazione sabato, autonomia e controllo scadenze legali
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher & Nuovo Collaboratore */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-2xl border border-slate-700/60 max-w-md">
            <button
              type="button"
              onClick={() => setActiveTab('roster')}
              className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'roster'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Elenco Squadra ({workers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'matrix'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Matrice Competenze & Sicurezza</span>
            </button>
          </div>

          <button
            onClick={() => { onOpenAddWorker(); onClose(); }}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuovo Collaboratore</span>
          </button>
        </div>

        {/* CONTENUTO TAB 1: ELENCO SQUADRA ORDINABILE */}
        {activeTab === 'roster' && (
          <div className="space-y-2 overflow-y-auto max-h-[58vh] pr-1">
            {sortedWorkers.map((w, idx) => {
              const isInactive = w.selected === false;
              const brain = w.brain || {};
              const p = w.profile || {};

              const tags: string[] = [];
              if (brain.officeProfile === 'severin') tags.push('Severin');
              if (brain.officeProfile === 'finiture') tags.push('Finiture');
              if (brain.jolly) tags.push('Jolly');
              if (brain.pair) tags.push(`Coppia ${brain.pair}`);
              if (brain.saturdayEligible && ['MANAGER', 'EDILE'].includes(w.group)) tags.push('Sabato OK');

              const hasForklift = p.qualifications?.forklift?.status === 'valid';
              const hasFirstAid = p.qualifications?.firstAid?.status === 'valid';

              return (
                <div
                  key={w.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition ${
                    isInactive
                      ? 'bg-slate-900/60 border-slate-800 opacity-50'
                      : 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 font-bold text-xs flex items-center justify-center text-slate-300">
                      {w.order || idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-sm font-extrabold text-white truncate">{w.name}</strong>
                        {isInactive && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                            Disattivo
                          </span>
                        )}
                        {hasForklift && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            🚜 Muletto
                          </span>
                        )}
                        {hasFirstAid && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                            🚑 1° Soccorso
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        {w.role || w.group} {tags.length > 0 ? `· ${tags.join(', ')}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Pulsanti Azione e Riordino */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      disabled={idx === 0}
                      onClick={() => onMoveOrder(w.id, -1)}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 disabled:opacity-30"
                      title="Sposta su"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={idx === sortedWorkers.length - 1}
                      onClick={() => onMoveOrder(w.id, 1)}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 disabled:opacity-30"
                      title="Sposta giù"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { onOpenWorkerEdit(w.id); onClose(); }}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-blue-400"
                      title="Modifica scheda"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onToggleActive(w.id)}
                      className={`p-1.5 rounded-lg border text-xs font-semibold ${
                        isInactive
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-amber-400'
                      }`}
                      title={isInactive ? 'Riattiva collaboratore' : 'Disattiva collaboratore'}
                    >
                      {isInactive ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CONTENUTO TAB 2: MATRICE COMPETENZE & SICUREZZA */}
        {activeTab === 'matrix' && (
          <div className="space-y-3 overflow-y-auto max-h-[58vh] pr-1">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">🚜 Muletto</span>
                <strong className="text-base font-extrabold text-emerald-400">{forkliftCount} abilitati</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">🏗️ Pala / Ruspa</span>
                <strong className="text-base font-extrabold text-blue-400">{loaderCount} abilitati</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">🚑 1° Soccorso</span>
                <strong className="text-base font-extrabold text-amber-400">{firstAidCount} addetti</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">🧯 Antincendio</span>
                <strong className="text-base font-extrabold text-red-400">{fireSafetyCount} addetti</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">⚠️ Scad. &lt;60gg</span>
                <strong className={`text-base font-extrabold ${expiringSoonCount > 0 ? 'text-amber-300' : 'text-slate-400'}`}>
                  {expiringSoonCount}
                </strong>
              </div>
            </div>

            {/* Tabella Matrice */}
            <div className="overflow-x-auto rounded-2xl border border-slate-700/80 bg-slate-900/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-[10px] text-slate-400 uppercase font-bold border-b border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Collaboratore</th>
                    <th className="py-2.5 px-2">Apertura</th>
                    <th className="py-2.5 px-2">Muletto</th>
                    <th className="py-2.5 px-2">Pala Mezzi</th>
                    <th className="py-2.5 px-2">1° Soccorso</th>
                    <th className="py-2.5 px-2">Antincendio</th>
                    <th className="py-2.5 px-2 text-right">Azione</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {sortedWorkers.map(w => {
                    const p = w.profile || {};
                    const qs = p.qualifications || {};
                    const isInactive = w.selected === false;

                    return (
                      <tr key={w.id} className={`hover:bg-slate-800/40 transition ${isInactive ? 'opacity-40' : ''}`}>
                        <td className="py-2.5 px-3">
                          <strong className="text-white block font-bold truncate max-w-[140px] sm:max-w-none">{w.name}</strong>
                          <span className="text-[10px] text-slate-400 block">{w.group} · {w.role}</span>
                        </td>
                        <td className="py-2.5 px-2">
                          {getAutonomyBadge(p.openingExperience)}
                        </td>
                        <td className="py-2.5 px-2">
                          {getQualBadge(qs.forklift?.status, qs.forklift?.expiry)}
                        </td>
                        <td className="py-2.5 px-2">
                          {getQualBadge(qs.loader?.status, qs.loader?.expiry)}
                        </td>
                        <td className="py-2.5 px-2">
                          {getQualBadge(qs.firstAid?.status, qs.firstAid?.expiry)}
                        </td>
                        <td className="py-2.5 px-2">
                          {getQualBadge(qs.fireSafety?.status, qs.fireSafety?.expiry)}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <button
                            onClick={() => { onOpenWorkerEdit(w.id); onClose(); }}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400"
                            title="Modifica competenze e scadenze"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Chiusura */}
        <div className="pt-2 text-right border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
