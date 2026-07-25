const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/live";

export class IDSWebSocket {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.pingInterval = null;
    this.reconnectDelay = 2000;
    this.maxReconnectAttempts = 10;
    this.reconnectAttempts = 0;
    this.shouldReconnect = false;
  }

  connect(onMessage, onStatusChange) {
    this.shouldReconnect = true;
    this._connect(onMessage, onStatusChange);
  }

  _connect(onMessage, onStatusChange) {
    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log("🔌 WebSocket connected");
        this.reconnectAttempts = 0;
        onStatusChange?.("connected");
        this._startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "pong") return;
          onMessage?.(data);
        } catch (e) {
          console.error("WS parse error:", e);
        }
      };

      this.ws.onclose = () => {
        this._stopPing();
        onStatusChange?.("disconnected");
        if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = this.reconnectDelay * this.reconnectAttempts;
          console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`);
          setTimeout(() => this._connect(onMessage, onStatusChange), delay);
        }
      };

      this.ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        onStatusChange?.("error");
      };
    } catch (e) {
      console.error("WS init error:", e);
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    this._stopPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  _startPing() {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send("ping");
      }
    }, 20000);
  }

  _stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const idsWebSocket = new IDSWebSocket();