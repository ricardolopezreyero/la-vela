// RLR · La Vela — API del tablero de operación (docs/11) — Ricardo López Reyero
// Todo pasa por aquí con sesión. Un solo GET trae el tablero completo; cada cambio es un PATCH chico.
import { ahora, azar, hoyMX, json, mismoOrigen, parrafo, texto } from './comun.js';

const _RLR = 'Ricardo López Reyero', _k = 'EYE', _rev = 181218; // RLR

export const ESTADOS_DIST = ['Nuevo', 'Calificado', 'Contactado', 'Llamada o visita', 'Propuesta', 'Piloto', 'Activo', 'En pausa', 'Descartado'];
export const ESTADOS_PEDIDO = ['Recibido', 'Confirmado', 'En producción', 'Curando', 'Control de calidad', 'Listo', 'En ruta', 'Entregado', 'Cobrado'];
const ESTADOS_TAREA = ['Por hacer', 'En curso', 'Hecho', 'Después', 'Descartado'];
const AJUSTES = ['fase_actual', 'deposito', 'dias_entrega', 'dias_cobro', 'meta_semanal', 'receta_activa', 'bajas_cartuchos', 'capacidad_dia', 'pedido_minimo_cajas'];

/* Qué se puede tocar de cada cosa. Tipos: s texto corto · p párrafo · n número o vacío · m número (0 si vacío)
   b sí/no · f fecha AAAA-MM-DD · o una de varias opciones · j objeto */
const R = {
  distribuidores: {
    tabla: 'solicitudes', sello: 'actualizado', bitacora: 'estado', borrar: true,
    campos: {
      nombre: ['s', 120], empresa: ['s', 160], whatsapp: ['s', 30], zonas: ['s', 400], puntos: ['s', 40], tipos: ['s', 200], visita: ['s', 40],
      veladoras: ['s', 40], vehiculos: ['s', 40], pedido: ['s', 40], tipo: ['o', ['A', 'B', 'C']], estado: ['o', ESTADOS_DIST], zona: ['s', 200],
      exclusividad: ['b'], responsable: ['s', 160], proxima_accion: ['s', 300], proxima_fecha: ['f'], notas: ['p', 6000], credito: ['m'], tiendas: ['m'],
    },
    alCrear: (v) => ({ creada: ahora(), puntaje: 0, origen: 'manual', tipo: 'B', estado: 'Nuevo', whatsapp: '', zonas: '', puntos: '', tipos: '', visita: '', veladoras: '', vehiculos: '', pedido: '', ...v }),
    pide: ['empresa'],
  },
  tareas: {
    tabla: 'tareas', sello: 'actualizada', borrar: true, pide: ['titulo'],
    campos: { titulo: ['s', 300], seccion: ['s', 60], fase: ['m'], estado: ['o', ESTADOS_TAREA], responsable: ['s', 160], fecha: ['f'], prioridad: ['o', ['Alta', 'Media', 'Baja']], notas: ['p', 6000] },
    alCrear: (v) => ({ creada: ahora(), fase: 1, ...v }),
  },
  lotes: {
    tabla: 'lotes', borrar: true, pide: ['codigo'],
    campos: { codigo: ['s', 40], receta_id: ['n'], piezas: ['m'], fecha: ['f'], gph: ['n'], horas: ['n'], resultado: ['o', ['En prueba', 'Aprobado', 'Rechazado']], notas: ['p', 2000] },
  },
  recetas: { tabla: 'recetas', sello: 'actualizada', firma: 'por', borrar: true, pide: ['nombre'], campos: { nombre: ['s', 160], datos: ['j'] } },
  pruebas: {
    tabla: 'pruebas', borrar: true, pide: ['nombre'], hijos: ['prueba_sesiones', 'prueba_id'],
    campos: { receta_id: ['n'], nombre: ['s', 160], detalle: ['s', 400], peso_inicial: ['n'], residual: ['m'], meta_horas: ['m'], cerrada: ['b'], notas: ['p', 3000] },
    alCrear: (v) => ({ creada: ahora(), residual: 0.03, meta_horas: 168, ...v }),
  },
  sesiones: {
    tabla: 'prueba_sesiones', borrar: true, pide: ['prueba_id', 'horas', 'peso_final'],
    campos: { prueba_id: ['m'], fecha: ['f'], horas: ['m'], peso_final: ['m'], flama_mm: ['n'], temp_c: ['n'], tunel: ['b'], hollin: ['b'] },
    alCrear: (v) => ({ fecha: hoyMX(), ...v }),
  },
  inventario: {
    tabla: 'inventario', pk: 'clave', sello: 'actualizado', borrar: true, pide: ['nombre'],
    campos: { nombre: ['s', 120], unidad: ['s', 12], existencia: ['m'], minimo: ['m'], costo: ['m'] },
  },
  productos: {
    tabla: 'productos', pk: 'clave', pide: ['nombre'],
    campos: { nombre: ['s', 120], piezas_caja: ['m'], precio_dist: ['m'], precio_publico: ['m'], lleva_vaso: ['b'], activo: ['b'], orden: ['m'] },
  },
  usuarios: {
    tabla: 'usuarios', pk: 'correo', soloAdmin: true, borrar: true,
    campos: { nombre: ['s', 120], rol: ['o', ['admin', 'equipo']] },
    alCrear: (v) => ({ creado: ahora(), rol: 'equipo', ...v }),
  },
};

