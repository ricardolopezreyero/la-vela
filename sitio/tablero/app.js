/* RLR · La Vela — armazón del tablero — Ricardo López Reyero
   Menú, rutas (#/seccion/detalle), panel lateral, arrastrar tarjetas y guardado al cambiar. Nada abre otra página. */
import { $, S, ajuste, alRepintar, api, aviso, cargar, crudo, guardar, html, recordar } from './nucleo.js';
import { distribuidores, hoy, pedidos } from './comercial.js';
import { cartuchosVista, indicadores, produccion } from './operacion.js';
import { ajustes, modelo, proyecto, receta } from './saber.js';

const _RLR = 'Ricardo López Reyero', _k = 'EYE', _rev = 181218; // RLR

const VISTAS = Object.fromEntries([hoy, distribuidores, pedidos, produccion, cartuchosVista, indicadores, proyecto, receta, modelo, ajustes].map((v) => [v.id, v]));
const GRUPOS = ['', 'Comercial', 'Operación', 'Proyecto'];
const LLAMA = '<svg viewBox="0 0 15 24" aria-hidden="true"><path fill="currentColor" d="M7.5 0C9 4 13 6.5 13 11a5.5 5.5 0 0 1-11 0C2 6.5 6 4 7.5 0Z"/><rect fill="currentColor" x="1" y="19" width="13" height="5"/></svg>';

const ruta = () => { const [sec = 'hoy', ...resto] = location.hash.replace(/^#\/?/, '').split('/'); return [VISTAS[sec] ? sec : 'hoy', resto.join('/')]; };
let pintada = '';

// Lo que la persona tiene escrito y aún no se guarda: se respeta al repintar
function recordarEscrito() {
  const a = document.activeElement;
  if (!a || !/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return null;
  const f = a.closest('form[data-f]');
  const llave = a.dataset.g ? `[data-g="${CSS.escape(a.dataset.g)}"]` : a.dataset.ajuste ? `[data-ajuste="${a.dataset.ajuste}"]` : 'buscar' in a.dataset ? '[data-buscar]' : null;
  return { llave, valor: a.value, cursor: a.selectionStart, forma: f ? { f: f.dataset.f, id: f.dataset.id || '', nombre: a.name, datos: [...f.elements].filter((e) => e.name).map((e) => [e.name, e.type === 'checkbox' ? e.checked : e.value]) } : null };
}
function devolverEscrito(m) {
  if (!m) return;
  let el = null;
  if (m.forma) {
    const f = document.querySelector(`form[data-f="${m.forma.f}"]${m.forma.id ? `[data-id="${m.forma.id}"]` : ''}`);
    if (f) { for (const [n, v] of m.forma.datos) { const e = f.elements[n]; if (e) { if (e.type === 'checkbox') e.checked = v; else e.value = v; } } el = f.elements[m.forma.nombre]; }
  } else if (m.llave) { el = document.querySelector(m.llave); if (el && el.type !== 'checkbox' && el.tagName !== 'SELECT') el.value = m.valor; }
  if (el) { el.focus({ preventScroll: true }); try { if (m.cursor != null) el.setSelectionRange(m.cursor, m.cursor); } catch { /* no todos los campos tienen cursor */ } }
}

// RLR · pinta todo: menú, barra de arriba, la pantalla y, si toca, el panel
function pintar() {
  if (!S.listo) return;
  const [sec, sub] = ruta(), v = VISTAS[sec], escrito = recordarEscrito();
  $('#lado').innerHTML = html`<a class="marca" href="#/hoy">${crudo(LLAMA)}La Vela</a>
    <nav>${GRUPOS.map((g) => html`${g ? html`<p class="grupo">${g}</p>` : ''}${Object.values(VISTAS).filter((x) => x.grupo === g && x.id !== 'ajustes').map((x) => { const n = x.cuenta ? x.cuenta() : 0;
      return html`<a href="#/${x.id}" aria-current="${x.id === sec ? 'page' : 'false'}">${x.titulo}${n ? html`<span class="cuenta">${n}</span>` : ''}</a>`; })}`)}</nav>
    <div class="abajo"><a href="#/ajustes" aria-current="${sec === 'ajustes' ? 'page' : 'false'}">Ajustes</a><a href="/" class="tenue">Ver el sitio</a><p>${S.yo.nombre || S.yo.correo}</p></div>`;
  $('#tope').innerHTML = html`<button class="menu" data-a="menu" aria-label="Menú">☰</button><h1>${v.titulo}</h1><div class="acciones">${v.botones ? v.botones() : ''}</div>`;
  const clave = v.fijo ? sec : '';
  if (!clave || clave !== pintada) $('#vista').innerHTML = v.pintar(sub);
  pintada = clave;
  $('#vista').className = 'v-' + sec;
  const p = v.panel && sub ? v.panel(sub) : null, panel = $('#panel');
  if (p) { const arriba = panel.dataset.de === `${sec}/${sub}` ? panel.scrollTop : 0; panel.innerHTML = p; panel.hidden = false; panel.dataset.de = `${sec}/${sub}`; panel.scrollTop = arriba; }
  else { panel.hidden = true; panel.innerHTML = ''; panel.dataset.de = ''; }
  $('#velo').hidden = !p;
  document.title = `${v.titulo} · La Vela`;
  devolverEscrito(escrito);
}
alRepintar(pintar);

const accionesBase = {
  ir: (el) => { location.hash = '#/' + el.dataset.ruta; },
  cerrar: () => { location.hash = '#/' + ruta()[0]; },
  vista: (el) => { S.ui.vista[el.dataset.rec] = el.dataset.v; },
  menu: () => document.body.classList.toggle('con-menu'),
};
const accion = (nombre) => accionesBase[nombre] || VISTAS[ruta()[0]].acciones?.[nombre];

async function correr(nombre, el, ev) {
  const f = accion(nombre);
  if (!f) return;
  await f(el, ev);
  recordar(); pintar();
}

document.addEventListener('click', (ev) => {
  if (ev.target.closest('#velo')) return accionesBase.cerrar();
  const el = ev.target.closest('[data-a]');
  if (!el) return;
  // Si se tocó una liga, un botón o un campo que está DENTRO de una tarjeta o renglón, manda lo de adentro
  const dentro = ev.target.closest('a, button, input, select, textarea, label');
  if (dentro && dentro !== el && el.contains(dentro)) return;
  if (el.tagName !== 'A') ev.preventDefault();
  document.body.classList.remove('con-menu');
  correr(el.dataset.a, el, ev);
});
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && !$('#panel').hidden) accionesBase.cerrar();
  if (ev.key === 'Enter' && ev.target.matches('.tarjeta')) correr('ir', ev.target, ev);
});

