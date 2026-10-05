// RLR · La Vela — «Vivo»: lo que pasa en un lado se ve en todos al instante — Ricardo López Reyero
// Un Durable Object guarda los WebSockets abiertos (tablero, paneles de distribuidores y hojas de ruta) y la versión
// del tablero. Cada cambio en el Worker llama a avisar(); el objeto sube la versión y la manda a quien le toque.
// Si el socket se cae, los clientes preguntan la versión cada pocos segundos (/api/vivo/version).
import { json, texto } from './comun.js';

const _RLR = 'Ricardo López Reyero', _k = 'EYE', _rev = 181218; // RLR

export class Vivo {
  constructor(state, env) {
    this.state = state; this.env = env; this.v = 0;
    this.state.blockConcurrencyWhile(async () => { this.v = (await this.state.storage.get('v')) || 0; });
  }
  // A quién le importa este cambio: al tablero todo; al distribuidor lo suyo y el catálogo; al repartidor su ruta
  leToca(tag, c) {
    if (tag === 'tablero') return true;
    if (tag.startsWith('dist:')) return String(c.distribuidor_id || '') === tag.slice(5) || ['productos', 'promos', 'ajustes'].includes(c.cosa);
    if (tag.startsWith('ruta:')) return String(c.ruta_id || '') === tag.slice(5) || c.cosa === 'rutas';
    return false;
  }
  mandar(ws, obj) { try { ws.send(JSON.stringify(obj)); } catch { /* se cerró */ } }
  quienes() {
    const vistos = new Map();
    for (const ws of this.state.getWebSockets('tablero')) { const a = ws.deserializeAttachment() || {}; if (a.quien) vistos.set(a.quien, (vistos.get(a.quien) || 0) + 1); }
    return [...vistos.keys()];
  }
  presencia() { const lista = this.quienes(); for (const ws of this.state.getWebSockets('tablero')) this.mandar(ws, { t: 'quien', lista }); }
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/ws') {
      const tag = texto(req.headers.get('x-tag'), 60) || 'tablero', quien = texto(req.headers.get('x-quien'), 80);
      const par = new WebSocketPair(), [cliente, servidor] = [par[0], par[1]];
      this.state.acceptWebSocket(servidor, [tag]);
      servidor.serializeAttachment({ tag, quien });
      this.mandar(servidor, { t: 'hola', v: this.v, lista: this.quienes() });
      if (tag === 'tablero') this.presencia();
      return new Response(null, { status: 101, webSocket: cliente });
    }
    if (url.pathname === '/cambio') {
      let c = {}; try { c = await req.json(); } catch { /* vacío */ }
      this.v += 1; await this.state.storage.put('v', this.v);
      const msj = { t: 'cambio', v: this.v, cosa: c.cosa || '', id: c.id || 0, distribuidor_id: c.distribuidor_id || 0, ruta_id: c.ruta_id || 0, de: c.de || '' };
      for (const ws of this.state.getWebSockets()) { const a = ws.deserializeAttachment() || {}; if (this.leToca(a.tag || 'tablero', msj)) this.mandar(ws, msj); }
      return json({ v: this.v });
    }
    if (url.pathname === '/version') return json({ v: this.v, conectados: this.state.getWebSockets().length, quienes: this.quienes() });
    return json({ error: 'No existe.' }, 404);
  }
  webSocketMessage(ws, msg) {
    let m = {}; try { m = JSON.parse(msg); } catch { return; }
    if (m.t === 'ping') this.mandar(ws, { t: 'pong', v: this.v });
    if (m.t === 'hola' && m.quien) { const a = ws.deserializeAttachment() || {}; a.quien = texto(m.quien, 80); ws.serializeAttachment(a); if (a.tag === 'tablero') this.presencia(); }
  }
  webSocketClose(ws) { try { ws.close(); } catch { /* ya */ } this.presencia(); }
  webSocketError(ws) { try { ws.close(); } catch { /* ya */ } this.presencia(); }
}

const sala = (env) => env.VIVO.get(env.VIVO.idFromName('la-vela'));
// RLR · avisar de un cambio sin detener la respuesta
export function avisar(env, ctx, cambio) {
  if (!env.VIVO) return;
  const p = sala(env).fetch('https://vivo/cambio', { method: 'POST', body: JSON.stringify(cambio) }).catch(() => {});
  if (ctx) ctx.waitUntil(p);
}
export const version = (env) => sala(env).fetch('https://vivo/version');
// RLR · abrir el socket ya autorizado por el Worker
export function conectar(env, req, tag, quien) {
  const h = new Headers(req.headers); h.set('x-tag', tag); h.set('x-quien', quien || '');
  return sala(env).fetch(new Request('https://vivo/ws', { method: 'GET', headers: h }));
}
void _RLR; void _k; void _rev;