class Mal extends Error { constructor(m, s = 400) { super(m); this.status = s; } }

function limpiar(campos, datos) {
  const v = {};
  for (const c in campos) {
    if (!(c in datos)) continue;
    const [tipo, extra] = campos[c], x = datos[c];
    if (tipo === 's') v[c] = texto(x, extra);
    else if (tipo === 'p') v[c] = parrafo(x, extra);
    else if (tipo === 'n' || tipo === 'm') { const n = x === '' || x == null ? NaN : Number(x); v[c] = Number.isFinite(n) ? n : tipo === 'm' ? 0 : null; }
    else if (tipo === 'b') v[c] = x && x !== '0' ? 1 : 0;
    else if (tipo === 'f') v[c] = /^\d{4}-\d{2}-\d{2}$/.test(String(x || '')) ? x : '';
    else if (tipo === 'o') { if (!extra.includes(x)) throw new Mal(`Valor no permitido en «${c}».`); v[c] = x; }
    else if (tipo === 'j') { const s = JSON.stringify(x ?? {}); if (s.length > 60000) throw new Mal('Demasiado texto.'); v[c] = s; }
  }
  return v;
}

const uno = (env, tabla, pk, id) => env.DB.prepare(`SELECT * FROM ${tabla} WHERE ${pk} = ?`).bind(id).first();
const nota = (env, cosa, id, textoNota, por) =>
  env.DB.prepare('INSERT INTO bitacora (cosa, cosa_id, texto, por, fecha) VALUES (?, ?, ?, ?, ?)').bind(cosa, id, textoNota, por, ahora());

async function ajustes(env) {
  const { results } = await env.DB.prepare('SELECT clave, valor FROM ajustes').all();
  return Object.fromEntries(results.map((r) => [r.clave, r.valor]));
}

