/* RLR · La Vela — las cuentas del tablero — Ricardo López Reyero
   Todo lo que se calcula a partir de los datos: plazos, saldos, necesidades, cartuchos, pruebas y pendientes. */
import { S, aj, diasA, dinero, fecha, hoyISO, horasDesde, num, wa } from './nucleo.js';

const _RLR = 'Ricardo López Reyero', _k = 'EYE', _rev = 181218; // RLR

export const dist = (id) => S.distribuidores.find((d) => d.id === id);
export const producto = (clave) => S.productos.find((p) => p.clave === clave);
export const paso = (estado) => S.estados.pedidos.indexOf(estado);
export const inv = (clave) => S.inventario.find((i) => i.clave === clave);

// Las cuatro fases del proyecto (docs/05)
export const FASES = [
  { n: 1, nombre: 'Prototipo', metrica: 'Duración comprobada', pasa: '3 de 3 velas pasan de 160 horas, sin túnel ni fallas.' },
  { n: 2, nombre: 'Lanzamiento', metrica: 'Preventas o piloto', pasa: '50 preventas pagadas, o un piloto de 50 tiendas rotando.' },
  { n: 3, nombre: 'Escala', metrica: 'Recompra', pasa: 'Más del 40% de las piezas vendidas son cartuchos.' },
  { n: 4, nombre: 'Planta', metrica: 'Demanda sostenida', pasa: 'Más de 47 mil piezas al mes; antes conviene maquilar.' },
];

// Gramos de cera por pieza, según la receta activa
export function gramosPieza() {
  const r = S.recetas.find((x) => x.id === aj('receta_activa', 1)) || S.recetas[0];
  const p = r && r.datos && r.datos.parametros;
  const g = p ? p.gph * p.horas * (1 + p.residual) : 0;
  return g > 0 ? g : 398;
}

// RLR · plazo para atender una solicitud nueva: A en 24 h, B en 72 h, C sin llamada
export function plazo(d) {
  if (d.estado !== 'Nuevo') return null;
  const limite = d.tipo === 'A' ? 24 : d.tipo === 'B' ? 72 : 0;
  if (!limite) return { vencido: false, texto: 'Mensaje con catálogo, sin llamada' };
  const quedan = limite - horasDesde(d.creada);
  return { vencido: quedan < 0, texto: quedan < 0 ? `Plazo vencido hace ${Math.ceil(-quedan)} h` : `Quedan ${Math.floor(quedan)} h para ${d.tipo === 'A' ? 'llamarle' : 'la videollamada'}` };
}

// Otro distribuidor con exclusividad en la misma zona
export function zonaTomada(d) {
  const mia = `${d.zona} ${d.zonas}`.toLowerCase().split(/[^a-záéíóúñü]+/).filter((w) => w.length > 3);
  return S.distribuidores.find((o) => o.id !== d.id && o.exclusividad && ['Piloto', 'Activo'].includes(o.estado)
    && `${o.zona} ${o.zonas}`.toLowerCase().split(/[^a-záéíóúñü]+/).some((w) => w.length > 3 && mia.includes(w)));
}

export const porCobrar = () => S.pedidos.filter((p) => p.entregado_fecha && p.cobro !== 'Cobrado');
export const saldoDe = (id) => porCobrar().filter((p) => p.distribuidor_id === id).reduce((s, p) => s + p.total, 0);
export const abiertos = () => S.pedidos.filter((p) => paso(p.estado) < paso('Entregado'));

// El total del pedido, igual que lo calcula el servidor
export function totalDe(lineas, vacios) {
  let piezas = 0, cajas = 0, subtotal = 0;
  for (const l of lineas) {
    const p = producto(l.clave), n = Math.max(0, Math.floor(Number(l.cajas) || 0));
    if (!p || !n) continue;
    cajas += n; piezas += n * p.piezas_caja; subtotal += n * p.piezas_caja * p.precio_dist;
  }
  const d = aj('deposito'), v = Math.max(0, Math.floor(Number(vacios) || 0));
  return { piezas, cajas, subtotal, deposito: d, cargo: d * piezas, abono: d * v, total: subtotal + d * (piezas - v) };
}

