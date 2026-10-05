// RLR · La Vela — el panel del distribuidor (/distribuidor/ y /api/d/…) — Ricardo López Reyero
// Entra con el Login de CapitalTorreon: su correo de Google se liga a su ficha desde el tablero.
// Ve sus pedidos y cómo van, pide en un clic, paga con tarjeta (Stripe) o por transferencia,
// pide anticipado para las temporadas, estima lo que gana y pide material de promoción.
import { CASA, ahora, azar, escapar, esLocal, hoyMX, huella, json, mismoOrigen, parrafo, seg, texto } from './comun.js';
import { verificarPase } from './verificar.js';
import { avisar } from './pedir.js';
import { ESTADOS_PEDIDO, calcularPedido, insertarPedido, nota, pagarPedido } from './tablero.js';

const _RLR = 'Ricardo López Reyero', _k = 'EYE', _rev = 181218; // RLR
const COOKIE = 'vela_dist', DURA = 30 * 86400;
const secreto = async (v) => { if (!v) return ''; if (typeof v === 'string') return v; try { return (await v.get()) || ''; } catch { return ''; } };

class Mal extends Error { constructor(m, s = 400) { super(m); this.status = s; } }
const cookieDe = (req) => { const m = (req.headers.get('cookie') || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([a-f0-9]{64})`)); return m ? m[1] : ''; };

// Quién es el distribuidor detrás de la petición (o null)
async function quien(req, env) {
  const id = cookieDe(req);
  if (!id) return null;
  const d = await env.DB.prepare('SELECT d.* FROM sesiones_dist s JOIN solicitudes d ON d.id = s.distribuidor_id WHERE s.hash = ? AND s.vence > ?').bind(await huella(id), seg()).first();
  return d && !['Descartado', 'En pausa'].includes(d.estado) ? d : null;
}

async function entrar(req, env, cuerpo) {
  let correo = '';
  if (esLocal(env) && cuerpo.correo) correo = texto(cuerpo.correo, 160).toLowerCase(); // solo en la compu, para probar sin Google
  else {
    const q = await verificarPase(String(cuerpo.pase || ''), esLocal(env) ? undefined : CASA);
    correo = texto(q && q.email, 160).toLowerCase();
    if (!q || !correo) throw new Mal('El pase no sirve. Vuelve a entrar.', 401);
  }
  const d = await env.DB.prepare('SELECT id, estado FROM solicitudes WHERE correo = ?').bind(correo).first();
  if (!d) throw new Mal(`${correo} todavía no está ligado a ningún distribuidor. Escríbenos y lo ligamos a tu cuenta.`, 403);
  if (['Descartado', 'En pausa'].includes(d.estado)) throw new Mal('Tu cuenta está en pausa. Escríbenos.', 403);
  const s = azar();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sesiones_dist WHERE vence < ?').bind(seg()),
    env.DB.prepare('INSERT INTO sesiones_dist (hash, distribuidor_id, vence, creada) VALUES (?, ?, ?, ?)').bind(await huella(s), d.id, seg() + DURA, seg()),
  ]);
  return json({ ok: true }, 200, { 'set-cookie': `${COOKIE}=${s}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${DURA}${esLocal(env) ? '' : '; Secure'}` });
}

async function ajustes(env) {
  const { results } = await env.DB.prepare('SELECT clave, valor FROM ajustes').all();
  return Object.fromEntries(results.map((r) => [r.clave, r.valor]));
}

// RLR · todo lo del distribuidor en una respuesta
async function todo(env, d, stripe) {
  const [pr, pm, pe, ru, bi] = await env.DB.batch([
    env.DB.prepare('SELECT clave, nombre, piezas_caja, precio_dist, precio_publico, piezas_reja, lleva_vaso FROM productos WHERE activo = 1 ORDER BY orden'),
    env.DB.prepare('SELECT * FROM promos WHERE activo = 1 ORDER BY orden'),
    env.DB.prepare('SELECT id, creado, estado, lineas, promos, promos_total, piezas, cajas, subtotal, deposito, total, vacios, rejas, kg, cobro, cobrado_fecha, pago_metodo, pago_aviso, pago_aviso_fecha, anticipado, fecha_prometida, entregado_fecha, ruta_id, notas FROM pedidos WHERE distribuidor_id = ? ORDER BY id DESC LIMIT 200').bind(d.id),
    env.DB.prepare('SELECT r.id, r.fecha, r.repartidor, r.estado FROM rutas r JOIN pedidos p ON p.ruta_id = r.id WHERE p.distribuidor_id = ? GROUP BY r.id').bind(d.id),
    env.DB.prepare(`SELECT b.cosa_id pedido_id, b.texto, b.fecha FROM bitacora b JOIN pedidos p ON p.id = b.cosa_id WHERE b.cosa = 'pedidos' AND p.distribuidor_id = ? AND (b.texto LIKE '% → %' OR b.texto LIKE 'Pagado%') ORDER BY b.id`).bind(d.id),
  ]);
  const a = await ajustes(env), n = (k, def = 0) => (Number.isFinite(Number(a[k])) && a[k] !== '' ? Number(a[k]) : def);
  const j = (t, x) => { try { return JSON.parse(t); } catch { return x; } };
  const pedidos = pe.results.map((p) => ({ ...p, lineas: j(p.lineas, []), promos: j(p.promos, []) }));
  const saldo = pedidos.filter((p) => p.entregado_fecha && p.cobro !== 'Cobrado').reduce((s, p) => s + p.total, 0);
  return json({
    yo: { id: d.id, empresa: d.empresa, nombre: d.nombre, estado: d.estado, credito: d.credito, tiendas: d.tiendas, zona: d.zona || d.zonas, liga: d.liga || '' },
    productos: pr.results, promos: pm.results, pedidos, rutas: ru.results, bitacora: bi.results, saldo,
    ajustes: { deposito: n('deposito'), dias_entrega: n('dias_entrega', 5), minimo: n('pedido_minimo_cajas', 1) || 1, rejas_tarima: n('rejas_tarima', 32) || 32, margen_tienda: n('margen_tienda', 27), piezas_tienda_semana: n('piezas_tienda_semana', 8),
      banco_nombre: a.banco_nombre || '', banco_clabe: a.banco_clabe || '', banco_beneficiario: a.banco_beneficiario || '', whatsapp: a.whatsapp_negocio || '' },
    pagos: { tarjeta: stripe ? 1 : 0 }, estados: ESTADOS_PEDIDO, hoy: hoyMX(),
  });
}

async function pedir(env, d, cuerpo, origen) {
  const c = await calcularPedido(env, cuerpo.lineas, cuerpo.vacios, cuerpo.promos);
  const a = await ajustes(env), minimo = Number(a.pedido_minimo_cajas) || 1, dias = Number(a.dias_entrega) || 5;
  if (!c.piezas && c.promos === '[]') throw new Mal('El pedido está vacío.');
  if (c.piezas && c.cajas < minimo) throw new Mal(`El pedido mínimo es de ${minimo} caja(s).`);
  // Anticipado: el distribuidor elige la fecha, nunca antes del plazo normal de entrega
  const minima = hoyMX(dias), pedida = /^\d{4}-\d{2}-\d{2}$/.test(cuerpo.fecha_prometida || '') ? cuerpo.fecha_prometida : '';
  const fecha = pedida && pedida > minima ? pedida : minima, anticipado = fecha > hoyMX(dias + 7) ? 1 : 0;
  const id = await insertarPedido(env, d.id, c, { ...cuerpo, fecha_prometida: fecha, anticipado, notas: parrafo(cuerpo.notas, 1000) }, 'panel');
  await nota(env, 'pedidos', id, anticipado ? `Pedido anticipado desde su panel, para el ${fecha}` : 'Pedido hecho desde su panel', texto(d.empresa, 80)).run();
  return { id, fecha, total: c.total, piezas: c.piezas, anticipado, origen };
}

const pedidoDe = async (env, d, id) => {
  const p = await env.DB.prepare('SELECT * FROM pedidos WHERE id = ? AND distribuidor_id = ?').bind(Number(id) || 0, d.id).first();
  if (!p) throw new Mal('Ese pedido no existe.', 404);
  return p;
};

// RLR · Stripe Checkout: una sesión por pedido; al volver se le pregunta a Stripe si de verdad se pagó
async function pagar(env, d, cuerpo, origen, stripe) {
  if (!stripe) throw new Mal('El pago con tarjeta todavía no está activo. Paga por transferencia.', 503);
  const p = await pedidoDe(env, d, cuerpo.pedido_id);
  if (p.cobro === 'Cobrado') throw new Mal('Ese pedido ya está pagado.');
  if (!(p.total > 0)) throw new Mal('No hay nada que cobrar.');
  if (['Entregado', 'Cobrado'].includes(p.estado) && p.estado === 'Cobrado') throw new Mal('Ese pedido ya está cerrado.');
  const f = new URLSearchParams();
  f.set('mode', 'payment'); f.set('success_url', `${origen}/distribuidor/?pagado={CHECKOUT_SESSION_ID}`); f.set('cancel_url', `${origen}/distribuidor/?pedido=${p.id}`);
  f.set('line_items[0][quantity]', '1'); f.set('line_items[0][price_data][currency]', 'mxn'); f.set('line_items[0][price_data][unit_amount]', String(Math.round(p.total * 100)));
  f.set('line_items[0][price_data][product_data][name]', `La Vela · pedido #${p.id} · ${p.piezas} piezas`);
  f.set('metadata[pedido_id]', String(p.id)); f.set('metadata[distribuidor_id]', String(d.id)); f.set('locale', 'es-419');
  if (d.correo) f.set('customer_email', d.correo);
  let r, s;
  try { r = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { authorization: 'Bearer ' + stripe, 'content-type': 'application/x-www-form-urlencoded' }, body: f }); s = await r.json(); } catch { throw new Mal('Stripe no contestó. Intenta de nuevo.', 502); }
  if (!r.ok || !s.url) throw new Mal('Stripe no aceptó el cobro. Intenta de nuevo o paga por transferencia.', 502);
  await env.DB.prepare('UPDATE pedidos SET stripe_sid = ? WHERE id = ?').bind(s.id, p.id).run();
  return { url: s.url };
}

