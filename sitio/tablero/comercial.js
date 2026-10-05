/* RLR · La Vela — pantallas Hoy, Distribuidores y Pedidos — Ricardo López Reyero */
import { S, aj, api, aviso, bitacoraDe, borrar, campo, cargar, columnas, crear, diasA, dinero, etiqueta, fecha, guardar, hace, html, hoyISO, interruptor, num, wa } from './nucleo.js';
import { FASES, abiertos, cartuchos, credito, dist, empaque, lunes, medir, mensajes, paso, pendientes, plazo, porCobrar, producto, saldoDe, tarimasTexto, temporadas, totalDe, zonaTomada } from './cuentas.js';

const _RLR = 'Ricardo López Reyero', _k = 'EYE', _rev = 181218; // RLR

// ───────── Hoy ─────────
function avanceFase(n) {
  if (n === 1) {
    const mias = S.pruebas.filter((p) => p.receta_id === aj('receta_activa', 1)).map(medir).filter((m) => m.listo);
    const pasan = mias.filter((m) => !m.falla && m.proy >= 160).length;
    return `${pasan} de 3 velas pasan de 160 horas (${mias.length} con mediciones).`;
  }
  if (n === 2) return `${S.distribuidores.filter((d) => ['Piloto', 'Activo'].includes(d.estado)).reduce((s, d) => s + (d.tiendas || 0), 0)} tiendas con distribuidores en piloto o activos.`;
  const ent = S.pedidos.filter((p) => p.entregado_fecha);
  if (n === 3) {
    const total = ent.reduce((s, p) => s + p.piezas, 0), cart = ent.reduce((s, p) => s + p.piezas - p.piezas_vaso, 0);
    return total ? `${Math.round((cart / total) * 100)}% de las piezas entregadas son cartuchos.` : 'Todavía no hay piezas entregadas.';
  }
  const mes = hoyISO().slice(0, 7);
  return `${num(ent.filter((p) => p.entregado_fecha.startsWith(mes)).reduce((s, p) => s + p.piezas, 0))} piezas entregadas este mes.`;
}

export const hoy = {
  id: 'hoy', titulo: 'Hoy', grupo: '',
  pintar() {
    const ps = pendientes(), f = FASES.find((x) => x.n === aj('fase_actual', 1)) || FASES[0], ts = temporadas().slice(0, 4);
    const semana = S.pedidos.filter((p) => p.creado.slice(0, 10) >= lunes()), piezasSem = semana.reduce((s, p) => s + p.piezas, 0), c = cartuchos();
    const nuevos = S.distribuidores.filter((d) => d.estado === 'Nuevo').length, activos = S.distribuidores.filter((d) => ['Piloto', 'Activo'].includes(d.estado)).length;
    return html`<div class="rejilla">
      <section class="bloque doble"><h2>Pendiente ahora<span class="cuenta">${ps.length}</span></h2>
        <ul class="pendientes">${ps.map((p) => html`<li class="u${p.urg}"><a href="${p.liga}"><b>${p.titulo}</b><span>${p.detalle}</span></a>${p.wa ? html`<a class="boton chico" href="${p.wa}" target="_blank" rel="noopener">WhatsApp</a>` : ''}</li>`)}
        ${ps.length ? '' : html`<li class="vacio">Nada pendiente. Buen momento para prender una vela de prueba.</li>`}</ul></section>
      <section class="bloque"><h2>Enfoque</h2>
        <p class="cifra">Fase ${f.n} · ${f.nombre}</p><p><b>${f.metrica}.</b> Se pasa cuando: ${f.pasa.charAt(0).toLowerCase() + f.pasa.slice(1)}</p>
        <p class="tenue">${avanceFase(f.n)}</p><p class="tenue">Lo que no mueva esta métrica va a «Después».</p></section>
      <section class="bloque"><h2>Lo que viene</h2>
        <ul class="lista">${ts.map((t) => html`<li><b>${t.nombre}</b><span>${t.dias === 0 ? 'hoy' : `en ${t.dias} días`} · ${fecha(t.fecha)}</span></li>`)}</ul>
        <p class="tenue">Para Día de Muertos y Guadalupe hay que producir desde junio.</p></section>
      <section class="bloque doble"><h2>De un vistazo</h2><div class="cifras">
        <a href="#/distribuidores"><b>${nuevos}</b><span>solicitudes nuevas</span></a>
        <a href="#/distribuidores"><b>${activos}</b><span>distribuidores en piloto o activos</span></a>
        <a href="#/pedidos"><b>${abiertos().length}</b><span>pedidos abiertos</span></a>
        <a href="#/indicadores"><b>${num(piezasSem)}</b><span>piezas pedidas esta semana${aj('meta_semanal') ? ` de ${num(aj('meta_semanal'))}` : ''}</span></a>
        <a href="#/indicadores"><b>${dinero(porCobrar().reduce((s, p) => s + p.total, 0))}</b><span>por cobrar</span></a>
        <a href="#/cartuchos"><b>${c.tasa == null ? '—' : Math.round(c.tasa * 100) + '%'}</b><span>de los cartuchos regresa</span></a>
      </div><p class="tenue">Todo el negocio en una pantalla: <a href="#/datos">Datos</a>.</p></section>
    </div>`;
  },
};

