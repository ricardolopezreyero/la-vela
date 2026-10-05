// RLR · La Vela — página de pedidos del distribuidor (docs/11, módulo 3) — Ricardo López Reyero
// Cada distribuidor tiene una liga privada. Con ella ve su catálogo, su saldo y su historial, y pide solo.
import { ahora, escapar, hoyMX, json, mismoOrigen, parrafo, texto } from './comun.js';
import { enviar, plantilla } from './correo.js';
import { calcularPedido } from './tablero.js';
import { avisar as avisarVivo } from './vivo.js';

const _RLR = 'Ricardo López Reyero', _k = 'EYE', _rev = 181218; // RLR

async function distribuidor(env, liga) {
  if (!/^[a-f0-9]{40}$/.test(liga || '')) return null;
  const d = await env.DB.prepare(`SELECT id, nombre, empresa, estado, credito FROM solicitudes WHERE liga = ?`).bind(liga).first();
  return d && !['Descartado', 'En pausa'].includes(d.estado) ? d : null;
}

export async function pedir(req, env, ctx) {
  const url = new URL(req.url);
  if (req.method === 'GET') {
    const d = await distribuidor(env, url.searchParams.get('d'));
    if (!d) return json({ error: 'Esta liga no está activa. Escríbenos y te mandamos una nueva.' }, 404);
    const [pr, pe, aj] = await env.DB.batch([
      env.DB.prepare('SELECT clave, nombre, piezas_caja, precio_dist, piezas_reja FROM productos WHERE activo = 1 ORDER BY orden'),
      env.DB.prepare('SELECT id, creado, estado, lineas, piezas, total, vacios, rejas, cobro, fecha_prometida, entregado_fecha FROM pedidos WHERE distribuidor_id = ? ORDER BY id DESC LIMIT 30').bind(d.id),
      env.DB.prepare(`SELECT clave, valor FROM ajustes WHERE clave IN ('deposito', 'dias_entrega', 'pedido_minimo_cajas', 'rejas_tarima')`),
    ]);
    const a = Object.fromEntries(aj.results.map((r) => [r.clave, Number(r.valor) || 0]));
    const pedidos = pe.results.map((p) => ({ ...p, lineas: JSON.parse(p.lineas || '[]') }));
    // Saldo: lo entregado y no cobrado. Por surtir: lo que ya pidió y aún no llega.
    const saldo = pedidos.filter((p) => p.entregado_fecha && p.cobro !== 'Cobrado').reduce((s, p) => s + p.total, 0);
    return json({ empresa: d.empresa, nombre: d.nombre, productos: pr.results, pedidos, saldo, credito: d.credito, deposito: a.deposito, dias_entrega: a.dias_entrega, minimo: a.pedido_minimo_cajas || 1, rejas_tarima: a.rejas_tarima || 32 });
  }
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  if (!mismoOrigen(req, env)) return json({ error: 'Origen no permitido.' }, 403);
  let e;
  try { e = await req.json(); } catch { return json({ error: 'No se pudo leer el pedido.' }, 400); }
  const d = await distribuidor(env, e && e.d);
  if (!d) return json({ error: 'Esta liga no está activa.' }, 404);
  const c = await calcularPedido(env, e.lineas, e.vacios);
  const aj = await env.DB.prepare(`SELECT clave, valor FROM ajustes WHERE clave IN ('dias_entrega', 'pedido_minimo_cajas')`).all();
  const a = Object.fromEntries(aj.results.map((r) => [r.clave, Number(r.valor) || 0]));
  if (c.cajas < (a.pedido_minimo_cajas || 1)) return json({ error: `El pedido mínimo es de ${a.pedido_minimo_cajas || 1} caja(s).` }, 400);
  const fecha = hoyMX(a.dias_entrega || 5);
  const r = await env.DB.prepare(
    `INSERT INTO pedidos (distribuidor_id, estado, lineas, piezas, piezas_vaso, cajas, subtotal, deposito, total, vacios, rejas, kg, fecha_prometida, notas, origen, creado)
     VALUES (?, 'Recibido', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'liga', ?)`
  ).bind(d.id, c.lineas, c.piezas, c.piezas_vaso, c.cajas, c.subtotal, c.deposito, c.total, c.vacios, c.rejas, c.kg, fecha, parrafo(e.notas, 1000), ahora()).run();
  const id = r.meta.last_row_id;
  avisarVivo(env, ctx, { cosa: 'pedidos', id, distribuidor_id: d.id });
  await env.DB.prepare('INSERT INTO bitacora (cosa, cosa_id, texto, por, fecha) VALUES (?, ?, ?, ?, ?)').bind('pedidos', id, 'Pedido hecho desde su liga', texto(d.empresa, 80), ahora()).run();
  ctx.waitUntil(avisar(env, url.origin, `Pedido nuevo · ${c.cajas} caja(s) · ${d.empresa}`, 'Pedido nuevo',
    [`<b>${escapar(d.empresa)}</b> pidió ${c.cajas} caja(s): ${c.piezas} piezas en ${c.rejas} reja(s), ${c.kg} kg.`, `Regresa ${c.vacios} cartuchos vacíos. Entrega estimada: ${fecha}.`], `/tablero/#/pedidos/${id}`));
  return json({ ok: true, id, fecha, total: c.total });
}

// RLR · aviso por correo a quienes administran el tablero
export async function avisar(env, origen, asunto, titulo, lineas, ruta) {
  const { results } = await env.DB.prepare(`SELECT correo FROM usuarios WHERE rol = 'admin'`).all();
  if (!results.length) return;
  return enviar(env, { para: results.map((u) => u.correo), asunto, html: plantilla({ titulo, lineas, boton: 'Abrir en el tablero', liga: origen + ruta }), texto: `${titulo}\n${lineas.join('\n').replace(/<[^>]+>/g, '')}\n${origen}${ruta}` });
}
void _RLR; void _k; void _rev;
