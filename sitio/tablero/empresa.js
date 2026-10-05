/* RLR · La Vela — pantallas Ventas, Compras, Pagos y Contabilidad — Ricardo López Reyero
   El dinero y las compras viven aquí. Los cobros de pedidos y los pagos de compras se anotan solos en el servidor. */
import { S, aj, api, aviso, bitacoraDe, borrar, campo, cargar, columnas, crear, crudo, diasA, dinero, etiqueta, fecha, guardar, html, hoyISO, interruptor, num } from './nucleo.js';
import { caja, costoPieza, dist, inv, mes, mesHoy, mesesAtras, nombreMes, nomina, piezasSemana, porCobrar, porFabricar, porPagar, producto, prov, resultado } from './cuentas.js';

const _RLR = 'Ricardo López Reyero', _k = 'EYE', _rev = 181218; // RLR
const barra = (n, max) => html`<span class="barra"><i style="${crudo(`width:${max && n ? Math.min(100, Math.max(2, (n / max) * 100)) : 0}%`)}"></i></span>`;
const dec = (i) => (i.unidad === 'kg' ? 1 : 0);
const canalNombre = (clave) => S.mercados.find((m) => m.tipo === 'Canal' && m.clave === clave)?.nombre || clave || 'Sin canal';

// ───────── Ventas ─────────
export const ventas = {
  id: 'ventas', titulo: 'Ventas', grupo: 'Comercial',
  pintar() {
    const meses = mesesAtras(12), iva = 1 + aj('iva', 16) / 100;
    const filas = meses.map((m) => { const ps = S.pedidos.filter((p) => mes(p.creado) === m && p.estado !== 'Recibido'); return { m, n: ps.length, piezas: ps.reduce((s, p) => s + p.piezas, 0), venta: ps.reduce((s, p) => s + p.subtotal, 0) / iva, dists: new Set(ps.map((p) => p.distribuidor_id)).size }; });
    const maxV = Math.max(1, ...filas.map((f) => f.venta));
    const porCanal = {}, porProd = {}, porDist = {};
    for (const p of S.pedidos) {
      if (p.estado === 'Recibido') continue;
      const d = dist(p.distribuidor_id), c = d?.canal || 'tienditas';
      porCanal[c] = (porCanal[c] || 0) + p.piezas; porDist[p.distribuidor_id] = (porDist[p.distribuidor_id] || 0) + p.subtotal / iva;
      for (const l of p.lineas) porProd[l.clave] = (porProd[l.clave] || 0) + l.cajas * (producto(l.clave)?.piezas_caja || 12) * (producto(l.clave)?.precio_dist || 0) / iva;
    }
    const maxC = Math.max(1, ...Object.values(porCanal)), maxP = Math.max(1, ...Object.values(porProd)), maxD = Math.max(1, ...Object.values(porDist));
    const sem = piezasSemana(), meta = aj('meta_semanal'), pipeline = S.distribuidores.filter((d) => ['Propuesta', 'Piloto'].includes(d.estado)).reduce((s, d) => s + (d.tiendas || 0) * aj('piezas_tienda_semana', 8), 0);
    const activos = S.distribuidores.filter((d) => ['Piloto', 'Activo'].includes(d.estado)), tiendas = activos.reduce((s, d) => s + (d.tiendas || 0), 0), hoyM = mesHoy();
    const r = resultado(hoyM), plan = { ventas: 9253871 / 12, piezas: 19052 };
    return html`<div class="rejilla">
      <section class="bloque doble"><h2>La venta, de un vistazo</h2><div class="cifras">
        <div><b>${num(sem)}</b><span>piezas por semana (promedio de 4 semanas)${meta ? ` · meta ${num(meta)}` : ''}</span>${meta ? barra(sem, meta) : ''}</div>
        <div><b>${dinero(filas[filas.length - 1].venta)}</b><span>vendido este mes, sin IVA · el plan Rentable pide ${dinero(plan.ventas)} al mes en el año 2</span></div>
        <div><b>${num(r.piezas)}</b><span>piezas entregadas este mes · plan ${num(plan.piezas)}</span>${barra(r.piezas, plan.piezas)}</div>
        <div><b>${num(tiendas)}</b><span>tiendas activas con ${activos.length} distribuidor(es) · ${tiendas ? num(sem / tiendas, 1) : '—'} piezas por tienda por semana</span></div>
        <div><b>${num(pipeline)}</b><span>piezas por semana en propuesta o piloto (tiendas × ${aj('piezas_tienda_semana', 8)})</span></div>
        <div><b>${tiendas ? dinero((sem / tiendas) * 4.33 * ((producto('semanal')?.precio_publico || 55) * 0.27)) : '—'}</b><span>lo que gana una tienda al mes con lo que vende hoy</span></div></div>
        <p class="tenue">La venta se cuenta cuando el pedido se confirma; lo entregado y lo cobrado van en Contabilidad y Pagos. Una tienda del plan vende 8 piezas por semana.</p></section>
      <section class="bloque doble"><h2>Por mes</h2><div class="tabla-caja"><table class="tabla"><thead><tr><th>Mes</th><th>Pedidos</th><th>Distribuidores</th><th>Piezas</th><th>Venta sin IVA</th><th></th></tr></thead><tbody>
        ${filas.map((f) => html`<tr class="${f.m === hoyM ? 'gris' : ''}"><th>${nombreMes(f.m)}</th><td>${f.n}</td><td>${f.dists}</td><td>${num(f.piezas)}</td><td>${dinero(f.venta)}</td><td style="min-width:140px">${barra(f.venta, maxV)}</td></tr>`)}</tbody></table></div></section>
      <section class="bloque"><h2>Por canal</h2>${Object.keys(porCanal).length ? html`<ul class="lista barras">${Object.entries(porCanal).sort((a, b) => b[1] - a[1]).map(([c, n]) => html`<li><b>${canalNombre(c)}</b>${barra(n, maxC)}<span>${num(n)} pzas</span></li>`)}</ul>` : html`<p class="vacio">Sin pedidos todavía. El canal se pone en la ficha de cada distribuidor.</p>`}
        <p class="tenue">Lo que cada canal debe aportar está en <a href="#/mercado">Mercado</a>.</p></section>
      <section class="bloque"><h2>Por producto, en pesos</h2>${Object.keys(porProd).length ? html`<ul class="lista barras">${Object.entries(porProd).sort((a, b) => b[1] - a[1]).map(([k, n]) => html`<li><b>${producto(k)?.nombre.split(' (')[0] || k}</b>${barra(n, maxP)}<span>${dinero(n)}</span></li>`)}</ul>` : html`<p class="vacio">Sin pedidos todavía.</p>`}</section>
      <section class="bloque doble"><h2>Por distribuidor, en pesos</h2>${Object.keys(porDist).length ? html`<ul class="lista barras">${Object.entries(porDist).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([id, n]) => html`<li><b><a href="#/distribuidores/${id}">${dist(Number(id))?.empresa || '—'}</a></b>${barra(n, maxD)}<span>${dinero(n)}</span></li>`)}</ul>` : html`<p class="vacio">Sin pedidos todavía.</p>`}</section>
    </div>`;
  },
};