// ───────── Distribuidores ─────────
const tarjetaDist = (d) => {
  const pl = plazo(d), venc = d.proxima_fecha && diasA(d.proxima_fecha) < 0 && !['Descartado', 'En pausa'].includes(d.estado);
  return html`<article class="tarjeta ${(pl && pl.vencido) || venc ? 'roja' : ''}" draggable="true" data-arr="${d.id}" data-a="ir" data-ruta="distribuidores/${d.id}" tabindex="0">
    <header>${etiqueta(d.tipo, 'tipo t' + d.tipo)}<b>${d.empresa}</b></header>
    <p>${d.nombre}${d.zonas ? ' · ' + d.zonas : ''}</p>
    ${d.puntos ? html`<p class="tenue">${d.puntos} puntos · ${d.visita.toLowerCase()}</p>` : ''}
    ${pl ? html`<p class="plazo">${pl.texto}</p>` : ''}
    ${d.proxima_accion ? html`<p class="sigue">→ ${d.proxima_accion}${d.proxima_fecha ? ' · ' + fecha(d.proxima_fecha) : ''}</p>` : ''}
  </article>`;
};

function filtrados() {
  const t = S.ui.filtro.tipo || '', b = (S.ui.buscar || '').toLowerCase();
  return S.distribuidores.filter((d) => (!t || d.tipo === t) && (!b || `${d.empresa} ${d.nombre} ${d.zonas} ${d.zona} ${d.responsable}`.toLowerCase().includes(b)));
}

