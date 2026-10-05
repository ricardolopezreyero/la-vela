/* RLR · La Vela — pantallas Producción, Cartuchos e Indicadores — Ricardo López Reyero */
import { S, aj, api, aviso, campo, cargar, crear, crudo, diasA, dinero, fecha, guardar, html, hoyISO, imprimir, num } from './nucleo.js';
import { cartuchos, dist, gramosPieza, lunes, porCobrar, porFabricar, producto, semanas, temporadas } from './cuentas.js';

const _RLR = 'Ricardo López Reyero', _k = 'EYE', _rev = 181218; // RLR
const dec = (i) => (i.unidad === 'kg' ? 1 : 0);

// ───────── Producción e inventario ─────────
export const produccion = {
  id: 'produccion', titulo: 'Producción', grupo: 'Operación',
  cuenta: () => { const f = porFabricar(); return S.inventario.filter((i) => (f.pide[i.clave] || 0) > i.existencia).length; },
  pintar() {
    const f = porFabricar(), cap = aj('capacidad_dia'), mes = new Date().getMonth();
    const compras = S.inventario.map((i) => ({ i, n: Math.max((f.pide[i.clave] || 0) - i.existencia, i.minimo - i.existencia) })).filter((c) => c.n > 0);
    return html`<div class="rejilla">
      ${mes >= 5 && mes <= 8 ? html`<p class="alerta doble">De junio a septiembre toca adelantar producción: octubre y noviembre traen cerca del 27% de la venta del año.</p>` : ''}
      <section class="bloque"><h2>Por fabricar<span class="cuenta">${num(f.piezas)}</span></h2>
        ${f.piezas ? html`<ul class="lista">${Object.entries(f.porProd).map(([k, n]) => html`<li><b>${producto(k)?.nombre || k}</b><span>${num(n)} piezas</span></li>`)}</ul>
          <p class="tenue">De ${f.pedidos.length} pedido(s): ${f.pedidos.map((p, n) => html`${n ? ', ' : ''}<a href="#/pedidos/${p.id}">#${p.id}</a>`)}. ${cap ? `A ${num(cap)} piezas por día son ${num(Math.ceil(f.piezas / cap))} día(s) de trabajo.` : ''}</p>`
          : html`<p class="vacio">No hay pedidos confirmados por fabricar.</p>`}
        <p class="tenue">Cada pieza lleva ${num(gramosPieza())} g de cera, según la <a href="#/receta">receta activa</a>. El material baja solo del inventario cuando el pedido pasa a «Curando».</p></section>
      <section class="bloque"><h2>Hay que comprar<span class="cuenta">${compras.length}</span></h2>
        ${compras.length ? html`<ul class="lista">${compras.map(({ i, n }) => html`<li><b>${num(n, dec(i))} ${i.unidad} de ${i.nombre.toLowerCase()}</b><span>≈ ${dinero(n * i.costo)}</span></li>`)}</ul>
          <p class="tenue">Total aproximado: ${dinero(compras.reduce((s, c) => s + c.n * c.i.costo, 0))}. Cubre los pedidos confirmados y deja cada material en su mínimo.</p>`
          : html`<p class="vacio">Con lo que hay alcanza para lo confirmado.</p>`}</section>
      <section class="bloque doble"><h2>Material</h2>
        <div class="tabla-caja"><table class="tabla editable"><thead><tr><th>Material</th><th>Hay</th><th>Mínimo</th><th>Piden los pedidos</th><th>Queda</th><th>Costo por unidad</th></tr></thead><tbody>
          ${S.inventario.map((i) => { const pide = f.pide[i.clave] || 0, queda = i.existencia - pide; return html`<tr class="${queda < 0 ? 'rojo' : i.existencia < i.minimo ? 'gris' : ''}"><th>${i.nombre}<small>${i.unidad}</small></th>
            <td>${campo('inventario', i.clave, 'existencia', i.existencia, { tipo: 'number' })}</td><td>${campo('inventario', i.clave, 'minimo', i.minimo, { tipo: 'number' })}</td>
            <td>${num(pide, dec(i))}</td><td><b>${num(queda, dec(i))}</b></td><td>${campo('inventario', i.clave, 'costo', i.costo, { tipo: 'number' })}</td></tr>`; })}
        </tbody></table></div>
        <div class="forma"><label class="campo"><span>Piezas que se pueden fabricar por día</span><input type="number" min="0" step="1" data-ajuste="capacidad_dia" value="${cap || ''}" placeholder="Sin definir"></label></div></section>
      <section class="bloque doble"><h2>Plan de la semana</h2>${planSemana(cap)}</section>
      <section class="bloque doble"><h2>Lotes<span class="cuenta">${S.lotes.length}</span></h2>
        <div class="tabla-caja"><table class="tabla editable"><thead><tr><th>Lote</th><th>Receta</th><th>Piezas</th><th>Rechazadas</th><th>Fecha</th><th>g por hora</th><th>Horas proyectadas</th><th>Resultado</th><th>Pedidos</th><th></th></tr></thead><tbody>
          ${S.lotes.map((l) => html`<tr class="${l.resultado === 'Rechazado' ? 'rojo' : ''}"><th>${campo('lotes', l.id, 'codigo', l.codigo)}</th>
            <td>${campo('lotes', l.id, 'receta_id', l.receta_id || '', { opciones: [['', '—'], ...S.recetas.map((r) => [r.id, r.nombre])] })}</td>
            <td>${campo('lotes', l.id, 'piezas', l.piezas, { tipo: 'number', paso: '1' })}</td><td>${campo('lotes', l.id, 'rechazadas', l.rechazadas || 0, { tipo: 'number', paso: '1' })}</td><td>${campo('lotes', l.id, 'fecha', l.fecha, { tipo: 'date' })}</td>
            <td>${campo('lotes', l.id, 'gph', l.gph ?? '', { tipo: 'number' })}</td><td>${campo('lotes', l.id, 'horas', l.horas ?? '', { tipo: 'number' })}</td>
            <td>${campo('lotes', l.id, 'resultado', l.resultado, { opciones: ['En prueba', 'Aprobado', 'Rechazado'] })}</td>
            <td>${S.pedidos.filter((p) => p.lote_id === l.id).map((p, n) => html`${n ? ', ' : ''}<a href="#/pedidos/${p.id}">#${p.id}</a>`)}</td><td><button class="enlace" data-a="orden-produccion" data-id="${l.id}">Imprimir orden</button></td></tr>`)}
          ${S.lotes.length ? '' : html`<tr><td colspan="10" class="vacio">Sin lotes. Cada lote se pesa y se prueba antes de salir; el pedido se liga a su lote desde su ficha.</td></tr>`}
        </tbody></table></div>
        <div class="botones"><button class="boton" data-a="lote-nuevo">+ Lote</button></div>
        <p class="tenue">Merma: ${num(S.lotes.reduce((s, l) => s + (l.rechazadas || 0), 0))} piezas rechazadas de ${num(S.lotes.reduce((s, l) => s + l.piezas, 0))} fabricadas${S.lotes.reduce((s, l) => s + l.piezas, 0) ? ` (${(S.lotes.reduce((s, l) => s + (l.rechazadas || 0), 0) / S.lotes.reduce((s, l) => s + l.piezas, 0) * 100).toFixed(1)}%)` : ''}.</p></section>
      <section class="bloque doble"><h2>Ajuste de inventario</h2>
        <form data-f="ajuste-inv" class="forma enlinea"><label class="campo"><span>Material</span><select name="clave">${S.inventario.map((i) => html`<option value="${i.clave}">${i.nombre}</option>`)}</select></label>
          <label class="campo"><span>Nueva existencia</span><input name="existencia" type="number" step="any" min="0" required></label><label class="campo" style="flex:2 1 240px"><span>Motivo</span><input name="motivo" required placeholder="Conteo físico, merma, cera derramada…"></label><button class="boton">Ajustar</button></form>
        <ul class="bitacora"><h4>Últimos ajustes</h4>${S.bitacora.filter((b) => b.cosa === 'inventario').slice(0, 8).map((b) => html`<li><p>${b.texto}</p><small>${b.por.split('@')[0]} · ${fecha(b.fecha)}</small></li>`)}</ul></section>
    </div>`;
  },
  acciones: {
    'orden-produccion'(el) {
      const l = S.lotes.find((x) => x.id === Number(el.dataset.id)), r = S.recetas.find((x) => x.id === l.receta_id), ps = S.pedidos.filter((p) => p.lote_id === l.id), g = gramosPieza();
      imprimir(`<h1>Orden de producción · ${l.codigo}</h1><p>${fecha(l.fecha)} · ${num(l.piezas)} piezas · receta: ${r?.nombre || '—'}</p>
        <table><thead><tr><th>Material</th><th>Por pieza</th><th>Para el lote</th></tr></thead><tbody><tr><td>Cera</td><td>${num(g)} g</td><td>${num((l.piezas * g) / 1000, 1)} kg</td></tr><tr><td>Mechas y cartuchos</td><td>1</td><td>${num(l.piezas)}</td></tr><tr><td>Vasos y etiquetas (si lleva vaso)</td><td>1</td><td>${num(l.piezas)}</td></tr><tr><td>Cajas de 12</td><td>1/12</td><td>${num(Math.ceil(l.piezas / 12))}</td></tr></tbody></table>
        ${r ? `<h2>Pasos</h2><ol>${(r.datos.pasos || []).map((x) => `<li>${x}</li>`).join('')}</ol><p>Meta: ${r.datos.parametros?.gph} g/h · ${r.datos.parametros?.horas} h. Mecha: ${r.datos.mecha || ''}</p>` : ''}
        ${ps.length ? `<h2>Pedidos</h2><p>${ps.map((p) => `#${p.id} ${dist(p.distribuidor_id)?.empresa || ''} (${num(p.piezas)})`).join(' · ')}</p>` : ''}
        <div class="firma"><span>Pesó la cera</span><span>Liberó calidad (g/h medido)</span><span>Empacó (rejas)</span></div>`);
    },
    'lote-nuevo': () => { const h = hoyISO(), n = S.lotes.filter((l) => l.fecha === h).length + 1; return crear('lotes', { codigo: `L-${h.slice(2).replace(/-/g, '')}-${n}`, fecha: h, receta_id: aj('receta_activa', 1) }); },
  },

  formularios: {
    async 'ajuste-inv'(f, d) {
      const i = S.inventario.find((x) => x.clave === d.clave), nueva = Number(d.existencia);
      if (await guardar('inventario', i.clave, { existencia: nueva }, { callado: true })) { try { await api('POST', 'nota', { cosa: 'inventario', cosa_id: 0, texto: `${i.nombre}: de ${num(i.existencia, i.unidad === 'kg' ? 1 : 0)} a ${num(nueva, i.unidad === 'kg' ? 1 : 0)} ${i.unidad} · ${d.motivo}` }); await cargar(); aviso('Inventario ajustado'); } catch (e) { aviso(e.message, true); } }
    },
  },
};
// Pedidos por entregar en los próximos 14 días, contra la capacidad por día
function planSemana(cap) {
  const ps = S.pedidos.filter((p) => !p.entregado_fecha && p.fecha_prometida && p.estado !== 'Listo' && p.estado !== 'En ruta').sort((a, b) => a.fecha_prometida.localeCompare(b.fecha_prometida));
  if (!ps.length) return html`<p class="vacio">Nada por entregar con fecha.</p>`;
  const dias = [];
  for (let i = 0; i < 14; i++) dias.push(hoyISO(i));
  let acum = 0;
  const filas = dias.map((d, i) => { const xs = ps.filter((p) => p.fecha_prometida === d || (i === 0 && p.fecha_prometida < d)); const n = xs.reduce((s, p) => s + p.piezas, 0); acum += n; return { d, xs, n, acum, cabe: !cap || acum <= cap * (i + 1) }; }).filter((f) => f.n);
  const maxN = Math.max(1, ...filas.map((f) => f.n));
  return html`<ul class="plan">${filas.map((f) => html`<li class="${f.cabe ? '' : 'pasa'}"><b>${f.d === hoyISO() ? 'Hoy' : f.d < hoyISO() ? 'Atrasado' : fecha(f.d)}</b><span class="barra"><i style="${crudo(`width:${Math.round((f.n / maxN) * 100)}%`)}"></i></span><span>${num(f.n)} pzas · ${f.xs.map((p) => `#${p.id}`).join(' ')}${f.cabe ? '' : ' · no alcanza la capacidad'}</span></li>`)}</ul>
    <p class="tenue">${cap ? `A ${num(cap)} piezas por día. Una fila negra quiere decir que lo acumulado hasta ese día rebasa lo que la planta puede fabricar.` : 'Pon la capacidad por día para ver si alcanza.'} Los anticipados se producen una semana antes de su fecha.</p>`;
}
export const cartuchosVista = {
  id: 'cartuchos', titulo: 'Cartuchos', grupo: 'Operación',
  pintar() {
    const c = cartuchos(), filas = Object.entries(c.porDist).map(([id, v]) => ({ d: dist(Number(id)), ...v })).sort((a, b) => b.enviados - a.enviados);
    return html`<div class="rejilla">
      <section class="bloque doble"><h2>El ciclo del cartucho</h2><div class="cifras">
        <div><b>${num(c.fuera)}</b><span>fuera: en casas, tiendas y ruta</span></div>
        <div><b>${num(c.enPlanta)}</b><span>en planta, nuevos y vacíos</span></div>
        <div><b>${c.tasa == null ? '—' : Math.round(c.tasa * 100) + '%'}</b><span>regresa · meta ${aj('meta_retorno', 80)}%</span></div>
        <div><b>${dinero(c.depositos)}</b><span>en depósitos de los que andan fuera</span></div>
        <div><b>${num(c.enviados)}</b><span>cartuchos entregados en total</span></div>
        <div><b>${num(c.regresados)}</b><span>vacíos recibidos en total</span></div></div>
        <p class="tenue">Se cuenta solo con los pedidos entregados: cada pieza sale con un cartucho y cada pedido trae de regreso los vacíos que anotó el distribuidor.</p></section>
      <section class="bloque doble"><h2>Por distribuidor</h2>
        ${filas.length ? html`<div class="tabla-caja"><table class="tabla"><thead><tr><th>Distribuidor</th><th>Entregados</th><th>Regresados</th><th>Regresa</th><th>Andan fuera</th><th>Depósitos</th></tr></thead><tbody>
          ${filas.map((f) => html`<tr data-a="ir" data-ruta="distribuidores/${f.d ? f.d.id : ''}"><th>${f.d ? f.d.empresa : 'Sin distribuidor'}</th><td>${num(f.enviados)}</td><td>${num(f.regresados)}</td>
            <td>${Math.round((f.regresados / f.enviados) * 100)}%</td><td>${num(f.enviados - f.regresados)}</td><td>${dinero((f.enviados - f.regresados) * aj('deposito'))}</td></tr>`)}</tbody></table></div>`
          : html`<p class="vacio">Aparece en cuanto se entregue el primer pedido.</p>`}</section>
      <section class="bloque"><h2>Bajas y meta</h2><div class="forma"><label class="campo"><span>Cartuchos dados de baja y reciclados</span><input type="number" min="0" step="1" data-ajuste="bajas_cartuchos" value="${c.bajas || ''}" placeholder="0"></label><label class="campo"><span>Meta de retorno (%)</span><input type="number" min="0" max="100" step="1" data-ajuste="meta_retorno" value="${S.ajustes.meta_retorno ?? 80}"></label></div>
        <p class="tenue">Al dar de baja cartuchos, réstalos también de «Cartuchos de aluminio» en Producción.</p></section>
      <section class="bloque"><h2>Por validar</h2><ul class="lista simple"><li>Cuántas vueltas aguanta un cartucho antes de deformarse.</li><li>Qué porcentaje regresa de verdad, por tienda.</li><li>Quién se queda con el depósito del que no vuelve.</li></ul></section>
    </div>`;
  },
};

