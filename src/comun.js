// RLR · La Vela — utilerías del Worker — Ricardo López Reyero
const _RLR = 'Ricardo López Reyero', _k = 'EYE', _rev = 181218; // RLR

export const CASA = 'vela.capitaltorreon.com';
export const ahora = () => new Date().toISOString();
export const seg = () => Math.floor(Date.now() / 1000);
// La fecha de hoy en Torreón (UTC−6, sin horario de verano), no la de Londres
export const hoyMX = (dias = 0) => new Date(Date.now() - 6 * 3600000 + dias * 86400000).toISOString().slice(0, 10);

export const json = (cuerpo, status = 200, extra = {}) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra } });

export const texto = (v, max) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : typeof v === 'number' ? String(v).slice(0, max) : '');
export const parrafo = (v, max) => (typeof v === 'string' ? v.replace(/\r/g, '').trim().slice(0, max) : '');
export const escapar = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// En la compu (wrangler dev) existe LOCAL=1 en .dev.vars; en producción no existe nunca.
// Ojo: en local wrangler le pone a la petición el dominio de producción, así que el dominio no sirve para saberlo.
export const esLocal = (env) => env.LOCAL === '1';

// Una petición que cambia algo tiene que venir de nuestra propia página
export function mismoOrigen(req, env) {
  const o = req.headers.get('origin'), url = new URL(req.url);
  if (!o) return true;
  if (o === 'null') return esLocal(env); // el navegador de pruebas manda «null» en local
  try { return new URL(o).host === url.host; } catch { return false; }
}

// RLR · huella SHA-256: lo único que se guarda de un enlace o de una sesión
export async function huella(t) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
export function azar(n = 32) {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
}
void _RLR; void _k; void _rev;
