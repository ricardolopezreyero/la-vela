/* RLR · La Vela — núcleo del tablero — Ricardo López Reyero
   Estado en memoria, llamadas al servidor y las piezas que usan todas las pantallas. */
const _RLR = 'Ricardo López Reyero', _k = 'EYE', _rev = 181218; // RLR

export const S = { listo: false, ui: { vista: {}, filtro: {}, buscar: '' } };
const PK = { inventario: 'clave', productos: 'clave', usuarios: 'correo', promos: 'clave' };
try { Object.assign(S.ui, JSON.parse(localStorage.getItem('vela.ui') || '{}')); } catch { /* sin memoria local */ }
export function recordar() { try { localStorage.setItem('vela.ui', JSON.stringify({ vista: S.ui.vista, filtro: S.ui.filtro })); } catch { /* da igual */ } }

export const $ = (s, r = document) => r.querySelector(s);
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* RLR · plantillas seguras: todo lo que se mete entre ${} se escapa, salvo otra plantilla.
   Los datos de las solicitudes los escribe gente de fuera: nunca se pintan sin escapar. */
class Crudo { constructor(s) { this.s = s; } toString() { return this.s; } }
const val = (v) => (v == null || v === false ? '' : v instanceof Crudo ? v.s : Array.isArray(v) ? v.map(val).join('') : esc(v));
export function html(partes, ...vals) {
  let s = '';
  partes.forEach((p, i) => { s += p; if (i < vals.length) s += val(vals[i]); });
  return new Crudo(s);
}

