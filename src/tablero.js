// RLR · La Vela — API del tablero de operación (docs/11) — Ricardo López Reyero
// Todo pasa por aquí con sesión. Un solo GET trae el tablero completo; cada cambio es un PATCH chico.
import { CASA, ahora, azar, hoyMX, json, mismoOrigen, parrafo, texto } from './comun.js';
import { enviar, plantilla } from './correo.js';

const _RLR = 'Ricardo López Reyero', _k = 'EYE', _rev = 181218; // RLR

export const ESTADOS_DIST = ['Nuevo', 'Calificado', 'Contactado', 'Llamada o visita', 'Propuesta', 'Piloto', 'Activo', 'En pausa', 'Descartado'];
export const ESTADOS_PEDIDO = ['Recibido', 'Confirmado', 'En producción', 'Curando', 'Control de calidad', 'Listo', 'En ruta', 'Entregado', 'Cobrado'];
const ESTADOS_TAREA = ['Por hacer', 'En curso', 'Hecho', 'Después', 'Descartado'];
const ESTADOS_COMPRA = ['Por pedir', 'Pedida', 'Recibida', 'Pagada', 'Cancelada'];
const ESTADOS_RUTA = ['Planeada', 'Cargada', 'En camino', 'Terminada'];
const ESTADOS_PUESTO = ['Después', 'Buscar', 'Entrevistando', 'Contratado'];
const ESTADOS_CANDIDATO = ['Nuevo', 'Entrevista', 'Prueba', 'Oferta', 'Contratado', 'Descartado'];
const ESTADOS_MERCADO = ['Después', 'Explorando', 'Piloto', 'Activo', 'Descartado'];
const CANALES = ['tienditas', 'corporativo', 'parroquia', 'restaurante', 'recaudacion', 'personalizada', 'eventos', 'mayorista', 'cadena', 'insumos', 'otro'];
const CATEGORIAS = ['Ventas', 'Depósitos', 'Insumos', 'Nómina', 'Renta', 'Transporte', 'Servicios', 'Marketing', 'Impuestos', 'Equipo', 'Inversión', 'Otro'];
const AJUSTES = ['fase_actual', 'deposito', 'dias_entrega', 'dias_cobro', 'meta_semanal', 'receta_activa', 'bajas_cartuchos', 'capacidad_dia', 'pedido_minimo_cajas',
  'rejas_tarima', 'reja_kg', 'tarima_kg', 'iva', 'transf_pieza', 'mercado_piezas_anio', 'meta_participacion', 'piezas_tienda_semana', 'tiendas_distribuidor', 'piezas_centro_semana', 'gasto_fijo_mes', 'piezas_semana_hoy', 'ebitda_pieza',
  'margen_tienda', 'banco_nombre', 'banco_clabe', 'banco_beneficiario', 'whatsapp_negocio', 'meta_retorno', 'semanas_cobertura', 'plantilla_contacto', 'plantilla_hojas', 'plantilla_estado', 'dias_sin_pedir'];
const BITACORA = ['distribuidores', 'pedidos', 'tareas', 'compras', 'rutas', 'puestos', 'mercados', 'proveedores', 'inventario'];
// RLR · las pantallas del tablero y qué pantalla da permiso de tocar cada cosa. Un administrador ve y toca todo.
export const PANTALLAS = ['hoy', 'datos', 'distribuidores', 'pedidos', 'ventas', 'mercado', 'produccion', 'compras', 'rutas', 'cartuchos', 'indicadores', 'pagos', 'contabilidad', 'equipo', 'proyecto', 'receta', 'modelo'];
const PERMISO = {
  distribuidores: ['distribuidores'], pedidos: ['pedidos', 'rutas', 'pagos'], tareas: ['proyecto'], lotes: ['produccion'], inventario: ['produccion', 'compras'], recetas: ['receta'], pruebas: ['receta'], sesiones: ['receta'],
  proveedores: ['compras'], compras: ['compras', 'pagos'], movimientos: ['pagos', 'contabilidad'], rutas: ['rutas'], vehiculos: ['rutas'], centros: [], puestos: ['equipo'], candidatos: ['equipo'], mercados: ['mercado'],
  productos: [], usuarios: [], promos: [], nota: ['distribuidores', 'pedidos', 'proyecto', 'compras', 'rutas', 'equipo', 'mercado', 'produccion'],
};
export const pantallasDe = (u) => (u.rol === 'admin' ? PANTALLAS : String(u.pantallas || '').split(/\s+/).filter((p) => PANTALLAS.includes(p)));
const puede = (yo, rec) => yo.rol === 'admin' || (PERMISO[rec] || []).some((p) => pantallasDe(yo).includes(p));

/* Qué se puede tocar de cada cosa. Tipos: s texto corto · p párrafo · n número o vacío · m número (0 si vacío)
   b sí/no · f fecha AAAA-MM-DD · o una de varias opciones · j objeto */
