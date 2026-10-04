// RLR · La Vela — Worker — Ricardo López Reyero
// 1) Cualquier otro dominio (la-vela., lavela.) lleva a vela.capitaltorreon.com.
// 2) POST /api/distribuir guarda la solicitud en D1 con su puntaje A/B/C (docs/10).
// 3) Todo lo demás son los archivos de sitio/.
const _RLR = 'Ricardo López Reyero', _k = 'EYE', _rev = 181218; // RLR

const CASA = 'vela.capitaltorreon.com';

// Opciones válidas de cada pregunta y los puntos que da cada una (0 = no puntúa)
const OPCIONES = {
  puntos: { 'Menos de 100': 1, '100–300': 2, '300–1,000': 3, 'Más de 1,000': 3 },
  visita: { 'Cada mes': 1, 'Cada 2 semanas': 2, 'Cada semana': 3 },
  veladoras: { 'No': 1, 'Menos de 1,000': 1, '1,000–10,000': 2, 'Más de 10,000': 3 },
  vehiculos: { '1–2': 1, '3–10': 2, 'Más de 10': 3 },
  pedido: { 'Menos de $10 mil': 1, '$10–50 mil': 2, 'Más de $50 mil': 3 },
};
const TIPOS = ['Misceláneas y abarrotes', 'Mayoristas', 'Artículos religiosos', 'Restaurantes y hoteles', 'Otro'];

const json = (cuerpo, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

const texto = (v, max) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '');

// RLR · calificación interna: 12–15 A, 8–11 B, 5–7 C; más de 10,000 veladoras al mes es A directo
function calificar(d) {
  let puntaje = 0;
  for (const campo in OPCIONES) puntaje += OPCIONES[campo][d[campo]];
  let tipo = puntaje >= 12 ? 'A' : puntaje >= 8 ? 'B' : 'C';
  if (d.veladoras === 'Más de 10,000') tipo = 'A';
  return { puntaje, tipo };
}

async function distribuir(req, env) {
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  const origen = req.headers.get('origin');
  if (origen && new URL(origen).host !== new URL(req.url).host) return json({ error: 'Origen no permitido.' }, 403);
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
  await env.DB.prepare(
    `INSERT INTO solicitudes (creada, nombre, empresa, whatsapp, zonas, puntos, tipos, visita, veladoras, vehiculos, pedido, puntaje, tipo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(new Date().toISOString(), d.nombre, d.empresa, d.whatsapp, d.zonas, d.puntos, d.tipos.join(' · '),
    d.visita, d.veladoras, d.vehiculos, d.pedido, puntaje, tipo).run();
  return json({ ok: true }); // el puntaje no sale de aquí
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.hostname !== CASA && url.hostname.endsWith('.capitaltorreon.com')) {
      url.hostname = CASA; url.protocol = 'https:'; url.port = '';
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname === '/api/distribuir') {
      try { return await distribuir(req, env); }
      catch (err) { console.error(err); return json({ error: 'No se pudo guardar. Intenta de nuevo.' }, 500); }
    }
    const r = await env.ASSETS.fetch(req);
    // El Excel del modelo se descarga, pero no se indexa
    if (url.pathname.endsWith('.xlsx')) {
      const h = new Headers(r.headers); h.set('X-Robots-Tag', 'noindex');
      return new Response(r.body, { status: r.status, headers: h });
    }
    return r;
  },
};
void _RLR; void _k; void _rev;
