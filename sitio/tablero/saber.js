/* RLR · La Vela — pantallas Proyecto, Receta, Modelo y Ajustes — Ricardo López Reyero */
import { S, aj, ajuste, bitacoraDe, borrar, campo, columnas, crear, diasA, dinero, etiqueta, fecha, guardar, html, interruptor, num } from './nucleo.js';
import { FASES, inv, medir } from './cuentas.js';

const _RLR = 'Ricardo López Reyero', _k = 'EYE', _rev = 181218; // RLR

// ───────── Proyecto: el checklist, una tarjeta por tarea ─────────
const PESO = { Alta: 0, Media: 1, Baja: 2 };
const secciones = () => [...new Set(S.tareas.map((t) => t.seccion))];
function tareasVisibles() {
  const sec = S.ui.filtro.seccion || '', soloFase = S.ui.filtro.fase !== 'todas', f = aj('fase_actual', 1);
  return S.tareas.filter((t) => (!sec || t.seccion === sec) && (!soloFase || t.fase <= f))
    .sort((a, b) => PESO[a.prioridad] - PESO[b.prioridad] || (a.fecha || '9').localeCompare(b.fecha || '9') || a.id - b.id);
}
const tarjetaTarea = (t) => {
  const venc = t.fecha && diasA(t.fecha) < 0 && ['Por hacer', 'En curso'].includes(t.estado);
  return html`<article class="tarjeta ${venc ? 'roja' : ''}" draggable="true" data-arr="${t.id}" data-a="ir" data-ruta="proyecto/${t.id}" tabindex="0">
    <p><b>${t.titulo}</b></p><p class="chips">${etiqueta(t.seccion)}${etiqueta('Fase ' + t.fase)}${t.prioridad === 'Alta' ? etiqueta('Alta', 'negra') : ''}</p>
    ${t.fecha || t.responsable ? html`<p class="${venc ? 'plazo' : 'sigue'}">${t.fecha ? fecha(t.fecha) : ''}${t.fecha && t.responsable ? ' · ' : ''}${(t.responsable || '').split('@')[0]}</p>` : ''}</article>`;
};