// ───────── Compras ─────────
const sugerencia = () => { const f = porFabricar(); return S.inventario.map((i) => ({ i, n: Math.max((f.pide[i.clave] || 0) - i.existencia, i.minimo - i.existencia) })).filter((c) => c.n > 0); };
const proveedorDe = (clave) => S.proveedores.find((p) => p.estado === 'Activo' && p.insumos.split(/\s+/).includes(clave)) || S.proveedores.find((p) => p.insumos.split(/\s+/).includes(clave));
const resumenCompra = (c) => c.lineas.map((l) => `${num(l.cantidad, inv(l.clave)?.unidad === 'kg' ? 1 : 0)} ${inv(l.clave)?.unidad || ''} ${inv(l.clave)?.nombre.split(' (')[0].toLowerCase() || l.clave}`).join(' · ');
const tarjetaCompra = (c) => {
  const tarde = ['Pedida'].includes(c.estado) && c.fecha_esperada && diasA(c.fecha_esperada) < 0;
  return html`<article class="tarjeta ${tarde ? 'roja' : ''}" draggable="true" data-arr="${c.id}" data-a="ir" data-ruta="compras/${c.id}" tabindex="0">
    <header><b>#${c.id} · ${prov(c.proveedor_id)?.nombre || 'Sin proveedor'}</b></header><p>${resumenCompra(c)}</p><p class="tenue">${dinero(c.total)}${c.factura ? ' · ' + c.factura : ''}</p>
    ${c.fecha_esperada && c.estado === 'Pedida' ? html`<p class="${tarde ? 'plazo' : 'sigue'}">${tarde ? 'Debió llegar el' : 'Llega el'} ${fecha(c.fecha_esperada)}</p>` : ''}</article>`;
};
function lineasCompra(c, editable) {
  return html`<form class="forma" data-f="compra-lineas" data-id="${c.id}"><div class="doble tabla-caja"><table class="tabla editable"><thead><tr><th>Material</th><th>Cantidad</th><th>Costo por unidad</th><th>Importe</th></tr></thead><tbody>
    ${S.inventario.map((i) => { const l = c.lineas.find((x) => x.clave === i.clave); if (!editable && !l) return ''; return html`<tr><th>${i.nombre}<small>${i.unidad}</small></th>
      <td><input name="cant:${i.clave}" type="number" min="0" step="any" value="${l ? l.cantidad : ''}" ${editable ? html`data-envia` : html`disabled`} placeholder="0"></td>
      <td><input name="costo:${i.clave}" type="number" min="0" step="any" value="${l ? l.costo : i.costo}" ${editable ? html`data-envia` : html`disabled`}></td><td>${l ? dinero(l.cantidad * l.costo, 2) : ''}</td></tr>`; })}
    </tbody></table></div></form><p class="cifra chica">Total ${dinero(c.total, 2)}</p>`;
}
const leerCompra = (d) => ({ lineas: Object.keys(d).filter((k) => k.startsWith('cant:')).map((k) => ({ clave: k.slice(5), cantidad: Number(d[k]) || 0, costo: Number(d['costo:' + k.slice(5)]) || 0 })).filter((l) => l.cantidad > 0) });

