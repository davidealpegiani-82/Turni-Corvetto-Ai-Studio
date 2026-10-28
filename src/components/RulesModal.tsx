import React, { useState } from 'react';
import { X, ArrowUp, ArrowDown, Plus, Trash2, Check, RotateCcw, Search, BookOpen, Sliders, ShieldCheck } from 'lucide-react';
import { AppData, RulesConfig, BranchOperationalRule } from '../types/turni';
import { defaultRules } from '../data/initialData';
import { official25OperationalRules } from '../data/operationalRulesData';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  appData: AppData;
  onSaveRules: (rules: RulesConfig) => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({
  isOpen,
  onClose,
  appData,
  onSaveRules
}) => {
  if (!isOpen) return null;

  const [rules, setRules] = useState<RulesConfig>(JSON.parse(JSON.stringify(appData.rules || defaultRules)));
  const [selectedToAdd, setSelectedToAdd] = useState('');
  const [activeTab, setActiveTab] = useState<'rules' | 'config'>('rules');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [ruleSearch, setRuleSearch] = useState('');

  const workerMap: Record<string, string> = {};
  appData.workers.forEach(w => { workerMap[w.id] = w.name; });

  const moveSaturdayOrder = (idx: number, delta: number) => {
    const arr = [...rules.sabatoUfficioIds];
    const target = idx + delta;
    if (target < 0 || target >= arr.length) return;
    const temp = arr[idx];
    arr[idx] = arr[target];
    arr[target] = temp;
    setRules(r => ({ ...r, sabatoUfficioIds: arr }));
  };

  const removeSaturdayWorker = (idx: number) => {
    const arr = [...rules.sabatoUfficioIds];
    arr.splice(idx, 1);
    setRules(r => ({ ...r, sabatoUfficioIds: arr }));
  };

  const addSaturdayWorker = () => {
    if (!selectedToAdd || rules.sabatoUfficioIds.includes(selectedToAdd)) return;
    setRules(r => ({
      ...r,
      sabatoUfficioIds: [...r.sabatoUfficioIds, selectedToAdd]
    }));
    setSelectedToAdd('');
  };

  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const handleSave = () => {
    onSaveRules(rules);
    onClose();
  };

  const handleConfirmReset = () => {
    setRules(JSON.parse(JSON.stringify(defaultRules)));
    setResetConfirmOpen(false);
  };

  const allRules: BranchOperationalRule[] = rules.operationalRules && rules.operationalRules.length > 0
    ? rules.operationalRules
    : official25OperationalRules;

  const filteredRules = allRules.filter(r => {
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
    if (!ruleSearch.trim()) return true;
    const term = ruleSearch.toLowerCase();
    return (
      r.title.toLowerCase().includes(term) ||
      r.ruleText.toLowerCase().includes(term) ||
      r.detail.toLowerCase().includes(term) ||
      String(r.num).includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-5 sm:p-6 text-white my-auto max-h-[92vh] flex flex-col justify-between space-y-4">
        {/* Header con Navigazione a Schede */}
        <div className="space-y-3 pb-3 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-lg">
                ⚖️
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">Regolamento & Parametri Motore Turni</h3>
                <p className="text-xs text-slate-400">
                  I 32 Standard Operativi Ufficiali e le impostazioni di rotazione per Filiale Corvetto
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selettore Schede Principali */}
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 ${
                activeTab === 'rules'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>I 32 Standard Operativi ({allRules.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('config')}
              className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 ${
                activeTab === 'config'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Rotazione Sabato & Parametri Minimi</span>
            </button>
          </div>
        </div>

        {/* Contenuto Scheda 1: I 32 Standard Operativi */}
        {activeTab === 'rules' && (
          <div className="overflow-y-auto space-y-3 pr-1 max-h-[60vh]">
            {/* Barra Filtri Categorie & Ricerca */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={ruleSearch}
                  onChange={(e) => setRuleSearch(e.target.value)}
                  placeholder="Cerca tra le 32 regole (es. sabatista uscente, apertura 8h, chiusura 8h, severin pranzo)..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {[
                  { key: 'all', label: `Tutte (${allRules.length})` },
                  { key: 'orari_pause', label: `🍽️ Orari & Pause (${allRules.filter(r => r.category === 'orari_pause').length})` },
                  { key: 'sabati_rotazioni', label: `📅 Sabati & Rotazioni (${allRules.filter(r => r.category === 'sabati_rotazioni').length})` },
                  { key: 'profili_speciali', label: `👤 Profili Speciali (${allRules.filter(r => r.category === 'profili_speciali').length})` },
                  { key: 'assenze_monteore', label: `🏖️ Assenze & 40h (${allRules.filter(r => r.category === 'assenze_monteore').length})` },
                  { key: 'politiche_aziendali', label: `🏢 Politiche Aziendali (${allRules.filter(r => r.category === 'politiche_aziendali').length})` }
                ].map(cat => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategoryFilter(cat.key)}
                    className={`px-2.5 py-1 rounded-lg font-bold border transition ${
                      categoryFilter === cat.key
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Griglia Regole */}
            <div className="space-y-2">
              {filteredRules.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-800/40 rounded-2xl border border-slate-700/60">
                  Nessuna regola corrispondente alla ricerca "{ruleSearch}".
                </div>
              ) : (
                filteredRules.map(rule => (
                  <div
                    key={rule.id}
                    className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1.5 transition hover:border-slate-600"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-lg bg-blue-600/30 text-blue-300 font-black text-xs flex items-center justify-center shrink-0">
                          {rule.num}
                        </span>
                        <strong className="text-white text-xs font-bold">{rule.title}</strong>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-700/60 shrink-0">
                        {rule.categoryLabel}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-blue-950/30 border border-blue-800/30 text-xs text-blue-200 font-semibold">
                      {rule.ruleText}
                    </div>

                    <p className="text-[11px] text-slate-300/90 leading-relaxed pl-1">
                      {rule.detail}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Contenuto Scheda 2: Parametri di Configurazione */}
        {activeTab === 'config' && (
          <div className="overflow-y-auto space-y-4 pr-1 max-h-[60vh]">
            {/* Rotazione Sabato & Orari Ufficio (Ciclo su 3 Settimane) */}
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Rotazione Orari Ufficio (Ciclo 3 Settimane)
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  40h Standard per Tutti
                </span>
              </div>
              
              {/* Box riassunto orari ciclo 3 settimane */}
              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs text-blue-200 space-y-1.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>🔄</span> Ciclo continuo per Davide, Marco Caregnato e Andrea:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                  <div className="p-2 rounded-lg bg-blue-900/40 border border-blue-700/40">
                    <strong className="block text-amber-300 font-bold">1ª Settimana (Sabatista)</strong>
                    <span className="text-slate-300">Lun–Ven 7h (06:30–14:30)</span>
                    <span className="block text-emerald-400 font-semibold">+ Sabato 5h (07:00–12:00)</span>
                    <span className="text-[10px] text-slate-400">= 40h totali</span>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-900/40 border border-blue-700/40">
                    <strong className="block text-cyan-300 font-bold">2ª Settimana (Apertura 8h)</strong>
                    <span className="text-slate-300">Lun–Ven 8h (06:30–15:30)</span>
                    <span className="block text-slate-400 font-semibold">Sabato Riposo</span>
                    <span className="text-[10px] text-slate-400">= 40h totali</span>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-900/40 border border-blue-700/40">
                    <strong className="block text-amber-400 font-bold">3ª Settimana (Chiusura 8h)</strong>
                    <span className="text-slate-300">Lun–Ven 8h (08:30–17:30)</span>
                    <span className="block text-slate-400 font-semibold">Sabato Riposo</span>
                    <span className="text-[10px] text-slate-400">= 40h totali</span>
                  </div>
                </div>
                <p className="text-[10px] text-blue-300/80 pt-1">
                  Presidio garantito: 2 persone in ufficio alle 06:30 tutti i giorni (1ª e 2ª settimana) e chiusura delle 17:30 sempre coperta (3ª settimana).
                </p>
              </div>

              <p className="text-[11px] text-slate-400">
                L'ordine sequenziale stabilisce chi fa il sabato dopo chi (Davide → Marco Caregnato → Andrea). Usa le frecce per riordinare la sequenza di ciclo.
              </p>

              <div className="space-y-1.5">
                {rules.sabatoUfficioIds.map((id, idx) => (
                  <div
                    key={id}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-slate-200">
                      {idx + 1}. {workerMap[id] || id}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        disabled={idx === 0}
                        onClick={() => moveSaturdayOrder(idx, -1)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
                        title="Sposta in alto"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        disabled={idx === rules.sabatoUfficioIds.length - 1}
                        onClick={() => moveSaturdayOrder(idx, 1)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
                        title="Sposta in basso"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeSaturdayWorker(idx)}
                        className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        title="Rimuovi"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <select
                  value={selectedToAdd}
                  onChange={(e) => setSelectedToAdd(e.target.value)}
                  className="flex-1 p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                >
                  <option value="">Aggiungi collaboratore alla rotazione...</option>
                  {appData.workers
                    .filter(w => !rules.sabatoUfficioIds.includes(w.id) && ['MANAGER', 'EDILE'].includes(w.group))
                    .map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                </select>
                <button
                  onClick={addSaturdayWorker}
                  disabled={!selectedToAdd}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Aggiungi</span>
                </button>
              </div>
            </div>

            {/* Coppie Magazzino */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Coppia Magazzino A</span>
                <div className="text-xs font-bold text-slate-200">
                  {rules.magPairA.map(id => workerMap[id] || id).join(' + ')}
                </div>
                <p className="text-[10px] text-slate-400">Sabato a settimane alterne con Coppia B</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Coppia Magazzino B</span>
                <div className="text-xs font-bold text-slate-200">
                  {rules.magPairB.map(id => workerMap[id] || id).join(' + ')}
                </div>
                <p className="text-[10px] text-slate-400">Sabato a settimane alterne con Coppia A</p>
              </div>
            </div>

            {/* Minimi di Copertura Apertura / Sabato */}
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Presidi Minimi di Copertura
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase block">Mag Lun-Ven (06:30)</label>
                  <input
                    type="number"
                    value={rules.minAperturaMag}
                    onChange={(e) => setRules(r => ({ ...r, minAperturaMag: Number(e.target.value) }))}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 font-bold text-white mt-1"
                    min={1}
                    max={5}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase block">Imp Lun-Ven (06:30)</label>
                  <input
                    type="number"
                    value={rules.minAperturaImp}
                    onChange={(e) => setRules(r => ({ ...r, minAperturaImp: Number(e.target.value) }))}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 font-bold text-white mt-1"
                    min={1}
                    max={5}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase block">Mag Sabato (07:00)</label>
                  <input
                    type="number"
                    value={rules.minSabatoMag}
                    onChange={(e) => setRules(r => ({ ...r, minSabatoMag: Number(e.target.value) }))}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 font-bold text-white mt-1"
                    min={1}
                    max={5}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase block">Imp Sabato (07:00)</label>
                  <input
                    type="number"
                    value={rules.minSabatoImp}
                    onChange={(e) => setRules(r => ({ ...r, minSabatoImp: Number(e.target.value) }))}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 font-bold text-white mt-1"
                    min={1}
                    max={5}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Azioni Modale */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          {resetConfirmOpen ? (
            <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 p-1.5 rounded-xl text-xs">
              <span className="text-amber-200 font-bold px-1">Confermi il ripristino default?</span>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow transition cursor-pointer"
              >
                Sì, Ripristina
              </button>
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setResetConfirmOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ripristina Default</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Chiudi
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Salva Modifiche</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