export const proyecto = {
  id: 'proyecto', titulo: 'Proyecto', grupo: 'Proyecto',
  botones: () => html`<select data-a-cambio="filtro-seccion" aria-label="Sección"><option value="">Todas las secciones</option>${secciones().map((s) => html`<option ${S.ui.filtro.seccion === s ? html`selected` : ''}>${s}</option>`)}</select>
    <div class="alterna"><button type="button" data-a="filtro-fase" data-v="" aria-pressed="${String(S.ui.filtro.fase !== 'todas')}">Hasta la fase actual</button><button type="button" data-a="filtro-fase" data-v="todas" aria-pressed="${String(S.ui.filtro.fase === 'todas')}">Todas</button></div>
    ${interruptor('proyecto', S.ui.vista.proyecto)}<button class="boton lleno" data-a="ir" data-ruta="proyecto/nuevo">+ Tarea</button>`,
  pintar() {
    const xs = tareasVisibles(), f = FASES.find((x) => x.n === aj('fase_actual', 1)) || FASES[0], hechas = xs.filter((t) => t.estado === 'Hecho').length;
    const cabeza = html`<p class="franja"><b>Fase ${f.n} · ${f.nombre}.</b> ${f.metrica}: ${f.pasa.charAt(0).toLowerCase() + f.pasa.slice(1)} <span class="tenue">${hechas} de ${xs.length} tareas hechas.</span></p>`;
    if (S.ui.vista.proyecto === 'tabla') return html`${cabeza}<div class="tabla-caja"><table class="tabla"><thead><tr><th>Tarea</th><th>Estado</th><th>Sección</th><th>Fase</th><th>Prioridad</th><th>Responsable</th><th>Fecha</th></tr></thead><tbody>
      ${xs.map((t) => html`<tr data-a="ir" data-ruta="proyecto/${t.id}"><th>${t.titulo}</th><td>${t.estado}</td><td>${t.seccion}</td><td>${t.fase}</td><td>${t.prioridad}</td><td>${(t.responsable || '').split('@')[0]}</td><td>${fecha(t.fecha)}</td></tr>`)}</tbody></table></div>`;
    return html`${cabeza}${columnas({ rec: 'tareas', cols: S.estados.tareas, items: xs, tarjeta: tarjetaTarea })}`;
  },
  panel(sub) {
    if (sub === 'nuevo') return html`<header><h2>Tarea nueva</h2><button class="cerrar" data-a="cerrar" aria-label="Cerrar">✕</button></header>
      <form data-f="tarea-nueva" class="forma"><label class="campo doble"><span>Qué hay que hacer</span><input name="titulo" required maxlength="300"></label>
        <label class="campo"><span>Sección</span><input name="seccion" list="secciones" value="${S.ui.filtro.seccion || 'Producción'}"><datalist id="secciones">${secciones().map((s) => html`<option value="${s}">`)}</datalist></label>
        <label class="campo"><span>Fase</span><select name="fase">${FASES.map((f) => html`<option value="${f.n}" ${f.n === aj('fase_actual', 1) ? html`selected` : ''}>${f.n} · ${f.nombre}</option>`)}</select></label>
        <label class="campo"><span>Para cuándo</span><input name="fecha" type="date"></label>
        <label class="campo"><span>Prioridad</span><select name="prioridad"><option>Alta</option><option selected>Media</option><option>Baja</option></select></label>
        <button class="boton lleno">Agregar</button></form>`;
    const t = S.tareas.find((x) => x.id === Number(sub));
    if (!t) return null;
    return html`<header><div>${etiqueta(t.seccion)} ${etiqueta('Fase ' + t.fase)}<h2>${t.titulo}</h2></div><button class="cerrar" data-a="cerrar" aria-label="Cerrar">✕</button></header>
      <div class="forma">
        ${campo('tareas', t.id, 'titulo', t.titulo, { rotulo: 'Qué hay que hacer', ancho: 'doble' })}
        ${campo('tareas', t.id, 'estado', t.estado, { rotulo: 'Estado', opciones: S.estados.tareas })}
        ${campo('tareas', t.id, 'prioridad', t.prioridad, { rotulo: 'Prioridad', opciones: ['Alta', 'Media', 'Baja'] })}
        ${campo('tareas', t.id, 'responsable', t.responsable, { rotulo: 'Responsable', opciones: [['', 'Sin asignar'], ...S.usuarios.map((u) => [u.correo, u.nombre || u.correo])] })}
        ${campo('tareas', t.id, 'fecha', t.fecha, { rotulo: 'Para cuándo', tipo: 'date' })}
        ${campo('tareas', t.id, 'seccion', t.seccion, { rotulo: 'Sección' })}
        ${campo('tareas', t.id, 'fase', t.fase, { rotulo: 'Fase', opciones: FASES.map((f) => [f.n, `${f.n} · ${f.nombre}`]) })}
        ${campo('tareas', t.id, 'notas', t.notas, { rotulo: 'Notas', tipo: 'area', ancho: 'doble' })}
      </div>${bitacoraDe('tareas', t.id)}
      <p class="fin"><button class="enlace" data-a="borrar-tarea" data-id="${t.id}">Borrar esta tarea</button></p>`;
  },
  acciones: {
    'filtro-seccion': (el) => { S.ui.filtro.seccion = el.value; },
    'filtro-fase': (el) => { S.ui.filtro.fase = el.dataset.v; },
    async 'borrar-tarea'(el) { if (await borrar('tareas', el.dataset.id, '¿Borrar esta tarea?')) location.hash = '#/proyecto'; },
  },
  formularios: { async 'tarea-nueva'(f, d) { const r = await crear('tareas', { ...d, fase: Number(d.fase) }); if (r) location.hash = '#/proyecto'; } },
};