function panelDist(sub) {
  if (sub === 'nuevo') return html`<header><h2>Agregar distribuidor</h2><button class="cerrar" data-a="cerrar" aria-label="Cerrar">✕</button></header>
    <form data-f="dist-nuevo" class="forma">
      <label class="campo"><span>Empresa</span><input name="empresa" required maxlength="160"></label>
      <label class="campo"><span>Nombre</span><input name="nombre" maxlength="120"></label>
      <label class="campo"><span>WhatsApp</span><input name="whatsapp" type="tel" maxlength="30"></label>
      <label class="campo"><span>Ciudades o estados</span><input name="zonas" maxlength="400"></label>
      <label class="campo"><span>Tipo</span><select name="tipo"><option value="A">A · Grande</option><option value="B" selected>B · Mediano</option><option value="C">C · Chico</option></select></label>
      <button class="boton lleno">Agregar</button></form>`;
  const d = dist(Number(sub));
  if (!d) return null;
  const pl = plazo(d), tomada = zonaTomada(d), peds = S.pedidos.filter((p) => p.distribuidor_id === d.id), saldo = saldoDe(d.id);
  const respuestas = [['Puntos de venta que surte', d.puntos], ['Tipo de puntos', d.tipos], ['Visita cada tienda', d.visita], ['Veladoras al mes', d.veladoras], ['Vehículos de reparto', d.vehiculos], ['Primer pedido', d.pedido]].filter((r) => r[1]);
  return html`<header><div>${etiqueta('Tipo ' + d.tipo, 'tipo t' + d.tipo)} ${d.origen === 'manual' ? etiqueta('Agregado a mano') : etiqueta(`Solicitud · ${d.puntaje} puntos`)}<h2>${d.empresa}</h2><p class="tenue">Llegó ${hace(d.creada)}</p></div><button class="cerrar" data-a="cerrar" aria-label="Cerrar">✕</button></header>
    ${pl ? html`<p class="alerta ${pl.vencido ? 'roja' : ''}">${pl.texto}</p>` : ''}
    ${tomada ? html`<p class="alerta">Esa zona ya tiene exclusividad: <b>${tomada.empresa}</b>. Va a lista de espera.</p>` : ''}
    <div class="botones">${mensajes(d).map(([t, m]) => html`<a class="boton ${t === 'Primer contacto' ? 'lleno' : ''}" href="${wa(d.whatsapp, m)}" target="_blank" rel="noopener">WhatsApp · ${t}</a>`)}</div>
    <div class="forma">
      ${campo('distribuidores', d.id, 'estado', d.estado, { rotulo: 'Etapa', opciones: S.estados.distribuidores })}
      ${campo('distribuidores', d.id, 'responsable', d.responsable, { rotulo: 'Responsable', opciones: [['', 'Sin asignar'], ...S.usuarios.map((u) => [u.correo, u.nombre || u.correo])] })}
      ${campo('distribuidores', d.id, 'proxima_accion', d.proxima_accion, { rotulo: 'Próxima acción', marcador: 'Llamarle, mandar propuesta, visitar su bodega…', ancho: 'doble' })}
      ${campo('distribuidores', d.id, 'proxima_fecha', d.proxima_fecha, { rotulo: 'Para cuándo', tipo: 'date' })}
      ${campo('distribuidores', d.id, 'tipo', d.tipo, { rotulo: 'Tipo', opciones: [['A', 'A · Grande'], ['B', 'B · Mediano'], ['C', 'C · Chico']] })}
      ${campo('distribuidores', d.id, 'canal', d.canal || 'tienditas', { rotulo: 'Canal', opciones: S.estados.canales.map((c) => [c, S.mercados.find((m) => m.tipo === 'Canal' && m.clave === c)?.nombre || c]) })}
      ${campo('distribuidores', d.id, 'zona', d.zona, { rotulo: 'Zona asignada', marcador: 'Torreón y Gómez Palacio' })}
      ${campo('distribuidores', d.id, 'centro_id', d.centro_id || '', { rotulo: 'Lo surte', opciones: [['', '—'], ...S.centros.map((c) => [c.id, c.nombre])] })}
      ${campo('distribuidores', d.id, 'ciudad', d.ciudad, { rotulo: 'Ciudad de entrega', marcador: 'Para armar las rutas' })}
      ${campo('distribuidores', d.id, 'direccion', d.direccion, { rotulo: 'Dirección de su bodega', marcador: 'Calle, número, colonia' })}
      ${campo('distribuidores', d.id, 'tiendas', d.tiendas || '', { rotulo: 'Tiendas activas con La Vela', tipo: 'number', paso: '1' })}
      ${campo('distribuidores', d.id, 'exclusividad', d.exclusividad, { rotulo: 'Tiene la exclusividad de su zona', tipo: 'checkbox', ancho: 'doble' })}
      ${campo('distribuidores', d.id, 'notas', d.notas, { rotulo: 'Notas', tipo: 'area', ancho: 'doble', marcador: 'Qué margen gana hoy, quién le fabrica, de qué se quejan sus tiendas…' })}
    </div>
    <h4>Contacto</h4>
    <div class="forma">
      ${campo('distribuidores', d.id, 'nombre', d.nombre, { rotulo: 'Nombre' })}
      ${campo('distribuidores', d.id, 'whatsapp', d.whatsapp, { rotulo: 'WhatsApp', tipo: 'tel' })}
      ${campo('distribuidores', d.id, 'empresa', d.empresa, { rotulo: 'Empresa' })}
      ${campo('distribuidores', d.id, 'zonas', d.zonas, { rotulo: 'Dónde distribuye' })}
    </div>
    ${respuestas.length ? html`<h4>Lo que contestó</h4><dl class="datos">${respuestas.map(([k, v]) => html`<dt>${k}</dt><dd>${v}</dd>`)}</dl>` : ''}
    <h4>Pedidos</h4>
    <div class="forma">
      ${campo('distribuidores', d.id, 'credito', d.credito || '', { rotulo: 'Crédito autorizado ($)', tipo: 'number', paso: '100' })}
      <div class="campo"><span>Saldo por cobrar</span><p class="cifra chica">${dinero(saldo)}</p></div>
    </div>
    <div class="forma">${campo('distribuidores', d.id, 'correo', d.correo, { rotulo: 'Su cuenta de Google (entra a su panel con ella)', tipo: 'email', ancho: 'doble', marcador: 'correo@gmail.com' })}</div>
    <p class="tenue">${d.correo ? html`Con ese correo entra en <b>${location.origin}/distribuidor/</b>: pide en un clic, ve cómo va cada pedido, paga con tarjeta o transferencia y pide material de promoción.` : 'Sin correo no puede entrar a su panel; mientras, usa su liga privada.'}</p>
    ${d.liga ? html`<p class="liga"><input readonly value="${location.origin}/pedir?d=${d.liga}" aria-label="Liga de pedidos"><button class="boton chico" data-a="copiar-liga" data-id="${d.id}">Copiar</button></p>` : ''}
    <div class="botones"><button class="boton" data-a="ir" data-ruta="pedidos/nuevo-${d.id}">+ Pedido</button>
      <button class="boton" data-a="liga" data-id="${d.id}">${d.liga ? 'Renovar su liga de pedidos' : 'Crear su liga de pedidos'}</button></div>
    ${peds.length ? html`<ul class="lista">${peds.map((p) => html`<li><a href="#/pedidos/${p.id}"><b>#${p.id} · ${p.estado}</b></a><span>${num(p.piezas)} piezas · ${dinero(p.total)} · ${fecha(p.creado)}</span></li>`)}</ul>` : html`<p class="tenue">Sin pedidos todavía.</p>`}
    ${bitacoraDe('distribuidores', d.id)}
    <p class="fin"><button class="enlace" data-a="borrar-dist" data-id="${d.id}">Borrar este distribuidor</button></p>`;
}