async function confirmar(env, d, cuerpo, stripe) {
  if (!stripe) throw new Mal('Sin Stripe.', 503);
  const sid = String(cuerpo.sid || '');
  if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(sid)) throw new Mal('Sesión de pago inválida.');
  let r, s;
  try { r = await fetch('https://api.stripe.com/v1/checkout/sessions/' + sid, { headers: { authorization: 'Bearer ' + stripe } }); s = await r.json(); } catch { throw new Mal('Stripe no contestó.', 502); }
  if (!r.ok || s.payment_status !== 'paid' || !s.metadata) throw new Mal('El pago no se completó.', 402);
  const p = await pedidoDe(env, d, s.metadata.pedido_id);
  if (p.cobro === 'Cobrado') return { ok: true, id: p.id, ya: true };
  if (p.stripe_sid && p.stripe_sid !== sid) throw new Mal('Esa sesión no corresponde al pedido.');
  await env.DB.batch(pagarPedido(env, p, 'Stripe', texto(d.empresa, 80), s.payment_intent ? String(s.payment_intent).slice(0, 80) : sid.slice(0, 80)));
  return { ok: true, id: p.id };
}

async function transferencia(env, d, cuerpo) {
  const p = await pedidoDe(env, d, cuerpo.pedido_id);
  if (p.cobro === 'Cobrado') throw new Mal('Ese pedido ya está pagado.');
  const ref = texto(cuerpo.referencia, 80) || 'sin referencia';
  await env.DB.batch([
    env.DB.prepare('UPDATE pedidos SET pago_aviso = ?, pago_aviso_fecha = ?, actualizado = ? WHERE id = ?').bind(ref, hoyMX(), ahora(), p.id),
    nota(env, 'pedidos', p.id, `Avisa que transfirió · ${ref}`, texto(d.empresa, 80)),
  ]);
  return { ok: true };
}

