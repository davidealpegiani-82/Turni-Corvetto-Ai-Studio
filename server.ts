import 'dotenv/config';
import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import webpush from 'web-push';
import { createServer as createViteServer } from 'vite';
import { createDefaultAppData } from './src/data/initialData';
import { AppData, PushSubscriptionRecord } from './src/types/turni';
import { handleAICopilot } from './src/services/aiCopilotServer';
import { reconcileAllLeavesWithWeeks } from './src/services/engine';

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const VAPID_FILE = path.join(DATA_DIR, 'vapid.json');
const SUBS_FILE = path.join(DATA_DIR, 'push_subscriptions.json');

// Assicura l'esistenza della directory dati
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Inizializza chiavi VAPID per notifiche push reali
let vapidKeys: { publicKey: string; privateKey: string };
if (fs.existsSync(VAPID_FILE)) {
  try {
    vapidKeys = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf-8'));
  } catch (e) {
    vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2));
  }
} else {
  vapidKeys = webpush.generateVAPIDKeys();
  fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2));
}

webpush.setVapidDetails(
  'mailto:davide.alpegiani@gmail.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Inizializza o carica i dati persistiti
let appData: AppData;
const FIREBASE_RTDB_URL = 'https://turni-corvetto-fca14-default-rtdb.firebaseio.com/turni_data_v47_pdf.json';

if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    appData = JSON.parse(raw);
    if (!appData.workers || !appData.workers.length) {
      appData = createDefaultAppData();
    }
    appData.leaveBalances = appData.leaveBalances || {};
  } catch (e) {
    console.warn('Errore lettura DB locale, uso default:', e);
    appData = createDefaultAppData();
  }
} else {
  appData = createDefaultAppData();
  fs.writeFileSync(DB_FILE, JSON.stringify(appData, null, 2));
}
appData.leaveBalances = appData.leaveBalances || {};

// Assicura che le competenze, abilitazioni e profili (profile) siano presenti per ogni lavoratore
const defaultWorkers = createDefaultAppData().workers;
let profilesEnriched = false;
appData.workers = (appData.workers || []).map(w => {
  if (!w.profile || !w.profile.qualifications || Object.keys(w.profile.qualifications).length === 0) {
    const def = defaultWorkers.find(dw => dw.id === w.id || dw.name.trim().toUpperCase() === w.name.trim().toUpperCase());
    if (def && def.profile) {
      profilesEnriched = true;
      return {
        ...w,
        profile: {
          ...def.profile,
          ...(w.profile || {})
        }
      };
    }
  }
  return w;
});

if (profilesEnriched) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(appData, null, 2));
    console.log('[DB] Profili ed abilitazioni collaboratori riallineati con successo.');
  } catch (e) {
    console.warn('[DB] Errore salvataggio profili:', e);
  }
}

// Riconciliazione automatica di tutte le assenze e turni (ripulisce residui e sincronizza date esatte)
try {
  appData.weeks = appData.weeks || {};
  appData.leaveRequests = appData.leaveRequests || [];
  reconcileAllLeavesWithWeeks(appData.weeks, appData.leaveRequests, appData);
  fs.writeFileSync(DB_FILE, JSON.stringify(appData, null, 2));
  console.log('[DB] Riconciliazione turni e assenze completata con successo all\'avvio.');
} catch (e) {
  console.warn('[DB] Errore riconciliazione turni-assenze:', e);
}

// Sincronizzazione automatica con Firebase Realtime Database
async function syncToFirebase(data: AppData) {
  try {
    const res = await fetch(FIREBASE_RTDB_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      console.log('[Firebase RTDB] Cloud sincronizzato con successo.');
    }
  } catch (err) {
    console.warn('[Firebase RTDB] Errore sync cloud:', err);
  }
}

async function loadFromFirebaseCloud() {
  try {
    const res = await fetch(FIREBASE_RTDB_URL);
    if (res.ok) {
      const remote = await res.json();
      if (remote && Array.isArray(remote.workers) && remote.workers.length > 0) {
        const localWeeks = Object.keys(appData.weeks || {}).length;
        const remoteWeeks = Object.keys(remote.weeks || {}).length;
        if (remoteWeeks >= localWeeks) {
          appData = { ...appData, ...remote };
          // Garantisci che le competenze ed abilitazioni non vengano cancellate se il cloud ha una versione vecchia
          appData.workers = (appData.workers || []).map(w => {
            if (!w.profile || !w.profile.qualifications || Object.keys(w.profile.qualifications).length === 0) {
              const def = defaultWorkers.find(dw => dw.id === w.id || dw.name.trim().toUpperCase() === w.name.trim().toUpperCase());
              if (def && def.profile) {
                return {
                  ...w,
                  profile: {
                    ...def.profile,
                    ...(w.profile || {})
                  }
                };
              }
            }
            return w;
          });
          fs.writeFileSync(DB_FILE, JSON.stringify(appData, null, 2));
          console.log(`[Firebase RTDB] Sincronizzati ${remoteWeeks} settimane, ${(remote.leaveRequests || []).length} richieste, ${(remote.events || []).length} impegni.`);
        }
      }
    }
  } catch (err) {
    console.warn('[Firebase RTDB] Connessione cloud non disponibile:', err);
  }
}