export const distribuidores = {
  id: 'distribuidores', titulo: 'Distribuidores', grupo: 'Comercial',
  cuenta: () => S.distribuidores.filter((d) => d.estado === 'Nuevo').length,
  botones: () => html`<input class="buscar" type="search" placeholder="Buscar" data-buscar value="${S.ui.buscar || ''}">
    <div class="alterna">${[['', 'Todos'], ['A', 'A'], ['B', 'B'], ['C', 'C']].map(([v, t]) => html`<button type="button" data-a="filtro-tipo" data-v="${v}" aria-pressed="${String((S.ui.filtro.tipo || '') === v)}">${t}</button>`)}</div>
    ${interruptor('distribuidores', S.ui.vista.distribuidores)}<button class="boton lleno" data-a="ir" data-ruta="distribuidores/nuevo">+ Distribuidor</button>`,
  pintar() {
    const xs = filtrados();
    if (!S.distribuidores.length) return html`<p class="vacio">Todavía no llega ninguna solicitud. Cuando alguien llene el formulario de «Quiero distribuir», aparece aquí ya calificada y te llega un correo.</p>`;
    if (S.ui.vista.distribuidores === 'tabla') return html`<div class="tabla-caja"><table class="tabla"><thead><tr><th>Empresa</th><th>Tipo</th><th>Etapa</th><th>Dónde</th><th>Puntos</th><th>Próxima acción</th><th>Para</th><th>Responsable</th><th>Llegó</th></tr></thead><tbody>
      ${xs.map((d) => html`<tr data-a="ir" data-ruta="distribuidores/${d.id}"><th>${d.empresa}<small>${d.nombre}</small></th><td>${etiqueta(d.tipo, 'tipo t' + d.tipo)}</td><td>${d.estado}</td><td>${d.zonas}</td><td>${d.puntos}</td><td>${d.proxima_accion}</td><td>${fecha(d.proxima_fecha)}</td><td>${(d.responsable || '').split('@')[0]}</td><td>${fecha(d.creada)}</td></tr>`)}</tbody></table></div>`;
    return columnas({ rec: 'distribuidores', cols: S.estados.distribuidores, items: xs, tarjeta: tarjetaDist });
  },
  panel: panelDist,
  acciones: {
    'filtro-tipo': (el) => { S.ui.filtro.tipo = el.dataset.v; },
    async liga(el) {
      const d = dist(Number(el.dataset.id));
      if (d.liga && !confirm('La liga anterior dejará de servir. ¿Crear una nueva?')) return;
      try { await api('POST', `distribuidores/${d.id}/liga`, { nueva: !!d.liga }); await cargar(); aviso('Liga lista'); } catch (e) { aviso(e.message, true); }
    },
    async 'copiar-liga'(el) {
      const d = dist(Number(el.dataset.id));
      try { await navigator.clipboard.writeText(`${location.origin}/pedir?d=${d.liga}`); aviso('Liga copiada'); } catch { aviso('Cópiala a mano', true); }
    },
    async 'borrar-dist'(el) { if (await borrar('distribuidores', el.dataset.id, '¿Borrar este distribuidor y su bitácora? No se puede deshacer.')) location.hash = '#/distribuidores'; },
  },
  formularios: {
    async 'dist-nuevo'(f, d) { const r = await crear('distribuidores', d); if (r) location.hash = `#/distribuidores/${r.fila.id}`; },
  },
};