// ───────── Receta y pruebas de encendido ─────────
function fichaReceta(r, editando) {
  const d = r.datos, p = d.parametros || {}, g = (p.gph || 0) * (p.horas || 0) * (1 + (p.residual || 0)), cera = inv('cera'), activa = aj('receta_activa', 1) === r.id;
  if (editando) return html`<form data-f="receta" data-id="${r.id}" class="forma">
    <label class="campo doble"><span>Nombre</span><input name="nombre" value="${r.nombre}" required></label>
    <label class="campo doble"><span>Para quién es</span><input name="para" value="${d.para || ''}"></label>
    <div class="campo doble"><span>Ingredientes</span><div class="ingredientes">${[...(d.ingredientes || []), { nombre: '', cantidad: '', unidad: 'g' }].map((x, i) => html`<div><input name="ing-n-${i}" value="${x.nombre}" placeholder="Ingrediente"><input name="ing-c-${i}" type="number" step="any" value="${x.cantidad}" placeholder="Cantidad"><input name="ing-u-${i}" value="${x.unidad}" placeholder="Unidad"></div>`)}</div><small>Deja una fila vacía para quitarla. Al guardar aparece otra en blanco.</small></div>
    <label class="campo"><span>Gramos por hora (meta)</span><input name="gph" type="number" step="any" value="${p.gph ?? ''}"></label>
    <label class="campo"><span>Horas que debe durar</span><input name="horas" type="number" step="any" value="${p.horas ?? ''}"></label>
    <label class="campo"><span>Cera que queda sin quemar (%)</span><input name="residual" type="number" step="any" value="${(p.residual || 0) * 100}"></label>
    <label class="campo"><span>Estado</span><select name="estado">${['En prueba', 'Congelada', 'Descartada'].map((e) => html`<option ${d.estado === e ? html`selected` : ''}>${e}</option>`)}</select></label>
    <label class="campo doble"><span>Mecha</span><textarea name="mecha" rows="2">${d.mecha || ''}</textarea></label>
    <label class="campo doble"><span>Vaso</span><textarea name="vaso" rows="2">${d.vaso || ''}</textarea></label>
    <label class="campo doble"><span>Cartucho o base</span><textarea name="cartucho" rows="2">${d.cartucho || ''}</textarea></label>
    <label class="campo doble"><span>Pasos (uno por renglón)</span><textarea name="pasos" rows="8">${(d.pasos || []).join('\n')}</textarea></label>
    <label class="campo doble"><span>Notas</span><textarea name="notas" rows="3">${d.notas || ''}</textarea></label>
    <div class="botones doble"><button class="boton lleno">Guardar la receta</button><button type="button" class="boton" data-a="receta-editar" data-id="">Cancelar</button></div></form>`;
  return html`<div class="receta">
    <p class="chips">${etiqueta(d.linea || 'Receta')}${etiqueta(d.estado || 'En prueba', d.estado === 'Congelada' ? 'negra' : '')}${activa ? etiqueta('Se usa para producir', 'negra') : ''}</p>
    <p class="grande">${d.para || ''}</p>
    <div class="cifras">
      <div><b>${num(g)} g</b><span>de cera por pieza</span></div>
      <div><b>${num(p.gph, 1)} g/h</b><span>consumo que se busca</span></div>
      <div><b>${num(p.horas)} h</b><span>${num((p.horas || 0) / 24, 0)} días de luz, por comprobar</span></div>
      ${activa && cera ? html`<div><b>${dinero((g / 1000) * cera.costo, 2)}</b><span>de cera por pieza, a ${dinero(cera.costo, 2)} el kilo</span></div>` : ''}</div>
    <div class="dos"><div><h4>Ingredientes</h4><ul class="lista">${(d.ingredientes || []).map((x) => html`<li><b>${x.nombre}</b><span>${num(x.cantidad, x.cantidad % 1 ? 1 : 0)} ${x.unidad}</span></li>`)}</ul>
        <h4>Mecha</h4><p>${d.mecha}</p><h4>Vaso</h4><p>${d.vaso}</p><h4>Cartucho o base</h4><p>${d.cartucho}</p></div>
      <div><h4>Pasos</h4><ol class="pasos">${(d.pasos || []).map((x) => html`<li>${x}</li>`)}</ol>${d.notas ? html`<h4>Notas</h4><p>${d.notas}</p>` : ''}</div></div>
    <p class="tenue">Última edición: ${fecha(r.actualizada)}${r.por && r.por !== 'semilla' ? ' · ' + r.por.split('@')[0] : ''}</p>
    <div class="botones"><button class="boton" data-a="receta-editar" data-id="${r.id}">✎ Editar la receta</button>
      ${activa ? '' : html`<button class="boton" data-a="receta-activa" data-id="${r.id}">Usar esta para producir</button>`}</div></div>`;
}

