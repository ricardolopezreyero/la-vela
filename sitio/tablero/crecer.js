/* RLR · La Vela — pantallas Mercado, Equipo y Datos — Ricardo López Reyero
   Mercado: la meta (25% de las velas de México), los canales, las regiones y dónde buscar comercializadores.
   Equipo: los puestos antes que la gente; el tablero dice cuándo toca contratar. Datos: la sala de datos, todo en una pantalla. */
import { S, aj, api, aviso, bitacoraDe, borrar, campo, cargar, columnas, crear, crudo, diasA, dinero, etiqueta, fecha, guardar, html, interruptor, num } from './nucleo.js';
import { FASES, abiertos, caja, cartuchos, dist, escalon, mesHoy, nomina, pendientes, piezasSemana, plantilla, plazas, porCobrar, porFabricar, porPagar, resultado, temporadas } from './cuentas.js';
import { cargaDe } from './logistica.js';

const _RLR = 'Ricardo López Reyero', _k = 'EYE', _rev = 181218; // RLR
const barra = (n, max) => html`<span class="barra"><i style="${crudo(`width:${max && n ? Math.min(100, Math.max(2, (n / max) * 100)) : 0}%`)}"></i></span>`;
const PESO = { Alta: 0, Media: 1, Baja: 2 };
const compacto = (n) => (n >= 1e6 ? num(n / 1e6, n >= 1e7 ? 0 : 1) + ' M' : n >= 1e4 ? num(n / 1e3, 0) + ' mil' : num(n));

// ───────── Mercado ─────────
const piezasCanal = (clave) => S.pedidos.filter((p) => p.estado !== 'Recibido' && (dist(p.distribuidor_id)?.canal || 'tienditas') === clave).reduce((s, p) => s + p.piezas, 0);
// Distribuidores activos cuya zona menciona alguna palabra del nombre de la región
const distsRegion = (m) => { const ws = `${m.nombre} ${m.descripcion}`.toLowerCase().split(/[^a-záéíóúñü]+/).filter((w) => w.length > 4); return S.distribuidores.filter((d) => ['Piloto', 'Activo'].includes(d.estado) && `${d.zona} ${d.zonas} ${d.ciudad}`.toLowerCase().split(/[^a-záéíóúñü]+/).some((w) => w.length > 4 && ws.includes(w))); };
const tarjetaMercado = (m) => html`<article class="tarjeta" draggable="true" data-arr="${m.id}" data-a="ir" data-ruta="mercado/${m.id}" tabindex="0">
  <p><b>${m.nombre}</b></p><p class="chips">${etiqueta('Fase ' + m.fase)}${m.prioridad === 'Alta' ? etiqueta('Alta', 'negra') : ''}${m.tipo === 'Canal' && m.meta_semana ? etiqueta(`${num(piezasCanal(m.clave))} de ${num(m.meta_semana)}/sem`) : ''}${m.tipo === 'Región' && distsRegion(m).length ? etiqueta(`${distsRegion(m).length} distribuidor(es)`) : ''}</p>
  <p class="tenue">${m.descripcion.slice(0, 110)}${m.descripcion.length > 110 ? '…' : ''}</p>${m.responsable ? html`<p class="sigue">${m.responsable.split('@')[0]}</p>` : ''}</article>`;

