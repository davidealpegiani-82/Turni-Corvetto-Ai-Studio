import { AppData } from '../types/turni';

export type SocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface SocketMessage {
  type: string;
  data?: any;
  revision?: number;
  sourceClientId?: string;
  changeType?: string;
  description?: string;
  connectedClients?: number;
  serverTime?: number;
}

// Hosting statico: Firebase Realtime Database REST sostituisce il server Node/WebSocket.
// Le scritture usano ETag + If-Match: se un altro dispositivo salva prima, non sovrascriviamo i suoi dati.
const FIREBASE_URL = 'https://turni-corvetto-fca14-default-rtdb.firebaseio.com/turni_data_v47_pdf.json';
const LOCAL_CACHE_KEY = 'turni_corvetto_free_cache_v1';

class RealtimeSocketManager {
  private stream: EventSource | null = null;
  private status: SocketStatus = 'disconnected';
  private statusListeners = new Set<(status: SocketStatus, clientCount: number) => void>();
  private dataListeners = new Set<(data: AppData, meta: { sourceClientId?: string; changeType?: string; description?: string }) => void>();
  private notificationListeners = new Set<(title: string, body: string) => void>();
  private clientId = this.getOrCreateClientId();
  private etag: string | null = null;
  private clientCount = 1;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private writeQueue: Promise<void> = Promise.resolve();
  private lastRemoteSignature = '';

  private getOrCreateClientId(): string {
    try {
      let id = sessionStorage.getItem('turni_client_id');
      if (!id) {
        id = 'usr_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
        sessionStorage.setItem('turni_client_id', id);
      }
      return id;
    } catch {
      return 'usr_' + Date.now();
    }
  }

  public getClientId(): string { return this.clientId; }
  public getStatus(): SocketStatus { return this.status; }
  public getClientCount(): number { return this.clientCount; }
  public async refreshNow() { await this.refreshRemote(); }

  private setStatus(status: SocketStatus) {
    this.status = status;
    this.statusListeners.forEach(fn => fn(this.status, this.clientCount));
  }

  private emitData(data: AppData, meta: { sourceClientId?: string; changeType?: string; description?: string }) {
    this.dataListeners.forEach(fn => fn(data, meta));
  }

  private emitNotification(title: string, body: string) {
    this.notificationListeners.forEach(fn => fn(title, body));
  }