function fichaPrueba(p, mejor) {
  const m = medir(p);
  const veredicto = !p.peso_inicial ? 'Falta pesarla antes de la primera encendida.' : !m.listo ? 'Pesada. Falta la primera sesión.'
    : m.falla ? `No pasa: ${m.falla}.` : m.pasa ? `Pasa: proyecta ${num(m.proy)} horas; la meta es ${num(p.meta_horas)}.` : `Proyecta ${num(m.proy)} horas; la meta es ${num(p.meta_horas)}.`;
  return html`<article class="prueba ${m.falla ? 'falla' : ''} ${mejor === p.id ? 'gana' : ''}">
    <header><div><h3>${p.nombre}</h3><p class="tenue">${p.detalle}</p></div>${mejor === p.id ? etiqueta('Va ganando', 'negra') : ''}</header>
    <div class="cifras chicas"><div><b>${m.listo ? num(m.gph, 2) : '—'}</b><span>gramos por hora</span></div><div><b>${m.listo && m.proy ? num(m.proy) : '—'}</b><span>horas proyectadas</span></div><div><b>${num(m.horas, 1)}</b><span>horas encendida</span></div></div>
    <p class="veredicto">${veredicto}</p>
    <div class="forma tres">
      ${campo('pruebas', p.id, 'peso_inicial', p.peso_inicial ?? '', { rotulo: 'Peso inicial (g)', tipo: 'number' })}
      ${campo('pruebas', p.id, 'meta_horas', p.meta_horas, { rotulo: 'Meta (horas)', tipo: 'number' })}
      ${campo('pruebas', p.id, 'residual', p.residual, { rotulo: 'Cera que no se quema', tipo: 'number', paso: '0.01' })}
    </div>
    ${m.sesiones.length ? html`<div class="tabla-caja"><table class="tabla"><thead><tr><th>Sesión</th><th>Horas</th><th>Peso final</th><th>g/h acumulado</th><th>Flama</th><th>Vaso</th><th></th><th></th></tr></thead><tbody>
      ${m.sesiones.map((s, i) => { const h = m.sesiones.slice(0, i + 1).reduce((t, x) => t + x.horas, 0); return html`<tr><th>${i + 1} · ${fecha(s.fecha)}</th><td>${num(s.horas, 1)}</td><td>${num(s.peso_final, 1)} g</td><td>${p.peso_inicial ? num((p.peso_inicial - s.peso_final) / h, 2) : '—'}</td>
        <td>${s.flama_mm != null ? num(s.flama_mm) + ' mm' : ''}</td><td>${s.temp_c != null ? num(s.temp_c) + ' °C' : ''}</td><td>${s.tunel ? 'Túnel' : ''}${s.tunel && s.hollin ? ' · ' : ''}${s.hollin ? 'Humo' : ''}</td>
        <td><button class="enlace" data-a="borrar-sesion" data-id="${s.id}" aria-label="Borrar sesión">✕</button></td></tr>`; })}</tbody></table></div>` : ''}
    <form data-f="sesion" data-id="${p.id}" class="forma sesion">
      <label class="campo"><span>Horas</span><input name="horas" type="number" step="any" min="0" required placeholder="3"></label>
      <label class="campo"><span>Peso al terminar (g)</span><input name="peso_final" type="number" step="any" min="0" required></label>
      <label class="campo"><span>Flama (mm)</span><input name="flama_mm" type="number" step="any" min="0"></label>
      <label class="campo"><span>Vaso (°C)</span><input name="temp_c" type="number" step="any"></label>
      <label class="campo casilla"><input name="tunel" type="checkbox"><span>Hizo túnel</span></label>
      <label class="campo casilla"><input name="hollin" type="checkbox"><span>Echó humo</span></label>
      <button class="boton">Anotar sesión</button></form>
    <p class="fin">${m.listo && !m.falla ? html`<button class="enlace" data-a="usar-gph" data-id="${p.id}">Usar ${num(m.gph, 2)} g/h en la receta</button> · ` : ''}<button class="enlace" data-a="borrar-prueba" data-id="${p.id}">Borrar esta prueba</button></p></article>`;
}