// ───────── Pedidos ─────────
const resumenLineas = (p) => p.lineas.map((l) => `${l.cajas} × ${producto(l.clave)?.nombre.split(' (')[0] || l.clave}`).join(' · ');
const tarjetaPedido = (p) => {
  const tarde = paso(p.estado) < paso('Entregado') && p.fecha_prometida && diasA(p.fecha_prometida) < 0;
  return html`<article class="tarjeta ${tarde ? 'roja' : ''}" draggable="true" data-arr="${p.id}" data-a="ir" data-ruta="pedidos/${p.id}" tabindex="0">
    <header><b>#${p.id} · ${dist(p.distribuidor_id)?.empresa || 'Sin distribuidor'}</b></header>
    <p>${resumenLineas(p)}</p><p class="tenue">${num(p.piezas)} piezas · ${p.rejas} rejas · ${dinero(p.total)}${p.vacios ? ` · regresa ${num(p.vacios)}` : ''}</p>
    ${p.fecha_prometida ? html`<p class="${tarde ? 'plazo' : 'sigue'}">${tarde ? 'Atrasado: era para el' : 'Para el'} ${fecha(p.fecha_prometida)}</p>` : ''}
    ${p.entregado_fecha && p.cobro !== 'Cobrado' ? html`<p class="plazo">Por cobrar · ${-diasA(p.entregado_fecha)} días</p>` : ''}
    ${p.anticipado ? html`<p class="sigue">Anticipado</p>` : ''}${p.pago_aviso && p.cobro !== 'Cobrado' ? html`<p class="plazo">Transferencia por confirmar</p>` : p.cobro === 'Cobrado' && !p.entregado_fecha ? html`<p class="sigue">Pagado por adelantado</p>` : ''}
  </article>`;
};

