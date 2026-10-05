/* RLR · La Vela — pantalla Rutas: todos los pedidos listos, de todas las ubicaciones, y el repartidor los acomoda — Ricardo López Reyero
   Una ruta es un día, un repartidor, un vehículo y sus paradas en orden. Se mide en rejas, tarimas y kilos contra lo que cabe en el vehículo. */
import { S, aj, api, aviso, bitacoraDe, borrar, campo, cargar, crear, etiqueta, fecha, guardar, html, hoyISO, num } from './nucleo.js';
import { centro, dist, paso, tarimasTexto, vehiculo } from './cuentas.js';

const _RLR = 'Ricardo López Reyero', _k = 'EYE', _rev = 181218; // RLR

export const paradasDe = (r) => S.pedidos.filter((p) => p.ruta_id === r.id).sort((a, b) => a.parada - b.parada);
const sinRuta = () => S.pedidos.filter((p) => !p.ruta_id && ['Listo', 'En ruta'].includes(p.estado));
const ciudadDe = (p) => { const d = dist(p.distribuidor_id); return d?.ciudad || d?.zona || d?.zonas || 'Sin ciudad'; };
export function cargaDe(r) {
  const ps = paradasDe(r), v = vehiculo(r.vehiculo_id);
  const rejas = ps.reduce((s, p) => s + p.rejas, 0), kg = ps.reduce((s, p) => s + p.kg, 0), piezas = ps.reduce((s, p) => s + p.piezas, 0), vacios = ps.reduce((s, p) => s + p.vacios, 0);
  const cabe = v ? Math.min(v.rejas ? rejas / v.rejas : 0, v.kg ? kg / v.kg : 0) : 0, excede = v && (rejas > v.rejas || kg > v.kg);
  return { ps, rejas, kg, piezas, vacios, tarimas: rejas / aj('rejas_tarima', 32), v, uso: v ? Math.max(v.rejas ? rejas / v.rejas : 0, v.kg ? kg / v.kg : 0) : 0, excede, entregadas: ps.filter((p) => p.entregado_fecha).length, cobro: ps.filter((p) => !p.entregado_fecha).reduce((s, p) => s + p.total, 0) };
}
void cargaDe; void paso;

const tarjetaRuta = (r) => {
  const c = cargaDe(r);
  return html`<article class="tarjeta ${c.excede ? 'roja' : ''}" data-a="ir" data-ruta="rutas/${r.id}" tabindex="0">
    <header>${etiqueta(r.estado, r.estado === 'En camino' ? 'negra' : '')}<b>${fecha(r.fecha)} · ${r.repartidor || 'Sin repartidor'}</b></header>
    <p>${c.ps.length} parada(s) · ${num(c.piezas)} piezas · ${c.rejas} rejas (${tarimasTexto(c.tarimas)}) · ${num(c.kg)} kg</p>
    <p class="tenue">${c.v ? `${c.v.nombre}: ${Math.round(c.uso * 100)}% lleno` : 'Sin vehículo'}${c.vacios ? ` · recoge ${num(c.vacios)} vacíos` : ''}</p>
    ${c.excede ? html`<p class="plazo">No cabe: ${c.rejas} rejas o ${num(c.kg)} kg pasan la capacidad</p>` : ''}</article>`;
};