// ───────── RLR · todo el tablero en una sola respuesta ─────────
async function todo(env, yo) {
  const c = (s) => env.DB.prepare(s);
  const [us, di, bi, ta, pr, pe, inv, lo, re, pb, se, aj] = await env.DB.batch([
    c('SELECT correo, nombre, rol FROM usuarios ORDER BY creado'),
    c('SELECT * FROM solicitudes ORDER BY id DESC'),
    c('SELECT * FROM bitacora ORDER BY id DESC LIMIT 800'),
    c('SELECT * FROM tareas ORDER BY id'),
    c('SELECT * FROM productos ORDER BY orden'),
    c('SELECT * FROM pedidos ORDER BY id DESC'),
    c('SELECT * FROM inventario ORDER BY rowid'),
    c('SELECT * FROM lotes ORDER BY id DESC'),
    c('SELECT * FROM recetas ORDER BY id'),
    c('SELECT * FROM pruebas ORDER BY id'),
    c('SELECT * FROM prueba_sesiones ORDER BY id'),
    c('SELECT clave, valor FROM ajustes'),
  ]);
  const j = (t, d) => { try { return JSON.parse(t); } catch { return d; } };
  return json({
    yo, usuarios: us.results, distribuidores: di.results, bitacora: bi.results, tareas: ta.results, productos: pr.results,
    pedidos: pe.results.map((p) => ({ ...p, lineas: j(p.lineas, []) })), inventario: inv.results, lotes: lo.results,
    recetas: re.results.map((r) => ({ ...r, datos: j(r.datos, {}) })), pruebas: pb.results, sesiones: se.results,
    ajustes: Object.fromEntries(aj.results.map((r) => [r.clave, r.valor])),
    estados: { distribuidores: ESTADOS_DIST, pedidos: ESTADOS_PEDIDO, tareas: ESTADOS_TAREA },
  });
}

// ───────── Lo genérico: crear, cambiar y borrar ─────────
async function crear(env, yo, rec, cuerpo) {
  const def = R[rec], pk = def.pk || 'id';
  let v = limpiar(def.campos, cuerpo);
  if (def.alCrear) v = def.alCrear(v);
  for (const c of def.pide || []) if (v[c] === '' || v[c] == null) throw new Mal(`Falta «${c}».`);
  if (pk !== 'id') {
    const clave = pk === 'correo' ? texto(cuerpo.correo, 160).toLowerCase() : texto(cuerpo.clave, 40).toLowerCase().replace(/[^a-z0-9_]+/g, '_');
    if (!clave || (pk === 'correo' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clave))) throw new Mal(pk === 'correo' ? 'Escribe un correo válido.' : 'Falta la clave.');
    if (await uno(env, def.tabla, pk, clave)) throw new Mal('Ya existe.');
    v[pk] = clave;
  }
  if (def.sello) v[def.sello] = ahora();
  if (def.firma) v[def.firma] = yo.correo;
  const cols = Object.keys(v);
  const r = await env.DB.prepare(`INSERT INTO ${def.tabla} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`).bind(...cols.map((c) => v[c])).run();
  const id = pk === 'id' ? r.meta.last_row_id : v[pk];
  if (rec === 'distribuidores') await nota(env, rec, id, 'Agregado a mano', yo.correo).run();
  return json({ fila: await uno(env, def.tabla, pk, id) });
}

async function cambiar(env, yo, rec, id, cuerpo) {
  const def = R[rec], pk = def.pk || 'id';
  const antes = await uno(env, def.tabla, pk, id);
  if (!antes) throw new Mal('Ya no existe.', 404);
  const v = limpiar(def.campos, cuerpo);
  if (!Object.keys(v).length) throw new Mal('Nada que guardar.');
  for (const c of def.pide || []) if (c in v && (v[c] === '' || v[c] == null)) throw new Mal(`«${c}» no puede quedar vacío.`);
  if (rec === 'usuarios' && id === yo.correo && v.rol && v.rol !== 'admin') throw new Mal('No puedes quitarte a ti mismo el acceso de administrador.');
  if (def.sello) v[def.sello] = ahora();
  if (def.firma) v[def.firma] = yo.correo;
  const cols = Object.keys(v), lote = [env.DB.prepare(`UPDATE ${def.tabla} SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE ${pk} = ?`).bind(...cols.map((c) => v[c]), id)];
  if (def.bitacora && def.bitacora in v && v[def.bitacora] !== antes[def.bitacora]) lote.push(nota(env, rec, id, `${antes[def.bitacora]} → ${v[def.bitacora]}`, yo.correo));
  await env.DB.batch(lote);
  return json({ fila: await uno(env, def.tabla, pk, id), recargar: lote.length > 1 });
}