// Carica eventuali aggiornamenti dal cloud
loadFromFirebaseCloud();

// Gestione sottoscrizioni push
let pushSubscriptions: PushSubscriptionRecord[] = [];
if (fs.existsSync(SUBS_FILE)) {
  try {
    pushSubscriptions = JSON.parse(fs.readFileSync(SUBS_FILE, 'utf-8'));
  } catch (e) {
    pushSubscriptions = [];
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(appData, null, 2));
    // Sincronizza anche con Firebase RTDB cloud in background
    syncToFirebase(appData);
  } catch (e) {
    console.error('Errore scrittura DB:', e);
  }
}

function saveSubscriptions() {
  try {
    fs.writeFileSync(SUBS_FILE, JSON.stringify(pushSubscriptions, null, 2));
  } catch (e) {
    console.error('Errore scrittura sottoscrizioni:', e);
  }
}

async function sendPushToAll(payload: { title: string; body: string; icon?: string; url?: string; tag?: string }) {
  if (!pushSubscriptions.length) return { sent: 0, failed: 0 };
  
  const payloadString = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icon.svg',
    badge: '/icon.svg',
    data: { url: payload.url || '/' },
    tag: payload.tag || `turni-${Date.now()}`
  });

  const deadEndpoints: string[] = [];
  let sent = 0;
  let failed = 0;

  await Promise.all(
    pushSubscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys
          },
          payloadString
        );
        sent++;
      } catch (err: any) {
        failed++;
        if (err.statusCode === 404 || err.statusCode === 410) {
          deadEndpoints.push(sub.endpoint);
        }
      }
    })
  );

  if (deadEndpoints.length > 0) {
    pushSubscriptions = pushSubscriptions.filter(s => !deadEndpoints.includes(s.endpoint));
    saveSubscriptions();
  }

  return { sent, failed };
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  app.use(express.json({ limit: '20mb' }));

  // WebSocket Server per Sincronizzazione in Tempo Reale
  const wss = new WebSocketServer({ server, path: '/ws' });
  const clients = new Set<WebSocket>();

  function broadcast(message: object, excludeClient?: WebSocket) {
    const raw = JSON.stringify(message);
    for (const client of clients) {
      if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
        client.send(raw);
      }
    }
  }

  function broadcastPresence() {
    broadcast({
      type: 'presence_updated',
      connectedClients: clients.size,
      serverTime: Date.now()
    });
  }

  wss.on('connection', (ws: WebSocket, req) => {
    clients.add(ws);
    console.log(`[WS] Nuovo client connesso. Totale attivi: ${clients.size}`);

    // Invia stato iniziale autorevole appena connesso
    ws.send(JSON.stringify({
      type: 'init',
      data: appData,
      connectedClients: clients.size,
      serverTime: Date.now()
    }));

    broadcastPresence();

    ws.on('message', async (messageData: string) => {
      try {
        const msg = JSON.parse(messageData.toString());

        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', time: Date.now() }));
          return;
        }

        if (msg.type === 'update_data') {
          if (msg.data && typeof msg.data === 'object') {
            appData = msg.data;
            appData.updatedAt = Date.now();
            appData.updatedBy = msg.clientId || 'remote_client';
            appData.updatedRevision = (Number(appData.updatedRevision) || 0) + 1;
            appData.weeks = appData.weeks || {};
            appData.leaveRequests = appData.leaveRequests || [];
            reconcileAllLeavesWithWeeks(appData.weeks, appData.leaveRequests, appData);

            saveDatabase();

            // Broadcast istantaneo a tutti gli altri client
            broadcast({
              type: 'data_updated',
              data: appData,
              revision: appData.updatedRevision,
              sourceClientId: msg.clientId,
              changeType: msg.changeType || 'generic',
              description: msg.description || ''
            }, ws);

            // Invia conferma al client mittente con il timestamp/revision aggiornati
            ws.send(JSON.stringify({
              type: 'ack',
              revision: appData.updatedRevision,
              updatedAt: appData.updatedAt
            }));

            // Se l'aggiornamento include una notifica push da inviare
            if (msg.pushNotification) {
              await sendPushToAll(msg.pushNotification);
            }
          }
        }
      } catch (err) {
        console.error('[WS] Errore elaborazione messaggio:', err);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`[WS] Client disconnesso. Rimanenti: ${clients.size}`);
      broadcastPresence();
    });

    ws.on('error', (err) => {
      console.warn('[WS] Errore connessione socket:', err);
      clients.delete(ws);
    });
  });

  // REST API Endpoints
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      version: appData.appVersion,
      connectedClients: clients.size,
      subscriptionsCount: pushSubscriptions.length,
      serverTime: new Date().toISOString()
    });
  });

  app.get('/api/data', (_req: Request, res: Response) => {
    res.json({
      data: appData,
      connectedClients: clients.size
    });
  });

  app.post('/api/data', async (req: Request, res: Response) => {
    try {
      const incoming = req.body.data;
      if (!incoming || typeof incoming !== 'object') {
        res.status(400).json({ error: 'Payload non valido' });
        return;
      }
      appData = incoming;
      appData.updatedAt = Date.now();
      appData.updatedBy = req.body.clientId || 'api';
      appData.updatedRevision = (Number(appData.updatedRevision) || 0) + 1;
      appData.weeks = appData.weeks || {};
      appData.leaveRequests = appData.leaveRequests || [];
      reconcileAllLeavesWithWeeks(appData.weeks, appData.leaveRequests, appData);
      saveDatabase();

      broadcast({
        type: 'data_updated',
        data: appData,
        revision: appData.updatedRevision,
        sourceClientId: req.body.clientId,
        changeType: req.body.changeType || 'api'
      });

      if (req.body.pushNotification) {
        await sendPushToAll(req.body.pushNotification);
      }

      res.json({
        success: true,
        revision: appData.updatedRevision,
        updatedAt: appData.updatedAt
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Errore salvataggio' });
    }
  });

  // Endpoint AI Copilot per Assistente Intelligente Turni & Audit
  app.post('/api/ai/copilot', async (req: Request, res: Response) => {
    try {
      const payload = req.body;
      if (!payload || !payload.message) {
        res.status(400).json({ error: 'Messaggio richiesto' });
        return;
      }
      const response = await handleAICopilot(payload, appData);
      res.json(response);
    } catch (err: any) {
      console.error('[API] Errore /api/ai/copilot:', err);
      res.status(500).json({ error: err.message || 'Errore interno elaborazione AI' });
    }
  });

  // Endpoint Notifiche Push
  app.get('/api/push/public-key', (_req: Request, res: Response) => {
    res.json({ publicKey: vapidKeys.publicKey });
  });

  app.post('/api/push/subscribe', (req: Request, res: Response) => {
    const sub = req.body;
    if (!sub || !sub.endpoint || !sub.keys) {
      res.status(400).json({ error: 'Sottoscrizione push non valida' });
      return;
    }

    const exists = pushSubscriptions.some(s => s.endpoint === sub.endpoint);
    if (!exists) {
      pushSubscriptions.push({
        endpoint: sub.endpoint,
        keys: sub.keys,
        userAgent: req.headers['user-agent'],
        createdAt: new Date().toISOString()
      });
      saveSubscriptions();
      console.log(`[Push] Nuova sottoscrizione registrata. Totale: ${pushSubscriptions.length}`);
    }

    res.json({
      success: true,
      totalSubscribers: pushSubscriptions.length
    });
  });

  app.post('/api/push/send', async (req: Request, res: Response) => {
    try {
      const { title, body, icon, url, tag } = req.body;
      if (!title || !body) {
        res.status(400).json({ error: 'Titolo e corpo richiesti per la notifica push' });
        return;
      }

      const result = await sendPushToAll({ title, body, icon, url, tag });
      res.json({
        success: true,
        ...result,
        totalSubscribers: pushSubscriptions.length
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Errore invio push' });
    }
  });

  // Sincronizzazione / Ricarica manuale da Firebase RTDB
  app.post('/api/firebase/resync', async (_req: Request, res: Response) => {
    try {
      await loadFromFirebaseCloud();
      broadcast({
        type: 'data_updated',
        data: appData,
        revision: appData.updatedRevision,
        changeType: 'firebase_resync'
      });
      res.json({
        success: true,
        weeksCount: Object.keys(appData.weeks || {}).length,
        leavesCount: (appData.leaveRequests || []).length,
        eventsCount: (appData.events || []).length
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Backup / Restore
  app.get('/api/backup', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=turni_backup_${Date.now()}.json`);
    res.send(JSON.stringify(appData, null, 2));
  });

  app.post('/api/backup/restore', (req: Request, res: Response) => {
    try {
      const restored = req.body;
      if (!restored || !Array.isArray(restored.workers)) {
        res.status(400).json({ error: 'File backup non valido' });
        return;
      }
      appData = restored;
      appData.updatedAt = Date.now();
      appData.updatedBy = 'backup_restore';
      appData.updatedRevision = (Number(appData.updatedRevision) || 0) + 1;
      saveDatabase();

      broadcast({
        type: 'data_updated',
        data: appData,
        revision: appData.updatedRevision,
        changeType: 'backup_restore'
      });

      res.json({ success: true, revision: appData.updatedRevision });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Integrazione Vite (dev vs prod)
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🚀 Turni Corvetto Live Server avviato su porta ${PORT}`);
    console.log(`📡 WebSocket real-time attivo su ws://0.0.0.0:${PORT}/ws`);
    console.log(`🔔 Notifiche Web Push attive con VAPID keys`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('Errore fatale avvio server:', err);
  process.exit(1);
});