function panelCompra(sub) {
  if (sub.startsWith('nueva')) {
    const pre = sub === 'nueva-sugerida' ? sugerencia() : [], prov1 = pre.length ? proveedorDe(pre[0].i.clave) : null;
    return html`<header><h2>Orden de compra</h2><button class="cerrar" data-a="cerrar" aria-label="Cerrar">✕</button></header>
      <form data-f="compra-nueva" class="forma">
        <label class="campo doble"><span>Proveedor</span><select name="proveedor_id"><option value="">Por elegir</option>${S.proveedores.map((p) => html`<option value="${p.id}" ${prov1 && prov1.id === p.id ? html`selected` : ''}>${p.nombre} · ${p.estado}</option>`)}</select></label>
        <div class="doble tabla-caja"><table class="tabla editable"><thead><tr><th>Material</th><th>Hay</th><th>Cantidad</th><th>Costo por unidad</th></tr></thead><tbody>
          ${S.inventario.map((i) => { const s = pre.find((x) => x.i.clave === i.clave); return html`<tr><th>${i.nombre}<small>${i.unidad}</small></th><td>${num(i.existencia, dec(i))}</td><td><input name="cant:${i.clave}" type="number" min="0" step="any" value="${s ? Math.ceil(s.n) : ''}" placeholder="0"></td><td><input name="costo:${i.clave}" type="number" min="0" step="any" value="${i.costo}"></td></tr>`; })}</tbody></table></div>
        <label class="campo"><span>Llega el</span><input name="fecha_esperada" type="date" value="${hoyISO(prov1?.dias_entrega || 7)}"></label>
        <label class="campo"><span>Factura</span><input name="factura" maxlength="80"></label>
        <label class="campo doble"><span>Notas</span><textarea name="notas" rows="2"></textarea></label>
        <button class="boton lleno">Crear la orden</button></form>`;
  }
  const c = S.compras.find((x) => x.id === Number(sub));
  if (!c) return null;
  const i = S.estados.compras.indexOf(c.estado), sig = c.estado === 'Pagada' || c.estado === 'Cancelada' ? null : S.estados.compras[i + 1], p = prov(c.proveedor_id);
  return html`<header><div>${etiqueta(c.estado)}<h2>Compra #${c.id}</h2><p class="tenue">${p ? p.nombre : 'Sin proveedor'} · ${fecha(c.fecha)}</p></div><button class="cerrar" data-a="cerrar" aria-label="Cerrar">✕</button></header>
    <div class="botones">${sig ? html`<button class="boton lleno" data-a="mover-compra" data-id="${c.id}" data-v="${sig}">${sig === 'Recibida' ? 'Ya llegó: meter al inventario' : sig === 'Pagada' ? 'Ya se pagó' : `Pasar a «${sig}»`}</button>` : ''}
      ${c.estado !== 'Cancelada' && !c.recibida ? html`<button class="boton" data-a="mover-compra" data-id="${c.id}" data-v="Cancelada">Cancelar</button>` : ''}</div>
    <ol class="pasos-pedido">${S.estados.compras.slice(0, 4).map((e, n) => html`<li class="${n < i ? 'hecho' : n === i ? 'aqui' : ''}">${e}</li>`)}</ol>
    ${lineasCompra(c, !c.recibida)}
    ${c.recibida ? html`<p class="tenue">Ya entró al inventario el ${fecha(c.recibida_fecha)}: las cantidades no se cambian.</p>` : html`<p class="tenue">Cambia cantidades y costos aquí; al recibirse entran al inventario y el costo por unidad se pone al día.</p>`}
    <div class="forma">
      ${campo('compras', c.id, 'proveedor_id', c.proveedor_id || '', { rotulo: 'Proveedor', opciones: [['', 'Por elegir'], ...S.proveedores.map((x) => [x.id, x.nombre])] })}
      ${campo('compras', c.id, 'fecha_esperada', c.fecha_esperada, { rotulo: 'Llega el', tipo: 'date' })}
      ${campo('compras', c.id, 'factura', c.factura, { rotulo: 'Factura' })}
      ${campo('compras', c.id, 'fecha', c.fecha, { rotulo: 'Fecha de la orden', tipo: 'date' })}
      ${campo('compras', c.id, 'notas', c.notas, { rotulo: 'Notas', tipo: 'area', ancho: 'doble' })}
    </div>
    <dl class="datos">${c.recibida_fecha ? html`<dt>Recibida</dt><dd>${fecha(c.recibida_fecha)}</dd>` : ''}${c.pagada_fecha ? html`<dt>Pagada</dt><dd>${fecha(c.pagada_fecha)}</dd>` : ''}${p?.whatsapp ? html`<dt>WhatsApp del proveedor</dt><dd><a href="https://wa.me/${p.whatsapp.replace(/\D/g, '')}" target="_blank" rel="noopener">${p.whatsapp}</a></dd>` : ''}</dl>
    ${bitacoraDe('compras', c.id)}
    ${c.recibida ? '' : html`<p class="fin"><button class="enlace" data-a="borrar-compra" data-id="${c.id}">Borrar esta orden</button></p>`}`;
}
function panelProveedor(sub) {
  const p = prov(Number(sub.split('-')[1]));
  if (!p) return null;
  const cs = S.compras.filter((c) => c.proveedor_id === p.id);
  return html`<header><div>${etiqueta(p.estado)}<h2>${p.nombre}</h2></div><button class="cerrar" data-a="cerrar" aria-label="Cerrar">✕</button></header>
    <div class="forma">
      ${campo('proveedores', p.id, 'nombre', p.nombre, { rotulo: 'Nombre', ancho: 'doble' })}
      ${campo('proveedores', p.id, 'estado', p.estado, { rotulo: 'Estado', opciones: ['Por cotizar', 'Cotizado', 'Activo', 'En pausa'] })}
      ${campo('proveedores', p.id, 'insumos', p.insumos, { rotulo: 'Qué surte (claves del inventario)', marcador: 'cera vaso mecha cartucho etiqueta caja' })}
      ${campo('proveedores', p.id, 'contacto', p.contacto, { rotulo: 'Contacto' })}
      ${campo('proveedores', p.id, 'whatsapp', p.whatsapp, { rotulo: 'WhatsApp', tipo: 'tel' })}
      ${campo('proveedores', p.id, 'correo', p.correo, { rotulo: 'Correo', tipo: 'email' })}
      ${campo('proveedores', p.id, 'ciudad', p.ciudad, { rotulo: 'Ciudad' })}
      ${campo('proveedores', p.id, 'dias_entrega', p.dias_entrega, { rotulo: 'Días de entrega', tipo: 'number', paso: '1' })}
      ${campo('proveedores', p.id, 'credito_dias', p.credito_dias, { rotulo: 'Días de crédito', tipo: 'number', paso: '1' })}
      ${campo('proveedores', p.id, 'liga', p.liga, { rotulo: 'Liga', ancho: 'doble' })}
      ${campo('proveedores', p.id, 'notas', p.notas, { rotulo: 'Notas', tipo: 'area', ancho: 'doble', marcador: 'Precio cotizado, mínimo de compra, flete, plazo…' })}
    </div>
    ${cs.length ? html`<h4>Compras</h4><ul class="lista">${cs.map((c) => html`<li><a href="#/compras/${c.id}"><b>#${c.id} · ${c.estado}</b></a><span>${dinero(c.total)} · ${fecha(c.fecha)}</span></li>`)}</ul>` : ''}
    ${bitacoraDe('proveedores', p.id)}
    <p class="fin"><button class="enlace" data-a="borrar-proveedor" data-id="${p.id}">Borrar este proveedor</button></p>`;
}

