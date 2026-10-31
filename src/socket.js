import { WebSocketServer, WebSocket } from 'ws';
import { events, getUser, getAllUsers } from './state.js';

const HEARTBEAT_INTERVAL = 30000;
const OP = { EVENT: 0, HELLO: 1, INITIALIZE: 2, HEARTBEAT: 3 };
const MAX_CONNECTIONS_PER_IP = 10;
const MAX_SUBSCRIPTIONS = 50;
const connectionsPerIp = new Map();

export function attachSocket(server) {
  const wss = new WebSocketServer({ server, path: '/socket', maxPayload: 4096 });

  wss.on('connection', (ws, req) => {
    ws.subscriptions = new Set();
    ws.subscribeAll = false;
    let seq = 0;

    ws.sendEvent = (t, d) => {
      if (ws.readyState !== WebSocket.OPEN) return;
      seq++;
      ws.send(JSON.stringify({ op: OP.EVENT, seq, t, d }));
    };

    const ip = req.socket.remoteAddress;
    const count = connectionsPerIp.get(ip) ?? 0;
    if (count >= MAX_CONNECTIONS_PER_IP) {
      return ws.close(4008, 'Too many connections');
    }
    connectionsPerIp.set(ip, count + 1);
    ws.on('close', () => {
      const left = (connectionsPerIp.get(ip) ?? 1) - 1;
      if (left <= 0) connectionsPerIp.delete(ip);
      else connectionsPerIp.set(ip, left);
    });

    let timeout;
    const resetTimeout = () => {
      clearTimeout(timeout);
      timeout = setTimeout(
        () => ws.close(4004, 'Heartbeat timeout'),
        HEARTBEAT_INTERVAL + 10000
      );
    };
    resetTimeout();
    ws.on('close', () => clearTimeout(timeout));

    ws.send(JSON.stringify({ op: OP.HELLO, d: { heartbeat_interval: HEARTBEAT_INTERVAL } }));

    ws.on('message', (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return ws.close(4005, 'Invalid JSON');
      }

      if (msg.op === OP.HEARTBEAT) {
        resetTimeout();
        return;
      }

      if (msg.op === OP.INITIALIZE) {
        resetTimeout();
        const d = msg.d ?? {};

        if (d.subscribe_to_all) {
          ws.subscribeAll = true;
          ws.sendEvent('INIT_STATE', getAllUsers());
        } else if (Array.isArray(d.subscribe_to_ids)) {
          if (d.subscribe_to_ids.length > MAX_SUBSCRIPTIONS) {
            return ws.close(4007, 'Too many subscriptions');
          }
          const state = {};
          for (const id of d.subscribe_to_ids.map(String)) {
            ws.subscriptions.add(id);
            const user = getUser(id);
            if (user) state[id] = user;
          }
          ws.sendEvent('INIT_STATE', state);
        } else if (d.subscribe_to_id) {
          const id = String(d.subscribe_to_id);
          ws.subscriptions.add(id);
          ws.sendEvent('INIT_STATE', getUser(id) ?? null);
        } else {
          ws.close(4006, 'Missing subscribe_to_id, subscribe_to_ids or subscribe_to_all');
        }
      }
    });
  });

  function broadcast(id, type, data) {
    for (const ws of wss.clients) {
      if (ws.subscribeAll || ws.subscriptions?.has(id)) ws.sendEvent?.(type, data);
    }
  }

  events.on('update', (id, data) => broadcast(id, 'PRESENCE_UPDATE', data));
  events.on('remove', (id) => broadcast(id, 'USER_REMOVED', { id }));
}