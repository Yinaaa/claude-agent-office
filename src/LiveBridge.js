/**
 * LiveBridge — shared WebSocket connection to the agent-office server.
 *
 * Both AgentState and AppMonitor import this singleton so they share
 * a single connection. Messages are routed by `msg.type`.
 */
class LiveBridgeClass {
    constructor() {
        this._ws        = null;
        this._handlers  = {};   // type → [fn]
        this._connected = false;
        this._retryMs   = 3000;
    }

    /** Register a handler for a specific message type (or '*' for all) */
    on(type, handler) {
        if (!this._handlers[type]) this._handlers[type] = [];
        this._handlers[type].push(handler);
        return this;
    }

    /** Open (or reuse) the WebSocket connection */
    connect(url = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3141') {
        if (this._ws && this._ws.readyState <= 1) return; // already open/opening
        try {
            this._ws = new WebSocket(url);

            this._ws.onopen = () => {
                this._connected = true;
                console.log('[LiveBridge] ✓ Connected to agent server');
                this._dispatch('connected', {});
            };

            this._ws.onmessage = (evt) => {
                try {
                    const msg = JSON.parse(evt.data);
                    const type = msg.type ?? 'unknown';
                    this._dispatch(type, msg);
                    this._dispatch('*', msg);
                } catch { /* ignore malformed */ }
            };

            this._ws.onclose = () => {
                this._connected = false;
                this._ws = null;
                console.log(`[LiveBridge] Disconnected — retrying in ${this._retryMs}ms`);
                this._dispatch('disconnected', {});
                setTimeout(() => this.connect(url), this._retryMs);
            };

            this._ws.onerror = () => { /* handled in onclose */ };
        } catch (e) {
            console.warn('[LiveBridge] WebSocket not available:', e.message);
        }
    }

    get connected() { return this._connected; }

    _dispatch(type, msg) {
        (this._handlers[type] ?? []).forEach(h => { try { h(msg); } catch { } });
    }
}

export const LiveBridge = new LiveBridgeClass();