// Lo que hay que fabricar y lo que eso pide de material
export function porFabricar() {
  const ps = S.pedidos.filter((p) => ['Confirmado', 'En producción'].includes(p.estado) && !p.descontado);
  let piezas = 0, vaso = 0, cajas = 0;
  const porProd = {};
  for (const p of ps) {
    piezas += p.piezas; vaso += p.piezas_vaso; cajas += p.cajas;
    for (const l of p.lineas) porProd[l.clave] = (porProd[l.clave] || 0) + l.cajas * (producto(l.clave)?.piezas_caja || 12);
  }
  return { pedidos: ps, piezas, vaso, cajas, porProd, pide: { cera: (piezas * gramosPieza()) / 1000, vaso, mecha: piezas, cartucho: piezas, etiqueta: vaso, caja: cajas } };
}

// Cartuchos: los que salieron, los que volvieron y los que andan fuera
export function cartuchos() {
  const entregados = S.pedidos.filter((p) => p.entregado_fecha);
  const porDist = {};
  let enviados = 0, regresados = 0;
  for (const p of entregados) {
    enviados += p.piezas; regresados += p.vacios;
    const d = (porDist[p.distribuidor_id] ||= { enviados: 0, regresados: 0 });
    d.enviados += p.piezas; d.regresados += p.vacios;
  }
  const fuera = Math.max(0, enviados - regresados);
  return { enviados, regresados, fuera, tasa: enviados ? regresados / enviados : null, enPlanta: inv('cartucho')?.existencia || 0, depositos: fuera * aj('deposito'), bajas: aj('bajas_cartuchos'), porDist };
}

// RLR · una prueba de encendido: gramos por hora y horas proyectadas (docs/03)
export function medir(p) {
  const ss = S.sesiones.filter((s) => s.prueba_id === p.id);
  const horas = ss.reduce((t, s) => t + s.horas, 0), ultima = ss[ss.length - 1];
  if (!p.peso_inicial || !ultima || !horas) return { sesiones: ss, horas, listo: false };
  const consumido = p.peso_inicial - ultima.peso_final, gph = consumido / horas;
  const proy = gph > 0 ? (p.peso_inicial * (1 - p.residual)) / gph : null;
  const falla = ss.some((s) => s.tunel) ? 'hizo túnel' : ss.some((s) => s.hollin) ? 'echó humo negro' : ultima.flama_mm != null && ultima.flama_mm < 15 ? 'flama de menos de 1.5 cm' : '';
  return { sesiones: ss, horas, consumido, gph, proy, falla, pasa: !falla && proy != null && proy >= p.meta_horas, listo: true };
}