// Guardar al cambiar: cada campo dice qué es con data-g = cosa:id:campo
document.addEventListener('change', (ev) => {
  const el = ev.target;
  if (el.dataset.g) {
    const [rec, id, nombre] = el.dataset.g.split(':');
    const valor = el.type === 'checkbox' ? (el.checked ? 1 : 0) : el.type === 'number' ? (el.value === '' ? null : Number(el.value)) : el.value;
    guardar(rec, id, { [nombre]: valor });
  } else if (el.dataset.ajuste) ajuste(el.dataset.ajuste, el.value);
  else if (el.dataset.aCambio) correr(el.dataset.aCambio, el, ev);
  else if ('envia' in el.dataset) el.form.requestSubmit();
});
document.addEventListener('input', (ev) => {
  const el = ev.target;
  if ('buscar' in el.dataset) { S.ui.buscar = el.value; pintar(); return; }
  const f = el.closest('form[data-vivo]');
  if (f) { const v = VISTAS[ruta()[0]].vivo?.[f.dataset.vivo]; if (v) $('#vivo-' + f.dataset.vivo).innerHTML = v(Object.fromEntries(new FormData(f))); }
});
document.addEventListener('submit', async (ev) => {
  const f = ev.target.closest('form[data-f]');
  if (!f) return;
  ev.preventDefault();
  const d = Object.fromEntries(new FormData(f));
  if (f.dataset.f === 'nota') {
    if (!d.texto.trim()) return;
    try { await api('POST', 'nota', { cosa: f.dataset.cosa, cosa_id: Number(f.dataset.id), texto: d.texto }); f.reset(); await cargar(); } catch (e) { aviso(e.message, true); }
    return pintar();
  }
  const h = VISTAS[ruta()[0]].formularios?.[f.dataset.f];
  if (!h) return;
  const boton = f.querySelector('button:not([type=button])');
  if (boton) boton.disabled = true;
  await h(f, d);
  if (boton && boton.isConnected) boton.disabled = false;
  if (f.isConnected && !['receta', 'pedido-lineas'].includes(f.dataset.f)) f.reset();
  pintar();
});

// Arrastrar una tarjeta a otra columna le cambia la etapa
document.addEventListener('dragstart', (ev) => { const t = ev.target.closest?.('.tarjeta'); if (t) { ev.dataTransfer.setData('text/plain', t.dataset.arr); ev.dataTransfer.effectAllowed = 'move'; t.classList.add('arrastra'); } });
document.addEventListener('dragend', (ev) => { ev.target.classList?.remove('arrastra'); document.querySelectorAll('.col.sobre').forEach((c) => c.classList.remove('sobre')); });
document.addEventListener('dragover', (ev) => { const c = ev.target.closest?.('.col'); if (c) { ev.preventDefault(); c.classList.add('sobre'); } });
document.addEventListener('dragleave', (ev) => { const c = ev.target.closest?.('.col'); if (c && !c.contains(ev.relatedTarget)) c.classList.remove('sobre'); });
document.addEventListener('drop', (ev) => {
  const c = ev.target.closest?.('.col'), id = ev.dataTransfer.getData('text/plain');
  if (!c || !id) return;
  ev.preventDefault();
  guardar(c.dataset.rec, id, { [c.dataset.campo]: c.dataset.col });
});

window.addEventListener('hashchange', () => { S.ui.editando = S.ui.editando && ruta()[0] === 'receta' ? S.ui.editando : 0; pintar(); window.scrollTo(0, 0); });

// Se pone al día solo, sin pisar lo que alguien está escribiendo
let ultima = Date.now();
async function refrescar() {
  if (document.hidden || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) return;
  try { await cargar(); ultima = Date.now(); pintar(); } catch { /* se intenta en la próxima */ }
}
setInterval(refrescar, 90000);
window.addEventListener('focus', () => { if (Date.now() - ultima > 30000) refrescar(); });

cargar().then(pintar).catch((e) => { $('#vista').innerHTML = html`<p class="vacio">No se pudo cargar el tablero: ${e.message}</p>`; });
void _RLR; void _k; void _rev;
