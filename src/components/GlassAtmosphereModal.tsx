import React from 'react';
import { Sparkles, Sliders, Volume2, VolumeX, X, Check } from 'lucide-react';
import { playGlassTap, playGlassSuccess, toggleSoundEffects, isSoundEnabled } from '../services/soundFx';

export type GlassIntensity = 'frosted' | 'crystal' | 'deep';
export type GlassAura = 'cosmic' | 'emerald' | 'solar' | 'rose';

interface GlassAtmosphereModalProps {
  open: boolean;
  onClose: () => void;
  intensity: GlassIntensity;
  onChangeIntensity: (val: GlassIntensity) => void;
  aura: GlassAura;
  onChangeAura: (val: GlassAura) => void;
}

export const GlassAtmosphereModal: React.FC<GlassAtmosphereModalProps> = ({
  open,
  onClose,
  intensity,
  onChangeIntensity,
  aura,
  onChangeAura
}) => {
  const [soundActive, setSoundActive] = React.useState<boolean>(isSoundEnabled());

  if (!open) return null;

  const handleToggleSound = () => {
    const next = toggleSoundEffects();
    setSoundActive(next);
    if (next) playGlassSuccess();
  };

  const auraPresets: Array<{ id: GlassAura; name: string; desc: string; gradient: string; previewClass: string }> = [
    {
      id: 'cosmic',
      name: 'Cosmic Cyan & Violet',
      desc: 'Ispirato ad Apple VisionOS e macOS Sonoma (Default)',
      gradient: 'from-cyan-500 via-blue-500 to-purple-600',
      previewClass: 'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600'
    },
    {
      id: 'emerald',
      name: 'Emerald Aurora',
      desc: 'Frequenze bio-rilassanti smeraldo, menta e indaco',
      gradient: 'from-emerald-400 via-teal-500 to-blue-600',
      previewClass: 'bg-gradient-to-r from-emerald-400 via-teal-500 to-blue-600'
    },
    {
      id: 'solar',
      name: 'Solar Titanium & Amber',
      desc: 'Riflessi caldi in titanio spazzolato, oro e ardesia',
      gradient: 'from-amber-400 via-orange-500 to-slate-700',
      previewClass: 'bg-gradient-to-r from-amber-400 via-orange-500 to-slate-700'
    },
    {
      id: 'rose',
      name: 'Rose Gold Nebula',
      desc: 'Tonalità magenta, zaffiro e violetto etereo',
      gradient: 'from-pink-500 via-purple-600 to-indigo-700',
      previewClass: 'bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-700'
    }
  ];

  const intensityPresets: Array<{ id: GlassIntensity; name: string; blur: string; desc: string }> = [
    {
      id: 'frosted',
      name: 'VisionOS Frosted Glass',
      blur: '28px',
      desc: 'Equilibrio perfetto tra trasparenza e rifrazione ottica satinata'
    },
    {
      id: 'crystal',
      name: 'Liquid Crystal Pure',
      blur: '16px',
      desc: 'Cristallo puro ad alta brillantezza, ideale per la massima leggibilità'
    },
    {
      id: 'deep',
      name: 'Deep Space Nebula',
      blur: '36px',
      desc: 'Vetro satinato pesante a contrasto profondo per ambienti immersivi'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl glass-panel shadow-2xl overflow-hidden border border-white/20 p-5 sm:p-6 space-y-5 animate-scale-in">
        {/* Header Modale */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-cyan-400 flex items-center justify-center text-xl shadow-lg shadow-purple-500/20">
              ✨
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Atmosfera & Esperienza Spaziale</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  VisionOS Tier
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalizza profondità ottica, aura luminosa e feedback aptici
              </p>
            </div>
          </div>
          <button
            onClick={() => { playGlassTap(); onClose(); }}
            className="p-1.5 rounded-xl glass-btn-ghost hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Selezione Palette Aura Luminosa */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Palette Rifrazione Aurorale</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {auraPresets.map(preset => {
              const active = aura === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    playGlassTap();
                    onChangeAura(preset.id);
                  }}
                  className={`p-3 rounded-2xl text-left transition-all border flex flex-col justify-between gap-2 cursor-pointer ${
                    active
                      ? 'glass-card ring-2 ring-blue-500 bg-blue-500/15 border-blue-400/50 shadow-md shadow-blue-500/20'
                      : 'glass-card hover:border-white/20 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-4 w-4 rounded-full ${preset.previewClass} shadow-sm`} />
                      <span className="text-xs font-black text-slate-900 dark:text-white">{preset.name}</span>
                    </div>
                    {active && <Check className="w-4 h-4 text-blue-400" />}
                  </div>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight">
                    {preset.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Intensità Vetro & Sfocatura Satinata */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span>Profondità Ottica (Backdrop Blur)</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {intensityPresets.map(preset => {
              const active = intensity === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    playGlassTap();
                    onChangeIntensity(preset.id);
                  }}
                  className={`p-3 rounded-2xl text-left transition-all border flex flex-col justify-between gap-1.5 cursor-pointer ${
                    active
                      ? 'glass-card ring-2 ring-blue-500 bg-blue-500/15 border-blue-400/50 shadow-md'
                      : 'glass-card hover:border-white/20 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white">{preset.name}</span>
                    {active && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                  <div className="text-[10px] font-mono text-blue-400 font-bold">{preset.blur} blur</div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    {preset.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Feedback Tattile & Suoni Cristallo */}
        <div className="p-3.5 rounded-2xl glass-card border border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${soundActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
              {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-white">
                Feedback Acustico Interazioni UI
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Suoni di cristallo sintetizzati in tempo reale al click e allo scambio turni
              </div>
            </div>
          </div>
          <button
            onClick={handleToggleSound}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              soundActive
                ? 'glass-btn-primary shadow-sm'
                : 'glass-btn-ghost text-slate-400'
            }`}
          >
            {soundActive ? 'Attivo 🔊' : 'Muto 🔇'}
          </button>
        </div>

        {/* Chiusura */}
        <div className="flex items-center justify-end pt-2 border-t border-white/10">
          <button
            onClick={() => { playGlassSuccess(); onClose(); }}
            className="glass-btn-primary px-5 py-2 rounded-xl text-xs font-black text-white cursor-pointer shadow-lg shadow-blue-500/25"
          >
            Applica Atmosfera
          </button>
        </div>
      </div>
    </div>
  );
};