export const compras = {
  id: 'compras', titulo: 'Compras', grupo: 'Operación',
  cuenta: () => sugerencia().length + S.compras.filter((c) => c.estado === 'Pedida' && c.fecha_esperada && diasA(c.fecha_esperada) < 0).length,
  botones: () => html`${interruptor('compras', S.ui.vista.compras)}<button class="boton" data-a="ir" data-ruta="compras/proveedor-nuevo">+ Proveedor</button><button class="boton lleno" data-a="ir" data-ruta="compras/nueva">+ Orden</button>`,
  pintar() {
    const sug = sugerencia(), abiertas = S.compras.filter((c) => !['Pagada', 'Cancelada'].includes(c.estado));
    // Consumo por semana de cada material, al ritmo de pedidos de hoy
    const consumo = (clave) => { const n = piezasSemana(); return clave === 'cera' ? (n * gramos()) / 1000 : clave === 'caja' ? n / 12 : n; };
    const dias = S.inventario.map((i) => { const porSem = consumo(i.clave); return { i, dias: porSem ? Math.round((i.existencia / porSem) * 7) : null }; });
    return html`<div class="rejilla">
      <section class="bloque"><h2>Hay que comprar<span class="cuenta">${sug.length}</span></h2>
        ${sug.length ? html`<ul class="lista">${sug.map(({ i, n }) => html`<li><b>${num(n, dec(i))} ${i.unidad} de ${i.nombre.toLowerCase()}</b><span>≈ ${dinero(n * i.costo)}${proveedorDe(i.clave) ? ' · ' + proveedorDe(i.clave).nombre : ''}</span></li>`)}</ul>
          <p class="tenue">Total aproximado: ${dinero(sug.reduce((s, c) => s + c.n * c.i.costo, 0))}. Cubre los pedidos confirmados y deja cada material en su mínimo.</p>
          <div class="botones"><button class="boton lleno" data-a="ir" data-ruta="compras/nueva-sugerida">Crear la orden con esto</button></div>` : html`<p class="vacio">Con lo que hay alcanza para lo confirmado y nada está bajo el mínimo.</p>`}</section>
      <section class="bloque"><h2>Cobertura</h2><ul class="lista">${dias.map(({ i, dias: d }) => html`<li><b>${i.nombre}</b><span>${num(i.existencia, dec(i))} ${i.unidad}${d != null ? ` · ${d} días al ritmo de hoy` : ''}</span></li>`)}</ul>
        <p class="tenue">Al ritmo de ${num(piezasSemana())} piezas por semana. El material baja solo cuando un pedido pasa a «Curando»; sube solo cuando una compra se marca como recibida.</p></section>
      <section class="bloque doble"><h2>Órdenes de compra<span class="cuenta">${abiertas.length}</span></h2>
        ${S.compras.length ? (S.ui.vista.compras === 'tabla' ? html`<div class="tabla-caja"><table class="tabla"><thead><tr><th>Orden</th><th>Estado</th><th>Proveedor</th><th>Total</th><th>Llega</th><th>Factura</th><th>Fecha</th></tr></thead><tbody>
          ${S.compras.map((c) => html`<tr data-a="ir" data-ruta="compras/${c.id}"><th>#${c.id}<small>${resumenCompra(c)}</small></th><td>${c.estado}</td><td>${prov(c.proveedor_id)?.nombre || ''}</td><td>${dinero(c.total)}</td><td>${fecha(c.fecha_esperada)}</td><td>${c.factura}</td><td>${fecha(c.fecha)}</td></tr>`)}</tbody></table></div>`
          : columnas({ rec: 'compras', cols: S.estados.compras, items: S.compras, tarjeta: tarjetaCompra })) : html`<p class="vacio">Sin órdenes. Se crean con «+ Orden» o desde la sugerencia de arriba.</p>`}</section>
      <section class="bloque doble"><h2>Proveedores<span class="cuenta">${S.proveedores.length}</span></h2>
        <div class="tabla-caja"><table class="tabla"><thead><tr><th>Proveedor</th><th>Estado</th><th>Surte</th><th>Ciudad</th><th>Entrega</th><th>Crédito</th><th>Notas</th></tr></thead><tbody>
          ${S.proveedores.map((p) => html`<tr data-a="ir" data-ruta="compras/proveedor-${p.id}"><th>${p.nombre}<small>${p.contacto}${p.whatsapp ? ' · ' + p.whatsapp : ''}</small></th><td>${etiqueta(p.estado, p.estado === 'Activo' ? 'negra' : '')}</td><td>${p.insumos.split(/\s+/).filter(Boolean).map((k) => inv(k)?.nombre.split(' (')[0] || k).join(', ')}</td><td>${p.ciudad}</td><td>${p.dias_entrega} días</td><td>${p.credito_dias ? p.credito_dias + ' días' : 'Contado'}</td><td class="tenue">${p.notas.slice(0, 90)}${p.notas.length > 90 ? '…' : ''}</td></tr>`)}</tbody></table></div>
        <p class="tenue">Regla de compras: tres cotizaciones por insumo, con flete, IVA y plazo. Convenio de confidencialidad antes de enseñar el cartucho.</p></section>
    </div>`;
  },
  panel: (sub) => (sub === 'proveedor-nuevo' ? html`<header><h2>Proveedor nuevo</h2><button class="cerrar" data-a="cerrar" aria-label="Cerrar">✕</button></header>
    <form data-f="proveedor-nuevo" class="forma"><label class="campo doble"><span>Nombre</span><input name="nombre" required maxlength="160"></label>
      <label class="campo"><span>Qué surte (claves)</span><input name="insumos" placeholder="cera vaso mecha…"></label><label class="campo"><span>Ciudad</span><input name="ciudad"></label>
      <label class="campo"><span>Contacto</span><input name="contacto"></label><label class="campo"><span>WhatsApp</span><input name="whatsapp" type="tel"></label>
      <button class="boton lleno">Agregar</button></form>` : sub.startsWith('proveedor-') ? panelProveedor(sub) : panelCompra(sub)),
  acciones: {
    'mover-compra': (el) => guardar('compras', el.dataset.id, { estado: el.dataset.v }),
    async 'borrar-compra'(el) { if (await borrar('compras', el.dataset.id, '¿Borrar esta orden?')) location.hash = '#/compras'; },
    async 'borrar-proveedor'(el) { if (await borrar('proveedores', el.dataset.id, '¿Borrar este proveedor?')) location.hash = '#/compras'; },
  },
  formularios: {
    async 'compra-nueva'(f, d) { const r = await crear('compras', { proveedor_id: Number(d.proveedor_id) || null, ...leerCompra(d), fecha_esperada: d.fecha_esperada, factura: d.factura, notas: d.notas }); if (r) location.hash = `#/compras/${r.id}`; },
    'compra-lineas': (f, d) => guardar('compras', f.dataset.id, leerCompra(d)),
    async 'proveedor-nuevo'(f, d) { const r = await crear('proveedores', d); if (r) location.hash = `#/compras/proveedor-${r.fila.id}`; },
  },
};

