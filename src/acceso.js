// RLR · La Vela — acceso por enlace mágico — Ricardo López Reyero
// Sin contraseñas. Entra quien esté en la tabla «usuarios»:
//   /entrar → POST /api/entrar → correo con /acceso?t=… (15 min, un solo uso)
//   abrir el enlace enseña un botón (el GET no lo gasta: los antivirus de correo abren las ligas)
//   POST /acceso gasta el enlace y deja la cookie de sesión (30 días) → /tablero/
import { ahora, azar, escapar, esLocal, huella, json, mismoOrigen, seg, texto } from './comun.js';
import { enviar, plantilla } from './correo.js';

const _RLR = 'Ricardo López Reyero', _k = 'EYE', _rev = 181218; // RLR
const DURA_ENLACE = 15 * 60, DURA_SESION = 30 * 86400, COOKIE = 'vela_sesion';

const PRIVADO = { 'cache-control': 'no-store, no-transform', 'x-frame-options': 'DENY', 'referrer-policy': 'no-referrer', 'x-robots-tag': 'noindex' };

function cookieDe(req) {
  const m = (req.headers.get('cookie') || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([a-f0-9]{64})`));
  return m ? m[1] : '';
}

// RLR · quién está detrás de esta petición (o null). Si lo quitan de «usuarios», deja de entrar al instante.
export async function quienEntra(req, env) {
  const id = cookieDe(req);
  if (!id) return null;
  const fila = await env.DB.prepare(
    `SELECT u.correo, u.nombre, u.rol FROM sesiones s JOIN usuarios u ON u.correo = s.correo WHERE s.hash = ? AND s.vence > ?`
  ).bind(await huella(id), seg()).first();
  return fila || null;
}

export async function pedirEnlace(req, env, ctx) {
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  if (!mismoOrigen(req, env)) return json({ error: 'Origen no permitido.' }, 403);
  const inicio = Date.now(), url = new URL(req.url);
  let cuerpo = {};
  try { cuerpo = await req.json(); } catch { /* cuerpo vacío */ }
  const correo = texto(cuerpo.correo, 160).toLowerCase();
  const respuesta = { ok: true };
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) {
    const t = seg();
    const usuario = await env.DB.prepare('SELECT correo FROM usuarios WHERE correo = ?').bind(correo).first();
    if (usuario) {
      await env.DB.prepare('DELETE FROM enlaces WHERE vence < ?').bind(t).run();
      const { n } = await env.DB.prepare('SELECT COUNT(*) n FROM enlaces WHERE correo = ? AND creado > ?').bind(correo, t - DURA_ENLACE).first();
      if (n < 3) {
        const token = azar();
        await env.DB.prepare('INSERT INTO enlaces (hash, correo, vence, creado) VALUES (?, ?, ?, ?)').bind(await huella(token), correo, t + DURA_ENLACE, t).run();
        const liga = `${url.origin}/acceso?t=${token}`;
        ctx.waitUntil(enviar(env, {
          para: correo, asunto: 'Tu enlace para entrar a La Vela',
          html: plantilla({ titulo: 'Entra al tablero', lineas: ['Toca el botón para entrar. El enlace dura 15 minutos y sirve una sola vez.'], boton: 'Entrar al tablero', liga, pie: 'Si no lo pediste tú, ignora este correo: nadie entra sin este enlace.' }),
          texto: `Entra al tablero de La Vela: ${liga}\n\nEl enlace dura 15 minutos y sirve una sola vez.`,
        }));
        if (esLocal(env)) respuesta.enlace = `/acceso?t=${token}`; // solo en la compu, para probar sin correo
      }
    }
  }
  // La misma respuesta y el mismo tiempo, esté o no en la lista
  await new Promise((r) => setTimeout(r, Math.max(0, 700 - (Date.now() - inicio))));
  return json(respuesta);
}

function pagina(titulo, cuerpo) {
  return new Response(`<!doctype html>
<!-- RLR · La Vela — ${_RLR} -->
<html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapar(titulo)} · La Vela</title><meta name="robots" content="noindex"><link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/estilos.css"></head>
<body><main><section class="negra acceso" style="min-height:100vh"><div class="caja"><div class="tarjeta">
<p class="etiqueta">Tablero</p>${cuerpo}</div></div></section></main></body></html>`, { headers: { 'content-type': 'text/html; charset=utf-8', ...PRIVADO, 'referrer-policy': 'same-origin' } });
}

export async function paginaAcceso(req, env) {
  const t = new URL(req.url).searchParams.get('t') || '';
  const fila = /^[a-f0-9]{64}$/.test(t) ? await env.DB.prepare('SELECT correo FROM enlaces WHERE hash = ? AND vence > ?').bind(await huella(t), seg()).first() : null;
  if (!fila) return pagina('Enlace vencido', '<h1>Este enlace ya no sirve</h1><p class="aviso">Duran 15 minutos y sirven una sola vez. Pide uno nuevo.</p><a class="boton lleno" href="/entrar">Pedir otro enlace</a>');
  return pagina('Entrar', `<h1>Ya casi</h1><form method="post" action="/acceso"><input type="hidden" name="t" value="${t}"><button class="boton lleno" type="submit">Entrar al tablero</button></form>`);
}

export async function usarEnlace(req, env) {
  const url = new URL(req.url);
  // Aquí no se revisa el origen: quien trae el enlace trae la credencial, y un formulario
  // enviado desde una página sin «referrer» llega con Origin «null» en cualquier navegador.
  const t = String((await req.formData()).get('t') || '');
  const h = /^[a-f0-9]{64}$/.test(t) ? await huella(t) : '';
  const fila = h ? await env.DB.prepare('SELECT correo FROM enlaces WHERE hash = ? AND vence > ?').bind(h, seg()).first() : null;
  if (!fila) return Response.redirect(`${url.origin}/acceso?t=vencido`, 303);
  const sesion = azar();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM enlaces WHERE hash = ?').bind(h),
    env.DB.prepare('DELETE FROM sesiones WHERE vence < ?').bind(seg()),
    env.DB.prepare('INSERT INTO sesiones (hash, correo, vence, creada) VALUES (?, ?, ?, ?)').bind(await huella(sesion), fila.correo, seg() + DURA_SESION, seg()),
  ]);
  return new Response(null, { status: 303, headers: {
    location: '/tablero/', ...PRIVADO,
    'set-cookie': `${COOKIE}=${sesion}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${DURA_SESION}${esLocal(env) ? '' : '; Secure'}`,
  } });
}

export async function salir(req, env) {
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  if (!mismoOrigen(req, env)) return json({ error: 'Origen no permitido.' }, 403);
  const id = cookieDe(req);
  if (id) await env.DB.prepare('DELETE FROM sesiones WHERE hash = ?').bind(await huella(id)).run();
  return json({ ok: true }, 200, { 'set-cookie': `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` });
}

// Lo privado nunca se guarda en caché ni se mete en un marco
export function privado(r) {
  const h = new Headers(r.headers);
  for (const k in PRIVADO) h.set(k, PRIVADO[k]);
  return new Response(r.body, { status: r.status, headers: h });
}
void _k; void _rev; void ahora;