export const mercado = {
  id: 'mercado', titulo: 'Mercado', grupo: 'Comercial',
  botones: () => html`<div class="alterna">${[['Canal', 'Canales'], ['Región', 'Regiones'], ['Fuente', 'Dónde buscar']].map(([v, t]) => html`<button type="button" data-a="filtro-tipo-m" data-v="${v}" aria-pressed="${String((S.ui.filtro.mercado || 'Canal') === v)}">${t}</button>`)}</div>
    ${interruptor('mercado', S.ui.vista.mercado)}<button class="boton lleno" data-a="ir" data-ruta="mercado/nuevo">+ Agregar</button>`,
  pintar() {
    const tipo = S.ui.filtro.mercado || 'Canal', xs = S.mercados.filter((m) => m.tipo === tipo).sort((a, b) => PESO[a.prioridad] - PESO[b.prioridad] || a.fase - b.fase || a.orden - b.orden);
    const hoy = piezasSemana(), meta = aj('meta_participacion', 25), total = aj('mercado_piezas_anio', 697000000), part = (hoy * 52) / total * 100;
    const pasos = [0.1, 0.5, 1, 5, 10, meta].filter((x, i, a) => a.indexOf(x) === i).sort((a, b) => a - b).map(escalon), grande = escalon(meta);
    const activos = S.distribuidores.filter((d) => ['Piloto', 'Activo'].includes(d.estado)).length, tiendas = S.distribuidores.reduce((s, d) => s + (['Piloto', 'Activo'].includes(d.estado) ? d.tiendas || 0 : 0), 0);
    const explicacion = tipo === 'Canal' ? 'A quién se le vende y cómo. Cada canal tiene su estrategia y su meta de piezas por semana; lo vendido se cuenta con el canal de cada distribuidor.'
      : tipo === 'Región' ? 'En qué orden crece la red: La Laguna primero, un centro de distribución por región, y después Centroamérica y Estados Unidos. Cada región abre con un gerente regional y cinco distribuidores.'
      : 'Dónde se encuentran los comercializadores, en orden de rapidez. La mejor fuente es preguntar en la tienda quién surte las veladoras hoy.';
    return html`<section class="bloque"><h2>La meta: ${meta}% de las velas de México</h2>
      <div class="cifras">
        <div><b>${num(hoy)}</b><span>piezas por semana hoy · ${part < 0.01 ? 'menos del 0.01' : num(part, 2)}% del mercado</span>${barra(hoy, grande.piezasSem)}</div>
        <div><b>${compacto(grande.piezasSem)}</b><span>piezas por semana que son el ${meta}% (${compacto(total)} al año en México)</span></div>
        <div><b>${compacto(grande.tiendas)}</b><span>tiendas a ${aj('piezas_tienda_semana', 8)} piezas por semana · hoy ${num(tiendas)}</span></div>
        <div><b>${num(grande.dists)}</b><span>distribuidores de ${aj('tiendas_distribuidor', 150)} tiendas · hoy ${activos}</span></div>
        <div><b>${grande.centros}</b><span>centros de ${compacto(aj('piezas_centro_semana', 60000))} piezas por semana · hoy ${S.centros.filter((c) => c.estado === 'Activo').length}</span></div>
        <div><b>${dinero(grande.ebitdaMes)}</b><span>EBITDA al mes a ${dinero(aj('ebitda_pieza', 9.22), 2)} por pieza (plan Rentable)</span></div></div>
      <div class="tabla-caja"><table class="tabla"><thead><tr><th>Escalón</th><th>Piezas por semana</th><th>Tiendas</th><th>Distribuidores</th><th>Centros</th><th>Personas</th><th>Nómina al mes</th><th>EBITDA al mes</th></tr></thead><tbody>
        ${pasos.map((e) => html`<tr class="${hoy >= e.piezasSem ? 'gris' : ''}"><th>${e.participacion}% de México</th><td>${num(e.piezasSem)}</td><td>${num(e.tiendas)}</td><td>${num(e.dists)}</td><td>${e.centros}</td><td>${num(e.personas)}</td><td>${dinero(e.nomina)}</td><td>${dinero(e.ebitdaMes)}</td></tr>`)}</tbody></table></div>
      <p class="tenue">El año 2 del plan Rentable (19 mil piezas al mes) es el 0.3% del mercado. Los escalones usan los supuestos de Ajustes (piezas por tienda, tiendas por distribuidor, capacidad por centro) y los disparadores de cada puesto en Equipo. Son supuestos: se corrigen con el piloto.</p></section>
      <section class="bloque"><h2>${tipo === 'Canal' ? 'Canales' : tipo === 'Región' ? 'Regiones' : 'Dónde buscar comercializadores'}<span class="cuenta">${xs.length}</span></h2><p class="tenue">${explicacion}</p>
      ${S.ui.vista.mercado === 'tabla' ? html`<div class="tabla-caja"><table class="tabla"><thead><tr><th>Nombre</th><th>Estado</th><th>Fase</th><th>Prioridad</th>${tipo === 'Canal' ? html`<th>Piezas / sem</th><th>Meta / sem</th>` : ''}<th>Responsable</th><th>Estrategia</th></tr></thead><tbody>
        ${xs.map((m) => html`<tr data-a="ir" data-ruta="mercado/${m.id}"><th>${m.nombre}<small>${m.tamano}</small></th><td>${m.estado}</td><td>${m.fase}</td><td>${m.prioridad}</td>${tipo === 'Canal' ? html`<td>${num(piezasCanal(m.clave))}</td><td>${num(m.meta_semana)}</td>` : ''}<td>${m.responsable.split('@')[0]}</td><td class="tenue">${m.estrategia.slice(0, 120)}${m.estrategia.length > 120 ? '…' : ''}</td></tr>`)}</tbody></table></div>`
        : columnas({ rec: 'mercados', cols: S.estados.mercados, items: xs, tarjeta: tarjetaMercado })}</section>`;
  },
  panel(sub) {
    if (sub === 'nuevo') return html`<header><h2>Agregar</h2><button class="cerrar" data-a="cerrar" aria-label="Cerrar">✕</button></header>
      <form data-f="mercado-nuevo" class="forma"><label class="campo"><span>Tipo</span><select name="tipo">${['Canal', 'Región', 'Fuente'].map((t) => html`<option ${t === (S.ui.filtro.mercado || 'Canal') ? html`selected` : ''}>${t}</option>`)}</select></label>
        <label class="campo"><span>Clave (canal)</span><input name="clave" maxlength="30" placeholder="tienditas, parroquia…"></label>
        <label class="campo doble"><span>Nombre</span><input name="nombre" required maxlength="160"></label>
        <label class="campo doble"><span>Qué es</span><textarea name="descripcion" rows="2"></textarea></label>
        <button class="boton lleno">Agregar</button></form>`;
    const m = S.mercados.find((x) => x.id === Number(sub));
    if (!m) return null;
    const ds = m.tipo === 'Canal' ? S.distribuidores.filter((d) => (d.canal || 'tienditas') === m.clave) : [];
    return html`<header><div>${etiqueta(m.tipo)} ${etiqueta('Fase ' + m.fase)} ${etiqueta(m.estado, m.estado === 'Activo' ? 'negra' : '')}<h2>${m.nombre}</h2></div><button class="cerrar" data-a="cerrar" aria-label="Cerrar">✕</button></header>
      ${m.tipo === 'Canal' ? html`<div class="cifras chicas"><div><b>${num(piezasCanal(m.clave))}</b><span>piezas vendidas por este canal</span></div><div><b>${ds.length}</b><span>distribuidor(es) con este canal</span></div><div><b>${num(m.meta_semana)}</b><span>meta de piezas por semana</span></div></div>` : ''}
      <div class="forma">
        ${campo('mercados', m.id, 'estado', m.estado, { rotulo: 'Estado', opciones: S.estados.mercados })}
        ${campo('mercados', m.id, 'prioridad', m.prioridad, { rotulo: 'Prioridad', opciones: ['Alta', 'Media', 'Baja'] })}
        ${campo('mercados', m.id, 'fase', m.fase, { rotulo: 'Fase del proyecto', opciones: FASES.map((f) => [f.n, `${f.n} · ${f.nombre}`]) })}
        ${campo('mercados', m.id, 'responsable', m.responsable, { rotulo: 'Responsable', opciones: [['', 'Sin asignar'], ...S.usuarios.map((u) => [u.correo, u.nombre || u.correo])] })}
        ${m.tipo === 'Canal' ? campo('mercados', m.id, 'meta_semana', m.meta_semana, { rotulo: 'Meta: piezas por semana', tipo: 'number', paso: '1' }) : ''}
        ${m.tipo === 'Canal' ? campo('mercados', m.id, 'clave', m.clave, { rotulo: 'Clave (la que lleva el distribuidor)' }) : ''}
        ${campo('mercados', m.id, 'nombre', m.nombre, { rotulo: 'Nombre', ancho: 'doble' })}
        ${campo('mercados', m.id, 'descripcion', m.descripcion, { rotulo: 'Qué es', tipo: 'area', ancho: 'doble' })}
        ${campo('mercados', m.id, 'tamano', m.tamano, { rotulo: 'Tamaño', tipo: 'area', ancho: 'doble' })}
        ${campo('mercados', m.id, 'estrategia', m.estrategia, { rotulo: 'Estrategia', tipo: 'area', ancho: 'doble' })}
        ${campo('mercados', m.id, 'como', m.como, { rotulo: m.tipo === 'Fuente' ? 'Cómo se hace' : 'Cómo entrar o dónde buscar', tipo: 'area', ancho: 'doble' })}
        ${campo('mercados', m.id, 'notas', m.notas, { rotulo: 'Notas', tipo: 'area', ancho: 'doble' })}
      </div>
      ${ds.length ? html`<h4>Distribuidores de este canal</h4><ul class="lista">${ds.map((d) => html`<li><a href="#/distribuidores/${d.id}"><b>${d.empresa}</b></a><span>${d.estado}</span></li>`)}</ul>` : ''}
      ${bitacoraDe('mercados', m.id)}
      <p class="fin"><button class="enlace" data-a="borrar-mercado" data-id="${m.id}">Borrar</button></p>`;
  },
  acciones: {
    'filtro-tipo-m': (el) => { S.ui.filtro.mercado = el.dataset.v; },
    async 'borrar-mercado'(el) { if (await borrar('mercados', el.dataset.id, '¿Borrar?')) location.hash = '#/mercado'; },
  },
  formularios: { async 'mercado-nuevo'(f, d) { const r = await crear('mercados', d); if (r) location.hash = `#/mercado/${r.fila.id}`; } },
};