function desglose(t, lineas = [], d = null) {
  const e = empaque(lineas), cr = d ? credito(d, t.total) : null;
  const sugerencia = !e.rejas ? '' : e.faltan.length ? `Para no mandar rejas a medias: ${e.faltan.map((f) => `${f.cajas} caja(s) más de ${f.nombre}`).join(' y ')}.`
    : e.paraTarima ? `Rejas completas. Faltan ${e.paraTarima} rejas para llenar la tarima.` : 'Tarima(s) completa(s).';
  return html`<dl class="datos cuenta-pedido"><dt>${num(t.piezas)} piezas en ${num(t.cajas)} cajas</dt><dd>${dinero(t.subtotal, 2)}</dd>
    <dt>Depósito de cartuchos (${num(t.piezas)} × ${dinero(t.deposito)})</dt><dd>${dinero(t.cargo, 2)}</dd>
    <dt>Cartuchos vacíos que entrega</dt><dd>${dinero(-t.abono, 2)}</dd><dt><b>Total, con IVA</b></dt><dd><b>${dinero(t.total, 2)}</b></dd>
    ${e.rejas ? html`<dt>Empaque</dt><dd>${e.rejas} reja(s) · ${tarimasTexto(e.tarimas)} · ${num(e.kg)} kg</dd>` : ''}</dl>
    ${sugerencia ? html`<p class="tenue">${sugerencia}</p>` : ''}
    ${cr && cr.excede ? html`<p class="alerta">Con este pedido debe ${dinero(cr.saldo)} y su crédito es de ${dinero(cr.credito)}. Confirmar solo con pago por adelantado o subir el crédito en su ficha.</p>` : ''}`;
}