// ───────── Pagos: cada peso que entra y sale ─────────
export const pagos = {
  id: 'pagos', titulo: 'Pagos', grupo: 'Dinero',
  cuenta: () => porCobrar().filter((p) => -diasA(p.entregado_fecha) > aj('dias_cobro', 30)).length + porPagar().length,
  botones: () => html`<select data-a-cambio="filtro-mes" aria-label="Mes"><option value="">Todos los meses</option>${mesesAtras(12).reverse().map((m) => html`<option value="${m}" ${S.ui.filtro.mes === m ? html`selected` : ''}>${nombreMes(m)}</option>`)}</select><button class="boton lleno" data-a="ir" data-ruta="pagos/nuevo">+ Movimiento</button>`,
  pintar() {
    const c = caja(), pc = porCobrar(), pp = porPagar(), m = S.ui.filtro.mes || '', hoyM = mesHoy();
    const movs = S.movimientos.filter((x) => !m || mes(x.fecha) === m), cobM = S.movimientos.filter((x) => x.tipo === 'Cobro' && mes(x.fecha) === hoyM).reduce((s, x) => s + x.monto, 0), pagM = S.movimientos.filter((x) => x.tipo === 'Pago' && mes(x.fecha) === hoyM).reduce((s, x) => s + x.monto, 0);
    const porCat = {};
    for (const x of movs) if (x.tipo === 'Pago') porCat[x.categoria] = (porCat[x.categoria] || 0) + x.monto;
    const maxCat = Math.max(1, ...Object.values(porCat));
    return html`<div class="rejilla">
      <section class="bloque doble"><h2>La caja</h2><div class="cifras">
        <div><b>${dinero(c.saldo)}</b><span>en caja: todo lo cobrado menos todo lo pagado</span></div>
        <div><b>${dinero(cobM)}</b><span>cobrado este mes</span></div>
        <div><b>${dinero(pagM)}</b><span>pagado este mes</span></div>
        <div><b>${dinero(pc.reduce((s, p) => s + p.total, 0))}</b><span>por cobrar: ${pc.length} pedido(s) entregados</span></div>
        <div><b>${dinero(pp.reduce((s, x) => s + x.total, 0))}</b><span>por pagar: ${pp.length} compra(s) recibidas</span></div>
        <div><b>${dinero(nomina())}</b><span>nómina mensual del equipo contratado</span></div></div>
        <p class="tenue">Los cobros de pedidos y los pagos de compras se anotan solos al marcarlos; aquí se capturan los demás: renta, nómina, transporte, servicios, aportaciones.</p></section>
      <section class="bloque"><h2>Por cobrar<span class="cuenta">${pc.length}</span></h2>
        ${pc.length ? html`<ul class="lista">${pc.sort((a, b) => a.entregado_fecha.localeCompare(b.entregado_fecha)).map((p) => html`<li><div><b><a href="#/pedidos/${p.id}">#${p.id} · ${dist(p.distribuidor_id)?.empresa || ''}</a></b><br><small class="${-diasA(p.entregado_fecha) > aj('dias_cobro', 30) ? 'plazo' : 'tenue'}">Entregado hace ${-diasA(p.entregado_fecha)} días</small></div><span>${dinero(p.total)}<br><button class="enlace" data-a="cobrar" data-id="${p.id}">Ya se cobró</button></span></li>`)}</ul>` : html`<p class="vacio">Nada por cobrar.</p>`}</section>
      <section class="bloque"><h2>Por pagar<span class="cuenta">${pp.length}</span></h2>
        ${pp.length ? html`<ul class="lista">${pp.map((x) => html`<li><div><b><a href="#/compras/${x.id}">Compra #${x.id} · ${prov(x.proveedor_id)?.nombre || ''}</a></b><br><small class="tenue">Recibida el ${fecha(x.recibida_fecha)}${prov(x.proveedor_id)?.credito_dias ? ` · vence ${fecha(hoyISO(prov(x.proveedor_id).credito_dias + diasA(x.recibida_fecha)))}` : ''}</small></div><span>${dinero(x.total)}<br><button class="enlace" data-a="pagar" data-id="${x.id}">Ya se pagó</button></span></li>`)}</ul>` : html`<p class="vacio">Nada por pagar.</p>`}</section>
      <section class="bloque"><h2>En qué se va${m ? ` · ${nombreMes(m)}` : ''}</h2>${Object.keys(porCat).length ? html`<ul class="lista barras">${Object.entries(porCat).sort((a, b) => b[1] - a[1]).map(([k, n]) => html`<li><b>${k}</b>${barra(n, maxCat)}<span>${dinero(n)}</span></li>`)}</ul>` : html`<p class="vacio">Sin pagos todavía.</p>`}</section>
      <section class="bloque doble"><h2>Movimientos${m ? ` · ${nombreMes(m)}` : ''}<span class="cuenta">${movs.length}</span></h2>
        ${movs.length ? html`<div class="tabla-caja"><table class="tabla"><thead><tr><th>Fecha</th><th>Concepto</th><th>Categoría</th><th>Método</th><th>Entra</th><th>Sale</th><th></th></tr></thead><tbody>
          ${movs.slice(0, 300).map((x) => html`<tr><th>${fecha(x.fecha)}</th><td>${x.pedido_id ? html`<a href="#/pedidos/${x.pedido_id}">${x.concepto}</a>` : x.compra_id ? html`<a href="#/compras/${x.compra_id}">${x.concepto}</a>` : x.concepto}${x.referencia ? html`<small>${x.referencia}</small>` : ''}</td><td>${x.categoria}</td><td>${x.metodo}</td>
            <td>${x.tipo === 'Cobro' ? dinero(x.monto, 2) : ''}</td><td>${x.tipo === 'Pago' ? dinero(x.monto, 2) : ''}</td><td>${x.pedido_id || x.compra_id ? '' : html`<button class="enlace" data-a="borrar-mov" data-id="${x.id}" aria-label="Borrar">✕</button>`}</td></tr>`)}</tbody></table></div>`
          : html`<p class="vacio">Sin movimientos. El primero llega solo cuando un pedido se marque «Cobrado», o se captura con «+ Movimiento».</p>`}</section>
    </div>`;
  },
  panel(sub) {
    if (sub !== 'nuevo') return null;
    return html`<header><h2>Movimiento</h2><button class="cerrar" data-a="cerrar" aria-label="Cerrar">✕</button></header>
      <form data-f="mov-nuevo" class="forma">
        <label class="campo"><span>Tipo</span><select name="tipo"><option>Pago</option><option>Cobro</option></select></label>
        <label class="campo"><span>Categoría</span><select name="categoria">${S.estados.categorias.map((c) => html`<option ${c === 'Nómina' ? html`selected` : ''}>${c}</option>`)}</select></label>
        <label class="campo doble"><span>Concepto</span><input name="concepto" required maxlength="200" placeholder="Nómina de la quincena, renta de octubre, aportación de socios…"></label>
        <label class="campo"><span>Monto</span><input name="monto" type="number" min="0" step="any" required inputmode="decimal"></label>
        <label class="campo"><span>Fecha</span><input name="fecha" type="date" value="${hoyISO()}" required></label>
        <label class="campo"><span>Método</span><select name="metodo"><option>Transferencia</option><option>Efectivo</option><option>Tarjeta</option><option>Cheque</option></select></label>
        <label class="campo"><span>Referencia o factura</span><input name="referencia" maxlength="80"></label>
        <label class="campo doble"><span>Notas</span><textarea name="notas" rows="2"></textarea></label>
        <button class="boton lleno">Anotar</button></form>`;
  },
  acciones: {
    'filtro-mes': (el) => { S.ui.filtro.mes = el.value; },
    cobrar: (el) => guardar('pedidos', el.dataset.id, { estado: 'Cobrado' }),
    pagar: (el) => guardar('compras', el.dataset.id, { estado: 'Pagada' }),
    'borrar-mov': (el) => borrar('movimientos', el.dataset.id, '¿Borrar este movimiento?'),
  },
  formularios: { async 'mov-nuevo'(f, d) { const r = await crear('movimientos', { ...d, monto: Number(d.monto) }); if (r) location.hash = '#/pagos'; } },
};