// ───────── Equipo ─────────
const candidatosDe = (id) => S.candidatos.filter((c) => c.puesto_id === id);
const tarjetaPuesto = (p) => {
  const hoy = piezasSemana(), n = plazas(p, hoy), toca = n > p.ocupadas;
  return html`<article class="tarjeta ${toca ? 'roja' : ''}" draggable="true" data-arr="${p.id}" data-a="ir" data-ruta="equipo/${p.id}" tabindex="0">
    <p><b>${p.nombre}</b></p><p class="chips">${etiqueta(p.area)}${p.ocupadas ? etiqueta(`${p.ocupadas} en el puesto`, 'negra') : ''}${candidatosDe(p.id).filter((c) => !['Contratado', 'Descartado'].includes(c.estado)).length ? etiqueta(`${candidatosDe(p.id).filter((c) => !['Contratado', 'Descartado'].includes(c.estado)).length} candidato(s)`) : ''}</p>
    <p class="tenue">${p.disparador ? `Desde ${num(p.disparador)} piezas/sem` : 'Desde el inicio'}${p.por_piezas ? ` · 1 por cada ${num(p.por_piezas)}` : ''} · ${p.sueldo ? dinero(p.sueldo) + '/mes' : 'sin sueldo'}</p>
    ${toca ? html`<p class="plazo">Toca contratar: hacen falta ${n - p.ocupadas}</p>` : p.persona ? html`<p class="sigue">${p.persona}</p>` : ''}</article>`;
};