function panelPedido(sub) {
  if (sub.startsWith('nuevo')) {
    const pre = Number(sub.split('-')[1]) || 0, entrega = hoyISO(aj('dias_entrega', 5));
    const quienes = S.distribuidores.filter((d) => !['Descartado'].includes(d.estado));
    return html`<header><h2>Pedido nuevo</h2><button class="cerrar" data-a="cerrar" aria-label="Cerrar">✕</button></header>
      <form data-f="pedido-nuevo" class="forma" data-vivo="pedido">
        <label class="campo doble"><span>Distribuidor</span><select name="distribuidor_id" required><option value="">Elige…</option>${quienes.map((d) => html`<option value="${d.id}" ${d.id === pre ? html`selected` : ''}>${d.empresa} · ${d.estado}</option>`)}</select></label>
        ${S.productos.filter((p) => p.activo).map((p) => html`<label class="campo"><span>${p.nombre}<small>caja de ${p.piezas_caja} · ${dinero(p.precio_dist * p.piezas_caja, 2)}</small></span><input name="cajas:${p.clave}" type="number" min="0" step="1" inputmode="numeric" placeholder="0 cajas"></label>`)}
        <label class="campo"><span>Cartuchos vacíos que entrega</span><input name="vacios" type="number" min="0" step="1" inputmode="numeric" placeholder="0"></label>
        <label class="campo"><span>Entrega prometida</span><input name="fecha_prometida" type="date" value="${entrega}"></label>
        <label class="campo doble"><span>Notas</span><textarea name="notas" rows="2"></textarea></label>
        <div class="doble" id="vivo-pedido">${desglose(totalDe([], 0))}</div>
        <button class="boton lleno">Crear pedido</button></form>`;
  }
  const p = S.pedidos.find((x) => x.id === Number(sub));
  if (!p) return null;
  const d = dist(p.distribuidor_id), i = paso(p.estado), sig = S.estados.pedidos[i + 1], ant = S.estados.pedidos[i - 1];
  const t = totalDe(p.lineas, p.vacios);
  return html`<header><div>${etiqueta(p.estado)} ${p.origen === 'liga' ? etiqueta('Lo pidió desde su liga') : p.origen === 'panel' ? etiqueta('Lo pidió desde su panel') : ''} ${p.anticipado ? etiqueta('Anticipado', 'negra') : ''} ${p.cobro === 'Cobrado' ? etiqueta(`Pagado · ${p.pago_metodo || 'al entregar'}`, 'negra') : p.pago_aviso ? etiqueta('Transferencia por confirmar') : ''}<h2>Pedido #${p.id}</h2>
      <p class="tenue"><a href="#/distribuidores/${p.distribuidor_id}">${d ? d.empresa : 'Sin distribuidor'}</a> · ${hace(p.creado)}</p></div><button class="cerrar" data-a="cerrar" aria-label="Cerrar">✕</button></header>
    <div class="botones">${sig ? html`<button class="boton lleno" data-a="mover-pedido" data-id="${p.id}" data-v="${sig}">Pasar a «${sig}»</button>` : ''}
      ${ant ? html`<button class="boton" data-a="mover-pedido" data-id="${p.id}" data-v="${ant}">Regresar a «${ant}»</button>` : ''}</div>
    <ol class="pasos-pedido">${S.estados.pedidos.map((e, n) => html`<li class="${n < i ? 'hecho' : n === i ? 'aqui' : ''}">${e}</li>`)}</ol>
    <form class="forma" data-f="pedido-lineas" data-id="${p.id}">
      ${S.productos.filter((x) => x.activo || p.lineas.some((l) => l.clave === x.clave)).map((x) => html`<label class="campo"><span>${x.nombre}<small>cajas de ${x.piezas_caja}</small></span>
        <input name="cajas:${x.clave}" type="number" min="0" step="1" value="${p.lineas.find((l) => l.clave === x.clave)?.cajas || ''}" ${p.descontado || p.cobro === 'Cobrado' ? html`disabled` : ''} data-envia></label>`)}
      <label class="campo"><span>Cartuchos vacíos que entrega</span><input name="vacios" type="number" min="0" step="1" value="${p.vacios || ''}" ${p.descontado || p.cobro === 'Cobrado' ? html`disabled` : ''} data-envia></label>
    </form>
    ${p.descontado ? html`<p class="tenue">Ya se fabricó y el material bajó del inventario: las piezas ya no se cambian.</p>` : p.cobro === 'Cobrado' ? html`<p class="tenue">Ya está pagado: las piezas no se cambian.</p>` : ''}
    ${desglose(t, p.lineas, p.estado === 'Recibido' ? d : null)}
    <div class="forma">
      ${campo('pedidos', p.id, 'fecha_prometida', p.fecha_prometida, { rotulo: 'Entrega prometida', tipo: 'date' })}
      ${campo('pedidos', p.id, 'lote_id', p.lote_id || '', { rotulo: 'Lote', opciones: [['', 'Sin lote'], ...S.lotes.map((l) => [l.id, `${l.codigo} · ${l.resultado}`])] })}
      ${campo('pedidos', p.id, 'ruta_id', p.ruta_id || '', { rotulo: 'Ruta', opciones: [['', 'Sin ruta'], ...S.rutas.filter((r) => r.estado !== 'Terminada' || r.id === p.ruta_id).map((r) => [r.id, `${fecha(r.fecha)} · ${r.repartidor || 'sin repartidor'}`])] })}
      ${campo('pedidos', p.id, 'notas', p.notas, { rotulo: 'Notas', tipo: 'area', ancho: 'doble' })}
    </div>
    ${p.promos?.length ? html`<h4>Material de promoción</h4><ul class="lista">${p.promos.map((x) => html`<li><b>${S.promos.find((y) => y.clave === x.clave)?.nombre || x.clave}</b><span>${x.cantidad}</span></li>`)}</ul>` : ''}
    ${p.cobro !== 'Cobrado' ? html`<div class="botones">${p.pago_aviso ? html`<p class="alerta doble">Avisó que transfirió el ${fecha(p.pago_aviso_fecha)} · referencia: ${p.pago_aviso}. Al verla en el banco:</p>` : ''}<button class="boton ${p.pago_aviso ? 'lleno' : ''}" data-a="confirmar-pago" data-id="${p.id}">${p.pago_aviso ? 'Confirmar la transferencia' : 'Marcar como pagado por adelantado'}</button></div>` : ''}
    <dl class="datos"><dt>Cobro</dt><dd>${p.cobro}${p.pago_metodo ? ' · ' + p.pago_metodo : ''}${p.cobrado_fecha ? ' · ' + fecha(p.cobrado_fecha) : ''}</dd>${p.entregado_fecha ? html`<dt>Entregado</dt><dd>${fecha(p.entregado_fecha)}</dd>` : ''}${d?.direccion || d?.ciudad ? html`<dt>Entregar en</dt><dd>${[d.direccion, d.ciudad].filter(Boolean).join(', ')}</dd>` : ''}</dl>
    ${bitacoraDe('pedidos', p.id)}
    ${p.descontado ? '' : html`<p class="fin"><button class="enlace" data-a="borrar-pedido" data-id="${p.id}">Borrar este pedido</button></p>`}`;
}