// ───────── Indicadores ─────────
const barra = (n, max) => html`<span class="barra"><i style="${crudo(`width:${max && n ? Math.min(100, Math.max(2, (n / max) * 100)) : 0}%`)}"></i></span>`;

export const indicadores = {
  id: 'indicadores', titulo: 'Indicadores', grupo: 'Operación',
  pintar() {
    const sem = S.pedidos.filter((p) => p.creado.slice(0, 10) >= lunes()), meta = aj('meta_semanal');
    const pzSem = sem.reduce((s, p) => s + p.piezas, 0), dinSem = sem.reduce((s, p) => s + p.subtotal, 0);
    const ent = S.pedidos.filter((p) => p.entregado_fecha), total = ent.reduce((s, p) => s + p.piezas, 0), cart = ent.reduce((s, p) => s + p.piezas - p.piezas_vaso, 0);
    const conFecha = ent.filter((p) => p.fecha_prometida), aTiempo = conFecha.filter((p) => p.entregado_fecha <= p.fecha_prometida).length;
    const pc = porCobrar(), tramo = (a, b) => pc.filter((p) => { const d = -diasA(p.entregado_fecha); return d >= a && d <= b; }).reduce((s, p) => s + p.total, 0);
    const etapas = S.estados.distribuidores.map((e) => [e, S.distribuidores.filter((d) => d.estado === e).length]), maxE = Math.max(1, ...etapas.map((e) => e[1]));
    const porProd = {}, porDist = {};
    for (const p of S.pedidos) { porDist[p.distribuidor_id] = (porDist[p.distribuidor_id] || 0) + p.piezas; for (const l of p.lineas) porProd[l.clave] = (porProd[l.clave] || 0) + l.cajas * (producto(l.clave)?.piezas_caja || 12); }
    const maxP = Math.max(1, ...Object.values(porProd)), maxD = Math.max(1, ...Object.values(porDist)), t = temporadas()[0];
    const activos = S.distribuidores.filter((d) => ['Piloto', 'Activo'].includes(d.estado)), rech = S.lotes.filter((l) => l.resultado === 'Rechazado').length;
    return html`<div class="rejilla">
      <section class="bloque doble"><h2>Lo que dice si el negocio va bien</h2><div class="cifras">
        <div><b>${num(pzSem)}</b><span>piezas pedidas esta semana${meta ? ` · meta ${num(meta)}` : ''}</span>${meta ? barra(pzSem, meta) : ''}</div>
        <div><b>${dinero(dinSem)}</b><span>en pedidos esta semana</span></div>
        <div><b>${total ? Math.round((cart / total) * 100) + '%' : '—'}</b><span>recompra: cartuchos sobre el total entregado</span></div>
        <div><b>${num(activos.reduce((s, d) => s + (d.tiendas || 0), 0))}</b><span>tiendas activas, con ${activos.length} distribuidor(es)</span></div>
        <div><b>${conFecha.length ? Math.round((aTiempo / conFecha.length) * 100) + '%' : '—'}</b><span>pedidos entregados a tiempo</span></div>
        <div><b>${t ? t.dias : '—'}</b><span>días para ${t ? t.nombre : 'la próxima temporada'}</span></div></div>
        <p class="tenue">La recompra es la métrica que dice si el modelo funciona: si la gente regresa por el cartucho, lo demás se sostiene. La meta de la fase 3 es pasar de 40%.</p></section>
      <section class="bloque doble"><h2>Doce semanas</h2><ul class="lista barras">${(() => { const ss = semanas(12), mx = Math.max(1, ...ss.map((x) => x.piezas)); return ss.map((x) => html`<li><b>${fecha(x.hasta)}</b>${barra(x.piezas, mx)}<span>${num(x.piezas)}</span></li>`); })()}</ul><p class="tenue">Piezas pedidas (confirmadas o más) por semana, la más reciente al final.</p></section>
      <section class="bloque"><h2>Embudo de distribuidores</h2><ul class="lista barras">${etapas.map(([e, n]) => html`<li><b>${e}</b>${barra(n, maxE)}<span>${n}</span></li>`)}</ul>
        <p class="tenue">Por tipo: ${['A', 'B', 'C'].map((x) => `${x} ${S.distribuidores.filter((d) => d.tipo === x).length}`).join(' · ')}</p></section>
      <section class="bloque"><h2>Por cobrar</h2><ul class="lista barras">
        ${[['0 a 30 días', tramo(0, 30)], ['31 a 60 días', tramo(31, 60)], ['Más de 60 días', tramo(61, 99999)]].map(([r, n]) => html`<li><b>${r}</b><span>${dinero(n)}</span></li>`)}</ul>
        <p class="cifra chica">${dinero(pc.reduce((s, p) => s + p.total, 0))}</p><p class="tenue">Total entregado y sin cobrar. El modelo supone cobrar a 30 días.</p></section>
      <section class="bloque"><h2>Piezas por producto</h2>${Object.keys(porProd).length ? html`<ul class="lista barras">${Object.entries(porProd).sort((a, b) => b[1] - a[1]).map(([k, n]) => html`<li><b>${producto(k)?.nombre.split(' (')[0] || k}</b>${barra(n, maxP)}<span>${num(n)}</span></li>`)}</ul>` : html`<p class="vacio">Sin pedidos todavía.</p>`}</section>
      <section class="bloque"><h2>Piezas por distribuidor</h2>${Object.keys(porDist).length ? html`<ul class="lista barras">${Object.entries(porDist).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, n]) => html`<li><b>${dist(Number(id))?.empresa || '—'}</b>${barra(n, maxD)}<span>${num(n)}</span></li>`)}</ul>` : html`<p class="vacio">Sin pedidos todavía.</p>`}</section>
      <section class="bloque doble"><h2>Operación</h2><div class="cifras">
        <div><b>${S.lotes.length ? `${rech} de ${S.lotes.length}` : '—'}</b><span>lotes rechazados</span></div>
        <div><b>${num(S.pedidos.filter((p) => !p.entregado_fecha).reduce((s, p) => s + p.piezas, 0))}</b><span>piezas pedidas y sin entregar</span></div>
        <div><b>${num(cartuchos().fuera)}</b><span>cartuchos fuera de planta</span></div></div>
        <p class="tenue">Garantías y registros por QR todavía no se capturan: llegan cuando exista la etiqueta con código.</p></section>
    </div>`;
  },
};
void _RLR; void _k; void _rev; void fecha;
