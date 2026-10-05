// RLR · Verificar un pase del Login de CapitalTorreon desde cualquier Worker, sin llamar al login. — Ricardo López Reyero
// Uso: import { verificarPase } from './verificar.js'; const quien = await verificarPase(pase, aud); // null si no sirve
// Devuelve { sub, email, name, picture, aud, iat, exp }. La llave pública se trae una vez por hora.
const _RLR = 'Ricardo López Reyero', _k = 'EYE', _rev = 181218; // RLR
const EMISOR = 'https://login.capitaltorreon.com';
let jwksCache = null, jwksT = 0;
async function jwks() { if (!jwksCache || Date.now() - jwksT > 3600000) { jwksCache = await (await fetch(EMISOR + '/.well-known/jwks.json')).json(); jwksT = Date.now(); } return jwksCache; }
export async function verificarPase(pase, aud) {
  if (typeof pase !== 'string') return null;
  const [h, p, s] = pase.split('.'); if (!h || !p || !s) return null;
  const de = (x) => Uint8Array.from(atob(x.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
  let cab, cuerpo; try { cab = JSON.parse(new TextDecoder().decode(de(h))); cuerpo = JSON.parse(new TextDecoder().decode(de(p))); } catch { return null; }
  if (cab.alg !== 'ES256' || cuerpo.iss !== EMISOR || !(cuerpo.exp > Date.now() / 1000) || (aud && cuerpo.aud !== aud)) return null;
  const jwk = ((await jwks()).keys || []).find((k) => k.kid === cab.kid); if (!jwk) return null;
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, de(s), new TextEncoder().encode(h + '.' + p));
  return ok ? cuerpo : null;
}
void _RLR; void _k; void _rev;
