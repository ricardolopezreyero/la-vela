// RLR · La Vela — Worker — Ricardo López Reyero
// 1) Cualquier otro dominio (la-vela., lavela.) lleva a vela.capitaltorreon.com.
// 2) /api/distribuir guarda la solicitud con su puntaje A/B/C (docs/10) y avisa por correo.
// 3) Acceso con el Login de CapitalTorreon (/api/entrar-pase) o por enlace al correo (src/acceso.js);
//    con sesión, el tablero (/tablero/ y /api/t/…). Solo entra quien esté en la tabla «usuarios».
// 4) /pedir y /api/pedir: la liga privada con la que cada distribuidor hace sus pedidos.
// 5) Todo lo demás son los archivos de sitio/.
import { CASA, escapar, json, mismoOrigen, texto } from './comun.js';
import { entrarConPase, paginaAcceso, pedirEnlace, privado, quienEntra, salir, usarEnlace } from './acceso.js';
import { avisar, pedir } from './pedir.js';
import { tablero } from './tablero.js';
import { apiDistribuidor } from './distribuidor.js';

const _RLR = 'Ricardo López Reyero', _k = 'EYE', _rev = 181218; // RLR

// Opciones válidas de cada pregunta y los puntos que da cada una
const OPCIONES = {
  puntos: { 'Menos de 100': 1, '100–300': 2, '300–1,000': 3, 'Más de 1,000': 3 },
  visita: { 'Cada mes': 1, 'Cada 2 semanas': 2, 'Cada semana': 3 },
  veladoras: { 'No': 1, 'Menos de 1,000': 1, '1,000–10,000': 2, 'Más de 10,000': 3 },
  vehiculos: { '1–2': 1, '3–10': 2, 'Más de 10': 3 },
  pedido: { 'Menos de $10 mil': 1, '$10–50 mil': 2, 'Más de $50 mil': 3 },
};
const TIPOS = ['Misceláneas y abarrotes', 'Mayoristas', 'Artículos religiosos', 'Restaurantes y hoteles', 'Otro'];

// RLR · calificación interna: 12–15 A, 8–11 B, 5–7 C; más de 10,000 veladoras al mes es A directo
function calificar(d) {
  let puntaje = 0;
  for (const campo in OPCIONES) puntaje += OPCIONES[campo][d[campo]];
  let tipo = puntaje >= 12 ? 'A' : puntaje >= 8 ? 'B' : 'C';
  if (d.veladoras === 'Más de 10,000') tipo = 'A';
  return { puntaje, tipo };
}