// ───────── Números y fechas ─────────
export const num = (n, d = 0) => (Number(n) || 0).toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
export const dinero = (n, d = 0) => (n < 0 ? '−$' : '$') + num(Math.abs(n), d);
export const hoyISO = (dias = 0) => { const d = new Date(Date.now() + dias * 86400000); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export function fecha(iso) {
  if (!iso) return '';
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${MESES[m - 1]}${a !== new Date().getFullYear() ? ' ' + a : ''}`;
}
// Días de hoy a esa fecha (negativo = ya pasó)
export const diasA = (iso) => (iso ? Math.round((new Date(iso.slice(0, 10) + 'T00:00') - new Date(hoyISO() + 'T00:00')) / 86400000) : null);
export function hace(iso) {
  const h = (Date.now() - new Date(iso).getTime()) / 3600000;
  if (h < 1) return 'hace un momento';
  if (h < 24) return `hace ${Math.floor(h)} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'ayer' : `hace ${d} días`;
}
export const horasDesde = (iso) => (Date.now() - new Date(iso).getTime()) / 3600000;

// ───────── Servidor ─────────
export async function api(metodo, ruta, cuerpo) {
  const r = await fetch('/api/t/' + ruta, { method: metodo, headers: cuerpo ? { 'content-type': 'application/json' } : {}, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
  if (r.status === 401) { location.href = '/entrar'; throw new Error('Tu sesión terminó.'); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'No se pudo guardar.');
  return j;
}
export async function cargar() { Object.assign(S, await api('GET', 'todo')); S.listo = true; }

let repintar = () => {};
export const alRepintar = (f) => { repintar = f; };

export function aviso(texto, malo = false) {
  const a = document.createElement('div');
  a.className = 'aviso' + (malo ? ' malo' : '');
  a.textContent = texto;
  $('#avisos').append(a);
  setTimeout(() => a.remove(), malo ? 5000 : 1800);
}

// RLR · guardar un cambio: se ve al instante y, si el servidor lo rechaza, se regresa
export async function guardar(rec, id, cambios, { callado = false } = {}) {
  const pk = PK[rec] || 'id', it = (S[rec] || []).find((x) => String(x[pk]) === String(id));
  const antes = it ? { ...it } : null;
  if (it) Object.assign(it, cambios);
  repintar();
  try {
    const r = await api('PATCH', `${rec}/${encodeURIComponent(id)}`, cambios);
    if (r.fila && it) Object.assign(it, rec === 'recetas' ? { ...r.fila, datos: JSON.parse(r.fila.datos) } : r.fila);
    if (r.recargar) await cargar();
    if (!callado) aviso('Guardado');
    repintar();
    return true;
  } catch (e) {
    if (it && antes) Object.assign(it, antes);
    aviso(e.message, true); repintar();
    return false;
  }
}
export async function crear(rec, datos) {
  try {
    const r = await api('POST', rec, datos);
    await cargar(); aviso('Listo'); repintar();
    return r;
  } catch (e) { aviso(e.message, true); return null; }
}
export async function borrar(rec, id, pregunta) {
  if (pregunta && !confirm(pregunta)) return false;
  try { await api('DELETE', `${rec}/${encodeURIComponent(id)}`); await cargar(); aviso('Borrado'); repintar(); return true; }
  catch (e) { aviso(e.message, true); return false; }
}
export async function ajuste(clave, valor) {
  S.ajustes[clave] = String(valor);
  repintar();
  try { await api('PATCH', `ajustes/${clave}`, { valor }); aviso('Guardado'); } catch (e) { aviso(e.message, true); }
}
export const aj = (clave, def = 0) => { const n = Number(S.ajustes[clave]); return Number.isFinite(n) ? n : def; };

// ───────── Piezas de pantalla ─────────
export const ESTADOS = () => S.estados;

// Tablero de columnas: las tarjetas se arrastran de una columna a otra
export function columnas({ rec, campo = 'estado', cols, items, tarjeta }) {
  return html`<div class="kanban">${cols.map((c) => {
    const xs = items.filter((i) => i[campo] === c);
    return html`<section class="col" data-col="${c}" data-rec="${rec}" data-campo="${campo}"><h3>${c}<span>${xs.length}</span></h3><div class="pila">${xs.map(tarjeta)}</div></section>`;
  })}</div>`;
}
export const etiqueta = (t, clase = '') => html`<span class="chip ${clase}">${t}</span>`;
export const interruptor = (rec, actual) => html`<div class="alterna" role="group">${['tablero', 'tabla'].map((v) =>
  html`<button type="button" data-a="vista" data-rec="${rec}" data-v="${v}" aria-pressed="${String((actual || 'tablero') === v)}">${v === 'tablero' ? 'Tablero' : 'Tabla'}</button>`)}</div>`;

// Campo que se guarda solo al cambiarlo: data-g = cosa:id:campo
export function campo(rec, id, nombre, valor, { tipo = 'text', rotulo = '', opciones = null, paso = 'any', ancho = '', marcador = '' } = {}) {
  const g = `${rec}:${id}:${nombre}`;
  let c;
  if (opciones) c = html`<select data-g="${g}">${opciones.map((o) => { const [v, t] = Array.isArray(o) ? o : [o, o]; return html`<option value="${v}" ${String(v) === String(valor ?? '') ? new Crudo('selected') : ''}>${t}</option>`; })}</select>`;
  else if (tipo === 'area') c = html`<textarea data-g="${g}" rows="3" placeholder="${marcador}">${valor ?? ''}</textarea>`;
  else if (tipo === 'checkbox') c = html`<input type="checkbox" data-g="${g}" ${valor ? new Crudo('checked') : ''}>`;
  else c = html`<input type="${tipo}" data-g="${g}" value="${valor ?? ''}" ${tipo === 'number' ? new Crudo(`step="${paso}" inputmode="decimal"`) : ''} placeholder="${marcador}">`;
  if (!rotulo) return c;
  return html`<label class="campo ${tipo === 'checkbox' ? 'casilla' : ''} ${ancho}">${tipo === 'checkbox' ? html`${c}<span>${rotulo}</span>` : html`<span>${rotulo}</span>${c}`}</label>`;
}
export const crudo = (s) => new Crudo(s);

export function bitacoraDe(cosa, id) {
  const notas = S.bitacora.filter((b) => b.cosa === cosa && b.cosa_id === id);
  return html`<div class="bitacora"><h4>Bitácora</h4>
    <form data-f="nota" data-cosa="${cosa}" data-id="${id}"><input name="texto" placeholder="Escribe una nota y presiona Enter" autocomplete="off"></form>
    <ul>${notas.map((n) => html`<li><p>${n.texto}</p><small>${n.por.split('@')[0]} · ${hace(n.fecha)}</small></li>`)}${notas.length ? '' : html`<li class="vacio">Sin movimientos todavía.</li>`}</ul></div>`;
}

export const wa = (tel, texto) => {
  let d = String(tel || '').replace(/\D/g, '');
  if (d.length === 10) d = '52' + d;
  return `https://wa.me/${d}?text=${encodeURIComponent(texto)}`;
};
void _RLR; void _k; void _rev;