export const receta = {
  id: 'receta', titulo: 'Receta', grupo: 'Proyecto',
  botones: () => html`<button class="boton" data-a="receta-nueva">+ Receta</button>`,
  pintar(sub) {
    if (!S.recetas.length) return html`<p class="vacio">Sin recetas. Agrega la primera con «+ Receta».</p>`;
    const r = S.recetas.find((x) => x.id === Number(sub)) || S.recetas.find((x) => x.id === aj('receta_activa', 1)) || S.recetas[0];
    const ps = S.pruebas.filter((p) => p.receta_id === r.id), ms = ps.map((p) => ({ p, m: medir(p) })).filter((x) => x.m.listo && !x.m.falla);
    const mejor = ms.length ? ms.sort((a, b) => a.m.gph - b.m.gph)[0].p.id : 0;
    return html`<div class="alterna pestanas">${S.recetas.map((x) => html`<button type="button" data-a="ir" data-ruta="receta/${x.id}" aria-pressed="${String(x.id === r.id)}">${x.nombre}</button>`)}</div>
      <section class="bloque"><h2>${r.nombre}</h2>${fichaReceta(r, S.ui.editando === r.id)}</section>
      <section class="bloque"><h2>Pruebas de encendido<span class="cuenta">${ps.length}</span></h2>
        <p class="tenue">Medir, no adivinar. Pesa la vela antes de la primera encendida y al terminar cada sesión de 3 o 4 horas. Gana la que queme menos gramos por hora sin hacer túnel, sin humo y con flama de al menos 1.5 cm.</p>
        <div class="pruebas">${ps.map((p) => fichaPrueba(p, mejor))}</div>
        <form data-f="prueba-nueva" data-id="${r.id}" class="forma enlinea"><label class="campo"><span>Prototipo nuevo</span><input name="nombre" required placeholder="Mecha 2/0, vaso angosto…"></label><button class="boton">+ Prueba</button></form></section>`;
  },
  acciones: {
    'receta-editar': (el) => { S.ui.editando = Number(el.dataset.id) || 0; },
    'receta-activa': (el) => ajuste('receta_activa', Number(el.dataset.id)),
    'receta-nueva': async () => { const r = await crear('recetas', { nombre: 'Receta nueva', datos: { linea: 'Prueba', estado: 'En prueba', ingredientes: [], parametros: { gph: 2.6, horas: 168, residual: 0.03 }, pasos: [] } }); if (r) { S.ui.editando = r.fila.id; location.hash = `#/receta/${r.fila.id}`; } },
    'borrar-sesion': (el) => borrar('sesiones', el.dataset.id, '¿Borrar esta sesión?'),
    'borrar-prueba': (el) => borrar('pruebas', el.dataset.id, '¿Borrar esta prueba y sus sesiones?'),
    'usar-gph'(el) {
      const p = S.pruebas.find((x) => x.id === Number(el.dataset.id)), r = S.recetas.find((x) => x.id === p.receta_id), m = medir(p);
      if (!confirm(`La receta «${r.nombre}» pasará de ${r.datos.parametros.gph} a ${m.gph.toFixed(2)} g/h. Cambia la cera por pieza y lo que pide Producción.`)) return;
      return guardar('recetas', r.id, { datos: { ...r.datos, parametros: { ...r.datos.parametros, gph: Math.round(m.gph * 100) / 100 } } });
    },
  },
  formularios: {
    async receta(f, d) {
      const r = S.recetas.find((x) => x.id === Number(f.dataset.id)), ing = [];
      for (let i = 0; `ing-n-${i}` in d; i++) if (d[`ing-n-${i}`].trim()) ing.push({ nombre: d[`ing-n-${i}`].trim(), cantidad: Number(d[`ing-c-${i}`]) || 0, unidad: d[`ing-u-${i}`].trim() || 'g' });
      const datos = { ...r.datos, para: d.para, estado: d.estado, ingredientes: ing, mecha: d.mecha, vaso: d.vaso, cartucho: d.cartucho, notas: d.notas,
        pasos: d.pasos.split('\n').map((x) => x.trim()).filter(Boolean), parametros: { gph: Number(d.gph) || 0, horas: Number(d.horas) || 0, residual: (Number(d.residual) || 0) / 100 } };
      if (await guardar('recetas', r.id, { nombre: d.nombre, datos })) S.ui.editando = 0;
    },
    sesion: (f, d) => crear('sesiones', { prueba_id: Number(f.dataset.id), horas: d.horas, peso_final: d.peso_final, flama_mm: d.flama_mm, temp_c: d.temp_c, tunel: d.tunel ? 1 : 0, hollin: d.hollin ? 1 : 0 }),
    'prueba-nueva': (f, d) => crear('pruebas', { receta_id: Number(f.dataset.id), nombre: d.nombre, meta_horas: S.recetas.find((x) => x.id === Number(f.dataset.id))?.datos.parametros?.horas || 168 }),
  },
};