function panelRuta(sub) {
  if (sub === 'nueva') return html`<header><h2>Ruta nueva</h2><button class="cerrar" data-a="cerrar" aria-label="Cerrar">✕</button></header>
    <form data-f="ruta-nueva" class="forma">
      <label class="campo"><span>Fecha</span><input name="fecha" type="date" value="${hoyISO(1)}" required></label>
      <label class="campo"><span>Repartidor</span><input name="repartidor" maxlength="120" list="repartidores"><datalist id="repartidores">${[...new Set(S.rutas.map((r) => r.repartidor).filter(Boolean))].map((x) => html`<option value="${x}">`)}</datalist></label>
      <label class="campo"><span>Vehículo</span><select name="vehiculo_id">${S.vehiculos.filter((v) => v.activo).map((v) => html`<option value="${v.id}">${v.nombre} · ${v.rejas} rejas · ${num(v.kg)} kg</option>`)}</select></label>
      <label class="campo"><span>Sale de</span><select name="centro_id">${S.centros.filter((c) => c.estado === 'Activo').map((c) => html`<option value="${c.id}">${c.nombre}</option>`)}</select></label>
      <button class="boton lleno">Crear la ruta</button></form>`;
  const r = S.rutas.find((x) => x.id === Number(sub));
  if (!r) return null;
  const c = cargaDe(r), libres = sinRuta(), i = S.estados.rutas.indexOf(r.estado), sig = S.estados.rutas[i + 1];
  const grupos = {};
  for (const p of libres) (grupos[ciudadDe(p)] ||= []).push(p);
  return html`<header><div>${etiqueta(r.estado, r.estado === 'En camino' ? 'negra' : '')}<h2>Ruta del ${fecha(r.fecha)}</h2><p class="tenue">${r.repartidor || 'Sin repartidor'} · ${c.v?.nombre || 'Sin vehículo'} · sale de ${centro(r.centro_id)?.nombre || '—'}</p></div><button class="cerrar" data-a="cerrar" aria-label="Cerrar">✕</button></header>
    <div class="cifras chicas"><div><b>${c.rejas}</b><span>rejas · ${tarimasTexto(c.tarimas)}</span></div><div><b>${num(c.kg)}</b><span>kg${c.v ? ` de ${num(c.v.kg)}` : ''}</span></div><div><b>${c.v ? Math.round(c.uso * 100) + '%' : '—'}</b><span>del vehículo</span></div><div><b>${num(c.vacios)}</b><span>vacíos por recoger</span></div></div>
    ${c.excede ? html`<p class="alerta roja">No cabe en ${c.v.nombre}: ${c.rejas} rejas o ${num(c.kg)} kg. Quita paradas o cambia el vehículo.</p>` : ''}
    <div class="botones">${sig ? html`<button class="boton lleno" data-a="mover-ruta" data-id="${r.id}" data-v="${sig}">${sig === 'Cargada' ? 'Cargada: pasar sus pedidos a «En ruta»' : sig === 'En camino' ? 'Salió' : 'Terminar la ruta'}</button>` : ''}
      ${r.estado === 'Planeada' && !c.ps.length ? html`<button class="boton" data-a="llenar-ruta" data-id="${r.id}">Llenar con lo que haya listo, hasta donde quepa</button>` : ''}</div>
    <h4>Paradas en orden<span class="cuenta">${c.ps.length}</span></h4>
    ${c.ps.length ? html`<ol class="paradas">${c.ps.map((p, n) => { const d = dist(p.distribuidor_id); return html`<li class="${p.entregado_fecha ? 'hecha' : ''}"><span class="n">${n + 1}</span><div><b><a href="#/pedidos/${p.id}">#${p.id} · ${d?.empresa || ''}</a></b><small>${d?.direccion || ciudadDe(p)} · ${p.rejas} rejas · ${num(p.kg)} kg${p.vacios ? ` · recoge ${p.vacios}` : ''} · ${p.cobro === 'Cobrado' ? 'pagado' : 'cobrar ' + num(p.total)}</small>${d?.whatsapp ? html`<small><a href="https://wa.me/${(d.whatsapp.replace(/\D/g, '').length === 10 ? '52' : '') + d.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, soy el repartidor de La Vela. Voy en camino con tu pedido #${p.id}.`)}" target="_blank" rel="noopener">Avisar por WhatsApp</a></small>` : ''}</div>
        <span class="mover">${p.entregado_fecha ? etiqueta('Entregado', 'negra') : html`<button class="enlace" data-a="entregar" data-id="${p.id}">Entregado</button>`}<button class="enlace" data-a="parada" data-id="${r.id}" data-p="${p.id}" data-d="-1" aria-label="Subir">↑</button><button class="enlace" data-a="parada" data-id="${r.id}" data-p="${p.id}" data-d="1" aria-label="Bajar">↓</button><button class="enlace" data-a="quitar-parada" data-id="${r.id}" data-p="${p.id}" aria-label="Quitar">✕</button></span></li>`; })}</ol>` : html`<p class="vacio">Sin paradas. Agrega pedidos listos de la lista de abajo.</p>`}
    ${r.estado === 'Terminada' ? '' : html`<h4>Pedidos listos sin ruta<span class="cuenta">${libres.length}</span></h4>
      ${libres.length ? Object.entries(grupos).map(([ciudad, ps]) => html`<p class="tenue"><b>${ciudad}</b></p><ul class="lista">${ps.map((p) => html`<li><div><b>#${p.id} · ${dist(p.distribuidor_id)?.empresa || ''}</b><br><small class="tenue">${p.rejas} rejas · ${num(p.kg)} kg · ${num(p.piezas)} piezas${p.fecha_prometida ? ' · para el ' + fecha(p.fecha_prometida) : ''}</small></div><span><button class="enlace" data-a="agregar-parada" data-id="${r.id}" data-p="${p.id}">+ A esta ruta</button></span></li>`)}</ul>`) : html`<p class="vacio">Todo lo listo ya tiene ruta.</p>`}`}
    <div class="forma">
      ${campo('rutas', r.id, 'fecha', r.fecha, { rotulo: 'Fecha', tipo: 'date' })}
      ${campo('rutas', r.id, 'repartidor', r.repartidor, { rotulo: 'Repartidor' })}
      ${campo('rutas', r.id, 'vehiculo_id', r.vehiculo_id || '', { rotulo: 'Vehículo', opciones: [['', '—'], ...S.vehiculos.map((v) => [v.id, v.nombre])] })}
      ${campo('rutas', r.id, 'centro_id', r.centro_id || '', { rotulo: 'Sale de', opciones: [['', '—'], ...S.centros.map((x) => [x.id, x.nombre])] })}
      ${campo('rutas', r.id, 'km', r.km, { rotulo: 'Kilómetros', tipo: 'number' })}
      ${campo('rutas', r.id, 'costo', r.costo, { rotulo: 'Costo de la ruta ($)', tipo: 'number' })}
      ${campo('rutas', r.id, 'notas', r.notas, { rotulo: 'Notas', tipo: 'area', ancho: 'doble' })}
    </div>
    ${c.piezas && r.costo ? html`<p class="tenue">Transporte: ${num(r.costo / c.piezas, 2)} por pieza${c.v?.costo_km && r.km ? ` · el vehículo estima ${num(c.v.costo_km * r.km)} por ${num(r.km)} km` : ''}.</p>` : ''}
    ${bitacoraDe('rutas', r.id)}
    <p class="fin"><button class="enlace" data-a="borrar-ruta" data-id="${r.id}">Borrar esta ruta</button></p>`;
}

async function paradas(rutaId, lista) {
  try { await api('POST', `rutas/${rutaId}/paradas`, { paradas: lista.map((id) => ({ pedido_id: id })) }); await cargar(); } catch (e) { aviso(e.message, true); }
}

export const rutas = {
  id: 'rutas', titulo: 'Rutas', grupo: 'Operación',
  cuenta: () => sinRuta().length,
  botones: () => html`<button class="boton lleno" data-a="ir" data-ruta="rutas/nueva">+ Ruta</button>`,
  pintar() {
    const libres = sinRuta(), hoy = hoyISO(), abiertas = S.rutas.filter((r) => r.estado !== 'Terminada'), cerradas = S.rutas.filter((r) => r.estado === 'Terminada').slice(0, 20);
    const grupos = {};
    for (const p of libres) (grupos[ciudadDe(p)] ||= []).push(p);
    const rejasLibres = libres.reduce((s, p) => s + p.rejas, 0), kgLibres = libres.reduce((s, p) => s + p.kg, 0), rt = aj('rejas_tarima', 32);
    const enRuta = S.pedidos.filter((p) => p.estado === 'En ruta');
    return html`<div class="rejilla">
      <section class="bloque doble"><h2>Lo que hay que mover</h2><div class="cifras">
        <div><b>${libres.length}</b><span>pedidos listos sin ruta</span></div>
        <div><b>${rejasLibres}</b><span>rejas por salir · ${tarimasTexto(rejasLibres / rt)}</span></div>
        <div><b>${num(kgLibres)}</b><span>kilos por salir</span></div>
        <div><b>${enRuta.length}</b><span>pedidos en camino ahora</span></div>
        <div><b>${abiertas.filter((r) => r.fecha === hoy).length}</b><span>rutas de hoy</span></div>
        <div><b>${num(libres.reduce((s, p) => s + p.vacios, 0))}</b><span>cartuchos vacíos por recoger</span></div></div>
        <p class="tenue">Un pedido aparece aquí cuando pasa a «Listo». El repartidor lo acomoda en una ruta; al cargarla, los pedidos pasan a «En ruta»; cada parada se marca entregada desde el teléfono. Reja de 24 piezas, ${rt} rejas por tarima.</p></section>
      <section class="bloque"><h2>Rutas abiertas<span class="cuenta">${abiertas.length}</span></h2>
        ${abiertas.length ? html`<div class="pila">${abiertas.sort((a, b) => a.fecha.localeCompare(b.fecha)).map(tarjetaRuta)}</div>` : html`<p class="vacio">Sin rutas abiertas. Crea una con «+ Ruta».</p>`}</section>
      <section class="bloque"><h2>Listos, por ciudad<span class="cuenta">${libres.length}</span></h2>
        ${libres.length ? Object.entries(grupos).sort((a, b) => b[1].length - a[1].length).map(([ciudad, ps]) => html`<p><b>${ciudad}</b> <span class="tenue">· ${ps.reduce((s, p) => s + p.rejas, 0)} rejas · ${num(ps.reduce((s, p) => s + p.kg, 0))} kg</span></p><ul class="lista">${ps.map((p) => html`<li><a href="#/pedidos/${p.id}"><b>#${p.id} · ${dist(p.distribuidor_id)?.empresa || ''}</b></a><span>${p.rejas} rejas${p.fecha_prometida ? ' · ' + fecha(p.fecha_prometida) : ''}</span></li>`)}</ul>`) : html`<p class="vacio">Nada listo por mover.</p>`}</section>
      <section class="bloque doble"><h2>Vehículos</h2><div class="tabla-caja"><table class="tabla editable"><thead><tr><th>Vehículo</th><th>Tarimas</th><th>Rejas</th><th>Kilos</th><th>$ por km</th><th>Propio</th><th>Activo</th></tr></thead><tbody>
        ${S.vehiculos.map((v) => html`<tr><th>${campo('vehiculos', v.id, 'nombre', v.nombre)}</th><td>${campo('vehiculos', v.id, 'tarimas', v.tarimas, { tipo: 'number', paso: '1' })}</td><td>${campo('vehiculos', v.id, 'rejas', v.rejas, { tipo: 'number', paso: '1' })}</td><td>${campo('vehiculos', v.id, 'kg', v.kg, { tipo: 'number', paso: '1' })}</td><td>${campo('vehiculos', v.id, 'costo_km', v.costo_km, { tipo: 'number' })}</td><td>${campo('vehiculos', v.id, 'propio', v.propio, { tipo: 'checkbox' })}</td><td>${campo('vehiculos', v.id, 'activo', v.activo, { tipo: 'checkbox' })}</td></tr>`)}</tbody></table></div>
        <div class="botones"><button class="boton" data-a="vehiculo-nuevo">+ Vehículo</button></div></section>
      ${cerradas.length ? html`<section class="bloque doble"><h2>Rutas terminadas</h2><div class="tabla-caja"><table class="tabla"><thead><tr><th>Fecha</th><th>Repartidor</th><th>Paradas</th><th>Piezas</th><th>Rejas</th><th>Km</th><th>Costo</th><th>Por pieza</th></tr></thead><tbody>
        ${cerradas.map((r) => { const c = cargaDe(r); return html`<tr data-a="ir" data-ruta="rutas/${r.id}"><th>${fecha(r.fecha)}</th><td>${r.repartidor}</td><td>${c.ps.length}</td><td>${num(c.piezas)}</td><td>${c.rejas}</td><td>${num(r.km)}</td><td>${num(r.costo)}</td><td>${c.piezas && r.costo ? num(r.costo / c.piezas, 2) : ''}</td></tr>`; })}</tbody></table></div></section>` : ''}
    </div>`;
  },
  panel: panelRuta,
  acciones: {
    async 'mover-ruta'(el) {
      const r = S.rutas.find((x) => x.id === Number(el.dataset.id)), v = el.dataset.v, ps = paradasDe(r);
      if (v === 'Cargada') { if (!ps.length) return aviso('La ruta no tiene paradas.', true); for (const p of ps) if (p.estado === 'Listo') await guardar('pedidos', p.id, { estado: 'En ruta' }, { callado: true }); }
      if (v === 'Terminada' && ps.some((p) => !p.entregado_fecha) && !confirm('Hay paradas sin entregar. ¿Terminar de todos modos? Los pedidos sin entregar se quedan en la ruta.')) return;
      await guardar('rutas', r.id, { estado: v });
    },
    entregar: (el) => guardar('pedidos', el.dataset.id, { estado: 'Entregado' }),
    async parada(el) {
      const r = S.rutas.find((x) => x.id === Number(el.dataset.id)), ids = paradasDe(r).map((p) => p.id), i = ids.indexOf(Number(el.dataset.p)), j = i + Number(el.dataset.d);
      if (i < 0 || j < 0 || j >= ids.length) return;
      [ids[i], ids[j]] = [ids[j], ids[i]];
      await paradas(r.id, ids);
    },
    'agregar-parada': (el) => { const r = S.rutas.find((x) => x.id === Number(el.dataset.id)); return paradas(r.id, [...paradasDe(r).map((p) => p.id), Number(el.dataset.p)]); },
    'quitar-parada': (el) => { const r = S.rutas.find((x) => x.id === Number(el.dataset.id)); return paradas(r.id, paradasDe(r).map((p) => p.id).filter((id) => id !== Number(el.dataset.p))); },
    // Llenar: por ciudad (la que más tenga primero), hasta donde quepa en el vehículo
    async 'llenar-ruta'(el) {
      const r = S.rutas.find((x) => x.id === Number(el.dataset.id)), v = vehiculo(r.vehiculo_id), ids = [];
      let rejas = 0, kg = 0;
      const grupos = {};
      for (const p of sinRuta()) (grupos[ciudadDe(p)] ||= []).push(p);
      for (const ps of Object.values(grupos).sort((a, b) => b.length - a.length)) for (const p of ps.sort((a, b) => (a.fecha_prometida || '9').localeCompare(b.fecha_prometida || '9'))) {
        if (v && (rejas + p.rejas > v.rejas || kg + p.kg > v.kg)) continue;
        ids.push(p.id); rejas += p.rejas; kg += p.kg;
      }
      if (!ids.length) return aviso('No hay pedidos listos que quepan.', true);
      await paradas(r.id, ids);
    },
    'vehiculo-nuevo': () => crear('vehiculos', { nombre: 'Vehículo nuevo', tarimas: 1, rejas: 32, kg: 1000 }),
    async 'borrar-ruta'(el) {
      const r = S.rutas.find((x) => x.id === Number(el.dataset.id));
      if (paradasDe(r).length) await paradas(r.id, []);
      if (await borrar('rutas', r.id, '¿Borrar esta ruta? Sus pedidos vuelven a la lista de listos.')) location.hash = '#/rutas';
    },
  },
  formularios: { async 'ruta-nueva'(f, d) { const r = await crear('rutas', { fecha: d.fecha, repartidor: d.repartidor, vehiculo_id: Number(d.vehiculo_id) || null, centro_id: Number(d.centro_id) || null }); if (r) location.hash = `#/rutas/${r.fila.id}`; } },
};
void _RLR; void _k; void _rev;
