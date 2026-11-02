// Minimal room relay for online play. Deploy on Render / Fly / Railway (Vercel can't hold WebSockets).
// Run: cd server && npm i && node relay.js     Then set VITE_WS_URL=wss://your-relay-host in the game's env.
import { WebSocketServer } from 'ws';

const rooms = new Map();
const wss = new WebSocketServer({ port: process.env.PORT || 8080 });
wss.on('connection', (ws, req) => {
  const room = new URL(req.url, 'http://relay').searchParams.get('room') || 'LOBBY';
  if (!rooms.has(room)) rooms.set(room, new Set());
  const peers = rooms.get(room); peers.add(ws);
  ws.on('message', d => { for (const o of peers) if (o !== ws && o.readyState === 1) o.send(d.toString()); });
  ws.on('close', () => { peers.delete(ws); if (!peers.size) rooms.delete(room); });
});
console.log('Island Echoes relay listening');