async function borrar(env, yo, rec, id) {
  const def = R[rec], pk = def.pk || 'id';
  if (!def.borrar) throw new Mal('Esto no se borra.', 405);
  if (rec === 'usuarios' && id === yo.correo) throw new Mal('No puedes borrarte a ti mismo.');
  if (rec === 'distribuidores' && (await env.DB.prepare('SELECT COUNT(*) n FROM pedidos WHERE distribuidor_id = ?').bind(id).first()).n) throw new Mal('Tiene pedidos: márcalo como Descartado en lugar de borrarlo.');
  const lote = [env.DB.prepare(`DELETE FROM ${def.tabla} WHERE ${pk} = ?`).bind(id)];
  if (def.hijos) lote.push(env.DB.prepare(`DELETE FROM ${def.hijos[0]} WHERE ${def.hijos[1]} = ?`).bind(id));
  if (rec === 'usuarios') lote.push(env.DB.prepare('DELETE FROM sesiones WHERE correo = ?').bind(id));
  if (rec === 'distribuidores') lote.push(env.DB.prepare(`DELETE FROM bitacora WHERE cosa = 'distribuidores' AND cosa_id = ?`).bind(id));
  await env.DB.batch(lote);
  return json({ ok: true });
}

// ───────── RLR · pedidos: el evento del que nace todo ─────────
export async function calcularPedido(env, lineas, vacios) {
  const { results: productos } = await env.DB.prepare('SELECT * FROM productos').all();
  const deposito = Number((await ajustes(env)).deposito) || 0;
  const limpias = [];
  let piezas = 0, piezasVaso = 0, cajas = 0, subtotal = 0;
  for (const l of Array.isArray(lineas) ? lineas : []) {
    const p = productos.find((x) => x.clave === l.clave), n = Math.floor(Number(l.cajas));
    if (!p || !(n > 0) || n > 100000) continue;
    limpias.push({ clave: p.clave, cajas: n });
    cajas += n; piezas += n * p.piezas_caja; subtotal += n * p.piezas_caja * p.precio_dist;
    if (p.lleva_vaso) piezasVaso += n * p.piezas_caja;
  }
  const v = Math.max(0, Math.floor(Number(vacios) || 0));
  return { lineas: JSON.stringify(limpias), piezas, piezas_vaso: piezasVaso, cajas, subtotal: Math.round(subtotal * 100) / 100, deposito, vacios: v,
    total: Math.round((subtotal + deposito * (piezas - v)) * 100) / 100 };
}

// Gramos de cera por pieza, según la receta activa
async function gramosPorPieza(env) {
  const id = Number((await ajustes(env)).receta_activa) || 1;
  const r = await env.DB.prepare('SELECT datos FROM recetas WHERE id = ?').bind(id).first();
  try { const p = JSON.parse(r.datos).parametros; const g = p.gph * p.horas * (1 + p.residual); return g > 0 ? g : 398; } catch { return 398; }
}

async function crearPedido(env, yo, cuerpo) {
  const dist = await uno(env, 'solicitudes', 'id', Number(cuerpo.distribuidor_id));
  if (!dist) throw new Mal('Elige un distribuidor.');
  const c = await calcularPedido(env, cuerpo.lineas, cuerpo.vacios);
  if (!c.piezas) throw new Mal('El pedido no tiene piezas.');
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(cuerpo.fecha_prometida || '') ? cuerpo.fecha_prometida : '';
  const r = await env.DB.prepare(
    `INSERT INTO pedidos (distribuidor_id, estado, lineas, piezas, piezas_vaso, cajas, subtotal, deposito, total, vacios, fecha_prometida, notas, origen, creado)
     VALUES (?, 'Recibido', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'tablero', ?)`
  ).bind(dist.id, c.lineas, c.piezas, c.piezas_vaso, c.cajas, c.subtotal, c.deposito, c.total, c.vacios, fecha, parrafo(cuerpo.notas, 2000), ahora()).run();
  await nota(env, 'pedidos', r.meta.last_row_id, 'Pedido creado en el tablero', yo.correo).run();
  return json({ ok: true, id: r.meta.last_row_id, recargar: true });
}