// Domingo de Pascua (cálculo gregoriano), para la Semana Santa
function pascua(a) {
  const c = a % 19, b = Math.floor(a / 100), d = a % 100, e = Math.floor(b / 4), f = b % 4, g = Math.floor((b + 8) / 25);
  const h = (19 * c + b - e - Math.floor((b - g + 1) / 3) + 15) % 30, i = Math.floor(d / 4), k = d % 4;
  const l = (32 + 2 * f + 2 * i - h - k) % 7, m = Math.floor((c + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(a, mes - 1, dia);
}
export function temporadas() {
  const hoy = new Date(hoyISO() + 'T00:00'), lista = [];
  const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  for (const a of [hoy.getFullYear(), hoy.getFullYear() + 1]) {
    const santo = pascua(a); santo.setDate(santo.getDate() - 2);
    lista.push(['San Valentín', new Date(a, 1, 14)], ['Semana Santa', santo], ['Día de las Madres', new Date(a, 4, 10)], ['Fiesta de San Judas Tadeo', new Date(a, 9, 28)],
      ['Día de Muertos', new Date(a, 10, 1)], ['Virgen de Guadalupe', new Date(a, 11, 12)], ['Navidad', new Date(a, 11, 24)]);
  }
  const d28 = new Date(hoy.getFullYear(), hoy.getMonth(), 28);
  if (d28 < hoy) d28.setMonth(d28.getMonth() + 1);
  if (!(d28.getMonth() === 9)) lista.push(['San Judas (día 28)', d28]);
  return lista.filter(([, d]) => d >= hoy).sort((x, y) => x[1] - y[1]).map(([nombre, d]) => ({ nombre, fecha: iso(d), dias: Math.round((d - hoy) / 86400000) }));
}

export const saludo = (d) => `Hola ${(d.nombre || '').split(' ')[0] || ''}, te escribo de La Vela.`.replace('Hola ,', 'Hola,');
// Las plantillas se editan en Ajustes; {zonas} {pedido} {estado} {detalle} se rellenan aquí
const rellenar = (clave, defecto, datos) => (S.ajustes[clave] || defecto).replace(/\{(\w+)\}/g, (m, k) => (k in datos ? datos[k] : m));
export const mensajes = (d) => [
  ['Primer contacto', `${saludo(d)} ${rellenar('plantilla_contacto', 'Recibimos tu solicitud para distribuir{zonas}. ¿Te puedo llamar hoy para platicarte cómo funciona y enseñarte los números?', { zonas: d.zonas ? ' en ' + d.zonas : '' })}`],
  ['Mandar las hojas', `${saludo(d)} ${rellenar('plantilla_hojas', 'Aquí puedes ver cómo funciona y descargar las hojas para ti, para la tienda y para el cliente: https://vela.capitaltorreon.com/distribuir#descargas', {})}`],
  ...(d.liga ? [['Su liga de pedidos', `${saludo(d)} Esta es tu liga para hacer pedidos, ver tu saldo y repetir el último: ${location.origin}/pedir?d=${d.liga}`]] : []),
  ...(d.correo ? [['Su panel', `${saludo(d)} Ya tienes tu panel: entra con tu cuenta de Google (${d.correo}) en ${location.origin}/distribuidor/ para pedir en un clic, ver cómo va cada pedido y pagar.`]] : []),
];
const TEXTO_ESTADO = { Confirmado: 'ya está confirmado y entra a producción', 'En producción': 'ya se está fabricando', Listo: 'ya está listo y sale en la próxima ruta', 'En ruta': 'va en camino', Entregado: 'quedó entregado, gracias' };
export const mensajeEstado = (p, d) => `${saludo(d || {})} ${rellenar('plantilla_estado', 'Tu pedido #{pedido} {estado}. {detalle}', { pedido: p.id, estado: TEXTO_ESTADO[p.estado] || 'está en «' + p.estado.toLowerCase() + '»', detalle: p.fecha_prometida && p.estado !== 'Entregado' ? `Entrega: ${fecha(p.fecha_prometida)}.` : '' })}`.trim();
export const mensajeCobro = (p, d) => `${saludo(d || {})} Te recuerdo el pedido #${p.id} por ${dinero(p.total, 2)}, entregado el ${fecha(p.entregado_fecha)}. ¿Me confirmas el pago?`;

// Último pedido y días sin pedir de un distribuidor
export function actividad(d) {
  const ps = S.pedidos.filter((p) => p.distribuidor_id === d.id), ultimo = ps[0];
  return { pedidos: ps, ultimo, piezas: ps.reduce((s, p) => s + p.piezas, 0), total: ps.reduce((s, p) => s + p.total, 0), dias: ultimo ? Math.max(0, -diasA(ultimo.creado.slice(0, 10))) : null };
}
// Semáforo de crédito: vacío = sin crédito definido o al día; medio = más de la mitad; lleno = excedido
export function semaforo(d) {
  if (!d.credito) return '';
  const c = credito(d);
  return c.excede ? 'lleno' : c.saldo > d.credito / 2 ? 'medio' : '';
}

// RLR · lo que pide atención hoy, de lo más urgente a lo menos
export function pendientes() {
  const p = [], hoy = hoyISO();
  for (const d of S.distribuidores) {
    const pl = plazo(d);
    if (pl) p.push({ urg: pl.vencido ? 2 : d.tipo === 'A' ? 1 : 0, titulo: `Solicitud nueva · tipo ${d.tipo} · ${d.empresa}`, detalle: pl.texto, liga: `#/distribuidores/${d.id}`, wa: wa(d.whatsapp, mensajes(d)[0][1]) });
    else if (d.proxima_fecha && d.proxima_fecha <= hoy && !['Descartado', 'En pausa'].includes(d.estado))
      p.push({ urg: d.proxima_fecha < hoy ? 2 : 1, titulo: `${d.empresa}: ${d.proxima_accion || 'dar seguimiento'}`, detalle: d.proxima_fecha < hoy ? `Era para el ${fecha(d.proxima_fecha)}` : 'Es para hoy', liga: `#/distribuidores/${d.id}`, wa: wa(d.whatsapp, saludo(d)) });
  }
  for (const x of S.pedidos) {
    const quien = dist(x.distribuidor_id)?.empresa || 'Sin distribuidor';
    if (x.estado === 'Recibido') p.push({ urg: 1, titulo: `Pedido #${x.id} por confirmar · ${quien}`, detalle: `${num(x.piezas)} piezas · ${dinero(x.total)}`, liga: `#/pedidos/${x.id}` });
    else if (paso(x.estado) < paso('Entregado') && x.fecha_prometida && x.fecha_prometida < hoy) p.push({ urg: 2, titulo: `Pedido #${x.id} atrasado · ${quien}`, detalle: `Se prometió para el ${fecha(x.fecha_prometida)} y va en «${x.estado}»`, liga: `#/pedidos/${x.id}` });
    if (x.entregado_fecha && x.cobro !== 'Cobrado' && -diasA(x.entregado_fecha) > aj('dias_cobro', 30)) p.push({ urg: 2, titulo: `Cobrar el pedido #${x.id} · ${quien}`, detalle: `${dinero(x.total)} · entregado hace ${-diasA(x.entregado_fecha)} días`, liga: `#/pedidos/${x.id}` });
  }
  const f = porFabricar();
  for (const i of S.inventario) {
    const falta = (f.pide[i.clave] || 0) - i.existencia;
    if (falta > 0) p.push({ urg: 2, titulo: `Falta ${i.nombre.toLowerCase()} para los pedidos confirmados`, detalle: `Hay ${num(i.existencia, i.unidad === 'kg' ? 1 : 0)} ${i.unidad} y se necesitan ${num(f.pide[i.clave], i.unidad === 'kg' ? 1 : 0)}`, liga: '#/produccion' });
    else if (i.minimo > 0 && i.existencia < i.minimo) p.push({ urg: 1, titulo: `${i.nombre}: debajo del mínimo`, detalle: `Hay ${num(i.existencia)} ${i.unidad}; el mínimo es ${num(i.minimo)}`, liga: '#/produccion' });
  }
  for (const t of S.tareas) {
    if (!t.fecha || !['Por hacer', 'En curso'].includes(t.estado)) continue;
    const d = diasA(t.fecha);
    if (d < 0) p.push({ urg: 2, titulo: t.titulo, detalle: `Tarea vencida: era para el ${fecha(t.fecha)}`, liga: `#/proyecto/${t.id}` });
    else if (d <= 7) p.push({ urg: d === 0 ? 1 : 0, titulo: t.titulo, detalle: d === 0 ? 'Tarea para hoy' : `Tarea para el ${fecha(t.fecha)}`, liga: `#/proyecto/${t.id}` });
  }
  // La empresa completa: compras que no llegan, pagos, rutas y contrataciones
  for (const c of S.compras || []) {
    if (c.estado === 'Pedida' && c.fecha_esperada && c.fecha_esperada < hoy) p.push({ urg: 2, titulo: `La compra #${c.id} no ha llegado`, detalle: `Se esperaba el ${fecha(c.fecha_esperada)} · ${dinero(c.total)}`, liga: `#/compras/${c.id}` });
    if (c.estado === 'Recibida') { const pv = (S.proveedores || []).find((x) => x.id === c.proveedor_id), vence = pv ? -diasA(c.recibida_fecha) >= pv.credito_dias : true; if (vence) p.push({ urg: 1, titulo: `Pagar la compra #${c.id}${pv ? ' · ' + pv.nombre : ''}`, detalle: `${dinero(c.total)} · recibida el ${fecha(c.recibida_fecha)}`, liga: `#/compras/${c.id}` }); }
  }
  for (const x of S.pedidos) if (x.pago_aviso && x.cobro !== 'Cobrado') p.push({ urg: 1, titulo: `Confirmar la transferencia del pedido #${x.id} · ${dist(x.distribuidor_id)?.empresa || ''}`, detalle: `${dinero(x.total)} · referencia ${x.pago_aviso} · avisó el ${fecha(x.pago_aviso_fecha)}`, liga: `#/pedidos/${x.id}` });
  for (const r of S.rutas || []) if (r.fecha === hoy && ['Planeada', 'Cargada'].includes(r.estado)) p.push({ urg: 1, titulo: `Ruta de hoy · ${r.repartidor || 'sin repartidor'}`, detalle: `${S.pedidos.filter((x) => x.ruta_id === r.id).length} paradas · ${r.estado}`, liga: `#/rutas/${r.id}` });
  const listos = S.pedidos.filter((x) => x.estado === 'Listo' && !x.ruta_id);
  if (listos.length) p.push({ urg: 1, titulo: `${listos.length} pedido(s) listos sin ruta`, detalle: `${listos.reduce((s, x) => s + x.rejas, 0)} rejas esperando repartidor`, liga: '#/rutas' });
  for (const f of plantilla(piezasSemana()).faltan) p.push({ urg: 1, titulo: `Toca contratar: ${f.p.nombre.toLowerCase()}`, detalle: `Hacen falta ${f.faltan} a ${num(piezasSemana())} piezas por semana`, liga: `#/equipo/${f.p.id}` });
  // Distribuidores activos que dejaron de pedir, anticipados que ya hay que producir, capacidad corta y retorno bajo
  const sinPedir = aj('dias_sin_pedir', 14);
  for (const d of S.distribuidores) {
    if (!['Piloto', 'Activo'].includes(d.estado)) continue;
    const a = actividad(d);
    if (a.ultimo && a.dias >= sinPedir) p.push({ urg: 1, titulo: `${d.empresa} lleva ${a.dias} días sin pedir`, detalle: `Su último pedido fue el ${fecha(a.ultimo.creado)} · ${num(a.ultimo.piezas)} piezas`, liga: `#/distribuidores/${d.id}`, wa: wa(d.whatsapp, `${saludo(d)} ¿Cómo va la venta? ¿Te mando el pedido de la semana?`) });
  }
  for (const x of S.pedidos) if (x.anticipado && x.estado === 'Confirmado' && x.fecha_prometida && diasA(x.fecha_prometida) <= 7) p.push({ urg: 2, titulo: `Producir ya el anticipado #${x.id} · ${dist(x.distribuidor_id)?.empresa || ''}`, detalle: `${num(x.piezas)} piezas para el ${fecha(x.fecha_prometida)}`, liga: `#/pedidos/${x.id}` });
  const cap = aj('capacidad_dia'), semana = S.pedidos.filter((x) => ['Confirmado', 'En producción'].includes(x.estado) && x.fecha_prometida && diasA(x.fecha_prometida) <= 7).reduce((s, x) => s + x.piezas, 0);
  if (cap && semana > cap * 6) p.push({ urg: 2, titulo: 'La semana pide más de lo que la planta puede', detalle: `${num(semana)} piezas para los próximos 7 días; a ${num(cap)} por día son ${num(cap * 6)}`, liga: '#/produccion' });
  const meta = aj('meta_retorno', 80), c = cartuchos();
  for (const [id, v] of Object.entries(c.porDist)) if (v.enviados >= 100 && (v.regresados / v.enviados) * 100 < meta) p.push({ urg: 0, titulo: `${dist(Number(id))?.empresa || ''}: regresa ${Math.round((v.regresados / v.enviados) * 100)}% de los cartuchos`, detalle: `La meta es ${meta}%. Revisar con sus tiendas el cambio con depósito`, liga: `#/cartuchos` });
  return p.sort((a, b) => b.urg - a.urg);
}

// Semanas hacia atrás: piezas pedidas (confirmadas o más) en cada una
export function semanas(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) { const hasta = hoyISO(-7 * i), desde = hoyISO(-7 * (i + 1)); out.push({ desde, hasta, piezas: S.pedidos.filter((p) => p.creado.slice(0, 10) > desde && p.creado.slice(0, 10) <= hasta && p.estado !== 'Recibido').reduce((s, p) => s + p.piezas, 0) }); }
  return out;
}

// Lunes de esta semana
export function lunes() {
  const d = new Date(hoyISO() + 'T00:00');
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// ═══════════ La empresa completa: empaque, dinero, equipo y escala ═══════════
export const prov = (id) => S.proveedores.find((p) => p.id === id);
export const centro = (id) => S.centros.find((c) => c.id === id);
export const vehiculo = (id) => S.vehiculos.find((v) => v.id === id);
export const mes = (iso) => (iso || '').slice(0, 7);
export const mesHoy = () => hoyISO().slice(0, 7);
export const mesesAtras = (n) => { const out = []; const d = new Date(hoyISO() + 'T00:00'); for (let i = 0; i < n; i++) { out.unshift(d.toISOString().slice(0, 7)); d.setMonth(d.getMonth() - 1); } return out; };
const MESL = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const nombreMes = (m) => `${MESL[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;

// RLR · empaque: cada producto llena sus propias rejas; la tarima son N rejas (Ajustes)
export function empaque(lineas) {
  let rejas = 0, kg = 0;
  const faltan = [];
  for (const l of lineas) {
    const p = producto(l.clave), piezas = (Number(l.cajas) || 0) * (p?.piezas_caja || 12);
    if (!p || !piezas) continue;
    const reja = p.piezas_reja || 24, sobra = piezas % reja;
    rejas += Math.ceil(piezas / reja); kg += piezas * (p.peso_kg || 0);
    if (sobra) faltan.push({ nombre: p.nombre.split(' (')[0], cajas: Math.ceil((reja - sobra) / p.piezas_caja) });
  }
  const rt = aj('rejas_tarima', 32);
  return { rejas, kg: kg + rejas * aj('reja_kg', 1.8), tarimas: rejas / rt, faltan, paraTarima: rejas % rt ? rt - (rejas % rt) : 0 };
}
export const tarimasTexto = (t) => (t >= 1 ? `${num(t, 1).replace('.0', '')} tarima(s)` : `${Math.round(t * 100)}% de una tarima`);

// Lo que el distribuidor debe más lo que pide, contra su crédito
export function credito(d, extra = 0) {
  const saldo = saldoDe(d.id) + S.pedidos.filter((p) => p.distribuidor_id === d.id && !p.entregado_fecha).reduce((s, p) => s + p.total, 0) + extra;
  return { saldo, credito: d.credito || 0, excede: d.credito > 0 && saldo > d.credito };
}

// Piezas pedidas por semana: el promedio de las últimas 4 semanas (o lo que diga Ajustes si todavía no hay pedidos)
export function piezasSemana() {
  const desde = hoyISO(-28), n = S.pedidos.filter((p) => p.creado.slice(0, 10) >= desde && p.estado !== 'Recibido').reduce((s, p) => s + p.piezas, 0);
  return n ? n / 4 : aj('piezas_semana_hoy');
}

// ───────── Dinero ─────────
export const porPagar = () => S.compras.filter((c) => c.estado === 'Recibida');
export function caja() {
  let cobros = 0, pagos = 0;
  for (const m of S.movimientos) { if (m.tipo === 'Cobro') cobros += m.monto; else pagos += m.monto; }
  return { cobros, pagos, saldo: cobros - pagos };
}
// Costo de materiales y transformación de una pieza, con los costos del inventario y la receta activa
export function costoPieza(conVaso = true) {
  const c = (clave) => inv(clave)?.costo || 0;
  return (gramosPieza() / 1000) * c('cera') + c('mecha') + c('cartucho') + (conVaso ? c('vaso') + c('etiqueta') : 0) + c('caja') / 12 + aj('transf_pieza', 2.2);
}
export const nomina = () => S.puestos.reduce((s, p) => s + p.ocupadas * p.sueldo, 0);

// RLR · estado de resultados de un mes, con lo que hay en el tablero (sin IVA)
export function resultado(m) {
  const iva = 1 + aj('iva', 16) / 100;
  const ent = S.pedidos.filter((p) => mes(p.entregado_fecha) === m);
  const piezas = ent.reduce((s, p) => s + p.piezas, 0), conVaso = ent.reduce((s, p) => s + p.piezas_vaso, 0);
  const ventas = ent.reduce((s, p) => s + p.subtotal, 0) / iva;
  const costo = conVaso * costoPieza(true) + (piezas - conVaso) * costoPieza(false);
  const gastos = {};
  for (const x of S.movimientos) if (x.tipo === 'Pago' && mes(x.fecha) === m && !['Insumos', 'Inversión', 'Depósitos', 'Impuestos'].includes(x.categoria)) gastos[x.categoria] = (gastos[x.categoria] || 0) + x.monto / (x.categoria === 'Nómina' ? 1 : iva);
  if (!gastos['Nómina'] && m === mesHoy()) gastos['Nómina'] = nomina();
  if (aj('gasto_fijo_mes') && !Object.keys(gastos).some((k) => k !== 'Nómina') && m === mesHoy()) gastos['Fijos (Ajustes)'] = aj('gasto_fijo_mes');
  const gasto = Object.values(gastos).reduce((s, n) => s + n, 0);
  const cobrado = S.movimientos.filter((x) => x.tipo === 'Cobro' && mes(x.fecha) === m && x.categoria === 'Ventas').reduce((s, x) => s + x.monto, 0);
  const pagadoInsumos = S.movimientos.filter((x) => x.tipo === 'Pago' && mes(x.fecha) === m && x.categoria === 'Insumos').reduce((s, x) => s + x.monto, 0);
  const ivaTrasladado = cobrado - cobrado / iva, ivaAcreditable = pagadoInsumos - pagadoInsumos / iva + Object.entries(gastos).filter(([k]) => k !== 'Nómina' && k !== 'Fijos (Ajustes)').reduce((s, [, n]) => s + n * (iva - 1), 0);
  return { mes: m, pedidos: ent.length, piezas, ventas, costo, bruta: ventas - costo, margen: ventas ? (ventas - costo) / ventas : 0, gastos, gasto, ebitda: ventas - costo - gasto, cobrado, iva: ivaTrasladado - ivaAcreditable };
}

// ───────── Equipo y escala ─────────
// Cuántas plazas de cada puesto pide un volumen de piezas por semana
export const plazas = (p, piezas) => (!p.disparador && !p.por_piezas ? 1 : piezas < p.disparador ? 0 : p.por_piezas ? Math.max(1, Math.ceil(piezas / p.por_piezas)) : 1);
export function plantilla(piezas) {
  const filas = S.puestos.map((p) => ({ p, necesarias: plazas(p, piezas), faltan: Math.max(0, plazas(p, piezas) - p.ocupadas) }));
  return { filas, personas: filas.reduce((s, f) => s + f.necesarias, 0), nomina: filas.reduce((s, f) => s + f.necesarias * f.p.sueldo, 0), faltan: filas.filter((f) => f.faltan > 0) };
}
// La escalera hacia el 25% de México: qué pide cada escalón
export function escalon(participacion) {
  const piezasSem = (aj('mercado_piezas_anio', 697000000) * participacion) / 100 / 52;
  const tiendas = piezasSem / Math.max(1, aj('piezas_tienda_semana', 8)), dists = tiendas / Math.max(1, aj('tiendas_distribuidor', 150));
  const centros = Math.max(1, Math.ceil(piezasSem / Math.max(1, aj('piezas_centro_semana', 60000)))), pl = plantilla(piezasSem);
  return { participacion, piezasSem, piezasMes: piezasSem * 4.33, tiendas, dists, centros, personas: pl.personas, nomina: pl.nomina, ebitdaMes: piezasSem * 4.33 * aj('ebitda_pieza', 9.22) };
}
void _RLR; void _k; void _rev;