const R = {
  distribuidores: {
    tabla: 'solicitudes', sello: 'actualizado', bitacora: 'estado', borrar: true,
    campos: {
      nombre: ['s', 120], empresa: ['s', 160], whatsapp: ['s', 30], zonas: ['s', 400], puntos: ['s', 40], tipos: ['s', 200], visita: ['s', 40],
      veladoras: ['s', 40], vehiculos: ['s', 40], pedido: ['s', 40], tipo: ['o', ['A', 'B', 'C']], estado: ['o', ESTADOS_DIST], zona: ['s', 200],
      exclusividad: ['b'], responsable: ['s', 160], proxima_accion: ['s', 300], proxima_fecha: ['f'], notas: ['p', 6000], credito: ['m'], tiendas: ['m'],
      canal: ['o', CANALES], direccion: ['s', 300], ciudad: ['s', 120], centro_id: ['n'], correo: ['s', 160],
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
    campos: { codigo: ['s', 40], receta_id: ['n'], piezas: ['m'], rechazadas: ['m'], fecha: ['f'], gph: ['n'], horas: ['n'], resultado: ['o', ['En prueba', 'Aprobado', 'Rechazado']], notas: ['p', 2000] },
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
    campos: { nombre: ['s', 120], piezas_caja: ['m'], precio_dist: ['m'], precio_publico: ['m'], lleva_vaso: ['b'], activo: ['b'], orden: ['m'], piezas_reja: ['m'], peso_kg: ['m'] },
  },
  usuarios: {
    tabla: 'usuarios', pk: 'correo', soloAdmin: true, borrar: true,
    campos: { nombre: ['s', 120], rol: ['o', ['admin', 'equipo']], pantallas: ['s', 400] },
    alCrear: (v) => ({ creado: ahora(), rol: 'equipo', ...v }),
  },
  promos: {
    tabla: 'promos', pk: 'clave', borrar: true, pide: ['nombre'],
    campos: { nombre: ['s', 120], descripcion: ['p', 600], precio: ['m'], condicion: ['s', 200], liga: ['s', 300], activo: ['b'], orden: ['m'] },
    alCrear: (v) => ({ activo: 1, orden: 99, ...v }),
  },
  // ── La empresa completa (migración 0003) ──
  proveedores: {
    tabla: 'proveedores', sello: 'actualizado', bitacora: 'estado', borrar: true, pide: ['nombre'],
    campos: { nombre: ['s', 160], insumos: ['s', 200], contacto: ['s', 120], whatsapp: ['s', 30], correo: ['s', 160], ciudad: ['s', 120], liga: ['s', 400], dias_entrega: ['m'], credito_dias: ['m'], estado: ['o', ['Por cotizar', 'Cotizado', 'Activo', 'En pausa']], notas: ['p', 4000] },
    alCrear: (v) => ({ creado: ahora(), ...v }),
  },
  compras: {
    tabla: 'compras', sello: 'actualizado', firma: 'por', bitacora: 'estado', borrar: true,
    campos: { proveedor_id: ['n'], lineas: ['j'], fecha: ['f'], fecha_esperada: ['f'], factura: ['s', 80], notas: ['p', 2000] },
    alCrear: (v) => ({ creado: ahora(), estado: 'Por pedir', fecha: hoyMX(), ...v }),
  },
  movimientos: {
    tabla: 'movimientos', firma: 'por', borrar: true, pide: ['tipo', 'fecha'],
    campos: { tipo: ['o', ['Cobro', 'Pago']], categoria: ['o', CATEGORIAS], concepto: ['s', 200], monto: ['m'], fecha: ['f'], metodo: ['o', ['Transferencia', 'Efectivo', 'Tarjeta', 'Cheque']], referencia: ['s', 80], distribuidor_id: ['n'], proveedor_id: ['n'], notas: ['p', 1000], conciliado: ['b'] },
    alCrear: (v) => ({ creado: ahora(), ...v }),
  },
  centros: { tabla: 'centros', borrar: true, pide: ['nombre'], campos: { nombre: ['s', 120], ciudad: ['s', 160], tipo: ['o', ['Planta', 'Maquila', 'Centro']], estado: ['o', ['Planeado', 'Activo', 'Cerrado']], piezas_semana: ['m'], abre: ['s', 20], notas: ['p', 2000], orden: ['m'] } },
  vehiculos: { tabla: 'vehiculos', borrar: true, pide: ['nombre'], campos: { nombre: ['s', 120], tarimas: ['m'], rejas: ['m'], kg: ['m'], costo_km: ['m'], propio: ['b'], activo: ['b'] } },
  rutas: {
    tabla: 'rutas', sello: 'actualizado', bitacora: 'estado', borrar: true, pide: ['fecha'],
    campos: { fecha: ['f'], repartidor: ['s', 120], vehiculo_id: ['n'], centro_id: ['n'], estado: ['o', ESTADOS_RUTA], km: ['m'], costo: ['m'], notas: ['p', 2000] },
    alCrear: (v) => ({ creado: ahora(), estado: 'Planeada', ...v }),
  },
  puestos: {
    tabla: 'puestos', sello: 'actualizado', bitacora: 'estado', borrar: true, pide: ['nombre'], hijos: ['candidatos', 'puesto_id'],
    campos: { orden: ['m'], nombre: ['s', 120], area: ['o', ['Dirección', 'Producción', 'Comercial', 'Logística', 'Compras', 'Dinero', 'Personas', 'Datos', 'Calidad']], hace: ['p', 2000], perfil: ['p', 2000], mide: ['p', 1000], disparador: ['m'], por_piezas: ['m'], sueldo: ['m'], donde: ['p', 2000], prueba: ['p', 2000], ocupadas: ['m'], estado: ['o', ESTADOS_PUESTO], persona: ['s', 200], notas: ['p', 4000] },
    alCrear: (v) => ({ orden: 99, ...v }),
  },
  candidatos: {
    tabla: 'candidatos', sello: 'actualizado', borrar: true, pide: ['puesto_id', 'nombre'],
    campos: { puesto_id: ['m'], nombre: ['s', 120], whatsapp: ['s', 30], fuente: ['s', 120], estado: ['o', ESTADOS_CANDIDATO], calificacion: ['m'], notas: ['p', 2000] },
    alCrear: (v) => ({ creado: ahora(), ...v }),
  },
  mercados: {
    tabla: 'mercados', sello: 'actualizado', bitacora: 'estado', borrar: true, pide: ['nombre'],
    campos: { orden: ['m'], tipo: ['o', ['Canal', 'Región', 'Fuente']], clave: ['s', 30], nombre: ['s', 160], descripcion: ['p', 2000], tamano: ['p', 1000], estrategia: ['p', 3000], como: ['p', 3000], fase: ['m'], prioridad: ['o', ['Alta', 'Media', 'Baja']], estado: ['o', ESTADOS_MERCADO], responsable: ['s', 160], meta_semana: ['m'], notas: ['p', 4000] },
    alCrear: (v) => ({ orden: 99, tipo: 'Canal', ...v }),
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
export const nota = (env, cosa, id, textoNota, por) =>
  env.DB.prepare('INSERT INTO bitacora (cosa, cosa_id, texto, por, fecha) VALUES (?, ?, ?, ?, ?)').bind(cosa, id, textoNota, por, ahora());

async function ajustes(env) {
  const { results } = await env.DB.prepare('SELECT clave, valor FROM ajustes').all();
  return Object.fromEntries(results.map((r) => [r.clave, r.valor]));
}

// ───────── RLR · todo el tablero en una sola respuesta ─────────
async function todo(env, yo) {
  const c = (s) => env.DB.prepare(s);
  const [us, di, bi, ta, pr, pe, inv, lo, re, pb, se, aj, pv, co, mo, ce, ve, ru, pu, ca, me, pm] = await env.DB.batch([
    c('SELECT correo, nombre, rol, pantallas FROM usuarios ORDER BY creado'),
    c('SELECT * FROM solicitudes ORDER BY id DESC'),
    c('SELECT * FROM bitacora ORDER BY id DESC LIMIT 1200'),
    c('SELECT * FROM tareas ORDER BY id'),
    c('SELECT * FROM productos ORDER BY orden'),
    c('SELECT * FROM pedidos ORDER BY id DESC'),
    c('SELECT * FROM inventario ORDER BY rowid'),
    c('SELECT * FROM lotes ORDER BY id DESC'),
    c('SELECT * FROM recetas ORDER BY id'),
    c('SELECT * FROM pruebas ORDER BY id'),
    c('SELECT * FROM prueba_sesiones ORDER BY id'),
    c('SELECT clave, valor FROM ajustes'),
    c('SELECT * FROM proveedores ORDER BY id'),
    c('SELECT * FROM compras ORDER BY id DESC'),
    c('SELECT * FROM movimientos ORDER BY fecha DESC, id DESC LIMIT 3000'),
    c('SELECT * FROM centros ORDER BY orden, id'),
    c('SELECT * FROM vehiculos ORDER BY id'),
    c('SELECT * FROM rutas ORDER BY fecha DESC, id DESC'),
    c('SELECT * FROM puestos ORDER BY orden, id'),
    c('SELECT * FROM candidatos ORDER BY id'),
    c('SELECT * FROM mercados ORDER BY orden, id'),
    c('SELECT * FROM promos ORDER BY orden, clave'),
  ]);
  const j = (t, d) => { try { return JSON.parse(t); } catch { return d; } };
  // Quien no es administrador solo recibe lo que sus pantallas usan; el resto llega vacío
  const ps = pantallasDe(yo), mira = (...xs) => yo.rol === 'admin' || xs.some((x) => ps.includes(x)), corta = (ok, filas) => (ok ? filas : []);
  return json({
    yo: { ...yo, pantallas: ps }, usuarios: yo.rol === 'admin' ? us.results : us.results.map((u) => ({ correo: u.correo, nombre: u.nombre, rol: u.rol })), distribuidores: di.results, bitacora: bi.results, tareas: ta.results, productos: pr.results,
    pedidos: pe.results.map((p) => ({ ...p, lineas: j(p.lineas, []), promos: j(p.promos, []) })), inventario: inv.results, lotes: lo.results, promos: pm.results,
    recetas: corta(mira('receta', 'produccion', 'contabilidad', 'datos'), re.results.map((r) => ({ ...r, datos: j(r.datos, {}) }))), pruebas: corta(mira('receta', 'hoy'), pb.results), sesiones: corta(mira('receta', 'hoy'), se.results),
    ajustes: Object.fromEntries(aj.results.filter((r) => yo.rol === 'admin' || !r.clave.startsWith('banco_')).map((r) => [r.clave, r.valor])),
    proveedores: corta(mira('compras', 'pagos', 'hoy', 'datos'), pv.results), compras: corta(mira('compras', 'pagos', 'contabilidad', 'hoy', 'datos'), co.results.map((x) => ({ ...x, lineas: j(x.lineas, []) }))), movimientos: corta(mira('pagos', 'contabilidad', 'datos'), mo.results),
    centros: ce.results, vehiculos: ve.results, rutas: ru.results, puestos: corta(mira('equipo', 'mercado', 'datos', 'contabilidad', 'hoy'), pu.results), candidatos: corta(mira('equipo'), ca.results), mercados: me.results,
    estados: { distribuidores: ESTADOS_DIST, pedidos: ESTADOS_PEDIDO, tareas: ESTADOS_TAREA, compras: ESTADOS_COMPRA, rutas: ESTADOS_RUTA, puestos: ESTADOS_PUESTO, candidatos: ESTADOS_CANDIDATO, mercados: ESTADOS_MERCADO, canales: CANALES, categorias: CATEGORIAS },
  });
}

// ───────── Lo genérico: crear, cambiar y borrar ─────────
async function crear(env, yo, rec, cuerpo) {
  const def = R[rec], pk = def.pk || 'id';
  let v = limpiar(def.campos, cuerpo);
  if (def.alCrear) v = def.alCrear(v);
  if (rec === 'usuarios') v.pantallas = String(v.pantallas || '').split(/\s+/).filter((x) => PANTALLAS.includes(x)).join(' ');
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
  if (rec === 'usuarios' && 'pantallas' in v) v.pantallas = v.pantallas.split(/\s+/).filter((x) => PANTALLAS.includes(x)).join(' ');
  const extra = [];
  if (rec === 'distribuidores' && 'correo' in v) {
    v.correo = v.correo.toLowerCase();
    if (v.correo && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.correo)) throw new Mal('Escribe un correo válido.');
    if (v.correo && (await env.DB.prepare('SELECT id FROM solicitudes WHERE correo = ? AND id <> ?').bind(v.correo, id).first())) throw new Mal('Ese correo ya es de otro distribuidor.');
    if (v.correo !== antes.correo) extra.push(env.DB.prepare('DELETE FROM sesiones_dist WHERE distribuidor_id = ?').bind(id));
  }
  if (def.sello) v[def.sello] = ahora();
  if (def.firma) v[def.firma] = yo.correo;
  const cols = Object.keys(v), lote = [env.DB.prepare(`UPDATE ${def.tabla} SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE ${pk} = ?`).bind(...cols.map((c) => v[c]), id), ...extra];
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
export async function calcularPedido(env, lineas, vacios, promos) {
  const [{ results: productos }, { results: promosCat }] = await env.DB.batch([env.DB.prepare('SELECT * FROM productos'), env.DB.prepare('SELECT * FROM promos WHERE activo = 1')]);
  const a = await ajustes(env), deposito = Number(a.deposito) || 0, rejaKg = Number(a.reja_kg) || 0;
  // Material de promoción: va aparte, no lleva depósito ni baja material del inventario
  const pm = [];
  let promosTotal = 0;
  for (const x of Array.isArray(promos) ? promos : []) {
    const p = promosCat.find((y) => y.clave === x.clave), n = Math.floor(Number(x.cantidad));
    if (!p || !(n > 0) || n > 1000) continue;
    pm.push({ clave: p.clave, cantidad: n }); promosTotal += n * p.precio;
  }
  const limpias = [];
  let piezas = 0, piezasVaso = 0, cajas = 0, subtotal = 0, rejas = 0, kg = 0;
  for (const l of Array.isArray(lineas) ? lineas : []) {
    const p = productos.find((x) => x.clave === l.clave), n = Math.floor(Number(l.cajas));
    if (!p || !(n > 0) || n > 100000) continue;
    limpias.push({ clave: p.clave, cajas: n });
    cajas += n; piezas += n * p.piezas_caja; subtotal += n * p.piezas_caja * p.precio_dist;
    if (p.lleva_vaso) piezasVaso += n * p.piezas_caja;
    // Empaque: cada producto llena sus propias rejas; la última va parcial
    rejas += (n * p.piezas_caja) / (p.piezas_reja || 24); kg += n * p.piezas_caja * (p.peso_kg || 0);
  }
  const v = Math.max(0, Math.floor(Number(vacios) || 0)), rejasEnteras = Math.ceil(rejas - 1e-9);
  return { lineas: JSON.stringify(limpias), piezas, piezas_vaso: piezasVaso, cajas, subtotal: Math.round(subtotal * 100) / 100, deposito, vacios: v,
    promos: JSON.stringify(pm), promos_total: Math.round(promosTotal * 100) / 100,
    total: Math.round((subtotal + deposito * (piezas - v) + promosTotal) * 100) / 100, rejas: rejasEnteras, kg: Math.round((kg + rejasEnteras * rejaKg) * 10) / 10 };
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
  const c = await calcularPedido(env, cuerpo.lineas, cuerpo.vacios, cuerpo.promos);
  if (!c.piezas && !c.promos_total && c.promos === '[]') throw new Mal('El pedido no tiene piezas.');
  const id = await insertarPedido(env, dist.id, c, cuerpo, 'tablero');
  await nota(env, 'pedidos', id, 'Pedido creado en el tablero', yo.correo).run();
  return json({ ok: true, id, recargar: true });
}

// RLR · un pedido nuevo, venga del tablero, de la liga o del panel del distribuidor
export async function insertarPedido(env, distId, c, cuerpo, origen) {
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(cuerpo.fecha_prometida || '') ? cuerpo.fecha_prometida : '';
  const r = await env.DB.prepare(
    `INSERT INTO pedidos (distribuidor_id, estado, lineas, piezas, piezas_vaso, cajas, subtotal, deposito, total, vacios, rejas, kg, promos, promos_total, anticipado, fecha_prometida, notas, origen, creado)
     VALUES (?, 'Recibido', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(distId, c.lineas, c.piezas, c.piezas_vaso, c.cajas, c.subtotal, c.deposito, c.total, c.vacios, c.rejas, c.kg, c.promos, c.promos_total, cuerpo.anticipado ? 1 : 0, fecha, parrafo(cuerpo.notas, 2000), origen, ahora()).run();
  return r.meta.last_row_id;
}

// RLR · marcar un pedido como pagado (Stripe, transferencia confirmada o efectivo): el dinero entra al libro una sola vez
export function pagarPedido(env, p, metodo, por, referencia = '') {
  const fecha = p.cobrado_fecha || hoyMX(), dep = p.deposito * (p.piezas - p.vacios), venta = Math.round((p.total - dep) * 100) / 100;
  const lote = [
    env.DB.prepare('UPDATE pedidos SET cobro = ?, cobrado_fecha = ?, pago_metodo = ?, actualizado = ?, estado = CASE WHEN estado = ? THEN ? ELSE estado END WHERE id = ?').bind('Cobrado', fecha, metodo, ahora(), 'Recibido', 'Confirmado', p.id),
    env.DB.prepare('DELETE FROM movimientos WHERE pedido_id = ?').bind(p.id),
    env.DB.prepare(`INSERT INTO movimientos (tipo, categoria, concepto, monto, fecha, metodo, referencia, pedido_id, distribuidor_id, creado, por) VALUES ('Cobro', 'Ventas', ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(`Pedido #${p.id}`, venta, fecha, metodo === 'Stripe' ? 'Tarjeta' : metodo === 'Efectivo' ? 'Efectivo' : 'Transferencia', texto(referencia, 80), p.id, p.distribuidor_id, ahora(), por),
    nota(env, 'pedidos', p.id, `Pagado por ${metodo.toLowerCase()}${referencia ? ' · ' + texto(referencia, 80) : ''}${p.estado === 'Recibido' ? ' · pasa a Confirmado' : ''}`, por),
  ];
  if (dep) lote.push(env.DB.prepare(`INSERT INTO movimientos (tipo, categoria, concepto, monto, fecha, metodo, pedido_id, distribuidor_id, creado, por) VALUES (?, 'Depósitos', ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(dep > 0 ? 'Cobro' : 'Pago', `Depósitos de cartuchos · pedido #${p.id}`, Math.abs(Math.round(dep * 100) / 100), fecha, metodo === 'Stripe' ? 'Tarjeta' : 'Transferencia', p.id, p.distribuidor_id, ahora(), por));
  return lote;
}

export async function cambiarPedido(env, yo, id, cuerpo, ctx) {
  const p = await uno(env, 'pedidos', 'id', id);
  if (!p) throw new Mal('Ya no existe.', 404);
  const v = {}, lote = [], avisos = [];
  if ('notas' in cuerpo) v.notas = parrafo(cuerpo.notas, 2000);
  if ('fecha_prometida' in cuerpo) v.fecha_prometida = /^\d{4}-\d{2}-\d{2}$/.test(cuerpo.fecha_prometida || '') ? cuerpo.fecha_prometida : '';
  if ('lote_id' in cuerpo) v.lote_id = Number(cuerpo.lote_id) || null;
  if ('ruta_id' in cuerpo) { v.ruta_id = Number(cuerpo.ruta_id) || null; if (!v.ruta_id) v.parada = 0; }
  if ('anticipado' in cuerpo) v.anticipado = cuerpo.anticipado ? 1 : 0;
  if (cuerpo.confirmar_pago) {
    if (p.cobro === 'Cobrado') throw new Mal('Ya está pagado.');
    await env.DB.batch(pagarPedido(env, p, p.pago_aviso ? 'Transferencia' : 'Efectivo', yo.correo, p.pago_aviso));
    return json({ ok: true, recargar: true });
  }
  if ('parada' in cuerpo) v.parada = Math.max(0, Math.floor(Number(cuerpo.parada) || 0));
  if ('lineas' in cuerpo || 'vacios' in cuerpo || 'promos' in cuerpo) {
    // Los vacíos que de verdad entregó se pueden corregir hasta que se cobre; las piezas se congelan al fabricar o al pagar
    const soloVacios = !('lineas' in cuerpo) && !('promos' in cuerpo);
    if (p.descontado && !soloVacios) throw new Mal('Ya se fabricó: las piezas no se pueden cambiar.');
    if (p.cobro === 'Cobrado') throw new Mal('Ya está pagado: las piezas no se cambian. Haz otro pedido.');
    const c = await calcularPedido(env, 'lineas' in cuerpo ? cuerpo.lineas : JSON.parse(p.lineas), 'vacios' in cuerpo ? cuerpo.vacios : p.vacios, 'promos' in cuerpo ? cuerpo.promos : JSON.parse(p.promos || '[]'));
    if (!c.piezas) throw new Mal('El pedido no tiene piezas.');
    Object.assign(v, c);
  }
  if ('estado' in cuerpo && cuerpo.estado !== p.estado) {
    const de = ESTADOS_PEDIDO.indexOf(p.estado), a = ESTADOS_PEDIDO.indexOf(cuerpo.estado);
    if (a < 0) throw new Mal('Estado no permitido.');
    v.estado = cuerpo.estado;
    lote.push(nota(env, 'pedidos', id, `${p.estado} → ${cuerpo.estado}`, yo.correo));
    if (['Confirmado', 'Listo', 'En ruta', 'Entregado'].includes(cuerpo.estado)) avisos.push(cuerpo.estado);
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
    // Al cobrarse, el dinero entra solo al libro de movimientos (y sale si se regresa el estado)
    if (cuerpo.estado === 'Cobrado' && p.cobro === 'Cobrado') { /* ya se había pagado antes de entregar: el libro ya lo tiene */ }
    else if (cuerpo.estado === 'Cobrado') {
      v.cobro = 'Cobrado'; v.cobrado_fecha = p.cobrado_fecha || hoyMX(); v.pago_metodo = p.pago_metodo || 'Efectivo';
      const total = v.total ?? p.total, dep = (v.deposito ?? p.deposito) * (piezas - vacios), venta = Math.round((total - dep) * 100) / 100;
      lote.push(env.DB.prepare('DELETE FROM movimientos WHERE pedido_id = ?').bind(id));
      lote.push(env.DB.prepare(`INSERT INTO movimientos (tipo, categoria, concepto, monto, fecha, metodo, pedido_id, distribuidor_id, creado, por) VALUES ('Cobro', 'Ventas', ?, ?, ?, 'Transferencia', ?, ?, ?, ?)`)
        .bind(`Pedido #${id}`, venta, v.cobrado_fecha, id, p.distribuidor_id, ahora(), yo.correo));
      if (dep) lote.push(env.DB.prepare(`INSERT INTO movimientos (tipo, categoria, concepto, monto, fecha, metodo, pedido_id, distribuidor_id, creado, por) VALUES (?, 'Depósitos', ?, ?, ?, 'Transferencia', ?, ?, ?, ?)`)
        .bind(dep > 0 ? 'Cobro' : 'Pago', `Depósitos de cartuchos · pedido #${id}`, Math.abs(Math.round(dep * 100) / 100), v.cobrado_fecha, id, p.distribuidor_id, ahora(), yo.correo));
    } else if (de === ESTADOS_PEDIDO.indexOf('Cobrado') && !['Stripe', 'Transferencia'].includes(p.pago_metodo)) { v.cobro = 'Pendiente'; v.cobrado_fecha = null; v.pago_metodo = ''; lote.push(env.DB.prepare('DELETE FROM movimientos WHERE pedido_id = ?').bind(id)); }
  }
  if (!Object.keys(v).length) throw new Mal('Nada que guardar.');
  v.actualizado = ahora();
  const cols = Object.keys(v);
  await env.DB.batch([env.DB.prepare(`UPDATE pedidos SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`).bind(...cols.map((c) => v[c]), id), ...lote]);
  // El distribuidor con correo se entera solo de los pasos que le importan
  if (avisos.length && ctx) ctx.waitUntil(avisarDistribuidor(env, p.distribuidor_id, id, avisos[avisos.length - 1], v.fecha_prometida ?? p.fecha_prometida));
  return json({ ok: true, recargar: true });
}

const TEXTO_ESTADO = { Confirmado: 'quedó confirmado y entra a producción', Listo: 'ya está listo y empacado; sale en la próxima ruta', 'En ruta': 'va en camino', Entregado: 'quedó entregado. Gracias' };
async function avisarDistribuidor(env, distId, pedidoId, estado, fecha) {
  const d = await env.DB.prepare('SELECT correo, nombre, empresa FROM solicitudes WHERE id = ?').bind(distId).first();
  if (!d || !d.correo) return;
  const liga = `https://${CASA}/distribuidor/?pedido=${pedidoId}`;
  return enviar(env, { para: d.correo, asunto: `Tu pedido #${pedidoId} ${estado === 'En ruta' ? 'va en camino' : estado.toLowerCase()} · La Vela`,
    html: plantilla({ titulo: `Pedido #${pedidoId}: ${estado}`, lineas: [`Hola ${(d.nombre || '').split(' ')[0] || d.empresa}: tu pedido #${pedidoId} ${TEXTO_ESTADO[estado] || estado.toLowerCase()}.${fecha && estado !== 'Entregado' ? ` Entrega: ${fecha}.` : ''}`], boton: 'Ver mi pedido', liga, pie: 'Este correo sale solo cuando tu pedido cambia de paso.' }),
    texto: `Tu pedido #${pedidoId} ${TEXTO_ESTADO[estado] || estado}. ${liga}` });
}

async function borrarPedido(env, id) {
  const p = await uno(env, 'pedidos', 'id', id);
  if (!p) throw new Mal('Ya no existe.', 404);
  if (p.descontado) throw new Mal('Ya se fabricó: no se puede borrar.');
  await env.DB.batch([env.DB.prepare('DELETE FROM pedidos WHERE id = ?').bind(id), env.DB.prepare(`DELETE FROM bitacora WHERE cosa = 'pedidos' AND cosa_id = ?`).bind(id)]);
  return json({ ok: true });
}

// ───────── RLR · compras: la orden entra al inventario al recibirse y al libro al pagarse ─────────
async function totalCompra(env, lineas) {
  const { results: inv } = await env.DB.prepare('SELECT clave FROM inventario').all();
  const limpias = [];
  let total = 0;
  for (const l of Array.isArray(lineas) ? lineas : []) {
    const clave = texto(l.clave, 40), n = Number(l.cantidad), c = Number(l.costo);
    if (!inv.some((i) => i.clave === clave) || !(n > 0)) continue;
    limpias.push({ clave, cantidad: Math.round(n * 100) / 100, costo: Number.isFinite(c) && c >= 0 ? Math.round(c * 100) / 100 : 0 });
    total += n * (Number.isFinite(c) ? c : 0);
  }
  return { lineas: JSON.stringify(limpias), total: Math.round(total * 100) / 100, limpias };
}

async function cambiarCompra(env, yo, id, cuerpo) {
  const c = await uno(env, 'compras', 'id', id);
  if (!c) throw new Mal('Ya no existe.', 404);
  const v = limpiar(R.compras.campos, cuerpo), lote = [];
  if ('lineas' in cuerpo) {
    if (c.recibida) throw new Mal('Ya se recibió: las cantidades no se cambian.');
    const t = await totalCompra(env, cuerpo.lineas);
    v.lineas = t.lineas; v.total = t.total;
  }
  if ('estado' in cuerpo && cuerpo.estado !== c.estado) {
    if (!ESTADOS_COMPRA.includes(cuerpo.estado)) throw new Mal('Estado no permitido.');
    const a = ESTADOS_COMPRA.indexOf(cuerpo.estado);
    v.estado = cuerpo.estado;
    lote.push(nota(env, 'compras', id, `${c.estado} → ${cuerpo.estado}`, yo.correo));
    // Al recibirse, lo comprado entra al inventario y el costo por unidad se pone al día, una sola vez
    if (a >= ESTADOS_COMPRA.indexOf('Recibida') && a < ESTADOS_COMPRA.indexOf('Cancelada') && !c.recibida) {
      const lineas = JSON.parse(v.lineas || c.lineas || '[]');
      if (!lineas.length) throw new Mal('La orden no tiene renglones.');
      for (const l of lineas) lote.push(env.DB.prepare('UPDATE inventario SET existencia = existencia + ?, costo = CASE WHEN ? > 0 THEN ? ELSE costo END, actualizado = ? WHERE clave = ?').bind(l.cantidad, l.costo, l.costo, ahora(), l.clave));
      lote.push(nota(env, 'compras', id, `Entró al inventario: ${lineas.map((l) => `${l.cantidad} de ${l.clave}`).join(', ')}`, 'tablero'));
      v.recibida = 1; v.recibida_fecha = c.recibida_fecha || hoyMX();
    }
    if (cuerpo.estado === 'Pagada') {
      v.pagada_fecha = c.pagada_fecha || hoyMX();
      lote.push(env.DB.prepare('DELETE FROM movimientos WHERE compra_id = ?').bind(id));
      lote.push(env.DB.prepare(`INSERT INTO movimientos (tipo, categoria, concepto, monto, fecha, metodo, compra_id, proveedor_id, creado, por) VALUES ('Pago', 'Insumos', ?, ?, ?, 'Transferencia', ?, ?, ?, ?)`)
        .bind(`Compra #${id}${c.factura ? ' · ' + c.factura : ''}`, v.total ?? c.total, v.pagada_fecha, id, c.proveedor_id, ahora(), yo.correo));
    } else if (c.estado === 'Pagada') { v.pagada_fecha = null; lote.push(env.DB.prepare('DELETE FROM movimientos WHERE compra_id = ?').bind(id)); }
  }
  if (!Object.keys(v).length) throw new Mal('Nada que guardar.');
  v.actualizado = ahora(); v.por = yo.correo;
  const cols = Object.keys(v);
  await env.DB.batch([env.DB.prepare(`UPDATE compras SET ${cols.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).bind(...cols.map((k) => v[k]), id), ...lote]);
  return json({ ok: true, recargar: true });
}

async function crearCompra(env, yo, cuerpo) {
  const t = await totalCompra(env, cuerpo.lineas);
  if (!t.limpias.length) throw new Mal('La orden no tiene renglones.');
  const v = limpiar(R.compras.campos, cuerpo);
  const r = await env.DB.prepare('INSERT INTO compras (proveedor_id, estado, lineas, total, fecha, fecha_esperada, factura, notas, creado, por) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(v.proveedor_id || null, 'Por pedir', t.lineas, t.total, v.fecha || hoyMX(), v.fecha_esperada || '', v.factura || '', v.notas || '', ahora(), yo.correo).run();
  await nota(env, 'compras', r.meta.last_row_id, 'Orden creada', yo.correo).run();
  return json({ ok: true, id: r.meta.last_row_id, recargar: true });
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

    if (rec !== 'ajustes' && !puede(yo, rec === 'nota' ? 'nota' : rec)) throw new Mal('Tu cuenta no tiene esa pantalla.', 403);
    if (rec === 'ajustes' && m === 'PATCH') {
      if (yo.rol !== 'admin' && !['capacidad_dia', 'bajas_cartuchos', 'receta_activa'].includes(idCrudo)) throw new Mal('Solo un administrador cambia los ajustes.', 403);
      if (!AJUSTES.includes(idCrudo)) throw new Mal('Ajuste desconocido.');
      await env.DB.prepare('INSERT INTO ajustes (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor').bind(idCrudo, texto(String(cuerpo.valor ?? ''), 200)).run();
      return json({ ok: true });
    }
    if (rec === 'nota' && m === 'POST') {
      const t = parrafo(cuerpo.texto, 2000), cosa = texto(cuerpo.cosa, 20);
      if (!t || !BITACORA.includes(cosa)) throw new Mal('Escribe la nota.');
      await nota(env, cosa, Number(cuerpo.cosa_id) || 0, t, yo.correo).run();
      return json({ ok: true, recargar: true });
    }
    if (rec === 'pedidos') {
      if (m === 'POST') return await crearPedido(env, yo, cuerpo);
      if (m === 'PATCH') return await cambiarPedido(env, yo, Number(idCrudo), cuerpo, ctx);
      if (m === 'DELETE') return await borrarPedido(env, Number(idCrudo));
    }
    if (rec === 'compras' && m === 'POST' && !idCrudo) return await crearCompra(env, yo, cuerpo);
    if (rec === 'compras' && m === 'PATCH' && idCrudo) return await cambiarCompra(env, yo, Number(idCrudo), cuerpo);
    if (rec === 'compras' && m === 'DELETE' && idCrudo) {
      const c = await uno(env, 'compras', 'id', Number(idCrudo));
      if (!c) throw new Mal('Ya no existe.', 404);
      if (c.recibida) throw new Mal('Ya entró al inventario: cancélala en lugar de borrarla.');
      await env.DB.batch([env.DB.prepare('DELETE FROM compras WHERE id = ?').bind(c.id), env.DB.prepare(`DELETE FROM bitacora WHERE cosa = 'compras' AND cosa_id = ?`).bind(c.id)]);
      return json({ ok: true });
    }
    // Una ruta recibe sus paradas en orden: [{pedido_id, parada}]; los pedidos que ya no están en la lista salen de la ruta
    if (rec === 'rutas' && accion === 'paradas' && m === 'POST') {
      const r = await uno(env, 'rutas', 'id', Number(idCrudo));
      if (!r) throw new Mal('Ya no existe.', 404);
      const ps = (Array.isArray(cuerpo.paradas) ? cuerpo.paradas : []).map((x, i) => [Number(x.pedido_id) || 0, i + 1]).filter((x) => x[0]);
      const lote = [env.DB.prepare('UPDATE pedidos SET ruta_id = NULL, parada = 0 WHERE ruta_id = ?').bind(r.id)];
      for (const [pid, n] of ps) lote.push(env.DB.prepare('UPDATE pedidos SET ruta_id = ?, parada = ?, actualizado = ? WHERE id = ? AND entregado_fecha IS NULL').bind(r.id, n, ahora(), pid));
      await env.DB.batch(lote);
      return json({ ok: true, recargar: true });
    }
    if (rec === 'rutas' && accion === 'liga' && m === 'POST') {
      const r = await uno(env, 'rutas', 'id', Number(idCrudo));
      if (!r) throw new Mal('Ya no existe.', 404);
      const liga = cuerpo.nueva || !r.liga ? azar(20) : r.liga;
      if (liga !== r.liga) await env.DB.batch([env.DB.prepare('UPDATE rutas SET liga = ? WHERE id = ?').bind(liga, r.id), nota(env, 'rutas', r.id, r.liga ? 'Liga del repartidor renovada' : 'Liga del repartidor creada', yo.correo)]);
      return json({ ok: true, liga, recargar: true });
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