async function cambiarPedido(env, yo, id, cuerpo) {
  const p = await uno(env, 'pedidos', 'id', id);
  if (!p) throw new Mal('Ya no existe.', 404);
  const v = {}, lote = [];
  if ('notas' in cuerpo) v.notas = parrafo(cuerpo.notas, 2000);
  if ('fecha_prometida' in cuerpo) v.fecha_prometida = /^\d{4}-\d{2}-\d{2}$/.test(cuerpo.fecha_prometida || '') ? cuerpo.fecha_prometida : '';
  if ('lote_id' in cuerpo) v.lote_id = Number(cuerpo.lote_id) || null;
  if ('lineas' in cuerpo || 'vacios' in cuerpo) {
    if (p.descontado) throw new Mal('Ya se fabricó: las piezas no se pueden cambiar.');
    const c = await calcularPedido(env, 'lineas' in cuerpo ? cuerpo.lineas : JSON.parse(p.lineas), 'vacios' in cuerpo ? cuerpo.vacios : p.vacios);
    if (!c.piezas) throw new Mal('El pedido no tiene piezas.');
    Object.assign(v, c);
  }
  if ('estado' in cuerpo && cuerpo.estado !== p.estado) {
    const de = ESTADOS_PEDIDO.indexOf(p.estado), a = ESTADOS_PEDIDO.indexOf(cuerpo.estado);
    if (a < 0) throw new Mal('Estado no permitido.');
    v.estado = cuerpo.estado;
    lote.push(nota(env, 'pedidos', id, `${p.estado} → ${cuerpo.estado}`, yo.correo));
    const piezas = v.piezas ?? p.piezas, conVaso = v.piezas_vaso ?? p.piezas_vaso, cajas = v.cajas ?? p.cajas, vacios = v.vacios ?? p.vacios;
    // Al fabricarse (pasa a Curando o más allá) baja el material del inventario, una sola vez
    if (a >= ESTADOS_PEDIDO.indexOf('Curando') && !p.descontado) {
      const kg = (piezas * (await gramosPorPieza(env))) / 1000;
      const baja = (clave, n) => env.DB.prepare('UPDATE inventario SET existencia = existencia - ?, actualizado = ? WHERE clave = ?').bind(n, ahora(), clave);
      lote.push(baja('cera', Math.round(kg * 100) / 100), baja('vaso', conVaso), baja('mecha', piezas), baja('cartucho', piezas), baja('etiqueta', conVaso), baja('caja', cajas));
      lote.push(nota(env, 'pedidos', id, `Bajó del inventario: ${kg.toFixed(1)} kg de cera, ${conVaso} vasos, ${piezas} mechas y cartuchos, ${cajas} cajas`, 'tablero'));
      v.descontado = 1;
    }
    // Al entregarse, los vacíos que entrega el distribuidor entran al inventario de cartuchos
    if (a >= ESTADOS_PEDIDO.indexOf('Entregado') && !p.entregado_fecha) {
      v.entregado_fecha = hoyMX();
      if (vacios > 0) lote.push(env.DB.prepare(`UPDATE inventario SET existencia = existencia + ?, actualizado = ? WHERE clave = 'cartucho'`).bind(vacios, ahora()));
    }
    if (cuerpo.estado === 'Cobrado') { v.cobro = 'Cobrado'; v.cobrado_fecha = p.cobrado_fecha || hoyMX(); }
    else if (de === ESTADOS_PEDIDO.indexOf('Cobrado')) { v.cobro = 'Pendiente'; v.cobrado_fecha = null; }
  }
  if (!Object.keys(v).length) throw new Mal('Nada que guardar.');
  v.actualizado = ahora();
  const cols = Object.keys(v);
  await env.DB.batch([env.DB.prepare(`UPDATE pedidos SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`).bind(...cols.map((c) => v[c]), id), ...lote]);
  return json({ ok: true, recargar: true });
}

