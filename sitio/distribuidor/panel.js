/* RLR · La Vela — el panel del distribuidor — Ricardo López Reyero
   Entra con su cuenta de Google (Login de CapitalTorreon). Pide en un clic, ve cómo va cada pedido,
   paga con tarjeta o por transferencia, pide anticipado para las temporadas, ve lo que gana y pide material de promoción. */
const _RLR = 'Ricardo López Reyero', _k = 'EYE', _rev = 181218; // RLR

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
class Crudo { constructor(s) { this.s = s; } toString() { return this.s; } }
const val = (v) => (v == null || v === false ? '' : v instanceof Crudo ? v.s : Array.isArray(v) ? v.map(val).join('') : esc(v));
const html = (p, ...vs) => new Crudo(p.map((x, i) => x + (i < vs.length ? val(vs[i]) : '')).join(''));
const num = (n, d = 0) => (Number(n) || 0).toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
const dinero = (n, d = 0) => (n < 0 ? '−$' : '$') + num(Math.abs(n), d);
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const fecha = (iso) => { if (!iso) return ''; const [a, m, d] = iso.slice(0, 10).split('-').map(Number); return `${d} ${MES[m - 1]}${a !== new Date().getFullYear() ? ' ' + a : ''}`; };
const masDias = (iso, n) => { const d = new Date(iso + 'T12:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

let D = null, F = { lineas: {}, promos: {}, vacios: 0, fecha: '', temporada: '' };

function aviso(t, malo = false) { const a = document.createElement('div'); a.className = 'aviso-v' + (malo ? ' malo' : ''); a.textContent = t; $('#avisos').append(a); setTimeout(() => a.remove(), malo ? 6000 : 2500); }
async function api(ruta, cuerpo) {
  const r = await fetch('/api/d/' + ruta, { method: cuerpo ? 'POST' : 'GET', headers: cuerpo ? { 'content-type': 'application/json' } : {}, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && j.entrar) { D = null; pintarEntrada(''); throw new Error('Entra con tu cuenta.'); }
  if (!r.ok) throw new Error(j.error || 'No se pudo.');
  return j;
}

// ───────── Temporadas (las mismas del tablero) ─────────
function pascua(a) {
  const c = a % 19, b = Math.floor(a / 100), d = a % 100, e = Math.floor(b / 4), f = b % 4, g = Math.floor((b + 8) / 25);
  const h = (19 * c + b - e - Math.floor((b - g + 1) / 3) + 15) % 30, i = Math.floor(d / 4), k = d % 4, l = (32 + 2 * f + 2 * i - h - k) % 7, m = Math.floor((c + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(a, mes - 1, dia);
}
function temporadas() {
  const hoy = new Date(D.hoy + 'T00:00'), lista = [], iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  for (const a of [hoy.getFullYear(), hoy.getFullYear() + 1]) {
    const santo = pascua(a); santo.setDate(santo.getDate() - 2);
    lista.push(['San Valentín', new Date(a, 1, 14)], ['Semana Santa', santo], ['10 de mayo', new Date(a, 4, 10)], ['San Judas', new Date(a, 9, 28)], ['Día de Muertos', new Date(a, 10, 1)], ['Guadalupe', new Date(a, 11, 12)], ['Navidad', new Date(a, 11, 24)]);
  }
  return lista.filter(([, d]) => d >= hoy).sort((x, y) => x[1] - y[1]).slice(0, 5).map(([nombre, d]) => ({ nombre, fecha: iso(d), dias: Math.round((d - hoy) / 86400000) }));
}

// ───────── Cuentas ─────────
const prod = (clave) => D.productos.find((p) => p.clave === clave);
const gananciaPieza = (p) => Math.max(0, p.precio_publico * (1 - D.ajustes.margen_tienda / 100) - p.precio_dist);
function cuenta(lineas, vacios, promos) {
  let piezas = 0, cajas = 0, sub = 0, rejas = 0, gana = 0, promosTotal = 0;
  const faltan = [];
  for (const [clave, n] of Object.entries(lineas)) {
    const p = prod(clave); if (!p || !n) continue;
    const pz = n * p.piezas_caja, reja = p.piezas_reja || 24, sobra = pz % reja;
    cajas += n; piezas += pz; sub += pz * p.precio_dist; rejas += Math.ceil(pz / reja); gana += pz * gananciaPieza(p);
    if (sobra) faltan.push(`${Math.ceil((reja - sobra) / p.piezas_caja)} caja(s) más de ${p.nombre.split(' (')[0]}`);
  }
  for (const [clave, n] of Object.entries(promos)) { const x = D.promos.find((y) => y.clave === clave); if (x && n) promosTotal += n * x.precio; }
  const dep = D.ajustes.deposito, rt = D.ajustes.rejas_tarima;
  return { piezas, cajas, sub, rejas, gana, promosTotal, deposito: dep * piezas, abono: dep * vacios, total: sub + dep * (piezas - vacios) + promosTotal, tarimas: rejas / rt, faltan, paraTarima: rejas % rt ? rt - (rejas % rt) : 0 };
}
const lineasDe = (p) => Object.fromEntries(p.lineas.map((l) => [l.clave, l.cajas]));
const ganaDePedido = (p) => p.lineas.reduce((s, l) => { const x = prod(l.clave); return s + (x ? l.cajas * x.piezas_caja * gananciaPieza(x) : 0); }, 0);
const abierto = (p) => !(p.entregado_fecha && p.cobro === 'Cobrado');

// ───────── Pantallas ─────────
function pintarEntrada(mensaje) {
  $('#nav').innerHTML = '';
  $('#panel').innerHTML = html`<section class="seccion negra" style="border-top:0;min-height:70vh"><div class="caja entrada">
    <p class="etiqueta">Distribuidores</p><h1>Mi panel</h1>
    <p class="grande">Aquí pides en un clic, ves cómo va cada pedido, pagas y ves lo que ganas. Entra con la cuenta de Google que nos diste.</p>
    <div class="botones"><button class="boton lleno" id="entrar" type="button">Entrar con Google</button></div>
    <p class="tenue" id="aviso-entrada">${mensaje}</p>
    <p class="tenue">¿Todavía no distribuyes La Vela? <a href="/distribuir">Llena la solicitud</a>.</p></div></section>`;
  $('#entrar').addEventListener('click', () => { if (window.LoginCT && LoginCT.quien()) conPase(); else if (window.LoginCT) LoginCT.entrar(); else aviso('El login todavía está cargando. Intenta de nuevo.', true); });
}
let probando = false;
async function conPase() {
  const pase = window.LoginCT && LoginCT.pase();
  if (!pase || probando || sessionStorage.getItem('vela_dist_malo') === pase) return;
  probando = true;
  try { await api('entrar', { pase }); location.reload(); }
  catch (e) { probando = false; try { sessionStorage.setItem('vela_dist_malo', pase); } catch { /* da igual */ } const a = $('#aviso-entrada'); if (a) a.textContent = e.message; }
}

function pintar() {
  const abiertos = D.pedidos.filter(abierto), ultimo = D.pedidos[0], hoyM = D.hoy.slice(0, 7);
  const entregadosMes = D.pedidos.filter((p) => p.entregado_fecha && p.entregado_fecha.slice(0, 7) === hoyM), ganaMes = entregadosMes.reduce((s, p) => s + ganaDePedido(p), 0);
  const enCamino = D.pedidos.filter((p) => p.estado === 'En ruta').length, regresados = D.pedidos.filter((p) => p.entregado_fecha).reduce((s, p) => s + p.vacios, 0);
  $('#nav').innerHTML = html`<a href="#pedir">Pedir</a><a href="#pedidos">Mis pedidos</a><a href="#gano">Lo que gano</a><a href="#promocion">Promoción</a><a href="#" id="salir">Salir</a>`;
  $('#panel').innerHTML = html`
    <section class="seccion negra" style="border-top:0"><div class="caja">
      <p class="etiqueta">Mi panel</p><h1>${D.yo.empresa}</h1>
      <div class="cifras">
        <div><b>${abiertos.length}</b><span>pedido(s) en proceso${enCamino ? ` · ${enCamino} en camino` : ''}</span></div>
        <div><b>${dinero(D.saldo)}</b><span>por pagar${D.yo.credito ? ` · crédito de ${dinero(D.yo.credito)}` : ''}</span></div>
        <div><b>${dinero(ganaMes)}</b><span>lo que ganas con lo entregado este mes</span></div>
        <div><b>${num(regresados)}</b><span>cartuchos que has regresado</span></div></div>
      ${ultimo ? html`<div class="botones"><button class="boton lleno" type="button" data-a="repetir">Repetir mi último pedido · ${ultimo.cajas} caja(s) · ${dinero(ultimo.total)}</button><a class="boton" href="#pedir">Pedido nuevo</a></div>
        <p class="tenue">Un clic y queda pedido; llega en ${D.ajustes.dias_entrega} días.</p>` : html`<div class="botones"><a class="boton lleno" href="#pedir">Hacer mi primer pedido</a></div>`}
    </div></section>
    ${seccionPedir()}
    ${seccionPedidos(abiertos)}
    ${seccionGano()}
    ${seccionPromos()}
    <section class="seccion"><div class="caja"><p class="tenue">¿Dudas? ${D.ajustes.whatsapp ? html`<a href="https://wa.me/${D.ajustes.whatsapp.replace(/\D/g, '')}">Escríbenos por WhatsApp</a>.` : 'Escríbenos a info@conectavelas.com.'} ${D.yo.liga ? html`También puedes pedir sin entrar desde <a href="/pedir?d=${D.yo.liga}">tu liga privada</a>.` : ''}</p></div></section>`;
  $('#salir').addEventListener('click', async (ev) => { ev.preventDefault(); await api('salir', {}); if (window.LoginCT) LoginCT.salir(); else location.reload(); });
  pintarCuenta();
}

function seccionPedir() {
  const ts = temporadas(), minima = masDias(D.hoy, D.ajustes.dias_entrega);
  if (!F.fecha) F.fecha = minima;
  return html`<section class="seccion" id="pedir"><div class="caja">
    <p class="etiqueta">Pedir</p><h2>Pedido nuevo</h2>
    <p>Por caja de 12. Dos cajas llenan una reja y ${D.ajustes.rejas_tarima} rejas una tarima: pide por tarima y el flete por pieza es el más bajo.</p>
    <div class="botones"><button class="boton" type="button" data-a="tarima">Llenar una tarima (${D.ajustes.rejas_tarima * 2} cajas)</button><button class="boton" type="button" data-a="limpiar">Vaciar</button></div>
    <form id="forma" class="renglones">
      ${D.productos.map((p) => html`<div class="renglon"><div><b>${p.nombre}</b><small>Caja de ${p.piezas_caja} · ${dinero(p.precio_dist * p.piezas_caja, 2)} · ${dinero(p.precio_dist, 2)} por pieza · tú ganas ${dinero(gananciaPieza(p), 2)} por pieza</small></div>
        <div class="mas"><button type="button" data-m="-1" data-l="${p.clave}" aria-label="Una caja menos">−</button><input type="number" min="0" step="1" inputmode="numeric" data-l="${p.clave}" value="${F.lineas[p.clave] || 0}" aria-label="Cajas de ${p.nombre}"><button type="button" data-m="1" data-l="${p.clave}" aria-label="Una caja más">+</button></div></div>`)}
      <div class="renglon"><div><b>Cartuchos vacíos que entregas</b><small>Los recogemos en la misma entrega y se descuentan</small></div><div class="mas"><button type="button" data-m="-12" data-l="vacios" aria-label="Doce menos">−</button><input type="number" min="0" step="1" inputmode="numeric" data-l="vacios" value="${F.vacios}" aria-label="Cartuchos vacíos"><button type="button" data-m="12" data-l="vacios" aria-label="Doce más">+</button></div></div>
    </form>
    <h3>Material de promoción para este pedido</h3>
    <div class="casillas">${D.promos.filter((x) => !x.liga).map((x) => html`<label><input type="checkbox" data-p="${x.clave}" ${F.promos[x.clave] ? html`checked` : ''}><span><b>${x.nombre}${x.precio ? ` · ${dinero(x.precio)}` : ' · gratis'}</b><small>${x.condicion}</small></span><span class="mas"><button type="button" data-m="-1" data-pm="${x.clave}" aria-label="Uno menos">−</button><input type="number" min="0" step="1" inputmode="numeric" data-pm="${x.clave}" value="${F.promos[x.clave] || 0}" aria-label="Cantidad"><button type="button" data-m="1" data-pm="${x.clave}" aria-label="Uno más">+</button></span></label>`)}</div>
    <h3>Cuándo lo quieres</h3>
    <p class="tenue">Normal: en ${D.ajustes.dias_entrega} días. Anticipado: eliges la fecha y lo producimos con tiempo; conviene para las temporadas.</p>
    <div class="temporadas">${ts.map((t) => html`<button type="button" data-t="${t.fecha}" aria-pressed="${String(F.temporada === t.fecha)}">${t.nombre} · ${fecha(t.fecha)} · en ${t.dias} días</button>`)}</div>
    <label><span>Entregar el</span><input type="date" id="fecha" min="${minima}" value="${F.fecha}"></label>
    <label><span>Notas</span><textarea id="notas" maxlength="1000" placeholder="Nombres para las personalizadas, horario de entrega, a qué tienda va cada exhibidor…"></textarea></label>
    <div class="cuenta" id="cuenta"></div>
    <p class="error" id="error" role="alert" hidden></p>
    <div class="botones"><button class="boton lleno ancho" type="button" id="enviar" data-a="pedir">Hacer el pedido</button></div>
  </div></section>`;
}

function pintarCuenta() {
  const c = cuenta(F.lineas, F.vacios, F.promos), el = $('#cuenta');
  if (!el) return;
  const saldoCon = D.saldo + D.pedidos.filter((p) => !p.entregado_fecha && p.cobro !== 'Cobrado').reduce((s, p) => s + p.total, 0) + c.total;
  const sug = !c.rejas ? '' : c.faltan.length ? `Para no mandar rejas a medias agrega ${c.faltan.join(' y ')}.` : c.paraTarima ? `Rejas completas. Faltan ${c.paraTarima} rejas (${c.paraTarima * 2} cajas) para llenar la tarima.` : 'Tarima(s) completa(s): el mejor flete por pieza.';
  el.innerHTML = html`<div><span>${num(c.piezas)} piezas en ${num(c.cajas)} caja(s)</span><b>${dinero(c.sub, 2)}</b></div>
    <div><span>Depósito de cartuchos (${num(c.piezas)} × ${dinero(D.ajustes.deposito)})</span><b>${dinero(c.deposito, 2)}</b></div>
    <div><span>Cartuchos vacíos que entregas</span><b>${dinero(-c.abono, 2)}</b></div>
    ${c.promosTotal ? html`<div><span>Material de promoción</span><b>${dinero(c.promosTotal, 2)}</b></div>` : ''}
    <div class="total"><span>Total, con IVA</span><b>${dinero(c.total, 2)}</b></div>
    ${c.rejas ? html`<div><span>Empaque</span><b>${c.rejas} reja(s) · ${c.tarimas >= 1 ? num(c.tarimas, 1).replace('.0', '') + ' tarima(s)' : Math.round(c.tarimas * 100) + '% de una tarima'}</b></div>` : ''}
    ${sug ? html`<p class="tenue" style="margin-top:8px">${sug}</p>` : ''}
    ${F.fecha > masDias(D.hoy, D.ajustes.dias_entrega + 7) ? html`<p class="tenue">Pedido anticipado: se entrega el ${fecha(F.fecha)}.</p>` : ''}
    ${c.gana ? html`<div class="gana"><span>Al venderlo en tus tiendas ganas</span><b>≈ ${dinero(c.gana)}</b></div>` : ''}
    ${D.yo.credito && saldoCon > D.yo.credito ? html`<p class="tenue" style="margin-top:8px">Con este pedido debes ${dinero(saldoCon)} y tu crédito es de ${dinero(D.yo.credito)}: paga por adelantado para que se confirme de inmediato.</p>` : ''}`.s;
  const b = $('#enviar'); if (b) b.disabled = !c.piezas && !Object.values(F.promos).some(Boolean);
}

function seccionPedidos(abiertos) {
  const cerrados = D.pedidos.filter((p) => !abierto(p));
  return html`<section class="seccion gris" id="pedidos"><div class="caja">
    <p class="etiqueta">Mis pedidos</p><h2>Cómo van</h2>
    ${abiertos.length ? html`<div class="pedidos">${abiertos.map(tarjetaPedido)}</div>` : html`<p>No tienes pedidos en proceso.</p>`}
    ${cerrados.length ? html`<h3 style="margin-top:32px">Entregados y pagados</h3><div class="tabla-caja"><table class="tabla"><thead><tr><th>Pedido</th><th>Fecha</th><th class="n">Piezas</th><th class="n">Regresaste</th><th class="n">Total</th><th class="n">Ganaste ≈</th><th>Pago</th></tr></thead><tbody>
      ${cerrados.map((p) => html`<tr><th>#${p.id}</th><td>${fecha(p.entregado_fecha)}</td><td class="n">${num(p.piezas)}</td><td class="n">${num(p.vacios)}</td><td class="n">${dinero(p.total)}</td><td class="n">${dinero(ganaDePedido(p))}</td><td>${p.pago_metodo || 'Al entregar'} · ${fecha(p.cobrado_fecha)}</td></tr>`)}</tbody></table></div>` : ''}
  </div></section>`;
}

function tarjetaPedido(p) {
  const pasos = D.estados.slice(0, 8), i = Math.min(pasos.indexOf(p.estado), 7), ruta = D.rutas.find((r) => r.id === p.ruta_id);
  const historia = D.bitacora.filter((b) => b.pedido_id === p.id).map((b) => ({ t: b.texto.includes('→') ? b.texto.split('→')[1].trim() : b.texto, f: b.fecha }));
  const donde = p.estado === 'Recibido' ? 'Recibido: lo confirmamos en cuanto lo veamos.' : p.estado === 'Confirmado' ? 'Confirmado: entra a producción.' : ['En producción', 'Curando', 'Control de calidad'].includes(p.estado) ? `En la planta: ${p.estado.toLowerCase()}.` : p.estado === 'Listo' ? 'Listo y empacado: esperando ruta.' : p.estado === 'En ruta' ? `En camino${ruta ? ` con ${ruta.repartidor || 'el repartidor'}` : ''}.` : p.estado === 'Entregado' ? 'Entregado.' : p.estado;
  const pagado = p.cobro === 'Cobrado';
  return html`<article class="pedido" id="pedido-${p.id}">
    <header><b>Pedido #${p.id}</b><span class="tenue">${fecha(p.creado)} · ${num(p.piezas)} piezas · ${p.rejas} reja(s)</span></header>
    <div class="chips"><span class="chip negro">${p.estado}</span>${p.anticipado ? html`<span class="chip">Anticipado</span>` : ''}${pagado ? html`<span class="chip">Pagado</span>` : p.pago_aviso ? html`<span class="chip">Transferencia por confirmar</span>` : ''}</div>
    <ol class="pasos" aria-label="Avance">${pasos.map((e, n) => html`<li class="${n < i ? 'hecho' : n === i ? 'aqui' : ''}" title="${e}"></li>`)}</ol>
    <p class="donde">${donde}</p>
    <p class="detalle">${p.lineas.map((l) => `${l.cajas} × ${prod(l.clave)?.nombre.split(' (')[0] || l.clave}`).join(' · ')}${p.promos.length ? ' · ' + p.promos.map((x) => `${x.cantidad} ${D.promos.find((y) => y.clave === x.clave)?.nombre || x.clave}`).join(', ') : ''}${p.vacios ? ` · regresas ${p.vacios} vacíos` : ''}</p>
    <p class="detalle">${p.entregado_fecha ? `Entregado el ${fecha(p.entregado_fecha)}` : `Entrega: ${fecha(p.fecha_prometida)}`}${ruta && !p.entregado_fecha ? ` · sale el ${fecha(ruta.fecha)}` : ''} · total ${dinero(p.total, 2)} · ganas ≈ ${dinero(ganaDePedido(p))}</p>
    ${historia.length ? html`<ul class="historia">${historia.map((h) => html`<li>${fecha(h.f)} · ${h.t}</li>`)}</ul>` : ''}
    <div class="pago">${pagado ? html`<p><b>Pagado</b> · ${p.pago_metodo || 'al entregar'} · ${fecha(p.cobrado_fecha)}</p>`
      : html`<p><b>Pago: ${dinero(p.total, 2)}</b>${p.pago_aviso ? html` · avisaste tu transferencia (${p.pago_aviso}) el ${fecha(p.pago_aviso_fecha)}; la confirmamos en cuanto la veamos en el banco.` : ' · paga ahora y el pedido se confirma de inmediato, o paga al recibirlo.'}</p>
        <div class="botones">${D.pagos.tarjeta ? html`<button class="boton lleno" type="button" data-a="tarjeta" data-id="${p.id}">Pagar con tarjeta</button>` : ''}<button class="boton" type="button" data-a="banco" data-id="${p.id}">${p.pago_aviso ? 'Ver datos de transferencia' : 'Pagar por transferencia'}</button></div>
        <div class="banco" id="banco-${p.id}" hidden>${D.ajustes.banco_clabe ? html`<p>Transfiere ${dinero(p.total, 2)} a:</p><p><b>${D.ajustes.banco_clabe}</b><br>${D.ajustes.banco_nombre}${D.ajustes.banco_beneficiario ? ' · ' + D.ajustes.banco_beneficiario : ''}<br>Concepto: La Vela pedido ${p.id}</p>` : html`<p>Pide los datos bancarios por WhatsApp; en cuanto estén aquí aparecen solos.</p>`}
          <div class="transferir"><input type="text" maxlength="80" placeholder="Referencia o folio de tu transferencia" id="ref-${p.id}"><button class="boton" type="button" data-a="transferi" data-id="${p.id}">Ya transferí</button></div></div>`}</div>
  </article>`;
}

function seccionGano() {
  const tiendas = D.yo.tiendas || 50, pts = D.ajustes.piezas_tienda_semana;
  const mezcla = D.pedidos.length ? D.productos.map((p) => [p, D.pedidos.reduce((s, x) => s + (x.lineas.find((l) => l.clave === p.clave)?.cajas || 0) * p.piezas_caja, 0)]) : D.productos.map((p) => [p, p.clave === 'semanal' ? 1 : 0]);
  const totalMezcla = mezcla.reduce((s, [, n]) => s + n, 0) || 1, pond = mezcla.reduce((s, [p, n]) => s + (n / totalMezcla) * gananciaPieza(p), 0);
  const desde = D.pedidos.filter((p) => p.entregado_fecha).reduce((s, p) => s + ganaDePedido(p), 0);
  return html`<section class="seccion" id="gano"><div class="caja">
    <p class="etiqueta">Lo que gano</p><h2>Tus números</h2>
    <div class="tabla-caja"><table class="tabla"><thead><tr><th>Producto</th><th class="n">Tú pagas</th><th class="n">Precio al público</th><th class="n">La tienda gana (${D.ajustes.margen_tienda}%)</th><th class="n">Tú ganas por pieza</th><th class="n">Por caja</th></tr></thead><tbody>
      ${D.productos.map((p) => html`<tr><th>${p.nombre.split(' (')[0]}</th><td class="n">${dinero(p.precio_dist, 2)}</td><td class="n">${dinero(p.precio_publico, 2)}</td><td class="n">${dinero(p.precio_publico * D.ajustes.margen_tienda / 100, 2)}</td><td class="n"><b>${dinero(gananciaPieza(p), 2)}</b></td><td class="n">${dinero(gananciaPieza(p) * p.piezas_caja, 2)}</td></tr>`)}</tbody></table></div>
    <p class="tenue">Precios con IVA. Tu ganancia es lo que te deja cada pieza después de lo que gana la tienda; el flete lo pones tú, en las rutas que ya recorres.</p>
    <h3>Estimación mensual</h3>
    <div class="cifras">
      <div><b>${dinero(tiendas * pts * 4.33 * pond)}</b><span>al mes con ${num(tiendas)} tiendas que vendan ${pts} piezas por semana</span></div>
      <div><b>${dinero(pts * 4.33 * pond)}</b><span>al mes por cada tienda</span></div>
      <div><b>${dinero(pond, 2)}</b><span>por pieza, con la mezcla de lo que pides</span></div>
      <div><b>${dinero(desde)}</b><span>ganado con todo lo que te hemos entregado</span></div></div>
    <p class="tenue">Las ${num(tiendas)} tiendas son las que tienes anotadas con nosotros${D.yo.tiendas ? '' : ' (si no hay dato, 50)'}. Una tienda del plan vende 8 piezas por semana; el piloto de 4 semanas te dice las tuyas.</p>
  </div></section>`;
}

function seccionPromos() {
  return html`<section class="seccion gris" id="promocion"><div class="caja">
    <p class="etiqueta">Promoción</p><h2>Material para tus tiendas</h2>
    <p>Lo que hace que la tienda venda y que el cliente regrese por el cartucho. Lo gratis va en tu siguiente pedido; las hojas se descargan.</p>
    <div class="promos">${D.promos.map((x) => html`<article class="promo"><h3>${x.nombre}</h3><p>${x.descripcion}</p><small>${x.condicion}${x.precio ? ` · ${dinero(x.precio)}` : ''}</small>
      ${x.liga ? html`<a class="boton" href="${x.liga}" target="_blank" rel="noopener">Descargar</a>` : html`<button class="boton" type="button" data-a="promo" data-id="${x.clave}">Agregar al pedido</button>`}</article>`)}</div>
  </div></section>`;
}

// ───────── Acciones ─────────
async function hacerPedido(lineas, extra = {}) {
  const b = $('#enviar'), err = $('#error');
  if (b) b.disabled = true; if (err) err.hidden = true;
  try {
    const r = await api('pedir', { lineas: Object.entries(lineas).map(([clave, cajas]) => ({ clave, cajas })), vacios: F.vacios, promos: Object.entries(F.promos).map(([clave, cantidad]) => ({ clave, cantidad })), fecha_prometida: F.fecha, notas: ($('#notas') || {}).value || '', ...extra });
    F = { lineas: {}, promos: {}, vacios: 0, fecha: '', temporada: '' };
    await cargar();
    aviso(`Pedido #${r.id} recibido${r.anticipado ? ' (anticipado)' : ''}. Llega el ${fecha(r.fecha)}.`);
    location.hash = '#pedido-' + r.id;
  } catch (e) { if (err) { err.textContent = e.message; err.hidden = false; } aviso(e.message, true); if (b) b.disabled = false; }
}
document.addEventListener('click', async (ev) => {
  const m = ev.target.closest('button[data-m]');
  if (m) {
    const clave = m.dataset.l || m.dataset.pm, inp = document.querySelector(`input[data-${m.dataset.l ? 'l' : 'pm'}="${clave}"]`);
    const v = Math.max(0, (Number(inp.value) || 0) + Number(m.dataset.m)); inp.value = v;
    if (m.dataset.pm) { F.promos[clave] = v; const cb = document.querySelector(`input[type=checkbox][data-p="${clave}"]`); if (cb) cb.checked = v > 0; } else if (clave === 'vacios') F.vacios = v; else F.lineas[clave] = v;
    return pintarCuenta();
  }
  const t = ev.target.closest('button[data-t]');
  if (t) { F.temporada = F.temporada === t.dataset.t ? '' : t.dataset.t; F.fecha = F.temporada ? masDias(F.temporada, -7) : masDias(D.hoy, D.ajustes.dias_entrega); $('#fecha').value = F.fecha; document.querySelectorAll('button[data-t]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.t === F.temporada))); return pintarCuenta(); }
  const a = ev.target.closest('[data-a]');
  if (!a) return;
  const id = Number(a.dataset.id), x = a.dataset.a;
  if (x === 'repetir') { const u = D.pedidos[0]; if (!u) return; F.promos = {}; F.vacios = 0; F.fecha = masDias(D.hoy, D.ajustes.dias_entrega); a.disabled = true; await hacerPedido(lineasDe(u)); }
  else if (x === 'pedir') await hacerPedido(F.lineas);
  else if (x === 'tarima') {
    // La tarima se llena con la mezcla del último pedido o, si no hay, con Semanal
    const cajas = D.ajustes.rejas_tarima * 2, u = D.pedidos[0], base = u && u.cajas ? lineasDe(u) : { semanal: 1 }, tot = Object.values(base).reduce((s, n) => s + n, 0) || 1;
    F.lineas = {}; let puestas = 0; const claves = Object.keys(base).filter((k) => base[k] > 0);
    claves.forEach((k, i) => { const n = i === claves.length - 1 ? cajas - puestas : Math.round((base[k] / tot) * cajas / 2) * 2; F.lineas[k] = n; puestas += n; });
    document.querySelectorAll('input[data-l]').forEach((inp) => { if (inp.dataset.l !== 'vacios') inp.value = F.lineas[inp.dataset.l] || 0; });
    pintarCuenta(); $('#cuenta').scrollIntoView({ block: 'center' });
  }
  else if (x === 'limpiar') { F.lineas = {}; F.promos = {}; F.vacios = 0; document.querySelectorAll('#forma input, .casillas input[type=number]').forEach((inp) => { inp.value = 0; }); document.querySelectorAll('.casillas input[type=checkbox]').forEach((c) => { c.checked = false; }); pintarCuenta(); }
  else if (x === 'promo') { F.promos[a.dataset.id] = (F.promos[a.dataset.id] || 0) + 1; const inp = document.querySelector(`input[data-pm="${a.dataset.id}"]`); if (inp) inp.value = F.promos[a.dataset.id]; const cb = document.querySelector(`input[type=checkbox][data-p="${a.dataset.id}"]`); if (cb) cb.checked = true; pintarCuenta(); aviso('Agregado al pedido'); location.hash = '#pedir'; }
  else if (x === 'tarjeta') { a.disabled = true; try { const r = await api('pagar', { pedido_id: id }); location.href = r.url; } catch (e) { aviso(e.message, true); a.disabled = false; } }
  else if (x === 'banco') { const b = $('#banco-' + id); b.hidden = !b.hidden; }
  else if (x === 'transferi') { a.disabled = true; try { await api('transferencia', { pedido_id: id, referencia: $('#ref-' + id).value }); await cargar(); aviso('Gracias. La confirmamos en cuanto la veamos.'); } catch (e) { aviso(e.message, true); a.disabled = false; } }
});
document.addEventListener('change', (ev) => {
  const el = ev.target;
  if (el.matches('input[data-l]')) { const v = Math.max(0, Math.floor(Number(el.value) || 0)); el.value = v; if (el.dataset.l === 'vacios') F.vacios = v; else F.lineas[el.dataset.l] = v; pintarCuenta(); }
  else if (el.matches('input[data-pm]')) { const v = Math.max(0, Math.floor(Number(el.value) || 0)); el.value = v; F.promos[el.dataset.pm] = v; const cb = document.querySelector(`input[type=checkbox][data-p="${el.dataset.pm}"]`); if (cb) cb.checked = v > 0; pintarCuenta(); }
  else if (el.matches('input[type=checkbox][data-p]')) { F.promos[el.dataset.p] = el.checked ? Math.max(1, F.promos[el.dataset.p] || 0) : 0; const inp = document.querySelector(`input[data-pm="${el.dataset.p}"]`); if (inp) inp.value = F.promos[el.dataset.p]; pintarCuenta(); }
  else if (el.id === 'fecha') { F.fecha = el.value || masDias(D.hoy, D.ajustes.dias_entrega); F.temporada = ''; document.querySelectorAll('button[data-t]').forEach((x) => x.setAttribute('aria-pressed', 'false')); pintarCuenta(); }
});

// ───────── Arranque ─────────
async function cargar() { D = await api('todo'); pintar(); }
(async () => {
  const q = new URLSearchParams(location.search);
  try { await cargar(); } catch (e) { pintarEntrada(''); const alCargar = () => { if (!window.LoginCT) return setTimeout(alCargar, 150); LoginCT.al((u) => { if (u) conPase(); }); if (LoginCT.quien()) conPase(); }; alCargar(); return; }
  if (q.get('pagado')) {
    try { const r = await api('confirmar', { sid: q.get('pagado') }); await cargar(); aviso(r.ya ? 'Ese pago ya estaba registrado.' : `Pago recibido. El pedido #${r.id} ya está confirmado.`); location.hash = '#pedido-' + r.id; }
    catch (e) { aviso(e.message, true); }
    history.replaceState(null, '', '/distribuidor/');
  } else if (q.get('pedido')) { location.hash = '#pedido-' + q.get('pedido'); history.replaceState(null, '', '/distribuidor/' + location.hash); }
  setInterval(async () => { if (document.hidden || /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName || '')) return; try { const antes = JSON.stringify(D.pedidos.map((p) => [p.id, p.estado, p.cobro])); const d = await api('todo'); if (JSON.stringify(d.pedidos.map((p) => [p.id, p.estado, p.cobro])) !== antes) { D = d; pintar(); } } catch { /* la próxima */ } }, 60000);
})();
void _RLR; void _k; void _rev;
