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
export const mensajes = (d) => [
  ['Primer contacto', `${saludo(d)} Recibimos tu solicitud para distribuir${d.zonas ? ' en ' + d.zonas : ''}. ¿Te puedo llamar hoy para platicarte cómo funciona y enseñarte los números?`],
  ['Mandar las hojas', `${saludo(d)} Aquí puedes ver cómo funciona y descargar las hojas para ti, para la tienda y para el cliente: https://vela.capitaltorreon.com/distribuir#descargas`],
  ...(d.liga ? [['Su liga de pedidos', `${saludo(d)} Esta es tu liga para hacer pedidos, ver tu saldo y repetir el último: ${location.origin}/pedir?d=${d.liga}`]] : []),
];

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
  return p.sort((a, b) => b.urg - a.urg);
}

// Lunes de esta semana
export function lunes() {
  const d = new Date(hoyISO() + 'T00:00');
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
void _RLR; void _k; void _rev;