export const equipo = {
  id: 'equipo', titulo: 'Equipo', grupo: 'Empresa',
  cuenta: () => plantilla(piezasSemana()).faltan.length,
  botones: () => html`${interruptor('equipo', S.ui.vista.equipo)}<button class="boton lleno" data-a="ir" data-ruta="equipo/nuevo">+ Puesto</button>`,
  pintar() {
    const hoy = piezasSemana(), pl = plantilla(hoy), siguiente = S.puestos.filter((p) => p.disparador > hoy && !p.ocupadas).sort((a, b) => a.disparador - b.disparador)[0];
    const anio2 = plantilla(19052 / 4.33), xs = [...S.puestos].sort((a, b) => a.orden - b.orden);
    return html`<div class="rejilla">
      <section class="bloque doble"><h2>El sistema primero, la gente después</h2><div class="cifras">
        <div><b>${S.puestos.reduce((s, p) => s + p.ocupadas, 0)}</b><span>personas en el equipo · ${dinero(nomina())} de nómina al mes</span></div>
        <div><b>${pl.faltan.length}</b><span>puesto(s) que ya toca contratar a ${num(hoy)} piezas por semana</span></div>
        <div><b>${siguiente ? num(siguiente.disparador) : '—'}</b><span>${siguiente ? `piezas por semana: entra ${siguiente.nombre.toLowerCase()}` : 'no hay siguiente contratación'}</span></div>
        <div><b>${anio2.personas}</b><span>personas en el año 2 del plan (${num(19052 / 4.33)} piezas/sem) · ${dinero(anio2.nomina)} al mes</span></div>
        <div><b>${S.candidatos.filter((c) => !['Contratado', 'Descartado'].includes(c.estado)).length}</b><span>candidatos en proceso</span></div>
        <div><b>${num(hoy ? hoy / Math.max(1, S.puestos.reduce((s, p) => s + p.ocupadas, 0)) : 0)}</b><span>piezas por semana por persona</span></div></div>
        ${pl.faltan.length ? html`<p class="alerta">Toca contratar: ${pl.faltan.map((f) => `${f.faltan} ${f.p.nombre.toLowerCase()}`).join(', ')}. Cada puesto trae su perfil, dónde buscar y la prueba para elegir.</p>` : ''}
        <p class="tenue">Cada puesto dice desde cuántas piezas por semana se contrata y cuántas plazas hacen falta por volumen. El tablero avisa en «Hoy» cuando toca. La nómina del equipo entra como gasto en Contabilidad hasta que se capture la real.</p></section>
      <section class="bloque doble"><h2>Orden de contratación</h2>
        ${S.ui.vista.equipo === 'tabla' ? html`<div class="tabla-caja"><table class="tabla"><thead><tr><th>#</th><th>Puesto</th><th>Área</th><th>Se contrata desde</th><th>Una plaza por cada</th><th>Hoy</th><th>Hacen falta</th><th>Sueldo</th><th>Estado</th><th>Quién</th></tr></thead><tbody>
          ${xs.map((p, i) => { const n = plazas(p, hoy); return html`<tr data-a="ir" data-ruta="equipo/${p.id}" class="${n > p.ocupadas ? 'gris' : ''}"><td>${i + 1}</td><th>${p.nombre}</th><td>${p.area}</td><td>${p.disparador ? num(p.disparador) + ' pzas/sem' : 'el inicio'}</td><td>${p.por_piezas ? num(p.por_piezas) + ' pzas/sem' : 'una sola'}</td><td>${p.ocupadas}</td><td>${n > p.ocupadas ? html`<b>${n - p.ocupadas}</b>` : ''}</td><td>${p.sueldo ? dinero(p.sueldo) : ''}</td><td>${p.estado}</td><td>${p.persona}</td></tr>`; })}</tbody></table></div>`
          : columnas({ rec: 'puestos', cols: S.estados.puestos, items: xs, tarjeta: tarjetaPuesto })}</section>
      <section class="bloque doble"><h2>Organigrama</h2><div class="dos">${['Dirección', 'Producción', 'Comercial', 'Logística', 'Compras', 'Dinero', 'Personas', 'Datos', 'Calidad'].filter((a) => S.puestos.some((p) => p.area === a)).map((a) => html`<div><h4>${a}</h4><ul class="lista">${S.puestos.filter((p) => p.area === a).sort((x, y) => x.orden - y.orden).map((p) => html`<li><b><a href="#/equipo/${p.id}">${p.nombre}</a></b><span>${p.ocupadas ? `${p.persona || p.ocupadas + ' persona(s)'}` : 'vacante'}</span></li>`)}</ul></div>`)}</div></section>
      <section class="bloque doble"><h2>Cómo se contrata aquí</h2><ul class="lista simple">
        <li><b>1 · El puesto ya existe en el tablero,</b> con qué hace, qué debe saber, qué mide y cuánto gana. Nadie se inventa el puesto el día que hace falta.</li>
        <li><b>2 · Toca cuando las piezas lo dicen,</b> no cuando alguien se cansa. El disparador está en piezas por semana y «Hoy» avisa.</li>
        <li><b>3 · Se busca donde dice el puesto</b> (rutas de Bimbo y Coca-Cola, plantas de la zona industrial, las universidades) y los candidatos se anotan aquí con su fuente.</li>
        <li><b>4 · Se elige con la prueba del puesto,</b> siempre práctica y con el trabajo real: vaciar 24 piezas, una ruta acompañada, cotizar parafina.</li>
        <li><b>5 · Quien entra aprende el tablero la primera semana.</b> Su pantalla es su trabajo: el repartidor vive en Rutas, el comercial en Distribuidores, compras en Compras.</li></ul></section>
    </div>`;
  },
  panel(sub) {
    if (sub === 'nuevo') return html`<header><h2>Puesto nuevo</h2><button class="cerrar" data-a="cerrar" aria-label="Cerrar">✕</button></header>
      <form data-f="puesto-nuevo" class="forma"><label class="campo doble"><span>Nombre</span><input name="nombre" required maxlength="120"></label>
        <label class="campo"><span>Área</span><select name="area">${['Dirección', 'Producción', 'Comercial', 'Logística', 'Compras', 'Dinero', 'Personas', 'Datos', 'Calidad'].map((a) => html`<option>${a}</option>`)}</select></label>
        <label class="campo"><span>Se contrata desde (piezas/sem)</span><input name="disparador" type="number" min="0" step="1" value="0"></label>
        <label class="campo"><span>Una plaza por cada (piezas/sem)</span><input name="por_piezas" type="number" min="0" step="1" value="0"></label>
        <label class="campo"><span>Sueldo mensual</span><input name="sueldo" type="number" min="0" step="100" value="0"></label>
        <button class="boton lleno">Agregar</button></form>`;
    const p = S.puestos.find((x) => x.id === Number(sub));
    if (!p) return null;
    const hoy = piezasSemana(), n = plazas(p, hoy), cs = candidatosDe(p.id);
    return html`<header><div>${etiqueta(p.area)} ${etiqueta(p.estado, p.estado === 'Contratado' ? 'negra' : '')}<h2>${p.nombre}</h2><p class="tenue">${p.disparador ? `Se contrata desde ${num(p.disparador)} piezas por semana` : 'Desde el inicio'}${p.por_piezas ? `; una plaza por cada ${num(p.por_piezas)}` : ''}. Hoy hacen falta ${n}; hay ${p.ocupadas}.</p></div><button class="cerrar" data-a="cerrar" aria-label="Cerrar">✕</button></header>
      ${n > p.ocupadas ? html`<p class="alerta roja">Toca contratar ${n - p.ocupadas}: ya se pasó el disparador.</p>` : ''}
      <h4>Qué hace</h4><p>${p.hace}</p><h4>Perfil</h4><p>${p.perfil}</p><h4>Qué mide</h4><p>${p.mide}</p><h4>Dónde buscar</h4><p>${p.donde}</p><h4>Cómo elegir</h4><p>${p.prueba}</p>
      <div class="forma">
        ${campo('puestos', p.id, 'estado', p.estado, { rotulo: 'Estado', opciones: S.estados.puestos })}
        ${campo('puestos', p.id, 'ocupadas', p.ocupadas, { rotulo: 'Plazas ocupadas', tipo: 'number', paso: '1' })}
        ${campo('puestos', p.id, 'persona', p.persona, { rotulo: 'Quién lo ocupa', ancho: 'doble' })}
        ${campo('puestos', p.id, 'sueldo', p.sueldo, { rotulo: 'Sueldo mensual', tipo: 'number', paso: '100' })}
        ${campo('puestos', p.id, 'area', p.area, { rotulo: 'Área', opciones: ['Dirección', 'Producción', 'Comercial', 'Logística', 'Compras', 'Dinero', 'Personas', 'Datos', 'Calidad'] })}
        ${campo('puestos', p.id, 'disparador', p.disparador, { rotulo: 'Se contrata desde (piezas/sem)', tipo: 'number', paso: '1' })}
        ${campo('puestos', p.id, 'por_piezas', p.por_piezas, { rotulo: 'Una plaza por cada (piezas/sem)', tipo: 'number', paso: '1' })}
        ${campo('puestos', p.id, 'orden', p.orden, { rotulo: 'Orden', tipo: 'number', paso: '1' })}
        ${campo('puestos', p.id, 'nombre', p.nombre, { rotulo: 'Nombre' })}
        ${campo('puestos', p.id, 'hace', p.hace, { rotulo: 'Qué hace', tipo: 'area', ancho: 'doble' })}
        ${campo('puestos', p.id, 'perfil', p.perfil, { rotulo: 'Perfil', tipo: 'area', ancho: 'doble' })}
        ${campo('puestos', p.id, 'mide', p.mide, { rotulo: 'Qué mide', tipo: 'area', ancho: 'doble' })}
        ${campo('puestos', p.id, 'donde', p.donde, { rotulo: 'Dónde buscar', tipo: 'area', ancho: 'doble' })}
        ${campo('puestos', p.id, 'prueba', p.prueba, { rotulo: 'Cómo elegir', tipo: 'area', ancho: 'doble' })}
        ${campo('puestos', p.id, 'notas', p.notas, { rotulo: 'Notas', tipo: 'area', ancho: 'doble' })}
      </div>
      <h4>Candidatos<span class="cuenta">${cs.length}</span></h4>
      ${cs.length ? html`<div class="tabla-caja"><table class="tabla editable"><thead><tr><th>Nombre</th><th>Fuente</th><th>Estado</th><th>Calif.</th><th></th></tr></thead><tbody>
        ${cs.map((c) => html`<tr><th>${c.nombre}<small>${c.whatsapp ? html`<a href="https://wa.me/${(c.whatsapp.replace(/\D/g, '').length === 10 ? '52' : '') + c.whatsapp.replace(/\D/g, '')}" target="_blank" rel="noopener">${c.whatsapp}</a>` : ''}</small></th><td>${c.fuente}</td><td>${campo('candidatos', c.id, 'estado', c.estado, { opciones: S.estados.candidatos })}</td><td>${campo('candidatos', c.id, 'calificacion', c.calificacion, { tipo: 'number', paso: '1' })}</td><td>${c.estado === 'Contratado' ? '' : html`<button class="enlace" data-a="contratar" data-id="${c.id}">Contratar</button> `}<button class="enlace" data-a="borrar-candidato" data-id="${c.id}" aria-label="Borrar">✕</button></td></tr>`)}</tbody></table></div>` : ''}
      <form data-f="candidato" data-id="${p.id}" class="forma enlinea"><label class="campo"><span>Nombre</span><input name="nombre" required></label><label class="campo"><span>WhatsApp</span><input name="whatsapp" type="tel"></label><label class="campo"><span>Fuente</span><input name="fuente" placeholder="Referido, Facebook, OCC…"></label><button class="boton">+ Candidato</button></form>
      <p class="tenue">Cuando un candidato pasa a «Contratado», súbele una plaza ocupada al puesto y anótalo en «Quién lo ocupa».</p>
      ${bitacoraDe('puestos', p.id)}
      <p class="fin"><button class="enlace" data-a="borrar-puesto" data-id="${p.id}">Borrar este puesto</button></p>`;
  },
  acciones: {
    async 'borrar-puesto'(el) { if (await borrar('puestos', el.dataset.id, '¿Borrar este puesto y sus candidatos?')) location.hash = '#/equipo'; },
    'borrar-candidato': (el) => borrar('candidatos', el.dataset.id, '¿Borrar este candidato?'),
    async contratar(el) {
      const c = S.candidatos.find((x) => x.id === Number(el.dataset.id)), p = S.puestos.find((x) => x.id === c.puesto_id);
      if (!confirm(`¿Contratar a ${c.nombre} como ${p.nombre}? Sube una plaza ocupada y queda anotado.`)) return;
      await guardar('candidatos', c.id, { estado: 'Contratado' }, { callado: true });
      await guardar('puestos', p.id, { ocupadas: p.ocupadas + 1, estado: 'Contratado', persona: [p.persona, c.nombre].filter(Boolean).join(', ') });
      try { await api('POST', 'nota', { cosa: 'puestos', cosa_id: p.id, texto: `Contratado: ${c.nombre} (${c.fuente || 'sin fuente'})` }); await cargar(); } catch { /* la nota es extra */ }
    },
  },
  formularios: {
    async 'puesto-nuevo'(f, d) { const r = await crear('puestos', { ...d, disparador: Number(d.disparador), por_piezas: Number(d.por_piezas), sueldo: Number(d.sueldo), orden: S.puestos.length + 1 }); if (r) location.hash = `#/equipo/${r.fila.id}`; },
    candidato: (f, d) => crear('candidatos', { puesto_id: Number(f.dataset.id), ...d }),
  },
};

