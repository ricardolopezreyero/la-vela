// RLR · La Vela — la hoja de ruta del repartidor en el teléfono (/ruta?r=… y /api/ruta) — Ricardo López Reyero
// Sin login: la liga es la credencial. Ve las paradas en orden, abre el mapa, avisa por WhatsApp, marca entregado y anota lo que cobró en efectivo.
import { ahora, hoyMX, json, mismoOrigen, texto } from './comun.js';
import { cambiarPedido, nota, pagarPedido } from './tablero.js';
import { avisar as avisarVivo } from './vivo.js';

const _RLR = 'Ricardo López Reyero', _k = 'EYE', _rev = 181218; // RLR

export async function rutaDe(env, liga) {
  if (!/^[a-f0-9]{40}$/.test(liga || '')) return null;
  return env.DB.prepare('SELECT * FROM rutas WHERE liga = ?').bind(liga).first();
}

export async function apiRuta(req, env, ctx) {
  const url = new URL(req.url);
  if (req.method === 'GET') {
    const r = await rutaDe(env, url.searchParams.get('r'));
    if (!r) return json({ error: 'Esta liga no está activa. Pide una nueva en el tablero.' }, 404);
    const [pe, ve, ce] = await env.DB.batch([
      env.DB.prepare(`SELECT p.id, p.estado, p.piezas, p.rejas, p.kg, p.vacios, p.total, p.cobro, p.pago_metodo, p.entregado_fecha, p.parada, p.notas, p.lineas, d.empresa, d.nombre, d.whatsapp, d.direccion, d.ciudad
        FROM pedidos p JOIN solicitudes d ON d.id = p.distribuidor_id WHERE p.ruta_id = ? ORDER BY p.parada`).bind(r.id),
      env.DB.prepare('SELECT nombre, rejas, kg FROM vehiculos WHERE id = ?').bind(r.vehiculo_id || 0),
      env.DB.prepare('SELECT nombre, ciudad FROM centros WHERE id = ?').bind(r.centro_id || 0),
    ]);
    const { results: productos } = await env.DB.prepare('SELECT clave, nombre FROM productos').all();
    const paradas = pe.results.map((p) => { let l = []; try { l = JSON.parse(p.lineas); } catch { /* vacío */ } return { ...p, lineas: l.map((x) => `${x.cajas} × ${(productos.find((q) => q.clave === x.clave)?.nombre || x.clave).split(' (')[0]}`).join(' · ') }; });
    return json({ ruta: { id: r.id, fecha: r.fecha, repartidor: r.repartidor, estado: r.estado, notas: r.notas }, vehiculo: ve.results[0] || null, centro: ce.results[0] || null, paradas });
  }
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  if (!mismoOrigen(req, env)) return json({ error: 'Origen no permitido.' }, 403);
  let e;
  try { e = await req.json(); } catch { return json({ error: 'No se pudo leer.' }, 400); }
  const r = await rutaDe(env, e && e.r);
  if (!r) return json({ error: 'Esta liga no está activa.' }, 404);
  const p = await env.DB.prepare('SELECT * FROM pedidos WHERE id = ? AND ruta_id = ?').bind(Number(e.pedido_id) || 0, r.id).first();
  if (!p) return json({ error: 'Esa parada no es de esta ruta.' }, 404);
  const yo = { correo: `repartidor:${texto(r.repartidor, 60) || r.id}`, rol: 'admin' };
  try {
    if (e.accion === 'salir') { await env.DB.batch([env.DB.prepare(`UPDATE rutas SET estado = 'En camino', actualizado = ? WHERE id = ? AND estado <> 'Terminada'`).bind(ahora(), r.id), nota(env, 'rutas', r.id, 'El repartidor marcó que salió', yo.correo)]); avisarVivo(env, ctx, { cosa: 'rutas', id: r.id, ruta_id: r.id }); return json({ ok: true }); }
    if (e.accion === 'entregar') {
      const vacios = Math.max(0, Math.floor(Number(e.vacios)));
      if (Number.isFinite(vacios) && vacios !== p.vacios && p.cobro !== 'Cobrado') await cambiarPedido(env, yo, p.id, { vacios }, ctx);
      if (!p.entregado_fecha) await cambiarPedido(env, yo, p.id, { estado: 'Entregado' }, ctx);
      const efectivo = Number(e.efectivo) || 0;
      if (efectivo > 0 && p.cobro !== 'Cobrado') {
        const q = await env.DB.prepare('SELECT * FROM pedidos WHERE id = ?').bind(p.id).first();
        await env.DB.batch(pagarPedido(env, q, 'Efectivo', yo.correo, `En ruta · ${hoyMX()}`));
        if (Math.abs(efectivo - q.total) > 1) await nota(env, 'pedidos', p.id, `Cobró en efectivo ${efectivo.toFixed(2)}; el pedido es de ${q.total.toFixed(2)}`, yo.correo).run();
      }
      // Si ya no queda nada por entregar, la ruta se cierra sola
      const { n } = await env.DB.prepare('SELECT COUNT(*) n FROM pedidos WHERE ruta_id = ? AND entregado_fecha IS NULL').bind(r.id).first();
      if (!n) await env.DB.prepare(`UPDATE rutas SET estado = 'Terminada', actualizado = ? WHERE id = ?`).bind(ahora(), r.id).run();
      avisarVivo(env, ctx, { cosa: 'pedidos', id: p.id, distribuidor_id: p.distribuidor_id, ruta_id: r.id });
      return json({ ok: true });
    }
    if (e.accion === 'nota') { const t = texto(e.texto, 500); if (!t) return json({ error: 'Escribe la nota.' }, 400); await nota(env, 'pedidos', p.id, `Repartidor: ${t}`, yo.correo).run(); return json({ ok: true }); }
  } catch (err) { return json({ error: err.message || 'No se pudo.' }, err.status || 400); }
  return json({ error: 'No existe.' }, 404);
}
void _RLR; void _k; void _rev;