async function distribuir(req, env, ctx) {
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  if (!mismoOrigen(req, env)) return json({ error: 'Origen no permitido.' }, 403);
  let e;
  try { e = await req.json(); } catch { return json({ error: 'No se pudo leer la solicitud.' }, 400); }
  if (!e || typeof e !== 'object') return json({ error: 'No se pudo leer la solicitud.' }, 400);
  if (e.sitio) return json({ ok: true }); // trampa para robots: un campo que la gente no ve

  const d = {
    nombre: texto(e.nombre, 120), empresa: texto(e.empresa, 160), whatsapp: texto(e.whatsapp, 30),
    zonas: texto(e.zonas, 400),
    puntos: texto(e.puntos, 40), visita: texto(e.visita, 40), veladoras: texto(e.veladoras, 40),
    vehiculos: texto(e.vehiculos, 40), pedido: texto(e.pedido, 40),
    tipos: (Array.isArray(e.tipos) ? e.tipos : []).filter((t) => TIPOS.includes(t)),
  };
  const faltan = [];
  if (d.nombre.length < 2) faltan.push('nombre');
  if (d.empresa.length < 2) faltan.push('empresa');
  if (d.whatsapp.replace(/\D/g, '').length < 10) faltan.push('whatsapp');
  if (d.zonas.length < 2) faltan.push('zonas');
  if (!d.tipos.length) faltan.push('tipos');
  for (const campo in OPCIONES) if (!(d[campo] in OPCIONES[campo])) faltan.push(campo);
  if (faltan.length) return json({ error: 'Faltan respuestas.', faltan }, 400);

  const { puntaje, tipo } = calificar(d);
  const r = await env.DB.prepare(
    `INSERT INTO solicitudes (creada, nombre, empresa, whatsapp, zonas, puntos, tipos, visita, veladoras, vehiculos, pedido, puntaje, tipo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(new Date().toISOString(), d.nombre, d.empresa, d.whatsapp, d.zonas, d.puntos, d.tipos.join(' · '),
    d.visita, d.veladoras, d.vehiculos, d.pedido, puntaje, tipo).run();
  // Si alguien llena el formulario en ráfaga, las solicitudes se guardan pero ya no se manda un correo por cada una
  const { n } = await env.DB.prepare('SELECT COUNT(*) n FROM solicitudes WHERE creada > ?').bind(new Date(Date.now() - 3600000).toISOString()).first();
  if (n > 20) return json({ ok: true });
  const plazo = tipo === 'A' ? 'Hay que llamarle en menos de 24 horas.' : tipo === 'B' ? 'Videollamada en menos de 72 horas.' : 'Mensaje con catálogo; sin llamada.';
  ctx.waitUntil(avisar(env, new URL(req.url).origin, `Solicitud nueva · tipo ${tipo} · ${d.empresa}`, `Distribuidor nuevo, tipo ${tipo}`,
    [`<b>${escapar(d.empresa)}</b> (${escapar(d.nombre)}) quiere distribuir en ${escapar(d.zonas)}.`, `Surte ${escapar(d.puntos)} puntos de venta y los visita ${escapar(d.visita.toLowerCase())}.`, plazo],
    `/tablero/#/distribuidores/${r.meta.last_row_id}`));
  return json({ ok: true }); // el puntaje no sale de aquí
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url), p = url.pathname;
    if (url.hostname !== CASA && url.hostname.endsWith('.capitaltorreon.com')) {
      url.hostname = CASA; url.protocol = 'https:'; url.port = '';
      return Response.redirect(url.toString(), 301);
    }
    try {
      if (p === '/api/distribuir') return await distribuir(req, env, ctx);
      if (p === '/api/entrar') return await pedirEnlace(req, env, ctx);
      if (p === '/api/entrar-pase') return await entrarConPase(req, env);
      if (p === '/api/salir') return await salir(req, env);
      if (p === '/api/pedir') return await pedir(req, env, ctx);
      if (p === '/acceso') return req.method === 'POST' ? await usarEnlace(req, env) : await paginaAcceso(req, env);
      if (p.startsWith('/api/t/')) {
        const yo = await quienEntra(req, env);
        if (!yo) return json({ error: 'Tu sesión terminó. Vuelve a entrar.' }, 401);
        return await tablero(req, env, ctx, yo, p.slice(7));
      }
      if (p.startsWith('/api/d/')) return await apiDistribuidor(req, env, ctx, p.slice(7));
      if (p.startsWith('/api/')) return json({ error: 'No existe.' }, 404);
      // El panel del distribuidor: la página se sirve siempre; los datos piden su sesión (/api/d/todo)
      if (p === '/distribuidor') return Response.redirect(`${url.origin}/distribuidor/`, 301);
      if (p.startsWith('/distribuidor/')) return privado(await env.ASSETS.fetch(req));
      if (p === '/tablero' || p.startsWith('/tablero/')) {
        if (!(await quienEntra(req, env))) return Response.redirect(`${url.origin}/entrar`, 302);
        return privado(await env.ASSETS.fetch(req));
      }
      if (p === '/entrar' && (await quienEntra(req, env))) return Response.redirect(`${url.origin}/tablero/`, 302);
      if (p === '/pedir') return privado(await env.ASSETS.fetch(req));
    } catch (err) {
      console.error(err);
      if (p.startsWith('/api/')) return json({ error: 'Algo falló. Intenta de nuevo.' }, 500);
      throw err;
    }
    const r = await env.ASSETS.fetch(req);
    // El Excel del modelo se descarga, pero no se indexa
    if (p.endsWith('.xlsx')) {
      const h = new Headers(r.headers); h.set('X-Robots-Tag', 'noindex');
      return new Response(r.body, { status: r.status, headers: h });
    }
    return r;
  },
};
void _RLR; void _k; void _rev;