async function borrarPedido(env, id) {
  const p = await uno(env, 'pedidos', 'id', id);
  if (!p) throw new Mal('Ya no existe.', 404);
  if (p.descontado) throw new Mal('Ya se fabricó: no se puede borrar.');
  await env.DB.batch([env.DB.prepare('DELETE FROM pedidos WHERE id = ?').bind(id), env.DB.prepare(`DELETE FROM bitacora WHERE cosa = 'pedidos' AND cosa_id = ?`).bind(id)]);
  return json({ ok: true });
}

// ───────── RLR · entrada ─────────
export async function tablero(req, env, ctx, yo, ruta) {
  const m = req.method, [rec, idCrudo, accion] = ruta.split('/').map(decodeURIComponent);
  try {
    if (m === 'GET') return rec === 'todo' ? await todo(env, yo) : json({ error: 'No existe.' }, 404);
    if (!mismoOrigen(req, env)) throw new Mal('Origen no permitido.', 403);
    let cuerpo = {};
    if (m !== 'DELETE') { try { cuerpo = await req.json(); } catch { throw new Mal('No se pudo leer.'); } }
    if (!cuerpo || typeof cuerpo !== 'object') throw new Mal('No se pudo leer.');

    if (rec === 'ajustes' && m === 'PATCH') {
      if (!AJUSTES.includes(idCrudo)) throw new Mal('Ajuste desconocido.');
      await env.DB.prepare('INSERT INTO ajustes (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor').bind(idCrudo, texto(String(cuerpo.valor ?? ''), 200)).run();
      return json({ ok: true });
    }
    if (rec === 'nota' && m === 'POST') {
      const t = parrafo(cuerpo.texto, 2000), cosa = texto(cuerpo.cosa, 20);
      if (!t || !['distribuidores', 'pedidos', 'tareas'].includes(cosa)) throw new Mal('Escribe la nota.');
      await nota(env, cosa, Number(cuerpo.cosa_id) || 0, t, yo.correo).run();
      return json({ ok: true, recargar: true });
    }
    if (rec === 'pedidos') {
      if (m === 'POST') return await crearPedido(env, yo, cuerpo);
      if (m === 'PATCH') return await cambiarPedido(env, yo, Number(idCrudo), cuerpo);
      if (m === 'DELETE') return await borrarPedido(env, Number(idCrudo));
    }
    if (rec === 'distribuidores' && accion === 'liga' && m === 'POST') {
      const d = await uno(env, 'solicitudes', 'id', Number(idCrudo));
      if (!d) throw new Mal('Ya no existe.', 404);
      const liga = cuerpo.nueva || !d.liga ? azar(20) : d.liga;
      if (liga !== d.liga) await env.DB.batch([env.DB.prepare('UPDATE solicitudes SET liga = ? WHERE id = ?').bind(liga, d.id), nota(env, 'distribuidores', d.id, d.liga ? 'Liga de pedidos renovada' : 'Liga de pedidos creada', yo.correo)]);
      return json({ ok: true, liga, recargar: true });
    }
    const def = R[rec];
    if (!def) return json({ error: 'No existe.' }, 404);
    if (def.soloAdmin && yo.rol !== 'admin') throw new Mal('Solo un administrador puede hacer esto.', 403);
    const id = (def.pk || 'id') === 'id' ? Number(idCrudo) : idCrudo;
    if (m === 'POST' && !idCrudo) return await crear(env, yo, rec, cuerpo);
    if (m === 'PATCH' && idCrudo) return await cambiar(env, yo, rec, id, cuerpo);
    if (m === 'DELETE' && idCrudo) return await borrar(env, yo, rec, id);
    return json({ error: 'No existe.' }, 404);
  } catch (e) {
    if (e instanceof Mal) return json({ error: e.message }, e.status);
    throw e;
  }
}
void _RLR; void _k; void _rev;
