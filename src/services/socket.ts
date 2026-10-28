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

class RealtimeSocketManager {
  private ws: WebSocket | null = null;
  private status: SocketStatus = 'disconnected';
  private statusListeners = new Set<(status: SocketStatus, clientCount: number) => void>();
  private dataListeners = new Set<(data: AppData, meta: { sourceClientId?: string; changeType?: string; description?: string }) => void>();
  private notificationListeners = new Set<(title: string, body: string) => void>();
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private clientId: string;
  private clientCount = 1;

  constructor() {
    this.clientId = this.getOrCreateClientId();
  }

  private getOrCreateClientId(): string {
    try {
      let id = sessionStorage.getItem('turni_client_id');
      if (!id) {
        id = 'usr_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
        sessionStorage.setItem('turni_client_id', id);
      }
      return id;
    } catch (e) {
      return 'usr_' + Date.now();
    }
  }

  public getClientId(): string {
    return this.clientId;
  }

  public getStatus(): SocketStatus {
    return this.status;
  }

  public getClientCount(): number {
    return this.clientCount;
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus('connecting');

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.setStatus('connected');
        clearTimeout(this.reconnectTimer);
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: SocketMessage = JSON.parse(event.data);

          if (msg.type === 'init' && msg.data) {
            if (msg.connectedClients) {
              this.clientCount = msg.connectedClients;
            }
            this.emitData(msg.data, { changeType: 'initial_sync' });
          } else if (msg.type === 'data_updated' && msg.data) {
            this.emitData(msg.data, {
              sourceClientId: msg.sourceClientId,
              changeType: msg.changeType,
              description: msg.description
            });

            // Se l'aggiornamento arriva da un altro dispositivo
            if (msg.sourceClientId && msg.sourceClientId !== this.clientId) {
              const desc = msg.description || 'Modifiche sincronizzate in tempo reale da un altro collega.';
              this.emitNotification('🔄 Sincronizzazione Live', desc);
            }
          } else if (msg.type === 'presence_updated') {
            if (typeof msg.connectedClients === 'number') {
              this.clientCount = msg.connectedClients;
              this.notifyStatus();
            }
          }
        } catch (err) {
          console.warn('[WS] Errore parsing messaggio server:', err);
        }
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.setStatus('disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.setStatus('error');
      };
    } catch (e) {
      this.setStatus('error');
      this.scheduleReconnect();
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect() {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 3000);
  }

  private setStatus(s: SocketStatus) {
    this.status = s;
    this.notifyStatus();
  }

  private notifyStatus() {
    this.statusListeners.forEach((fn) => fn(this.status, this.clientCount));
  }

  private emitData(data: AppData, meta: { sourceClientId?: string; changeType?: string; description?: string }) {
    this.dataListeners.forEach((fn) => fn(data, meta));
  }

  private emitNotification(title: string, body: string) {
    this.notificationListeners.forEach((fn) => fn(title, body));
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

  public sendDataUpdate(data: AppData, changeType: string, description: string, pushNotification?: { title: string; body: string; url?: string }) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'update_data',
        clientId: this.clientId,
        data,
        changeType,
        description,
        pushNotification
      }));
    } else {
      // Fallback via HTTP POST
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data,
          clientId: this.clientId,
          changeType,
          description,
          pushNotification
        })
      }).catch((e) => console.warn('Fallback HTTP POST fallito:', e));
    }
  }
}

export const socketManager = new RealtimeSocketManager();
