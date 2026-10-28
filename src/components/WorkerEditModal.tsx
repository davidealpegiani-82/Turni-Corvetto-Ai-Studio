import React, { useState } from 'react';
import { X, Check, Trash2, Shield, Wrench, UserCheck, AlertTriangle } from 'lucide-react';
import {
  Worker,
  WorkerGroup,
  WorkerExperienceLevel,
  QualificationStatus,
  WorkerQualificationsMap
} from '../types/turni';
import { initialWorkers } from '../data/initialData';

interface WorkerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerId?: string | null;
  workers: Worker[];
  onSaveWorker: (worker: Partial<Worker>) => void;
  onDeleteWorker: (id: string) => void;
  onDeactivateWorker: (id: string) => void;
}

export const WorkerEditModal: React.FC<WorkerEditModalProps> = ({
  isOpen,
  onClose,
  workerId,
  workers,
  onSaveWorker,
  onDeleteWorker,
  onDeactivateWorker
}) => {
  if (!isOpen) return null;

  const existing = workerId ? workers.find(w => w.id === workerId) : null;
  const [activeTab, setActiveTab] = useState<'profile' | 'skills' | 'qualifications'>('profile');

  // Campi Anagrafici
  const [name, setName] = useState(existing?.name || '');
  const [role, setRole] = useState(existing?.role || '');
  const [group, setGroup] = useState<WorkerGroup>(existing?.group || 'MAGAZZINO');
  const [phone, setPhone] = useState(existing?.phone || '');
  const [dob, setDob] = useState(existing?.dob || '');
  const [order, setOrder] = useState(existing?.order ?? (workers.length + 1));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Brain Profile
  const b = existing?.brain || {};
  const [canOpen, setCanOpen] = useState(b.canOpen ?? true);
  const [canClose, setCanClose] = useState(b.canClose ?? true);
  const [saturdayEligible, setSaturdayEligible] = useState(b.saturdayEligible ?? true);
  const [sabatista, setSabatista] = useState(b.sabatista ?? false);
  const [jolly, setJolly] = useState(b.jolly ?? false);
  const [fixed, setFixed] = useState(b.fixed ?? false);
  const [pair, setPair] = useState<'A' | 'B' | ''>(b.pair || '');
  const [officeProfile, setOfficeProfile] = useState<string>(b.officeProfile || (group === 'FINITURE' ? 'finiture' : 'standard'));

  // Competenze & Autonomia (v9.11.19)
  const defaultProfile = initialWorkers.find(
    iw => iw.id === existing?.id || iw.name.trim().toUpperCase() === existing?.name.trim().toUpperCase()
  )?.profile;
  const p = (existing?.profile && Object.keys(existing.profile).length > 0) ? existing.profile : (defaultProfile || {});

  const [openingExperience, setOpeningExperience] = useState<WorkerExperienceLevel>(p.openingExperience || 'unknown');
  const [sandExperience, setSandExperience] = useState<WorkerExperienceLevel>(p.sandExperience || 'unknown');
  const [loaderExperience, setLoaderExperience] = useState<WorkerExperienceLevel>(p.loaderExperience || 'unknown');
  const [loadingExperience, setLoadingExperience] = useState<WorkerExperienceLevel>(p.loadingExperience || 'unknown');
  const [competencies, setCompetencies] = useState(p.competencies || '');
  const [experience, setExperience] = useState(p.experience || '');
  const [otherQualifications, setOtherQualifications] = useState(p.otherQualifications || '');

  // Qualifiche e Abilitazioni Formali (D.Lgs 81/08 con scadenze)
  const qs = p.qualifications || {};
  const [qualifications, setQualifications] = useState<WorkerQualificationsMap>({
    forklift: {
      status: qs.forklift?.status || (group === 'MAGAZZINO' ? 'valid' : 'none'),
      expiry: qs.forklift?.expiry || ''
    },
    loader: {
      status: qs.loader?.status || 'none',
      expiry: qs.loader?.expiry || ''
    },
    firstAid: {
      status: qs.firstAid?.status || 'none',
      expiry: qs.firstAid?.expiry || ''
    },
    fireSafety: {
      status: qs.fireSafety?.status || 'none',
      expiry: qs.fireSafety?.expiry || ''
    }
  });

  const updateQual = (key: 'forklift' | 'loader' | 'firstAid' | 'fireSafety', field: 'status' | 'expiry', value: string) => {
    setQualifications(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        status: field === 'status' ? (value as QualificationStatus) : (prev[key]?.status || 'unknown'),
        expiry: field === 'expiry' ? value : (prev[key]?.expiry || '')
      }
    }));
  };

  const getDaysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const exp = new Date(expiryDate + 'T00:00:00');
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffTime = exp.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleSave = () => {
    if (!name.trim()) {
      setErrorMsg('Inserisci il nome e cognome del collaboratore prima di salvare.');
      return;
    }
    setErrorMsg(null);

    // Normalizza qualifiche verificando se la scadenza è già passata
    const todayStr = new Date().toISOString().split('T')[0];
    const normalizedQuals: WorkerQualificationsMap = {};
    (['forklift', 'loader', 'firstAid', 'fireSafety'] as const).forEach(k => {
      const q = qualifications[k];
      if (q) {
        let finalStatus = q.status;
        if (q.status === 'valid' && q.expiry && q.expiry < todayStr) {
          finalStatus = 'expired';
        }
        normalizedQuals[k] = {
          status: finalStatus,
          expiry: q.expiry || ''
        };
      }
    });

    onSaveWorker({
      id: existing?.id,
      name: name.trim().toUpperCase(),
      role: role.trim(),
      group,
      phone: phone.trim(),
      dob,
      order: Number(order) || workers.length + 1,
      selected: existing?.selected ?? true,
      brain: {
        office: ['MANAGER', 'EDILE', 'FINITURE'].includes(group),
        warehouse: group === 'MAGAZZINO',
        canOpen,
        canClose,
        saturdayEligible,
        sabatista,
        jolly,
        fixed,
        pair: group === 'MAGAZZINO' && (pair === 'A' || pair === 'B') ? pair : null,
        officeProfile: group === 'FINITURE' ? 'finiture' : officeProfile
      },
      profile: {
        openingExperience,
        sandExperience,
        loaderExperience,
        loadingExperience,
        competencies: competencies.trim(),
        experience: experience.trim(),
        otherQualifications: otherQualifications.trim(),
        qualifications: normalizedQuals
      }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-5 text-white my-auto space-y-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{existing ? 'Scheda Collaboratore' : 'Nuovo Collaboratore'}</span>
              {existing?.name && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
                  {existing.name}
                </span>
              )}
            </h3>
            <span className="text-xs text-slate-400">Anagrafica, profilo algoritmo, competenze ed abilitazioni D.Lgs 81/08</span>
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

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-2xl border border-slate-700/60">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Anagrafica & Brain</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('skills')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'skills'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Esperienza Operativa</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('qualifications')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'qualifications'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Qualifiche & Sicurezza</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* TAB 1: ANAGRAFICA & BRAIN */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Nome e Cognome</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Es. ROSSI MARIO"
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white mt-1 uppercase"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Ruolo / Mansione</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Es. Magazziniere, Addetto Vendite..."
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Gruppo Reparto</label>
                  <select
                    value={group}
                    onChange={(e) => {
                      const g = e.target.value as WorkerGroup;
                      setGroup(g);
                      if (g === 'FINITURE') {
                        setOfficeProfile('finiture');
                        setSaturdayEligible(false);
                        setFixed(true);
                      }
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white mt-1"
                  >
                    <option value="MANAGER">Ufficio Direzione / Store Manager</option>
                    <option value="EDILE">Ufficio Vendite Banco Edile</option>
                    <option value="FINITURE">Ufficio Finiture (Idalia)</option>
                    <option value="MAGAZZINO">Logistica & Magazzino</option>
                    <option value="ALTRO">Altro</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Ordine in Griglia</label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white mt-1"
                  />
                </div>
              </div>

              {/* Profilo Operativo Motore Regole */}
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  ⚙️ Profilo Operativo Generatore Intelligente
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canOpen}
                      onChange={(e) => setCanOpen(e.target.checked)}
                      className="rounded border-slate-600 text-blue-600"
                    />
                    <span>Può fare apertura (06:30)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canClose}
                      onChange={(e) => setCanClose(e.target.checked)}
                      className="rounded border-slate-600 text-blue-600"
                    />
                    <span>Può fare chiusura (17:30)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saturdayEligible}
                      onChange={(e) => setSaturdayEligible(e.target.checked)}
                      className="rounded border-slate-600 text-blue-600"
                    />
                    <span>Idoneo al Sabato</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={jolly}
                      onChange={(e) => setJolly(e.target.checked)}
                      className="rounded border-slate-600 text-blue-600"
                    />
                    <span>Jolly flessibile (es. Mario)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fixed}
                      onChange={(e) => setFixed(e.target.checked)}
                      className="rounded border-slate-600 text-blue-600"
                    />
                    <span>Turno Fisso (non spostabile)</span>
                  </label>
                </div>

                {/* Coppia Magazzino se MAGAZZINO */}
                {group === 'MAGAZZINO' && (
                  <div className="pt-2 border-t border-slate-700/60">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Coppia Magazzino (Sabato alternato)</label>
                    <select
                      value={pair}
                      onChange={(e) => setPair(e.target.value as any)}
                      className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white mt-1"
                    >
                      <option value="">Nessuna coppia (es. Jolly)</option>
                      <option value="A">Coppia A (con Pino / Massimo)</option>
                      <option value="B">Coppia B (con Vincenzo / Mattia)</option>
                    </select>
                  </div>
                )}

                {/* Profilo Ufficio se Ufficio */}
                {['MANAGER', 'EDILE'].includes(group) && (
                  <div className="pt-2 border-t border-slate-700/60">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Profilo Ufficio Speciale</label>
                    <select
                      value={officeProfile}
                      onChange={(e) => setOfficeProfile(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white mt-1"
                    >
                      <option value="standard">Standard (Rotazione Sabato + Turno 2° 17:30)</option>
                      <option value="severin">Severin (Apertura e chiusura specifica, pausa 30m)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: COMPETENZE & AUTONOMIA OPERATIVA (v9.11.19) */}
          {activeTab === 'skills' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4" />
                    <span>Autonomia Pratica sul Campo (Magazzino & Piazzale)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Livelli effettivi di competenza verificata</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Autonomia Apertura Magazzino (06:30)
                    </label>
                    <select
                      value={openingExperience}
                      onChange={(e) => setOpeningExperience(e.target.value as WorkerExperienceLevel)}
                      className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white mt-1"
                    >
                      <option value="unknown">Da valutare</option>
                      <option value="assisted">Richiede affiancamento</option>
                      <option value="autonomous">Autonomo</option>
                      <option value="mentor">Esperto / può affiancare (Tutor)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Vendita / Preparazione Sabbia Sfusa
                    </label>
                    <select
                      value={sandExperience}
                      onChange={(e) => setSandExperience(e.target.value as WorkerExperienceLevel)}
                      className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white mt-1"
                    >
                      <option value="unknown">Da valutare</option>
                      <option value="assisted">Richiede affiancamento</option>
                      <option value="autonomous">Autonomo</option>
                      <option value="mentor">Esperto / può affiancare</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Uso Pala Caricatrice nella Pratica
                    </label>
                    <select
                      value={loaderExperience}
                      onChange={(e) => setLoaderExperience(e.target.value as WorkerExperienceLevel)}
                      className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white mt-1"
                    >
                      <option value="unknown">Da valutare</option>
                      <option value="assisted">Richiede affiancamento</option>
                      <option value="autonomous">Autonomo</option>
                      <option value="mentor">Esperto / può affiancare</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Carico Camion & Preparazione Ordini
                    </label>
                    <select
                      value={loadingExperience}
                      onChange={(e) => setLoadingExperience(e.target.value as WorkerExperienceLevel)}
                      className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white mt-1"
                    >
                      <option value="unknown">Da valutare</option>
                      <option value="assisted">Richiede affiancamento</option>
                      <option value="autonomous">Autonomo</option>
                      <option value="mentor">Esperto / può affiancare</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Note pratiche */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Competenze Pratiche Specifiche
                </label>
                <textarea
                  rows={2}
                  value={competencies}
                  onChange={(e) => setCompetencies(e.target.value)}
                  placeholder="Es. preparazione ordini pesanti, scarico bilici, vendita sabbia sfusa, tintometro..."
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Esperienza, Autonomia ed Eventuali Limitazioni
                </label>
                <textarea
                  rows={2}
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Es. anni di esperienza, attività svolte in totale autonomia, affiancamento necessario..."
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white mt-1"
                />
              </div>
            </div>
          )}

          {/* TAB 3: QUALIFICHE FORMALI D.Lgs 81/08 & SCADENZE */}
          {activeTab === 'qualifications' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    <span>Abilitazioni & Certificazioni di Sicurezza (D.Lgs 81/08)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Controllo scadenze legali vincolanti</span>
                </div>

                {/* 1. Muletto */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>🚜 Carrello Elevatore (Muletto)</span>
                      {(() => {
                        const q = qualifications.forklift;
                        if (!q || q.status === 'none') return <span className="text-[10px] text-slate-500 font-medium">Non posseduto</span>;
                        const days = getDaysUntilExpiry(q.expiry);
                        if (q.status === 'expired' || (days !== null && days <= 0)) {
                          return <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold text-[10px] border border-red-500/30">SCADUTO</span>;
                        }
                        if (days !== null && days <= 60) {
                          return <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">In scadenza ({days} gg)</span>;
                        }
                        return <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">Valido</span>;
                      })()}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400">Stato Abilitazione</label>
                      <select
                        value={qualifications.forklift?.status || 'none'}
                        onChange={(e) => updateQual('forklift', 'status', e.target.value)}
                        className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white mt-0.5"
                      >
                        <option value="none">Non posseduta</option>
                        <option value="valid">Valida</option>
                        <option value="expired">Scaduta</option>
                        <option value="unknown">Da verificare</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Data Scadenza Patentino</label>
                      <input
                        type="date"
                        value={qualifications.forklift?.expiry || ''}
                        onChange={(e) => updateQual('forklift', 'expiry', e.target.value)}
                        className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white mt-0.5"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Pala Caricatrice */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>🏗️ Pala Caricatrice / Macchine Movimento Terra</span>
                      {(() => {
                        const q = qualifications.loader;
                        if (!q || q.status === 'none') return <span className="text-[10px] text-slate-500 font-medium">Non posseduto</span>;
                        const days = getDaysUntilExpiry(q.expiry);
                        if (q.status === 'expired' || (days !== null && days <= 0)) {
                          return <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold text-[10px] border border-red-500/30">SCADUTO</span>;
                        }
                        if (days !== null && days <= 60) {
                          return <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">In scadenza ({days} gg)</span>;
                        }
                        return <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">Valido</span>;
                      })()}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400">Stato Abilitazione</label>
                      <select
                        value={qualifications.loader?.status || 'none'}
                        onChange={(e) => updateQual('loader', 'status', e.target.value)}
                        className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white mt-0.5"
                      >
                        <option value="none">Non posseduta</option>
                        <option value="valid">Valida</option>
                        <option value="expired">Scaduta</option>
                        <option value="unknown">Da verificare</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Data Scadenza</label>
                      <input
                        type="date"
                        value={qualifications.loader?.expiry || ''}
                        onChange={(e) => updateQual('loader', 'expiry', e.target.value)}
                        className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white mt-0.5"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Primo Soccorso */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>🚑 Addetto Primo Soccorso Aziendale</span>
                      {(() => {
                        const q = qualifications.firstAid;
                        if (!q || q.status === 'none') return <span className="text-[10px] text-slate-500 font-medium">Non incaricato</span>;
                        const days = getDaysUntilExpiry(q.expiry);
                        if (q.status === 'expired' || (days !== null && days <= 0)) {
                          return <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold text-[10px] border border-red-500/30">SCADUTO</span>;
                        }
                        if (days !== null && days <= 60) {
                          return <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">In scadenza ({days} gg)</span>;
                        }
                        return <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">Valido</span>;
                      })()}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400">Stato Certificazione</label>
                      <select
                        value={qualifications.firstAid?.status || 'none'}
                        onChange={(e) => updateQual('firstAid', 'status', e.target.value)}
                        className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white mt-0.5"
                      >
                        <option value="none">Non posseduta</option>
                        <option value="valid">Valida</option>
                        <option value="expired">Scaduta</option>
                        <option value="unknown">Da verificare</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Data Aggiornamento Triennale</label>
                      <input
                        type="date"
                        value={qualifications.firstAid?.expiry || ''}
                        onChange={(e) => updateQual('firstAid', 'expiry', e.target.value)}
                        className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white mt-0.5"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Antincendio */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>🧯 Addetto Antincendio & Gestione Emergenze</span>
                      {(() => {
                        const q = qualifications.fireSafety;
                        if (!q || q.status === 'none') return <span className="text-[10px] text-slate-500 font-medium">Non incaricato</span>;
                        const days = getDaysUntilExpiry(q.expiry);
                        if (q.status === 'expired' || (days !== null && days <= 0)) {
                          return <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold text-[10px] border border-red-500/30">SCADUTO</span>;
                        }
                        if (days !== null && days <= 60) {
                          return <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">In scadenza ({days} gg)</span>;
                        }
                        return <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">Valido</span>;
                      })()}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400">Stato Certificazione</label>
                      <select
                        value={qualifications.fireSafety?.status || 'none'}
                        onChange={(e) => updateQual('fireSafety', 'status', e.target.value)}
                        className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white mt-0.5"
                      >
                        <option value="none">Non posseduta</option>
                        <option value="valid">Valida</option>
                        <option value="expired">Scaduta</option>
                        <option value="unknown">Da verificare</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Data Aggiornamento Triennale</label>
                      <input
                        type="date"
                        value={qualifications.fireSafety?.expiry || ''}
                        onChange={(e) => updateQual('fireSafety', 'expiry', e.target.value)}
                        className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white mt-0.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Altre abilitazioni */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Altre Abilitazioni / Incarichi D.Lgs 81/08
                  </label>
                  <textarea
                    rows={2}
                    value={otherQualifications}
                    onChange={(e) => setOtherQualifications(e.target.value)}
                    placeholder="Es. Preposto alla sicurezza, addetto DPI 3ª categoria, formazione specifica rischi..."
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white mt-1"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Azioni */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          {existing ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { onDeleteWorker(existing.id); onClose(); }}
                className="p-2 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 transition"
                title="Elimina definitivamente"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => { onDeactivateWorker(existing.id); onClose(); }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-amber-300 hover:bg-slate-700 text-xs font-semibold transition"
              >
                {existing.selected === false ? 'Riattiva' : 'Disattiva'}
              </button>
            </div>
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
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Salva Collaboratore</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