  private cache(data: AppData) {
    try { localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(data)); } catch {}
  }

  private async readCloud(emit = false): Promise<AppData> {
    const response = await fetch(FIREBASE_URL, {
      method: 'GET',
      headers: { 'X-Firebase-ETag': 'true', 'Cache-Control': 'no-cache' },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`Firebase HTTP ${response.status}`);
    const data = await response.json() as AppData | null;
    this.etag = response.headers.get('ETag') || this.etag;
    if (!data || !Array.isArray(data.workers) || data.workers.length === 0) {
      throw new Error('Il database Firebase non contiene una programmazione valida.');
    }
    this.cache(data);
    const signature = JSON.stringify([data.updatedRevision, data.updatedAt, data.updatedBy]);
    if (emit && signature !== this.lastRemoteSignature) {
      this.lastRemoteSignature = signature;
      const sourceClientId = data.updatedBy || 'firebase';
      this.emitData(data, {
        sourceClientId,
        changeType: 'firebase_realtime',
        description: sourceClientId !== this.clientId ? 'Modifiche sincronizzate da un altro dispositivo.' : undefined
      });
      if (sourceClientId !== this.clientId) {
        this.emitNotification('🔄 Sincronizzazione Cloud', 'Sono arrivati aggiornamenti da un altro dispositivo.');
      }
    }
    return data;
  }

  private async refreshRemote() {
    try {
      await this.readCloud(true);
      this.setStatus('connected');
    } catch (error) {
      console.warn('[Firebase] Aggiornamento remoto non riuscito:', error);
      this.setStatus('error');
    }
  }

  public async connect() {
    if (this.stream) return;
    this.setStatus('connecting');

    try {
      const data = await this.readCloud(false);
      this.lastRemoteSignature = JSON.stringify([data.updatedRevision, data.updatedAt, data.updatedBy]);
      this.emitData(data, { changeType: 'initial_sync', description: 'Dati caricati da Firebase.' });
      this.setStatus('connected');
    } catch (error) {
      console.warn('[Firebase] Caricamento cloud non riuscito:', error);
      try {
        const cached = localStorage.getItem(LOCAL_CACHE_KEY);
        if (cached) {
          const data = JSON.parse(cached) as AppData;
          if (Array.isArray(data.workers) && data.workers.length) {
            this.emitData(data, { changeType: 'offline_cache', description: 'Copia locale: connessione cloud non disponibile.' });
          }
        }
      } catch {}
      this.setStatus('error');
    }

    // Firebase REST supporta gli aggiornamenti in streaming SSE: nessun server WebSocket da mantenere.
    try {
      this.stream = new EventSource(FIREBASE_URL);
      this.stream.onopen = () => this.setStatus('connected');
      const onRemoteChange = () => {
        if (this.refreshTimer) clearTimeout(this.refreshTimer);
        this.refreshTimer = setTimeout(() => { void this.refreshRemote(); }, 180);
      };
      this.stream.addEventListener('put', onRemoteChange);
      this.stream.addEventListener('patch', onRemoteChange);
      this.stream.onerror = () => {
        this.setStatus('disconnected');
      };
    } catch (error) {
      console.warn('[Firebase] Streaming non disponibile:', error);
      this.setStatus('error');
    }
  }

  public sendDataUpdate(
    data: AppData,
    changeType: string,
    description: string,
    _pushNotification?: { title: string; body: string; url?: string }
  ) {
    // Serializza le scritture e usa il token ETag più recente.
    this.writeQueue = this.writeQueue.then(async () => {
      try {
        if (!this.etag) await this.readCloud(false);
        const response = await fetch(FIREBASE_URL, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'if-match': this.etag || 'null'
          },
          body: JSON.stringify(data)
        });

        if (response.status === 412) {
          const current = await this.readCloud(false);
          this.emitData(current, {
            sourceClientId: 'server-conflict',
            changeType: 'revision_conflict',
            description: 'Un altro dispositivo ha salvato prima di questa modifica. I dati cloud sono stati protetti.'
          });
          this.emitNotification('⚠️ Conflitto di modifica', 'Ho recuperato la versione cloud più recente. Controlla i turni prima di ripetere la modifica.');
          return;
        }
        if (!response.ok) throw new Error(`Firebase HTTP ${response.status}`);

        this.etag = response.headers.get('ETag') || null;
        this.cache(data);
        this.lastRemoteSignature = JSON.stringify([data.updatedRevision, data.updatedAt, data.updatedBy]);
        this.setStatus('connected');
        console.info('[Firebase] Salvataggio confermato:', changeType, description);
      } catch (error) {
        console.error('[Firebase] Salvataggio non riuscito:', error);
        this.cache(data);
        this.setStatus('error');
        this.emitNotification('⚠️ Salvataggio non confermato', 'La modifica è conservata nella cache di questo dispositivo, ma non risulta sincronizzata. Verifica la connessione e riprova.');
      }
    }).catch(error => console.error('[Firebase] Coda salvataggi:', error));
  }

  public onStatusChange(callback: (status: SocketStatus, clientCount: number) => void) {
    this.statusListeners.add(callback);
    callback(this.status, this.clientCount);
    return () => this.statusListeners.delete(callback);
  }

  public onDataUpdate(callback: (data: AppData, meta: { sourceClientId?: string; changeType?: string; description?: string }) => void) {
    this.dataListeners.add(callback);
    return () => this.dataListeners.delete(callback);
  }

  public onRemoteNotification(callback: (title: string, body: string) => void) {
    this.notificationListeners.add(callback);
    return () => this.notificationListeners.delete(callback);
  }

  public disconnect() {
    this.stream?.close();
    this.stream = null;
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = null;
    this.setStatus('disconnected');
  }
}

export const socketManager = new RealtimeSocketManager();
