import { PushSubscriptionRecord } from '../types/turni';

// Suono discreto di notifica sintetizzato con Web Audio API.
export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.25);
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
    osc1.start(now); osc1.stop(now + 0.18); osc2.start(now + 0.12); osc2.stop(now + 0.35);
    window.setTimeout(() => { void ctx.close(); }, 500);
  } catch {}
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const base = import.meta.env.BASE_URL || '/';
    return await navigator.serviceWorker.register(`${base}sw.js`, { scope: base });
  } catch (err) {
    console.warn('[PWA] Registrazione Service Worker fallita:', err);
    return null;
  }
}

// Le notifiche push richiedono un servizio mittente protetto. Su GitHub Pages statico
// non esponiamo chiavi private nel browser: restano attive le notifiche in-app/realtime.
export async function getPushSubscription(): Promise<PushSubscription | null> {
  return null;
}

export async function requestPushSubscription(): Promise<{ success: boolean; error?: string; subscription?: PushSubscription }> {
  return { success: false, error: 'Le notifiche push in background non sono disponibili nella versione gratuita senza server. Gli aggiornamenti in tempo reale e gli avvisi interni all’app restano attivi.' };
}

export async function triggerPushNotification(_payload: {
  title: string; body: string; icon?: string; url?: string; tag?: string;
}): Promise<boolean> {
  return false;
}