const leerLineas = (d) => ({ lineas: Object.keys(d).filter((k) => k.startsWith('cajas:')).map((k) => ({ clave: k.slice(6), cajas: Number(d[k]) || 0 })), vacios: Number(d.vacios) || 0 });

export const pedidos = {
  id: 'pedidos', titulo: 'Pedidos', grupo: 'Comercial',
  cuenta: () => S.pedidos.filter((p) => p.estado === 'Recibido').length,
  botones: () => html`${interruptor('pedidos', S.ui.vista.pedidos)}<button class="boton lleno" data-a="ir" data-ruta="pedidos/nuevo">+ Pedido</button>`,
  pintar() {
    if (!S.pedidos.length) return html`<p class="vacio">Aún no hay pedidos. Se crean aquí con «+ Pedido», o los hace el distribuidor desde su liga privada (se crea en su ficha).</p>`;
    if (S.ui.vista.pedidos === 'tabla') return html`<div class="tabla-caja"><table class="tabla"><thead><tr><th>Pedido</th><th>Estado</th><th>Piezas</th><th>Total</th><th>Vacíos</th><th>Prometido</th><th>Cobro</th><th>Creado</th></tr></thead><tbody>
      ${S.pedidos.map((p) => html`<tr data-a="ir" data-ruta="pedidos/${p.id}"><th>#${p.id} · ${dist(p.distribuidor_id)?.empresa || ''}<small>${resumenLineas(p)}</small></th><td>${p.estado}</td><td>${num(p.piezas)}</td><td>${dinero(p.total)}</td><td>${num(p.vacios)}</td><td>${fecha(p.fecha_prometida)}</td><td>${p.cobro}</td><td>${fecha(p.creado)}</td></tr>`)}</tbody></table></div>`;
    return columnas({ rec: 'pedidos', cols: S.estados.pedidos, items: S.pedidos, tarjeta: tarjetaPedido });
  },
  panel: panelPedido,
  vivo: { pedido: (d) => desglose(totalDe(leerLineas(d).lineas, d.vacios), leerLineas(d).lineas, dist(Number(d.distribuidor_id))) },
  acciones: {
    'mover-pedido': (el) => guardar('pedidos', el.dataset.id, { estado: el.dataset.v }),
    'confirmar-pago': (el) => { if (confirm('¿Ya está el dinero en el banco? El pedido queda pagado y, si estaba en Recibido, pasa a Confirmado.')) return guardar('pedidos', el.dataset.id, { confirmar_pago: 1 }); },
    async 'borrar-pedido'(el) { if (await borrar('pedidos', el.dataset.id, '¿Borrar este pedido?')) location.hash = '#/pedidos'; },
  },
  formularios: {
    async 'pedido-nuevo'(f, d) {
      const r = await crear('pedidos', { distribuidor_id: Number(d.distribuidor_id), ...leerLineas(d), fecha_prometida: d.fecha_prometida, notas: d.notas });
      if (r) location.hash = `#/pedidos/${r.id}`;
    },
    'pedido-lineas': (f, d) => guardar('pedidos', f.dataset.id, leerLineas(d)),
  },
};
void _RLR; void _k; void _rev;