// ───────── Modelo de negocio ─────────
export const modelo = {
  id: 'modelo', titulo: 'Modelo', grupo: 'Proyecto',
  fijo: true, // no se repinta con cada cambio: es un documento
  pintar: () => html`<iframe class="documento" src="/modelo?dentro=1" title="El modelo de negocio de La Vela" loading="lazy"></iframe>`,
};

// ───────── Ajustes: operación, catálogo y quién entra ─────────
const AJ = [['deposito', 'Depósito por cartucho ($)', '1'], ['dias_entrega', 'Días para entregar un pedido', '1'], ['dias_cobro', 'Días de crédito antes de avisar', '1'],
  ['meta_semanal', 'Meta de piezas por semana', '1'], ['pedido_minimo_cajas', 'Pedido mínimo desde la liga (cajas)', '1']];

export const ajustes = {
  id: 'ajustes', titulo: 'Ajustes', grupo: '',
  pintar() {
    const admin = S.yo.rol === 'admin';
    return html`<div class="rejilla">
      <section class="bloque"><h2>Operación</h2><div class="forma">
        <label class="campo doble"><span>Fase actual del proyecto</span><select data-ajuste="fase_actual">${FASES.map((f) => html`<option value="${f.n}" ${aj('fase_actual', 1) === f.n ? html`selected` : ''}>${f.n} · ${f.nombre}: ${f.metrica.toLowerCase()}</option>`)}</select></label>
        ${AJ.map(([k, t, paso]) => html`<label class="campo"><span>${t}</span><input type="number" min="0" step="${paso}" data-ajuste="${k}" value="${S.ajustes[k] ?? ''}"></label>`)}</div></section>
      <section class="bloque"><h2>Tu sesión</h2><p>Entraste como <b>${S.yo.correo}</b>${admin ? ', con acceso de administrador' : ''}.</p>
        <p class="tenue">Se entra con un enlace que llega al correo; dura 15 minutos y sirve una vez. La sesión dura 30 días en este navegador.</p>
        <div class="botones"><button class="boton" data-a="salir">Cerrar sesión</button></div></section>
      <section class="bloque doble"><h2>Catálogo</h2><div class="tabla-caja"><table class="tabla editable"><thead><tr><th>Producto</th><th>Piezas por caja</th><th>Precio al distribuidor, por pieza</th><th>Precio al público</th><th>Lleva vaso</th><th>Se vende</th></tr></thead><tbody>
        ${S.productos.map((p) => html`<tr><th>${campo('productos', p.clave, 'nombre', p.nombre)}</th><td>${campo('productos', p.clave, 'piezas_caja', p.piezas_caja, { tipo: 'number', paso: '1' })}</td>
          <td>${campo('productos', p.clave, 'precio_dist', p.precio_dist, { tipo: 'number' })}</td><td>${campo('productos', p.clave, 'precio_publico', p.precio_publico, { tipo: 'number' })}</td>
          <td>${campo('productos', p.clave, 'lleva_vaso', p.lleva_vaso, { tipo: 'checkbox' })}</td><td>${campo('productos', p.clave, 'activo', p.activo, { tipo: 'checkbox' })}</td></tr>`)}</tbody></table></div>
        <p class="tenue">Los precios al distribuidor llevan IVA y salen del modelo (escenario Optimizado). Cambiarlos aquí cambia los pedidos nuevos, no los que ya existen.</p></section>
      <section class="bloque doble"><h2>Quién entra al tablero</h2>
        <div class="tabla-caja"><table class="tabla ${admin ? 'editable' : ''}"><thead><tr><th>Correo</th><th>Nombre</th><th>Acceso</th><th></th></tr></thead><tbody>
          ${S.usuarios.map((u) => html`<tr><th>${u.correo}</th><td>${admin ? campo('usuarios', u.correo, 'nombre', u.nombre) : u.nombre}</td>
            <td>${admin ? campo('usuarios', u.correo, 'rol', u.rol, { opciones: [['admin', 'Administrador'], ['equipo', 'Equipo']] }) : u.rol}</td>
            <td>${admin && u.correo !== S.yo.correo ? html`<button class="enlace" data-a="borrar-usuario" data-id="${u.correo}">Quitar</button>` : ''}</td></tr>`)}</tbody></table></div>
        ${admin ? html`<form data-f="usuario-nuevo" class="forma enlinea"><label class="campo"><span>Correo</span><input name="correo" type="email" required></label><label class="campo"><span>Nombre</span><input name="nombre"></label>
          <label class="campo"><span>Acceso</span><select name="rol"><option value="equipo">Equipo</option><option value="admin">Administrador</option></select></label><button class="boton">Dar acceso</button></form>
          <p class="tenue">Quien esté en esta lista entra con su correo. Los administradores reciben el aviso de cada solicitud y pedido nuevo, y son los únicos que cambian esta lista.</p>` : ''}</section>
    </div>`;
  },
  acciones: {
    'borrar-usuario': (el) => borrar('usuarios', el.dataset.id, `¿Quitarle el acceso a ${el.dataset.id}?`),
    async salir() { await fetch('/api/salir', { method: 'POST' }); location.href = '/entrar'; },
  },
  formularios: { 'usuario-nuevo': (f, d) => crear('usuarios', d) },
};
void _RLR; void _k; void _rev; void interruptor;
