// RLR · La Vela — correos por Resend — Ricardo López Reyero
// La llave vive en la bóveda de Cloudflare (Secrets Store). Sin llave no truena: avisa en el registro y sigue.
import { escapar } from './comun.js';

const DE = 'La Vela <tablero@capitaltorreon.com>';

async function llave(env) {
  const x = env.RESEND_API_KEY;
  if (!x) return '';
  if (typeof x === 'string') return x;
  try { return (await x.get()) || ''; } catch { return ''; }
}

export async function enviar(env, { para, asunto, html, texto }) {
  const k = await llave(env), destinos = [].concat(para).filter(Boolean);
  if (!destinos.length) return { ok: false, motivo: 'sin destinatarios' };
  if (!k) { console.log(`[correo sin llave] ${asunto} → ${destinos.length} destinatario(s)`); return { ok: false, motivo: 'sin llave' }; }
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${k}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: DE, to: destinos, subject: asunto, html, text: texto }),
    });
    if (!r.ok) console.error('[correo]', r.status, (await r.text()).slice(0, 200));
    return { ok: r.ok };
  } catch (e) { console.error('[correo]', String(e).slice(0, 200)); return { ok: false }; }
}

// RLR · un correo corto: fondo blanco, un título, pocas líneas y un solo botón
export function plantilla({ titulo, lineas = [], boton, liga, pie = '' }) {
  const p = lineas.map((l) => `<p style="margin:0 0 12px;font:16px/1.5 Helvetica,Arial,sans-serif;color:#222">${l}</p>`).join('');
  return `<!doctype html><html lang="es"><body style="margin:0;background:#ffffff">
<div style="max-width:520px;margin:0 auto;padding:32px 24px;background:#ffffff">
<p style="margin:0 0 24px;font:20px Georgia,serif;color:#111">La Vela</p>
<h1 style="margin:0 0 16px;font:400 28px/1.15 Georgia,serif;color:#111">${escapar(titulo)}</h1>
${p}
${boton ? `<p style="margin:24px 0"><a href="${liga}" style="display:inline-block;background:#111;color:#ffffff;text-decoration:none;font:600 16px Helvetica,Arial,sans-serif;padding:16px 28px">${escapar(boton)}</a></p>` : ''}
${pie ? `<p style="margin:24px 0 0;font:13px/1.5 Helvetica,Arial,sans-serif;color:#6b6b6b">${pie}</p>` : ''}
</div></body></html>`;
}