// ───────── Datos: la sala de datos, todo en una pantalla ─────────
export const datos = {
  id: 'datos', titulo: 'Datos', grupo: '',
  botones: () => html`<button class="boton" data-a="copiar-resumen">Copiar el resumen</button>`,
  pintar() {
    const hoy = piezasSemana(), r = resultado(mesHoy()), c = caja(), ca = cartuchos(), f = porFabricar(), pc = porCobrar(), pp = porPagar(), ps = pendientes();
    const porEstado = S.estados.pedidos.map((e) => [e, S.pedidos.filter((p) => p.estado === e)]).filter(([, xs]) => xs.length);
    const activos = S.distribuidores.filter((d) => ['Piloto', 'Activo'].includes(d.estado)), tiendas = activos.reduce((s, d) => s + (d.tiendas || 0), 0);
    const rutasHoy = S.rutas.filter((x) => x.estado !== 'Terminada'), pl = plantilla(hoy), part = (hoy * 52) / aj('mercado_piezas_anio', 697000000) * 100;
    const riesgos = S.tareas.filter((t) => t.seccion === 'Validar' && !['Hecho', 'Descartado'].includes(t.estado)), fase = FASES.find((x) => x.n === aj('fase_actual', 1)) || FASES[0];
    const cobertura = S.inventario.map((i) => ({ i, queda: i.existencia - (f.pide[i.clave] || 0) })).filter((x) => x.queda < 0);
    const semanas = [3, 2, 1, 0].map((n) => { const d = new Date(Date.now() - n * 7 * 86400000).toISOString().slice(0, 10), d0 = new Date(Date.now() - (n + 1) * 7 * 86400000).toISOString().slice(0, 10); return S.pedidos.filter((p) => p.creado.slice(0, 10) > d0 && p.creado.slice(0, 10) <= d && p.estado !== 'Recibido').reduce((s, p) => s + p.piezas, 0); });
    const maxS = Math.max(1, ...semanas), t = temporadas()[0];
    return html`<div class="rejilla">
      <section class="bloque doble"><h2>El negocio, ahora mismo</h2><div class="cifras">
        <div><b>${num(hoy)}</b><span>piezas por semana · ${part < 0.01 ? '<0.01' : num(part, 2)}% de México · meta ${aj('meta_participacion', 25)}%</span></div>
        <div><b>${dinero(r.ventas)}</b><span>ventas del mes sin IVA · EBITDA ${dinero(r.ebitda)}</span></div>
        <div><b>${dinero(c.saldo)}</b><span>en caja · por cobrar ${dinero(pc.reduce((s, p) => s + p.total, 0))} · por pagar ${dinero(pp.reduce((s, x) => s + x.total, 0))}</span></div>
        <div><b>${num(tiendas)}</b><span>tiendas activas · ${activos.length} distribuidores activos · ${S.distribuidores.filter((d) => d.estado === 'Nuevo').length} solicitudes nuevas</span></div>
        <div><b>${ca.tasa == null ? '—' : Math.round(ca.tasa * 100) + '%'}</b><span>de los cartuchos regresa · ${num(ca.fuera)} fuera</span></div>
        <div><b>${S.puestos.reduce((s, p) => s + p.ocupadas, 0)}</b><span>personas · ${pl.faltan.length ? `toca contratar ${pl.faltan.length}` : 'nadie pendiente'}</span></div></div>
        <p class="tenue">Fase ${fase.n} · ${fase.nombre}: ${fase.pasa} ${t ? `Próxima temporada: ${t.nombre} en ${t.dias} días.` : ''}</p></section>
      <section class="bloque"><h2>Pedidos en proceso<span class="cuenta">${abiertos().length}</span></h2>
        ${porEstado.length ? html`<ul class="lista">${porEstado.map(([e, xs]) => html`<li><b><a href="#/pedidos">${e}</a></b><span>${xs.length} · ${num(xs.reduce((s, p) => s + p.piezas, 0))} piezas · ${xs.reduce((s, p) => s + p.rejas, 0)} rejas</span></li>`)}</ul>` : html`<p class="vacio">Sin pedidos.</p>`}</section>
      <section class="bloque"><h2>Últimas 4 semanas</h2><ul class="lista barras">${semanas.map((n, i) => html`<li><b>${['Hace 3 semanas', 'Hace 2 semanas', 'La semana pasada', 'Esta semana'][i]}</b>${barra(n, maxS)}<span>${num(n)}</span></li>`)}</ul><p class="tenue">Piezas pedidas (confirmadas o más) por semana.</p></section>
      <section class="bloque"><h2>Operación</h2><ul class="lista">
        <li><b>Por fabricar</b><span>${num(f.piezas)} piezas de ${f.pedidos.length} pedido(s)</span></li>
        <li><b>Material que falta</b><span>${cobertura.length ? cobertura.map((x) => x.i.nombre.split(' (')[0]).join(', ') : 'nada'}</span></li>
        <li><b>Rutas abiertas</b><span>${rutasHoy.length} · ${rutasHoy.reduce((s, x) => s + cargaDe(x).rejas, 0)} rejas</span></li>
        <li><b>Listos sin ruta</b><span>${S.pedidos.filter((p) => !p.ruta_id && p.estado === 'Listo').length}</span></li>
        <li><b>Compras abiertas</b><span>${S.compras.filter((x) => !['Pagada', 'Cancelada'].includes(x.estado)).length}</span></li>
        <li><b>Lotes rechazados</b><span>${S.lotes.filter((l) => l.resultado === 'Rechazado').length} de ${S.lotes.length}</span></li></ul></section>
      <section class="bloque"><h2>Dinero</h2><ul class="lista">
        <li><b>Cobrado este mes</b><span>${dinero(r.cobrado)}</span></li>
        <li><b>Margen bruto</b><span>${r.ventas ? Math.round(r.margen * 100) + '%' : '—'}</span></li>
        <li><b>Gastos del mes</b><span>${dinero(r.gasto)}</span></li>
        <li><b>Nómina mensual</b><span>${dinero(nomina())}</span></li>
        <li><b>Cartera vencida (más de ${aj('dias_cobro', 30)} días)</b><span>${dinero(pc.filter((p) => -diasA(p.entregado_fecha) > aj('dias_cobro', 30)).reduce((s, p) => s + p.total, 0))}</span></li>
        <li><b>Depósitos de cartuchos fuera</b><span>${dinero(ca.depositos)}</span></li></ul></section>
      <section class="bloque"><h2>Pendiente ahora<span class="cuenta">${ps.length}</span></h2>${ps.length ? html`<ul class="lista">${ps.slice(0, 8).map((p) => html`<li><a href="${p.liga}"><b>${p.titulo}</b></a><span>${p.detalle}</span></li>`)}</ul>` : html`<p class="vacio">Nada pendiente.</p>`}</section>
      <section class="bloque"><h2>Supuestos por validar<span class="cuenta">${riesgos.length}</span></h2>${riesgos.length ? html`<ul class="lista">${riesgos.slice(0, 8).map((x) => html`<li><a href="#/proyecto/${x.id}"><b>${x.titulo.replace('Validar: ', '')}</b></a><span>${x.estado}</span></li>`)}</ul>` : html`<p class="vacio">Todo validado.</p>`}</section>
    </div>`;
  },
  acciones: {
    async 'copiar-resumen'() {
      const hoy = piezasSemana(), r = resultado(mesHoy()), c = caja(), ca = cartuchos(), pc = porCobrar();
      const activos = S.distribuidores.filter((d) => ['Piloto', 'Activo'].includes(d.estado));
      const t = [`La Vela · ${fecha(new Date().toISOString())}`, `Piezas por semana: ${num(hoy)}`, `Ventas del mes sin IVA: ${dinero(r.ventas)} · EBITDA: ${dinero(r.ebitda)}`, `Caja: ${dinero(c.saldo)} · por cobrar: ${dinero(pc.reduce((s, p) => s + p.total, 0))}`,
        `Distribuidores activos: ${activos.length} · tiendas: ${num(activos.reduce((s, d) => s + (d.tiendas || 0), 0))}`, `Cartuchos que regresan: ${ca.tasa == null ? '—' : Math.round(ca.tasa * 100) + '%'}`, `Pedidos abiertos: ${abiertos().length}`, `Equipo: ${S.puestos.reduce((s, p) => s + p.ocupadas, 0)} personas`].join('\n');
      try { await navigator.clipboard.writeText(t); aviso('Resumen copiado'); } catch { aviso('No se pudo copiar', true); }
    },
  },
};
void _RLR; void _k; void _rev; void guardar;