// ───────── Contabilidad: el estado de resultados, mes por mes ─────────
const csv = (filas) => 'data:text/csv;charset=utf-8,' + encodeURIComponent(filas.map((f) => f.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n'));
export const contabilidad = {
  id: 'contabilidad', titulo: 'Contabilidad', grupo: 'Dinero',
  botones() {
    const rs = mesesAtras(12).map(resultado), cats = [...new Set(rs.flatMap((r) => Object.keys(r.gastos)))];
    const filas = [['Mes', 'Pedidos entregados', 'Piezas', 'Ventas sin IVA', 'Costo de ventas', 'Utilidad bruta', ...cats, 'Gastos', 'EBITDA', 'Cobrado', 'IVA por pagar'],
      ...rs.map((r) => [r.mes, r.pedidos, r.piezas, r.ventas.toFixed(2), r.costo.toFixed(2), r.bruta.toFixed(2), ...cats.map((c) => (r.gastos[c] || 0).toFixed(2)), r.gasto.toFixed(2), r.ebitda.toFixed(2), r.cobrado.toFixed(2), r.iva.toFixed(2)])];
    const movs = [['Fecha', 'Tipo', 'Categoría', 'Concepto', 'Monto', 'Método', 'Referencia', 'Pedido', 'Compra'], ...S.movimientos.map((x) => [x.fecha, x.tipo, x.categoria, x.concepto, x.monto, x.metodo, x.referencia, x.pedido_id || '', x.compra_id || ''])];
    return html`<a class="boton" href="${csv(filas)}" download="La_Vela_Resultados_${hoyISO()}.csv">Resultados (CSV)</a><a class="boton" href="${csv(movs)}" download="La_Vela_Movimientos_${hoyISO()}.csv">Movimientos (CSV)</a>`;
  },
  pintar() {
    const meses = mesesAtras(12), rs = meses.map(resultado), hoyM = mesHoy(), r = rs[rs.length - 1], a = rs[rs.length - 2];
    const cats = [...new Set(rs.flatMap((x) => Object.keys(x.gastos)))], plan = { ebitda: 151647, ventas: 9253871 / 12, margen: 0.38 };
    const cv = costoPieza(true), cc = costoPieza(false), semanal = producto('semanal'), cart = producto('cartucho'), iva = 1 + aj('iva', 16) / 100;
    return html`<div class="rejilla">
      <section class="bloque doble"><h2>${nombreMes(hoyM)}</h2><div class="cifras">
        <div><b>${dinero(r.ventas)}</b><span>ventas sin IVA (entregado) · plan ${dinero(plan.ventas)}</span>${barra(r.ventas, plan.ventas)}</div>
        <div><b>${r.ventas ? Math.round(r.margen * 100) + '%' : '—'}</b><span>margen bruto · el modelo supone ~38%</span></div>
        <div><b>${dinero(r.gasto)}</b><span>gastos del mes (sin insumos)</span></div>
        <div><b>${dinero(r.ebitda)}</b><span>EBITDA · plan año 2: ${dinero(plan.ebitda)} al mes</span>${barra(Math.max(0, r.ebitda), plan.ebitda)}</div>
        <div><b>${dinero(r.iva)}</b><span>IVA por pagar, estimado (trasladado − acreditable)</span></div>
        <div><b>${a ? dinero(a.ebitda) : '—'}</b><span>EBITDA del mes anterior</span></div></div>
        <p class="tenue">Ventas = lo entregado en el mes, sin IVA. Costo = piezas × costo de materiales y maquila (abajo). Gastos = los pagos capturados en Pagos, menos insumos e inversión; si no hay nómina capturada se usa la del Equipo. Esto es gestión, no la contabilidad fiscal: esa la lleva el despacho con los CSV.</p></section>
      <section class="bloque doble"><h2>Estado de resultados, 12 meses</h2><div class="tabla-caja"><table class="tabla"><thead><tr><th>Mes</th><th>Piezas</th><th>Ventas</th><th>Costo</th><th>Bruta</th><th>Margen</th>${cats.map((c) => html`<th>${c}</th>`)}<th>EBITDA</th><th>Cobrado</th></tr></thead><tbody>
        ${rs.map((x) => html`<tr class="${x.mes === hoyM ? 'gris' : ''}"><th>${nombreMes(x.mes)}</th><td>${num(x.piezas)}</td><td>${dinero(x.ventas)}</td><td>${dinero(x.costo)}</td><td>${dinero(x.bruta)}</td><td>${x.ventas ? Math.round(x.margen * 100) + '%' : ''}</td>${cats.map((c) => html`<td>${x.gastos[c] ? dinero(x.gastos[c]) : ''}</td>`)}<td><b>${dinero(x.ebitda)}</b></td><td>${dinero(x.cobrado)}</td></tr>`)}
        <tr><th>12 meses</th><td>${num(rs.reduce((s, x) => s + x.piezas, 0))}</td><td>${dinero(rs.reduce((s, x) => s + x.ventas, 0))}</td><td>${dinero(rs.reduce((s, x) => s + x.costo, 0))}</td><td>${dinero(rs.reduce((s, x) => s + x.bruta, 0))}</td><td></td>${cats.map((c) => html`<td>${dinero(rs.reduce((s, x) => s + (x.gastos[c] || 0), 0))}</td>`)}<td><b>${dinero(rs.reduce((s, x) => s + x.ebitda, 0))}</b></td><td>${dinero(rs.reduce((s, x) => s + x.cobrado, 0))}</td></tr></tbody></table></div></section>
      <section class="bloque"><h2>Costo por pieza, hoy</h2><dl class="datos">
        <dt>Cera (${num(gramos())} g a ${dinero(inv('cera')?.costo || 0, 2)} el kilo)</dt><dd>${dinero((gramos() / 1000) * (inv('cera')?.costo || 0), 2)}</dd>
        ${['mecha', 'cartucho', 'vaso', 'etiqueta'].map((k) => html`<dt>${inv(k)?.nombre || k}</dt><dd>${dinero(inv(k)?.costo || 0, 2)}</dd>`)}
        <dt>Caja (una doceava parte)</dt><dd>${dinero((inv('caja')?.costo || 0) / 12, 2)}</dd>
        <dt>Maquila o transformación</dt><dd>${dinero(aj('transf_pieza', 2.2), 2)}</dd>
        <dt><b>Semanal, con vaso</b></dt><dd><b>${dinero(cv, 2)}</b></dd><dt><b>Cartucho, sin vaso</b></dt><dd><b>${dinero(cc, 2)}</b></dd></dl>
        <p class="tenue">Contra el precio al distribuidor sin IVA: Semanal ${semanal ? dinero(semanal.precio_dist / iva, 2) : '—'} (margen ${semanal ? Math.round((1 - cv / (semanal.precio_dist / iva)) * 100) : '—'}%), Cartucho ${cart ? dinero(cart.precio_dist / iva, 2) : '—'} (margen ${cart ? Math.round((1 - cc / (cart.precio_dist / iva)) * 100) : '—'}%). Los costos salen del inventario y se ponen al día con cada compra recibida.</p></section>
      <section class="bloque"><h2>Lo que el contador necesita</h2><ul class="lista simple">
        <li><b>Cada mes, antes del día 5:</b> los dos CSV de arriba (resultados y movimientos) y las facturas de compras con su número en la orden.</li>
        <li><b>Depósitos de cartuchos:</b> no son venta; son un pasivo que se regresa. Van aparte en los movimientos.</li>
        <li><b>IVA:</b> la estimación de aquí es para no sorprenderse; la declaración la hace el despacho con los CFDI.</li>
        <li><b>Nómina:</b> hasta que exista, se usa la del Equipo como gasto proyectado del mes en curso.</li></ul></section>
    </div>`;
  },
};
const gramos = () => { const r = S.recetas.find((x) => x.id === aj('receta_activa', 1)) || S.recetas[0], p = r?.datos?.parametros; const g = p ? p.gph * p.horas * (1 + p.residual) : 0; return g > 0 ? g : 398; };
void _RLR; void _k; void _rev; void api; void aviso; void cargar; void etiqueta;