// ───────── RLR · entrada ─────────
export async function apiDistribuidor(req, env, ctx, ruta) {
  const origen = new URL(req.url).origin;
  try {
    if (req.method !== 'POST' && !(req.method === 'GET' && ruta === 'todo')) throw new Mal('Método no permitido.', 405);
    let cuerpo = {};
    if (req.method === 'POST') { if (!mismoOrigen(req, env)) throw new Mal('Origen no permitido.', 403); try { cuerpo = await req.json(); } catch { cuerpo = {}; } }
    if (ruta === 'entrar') return await entrar(req, env, cuerpo || {});
    const d = await quien(req, env);
    if (!d) return json({ error: 'Entra con tu cuenta.', entrar: true }, 401);
    const stripe = await secreto(env.STRIPE_SECRET_KEY);
    if (ruta === 'todo') return await todo(env, d, stripe);
    if (ruta === 'salir') { const id = cookieDe(req); if (id) await env.DB.prepare('DELETE FROM sesiones_dist WHERE hash = ?').bind(await huella(id)).run(); return json({ ok: true }, 200, { 'set-cookie': `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` }); }
    if (ruta === 'pedir') {
      const r = await pedir(env, d, cuerpo, origen);
      ctx.waitUntil(avisar(env, origen, `Pedido ${r.anticipado ? 'anticipado' : 'nuevo'} · ${r.piezas} piezas · ${d.empresa}`, r.anticipado ? 'Pedido anticipado' : 'Pedido nuevo desde su panel',
        [`<b>${escapar(d.empresa)}</b> pidió ${r.piezas} piezas por ${r.total.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}.`, `Entrega: ${r.fecha}.`], `/tablero/#/pedidos/${r.id}`));
      return json(r);
    }
    if (ruta === 'pagar') return json(await pagar(env, d, cuerpo, origen, stripe));
    if (ruta === 'confirmar') {
      const r = await confirmar(env, d, cuerpo, stripe);
      if (!r.ya) ctx.waitUntil(avisar(env, origen, `Pago con tarjeta · pedido #${r.id} · ${d.empresa}`, 'Pedido pagado con tarjeta', [`<b>${escapar(d.empresa)}</b> pagó el pedido #${r.id} con tarjeta. Ya pasó a Confirmado.`], `/tablero/#/pedidos/${r.id}`));
      return json(r);
    }
    if (ruta === 'transferencia') {
      const r = await transferencia(env, d, cuerpo);
      ctx.waitUntil(avisar(env, origen, `Aviso de transferencia · pedido #${cuerpo.pedido_id} · ${d.empresa}`, 'Transferencia por confirmar', [`<b>${escapar(d.empresa)}</b> avisa que transfirió el pedido #${Number(cuerpo.pedido_id) || 0}. Confírmalo en Pagos cuando lo veas en el banco.`], `/tablero/#/pagos`));
      return json(r);
    }
    return json({ error: 'No existe.' }, 404);
  } catch (e) {
    if (e instanceof Mal) return json({ error: e.message }, e.status);
    throw e;
  }
}
void _RLR; void _k; void _rev;
