/* RLR · La Vela — Usuarios (quién ve qué) y el buscador de todo el tablero — Ricardo López Reyero
   La matriz: usuarios hacia abajo, pantallas a la derecha, una palomita por celda. Lo que se palomea aquí también lo revisa el servidor. */
import { S, borrar, campo, crear, guardar, html, num, dinero, fecha } from './nucleo.js';
import { dist, prov } from './cuentas.js';

const _RLR = 'Ricardo López Reyero', _k = 'EYE', _rev = 181218; // RLR

export const PANTALLAS = [['hoy', 'Hoy'], ['datos', 'Datos'], ['distribuidores', 'Distribuidores'], ['pedidos', 'Pedidos'], ['ventas', 'Ventas'], ['mercado', 'Mercado'], ['produccion', 'Producción'], ['compras', 'Compras'], ['rutas', 'Rutas'],
  ['cartuchos', 'Cartuchos'], ['indicadores', 'Indicadores'], ['pagos', 'Pagos'], ['contabilidad', 'Contabilidad'], ['equipo', 'Equipo'], ['proyecto', 'Proyecto'], ['receta', 'Receta'], ['modelo', 'Modelo']];
export const pantallasDe = (u) => (u.rol === 'admin' ? PANTALLAS.map((p) => p[0]) : String(u.pantallas || '').split(/\s+/).filter(Boolean));
export const ve = (id) => S.yo.rol === 'admin' || (S.yo.pantallas || []).includes(id);

export const usuarios = {
  id: 'usuarios', titulo: 'Usuarios', grupo: 'Empresa', soloAdmin: true,
  pintar() {
    if (S.yo.rol !== 'admin') return html`<p class="vacio">Solo un administrador maneja los usuarios.</p>`;
    return html`<div class="rejilla">
      <section class="bloque doble"><h2>Quién ve qué</h2>
        <p class="tenue">Una palomita por pantalla. Quita o pon pantallas cuando quieras: se guarda al instante y aplica la próxima vez que esa persona cargue el tablero. Los administradores ven todo y son los únicos que entran aquí y a Ajustes.</p>
        <div class="tabla-caja"><table class="tabla matriz"><thead><tr><th>Usuario</th>${PANTALLAS.map(([, t]) => html`<th>${t}</th>`)}<th>Todo</th><th></th></tr></thead><tbody>
          ${S.usuarios.map((u) => { const ps = pantallasDe(u), admin = u.rol === 'admin'; return html`<tr class="${admin ? 'admin' : ''}"><th>${u.nombre || u.correo}<small>${u.correo}${admin ? ' · administrador' : ''}</small></th>
            ${PANTALLAS.map(([id]) => html`<td>${admin ? '✓' : html`<input type="checkbox" data-pantalla="${id}" data-correo="${u.correo}" ${ps.includes(id) ? html`checked` : ''} aria-label="${id} para ${u.correo}">`}</td>`)}
            <td>${admin ? '' : html`<button class="todo" type="button" data-a="todas" data-correo="${u.correo}" data-v="${ps.length === PANTALLAS.length ? '0' : '1'}">${ps.length === PANTALLAS.length ? 'Ninguna' : 'Todas'}</button>`}</td>
            <td>${u.correo !== S.yo.correo ? html`<button class="enlace" data-a="borrar-usuario" data-id="${u.correo}">Quitar</button>` : ''}</td></tr>`; })}
        </tbody></table></div></section>
      <section class="bloque"><h2>Dar acceso a alguien</h2>
        <form data-f="usuario-nuevo" class="forma">
          <label class="campo doble"><span>Correo (con el que entra por Google)</span><input name="correo" type="email" required></label>
          <label class="campo"><span>Nombre</span><input name="nombre"></label>
          <label class="campo"><span>Acceso</span><select name="rol"><option value="equipo">Equipo: solo las pantallas palomeadas</option><option value="admin">Administrador: todo</option></select></label>
          <div class="campo doble"><span>Pantallas que ve</span><div class="chips">${PANTALLAS.map(([id, t]) => html`<label class="chip" style="cursor:pointer"><input type="checkbox" name="p:${id}" style="width:14px;height:14px;margin-right:4px"> ${t}</label>`)}</div></div>
          <button class="boton lleno">Dar acceso</button></form>
        <p class="tenue">Entra con su cuenta de Google en ${location.origin}/entrar; no hay que avisarle nada más que la liga.</p></section>
      <section class="bloque"><h2>Nombre y rol</h2><div class="tabla-caja"><table class="tabla editable"><thead><tr><th>Correo</th><th>Nombre</th><th>Acceso</th></tr></thead><tbody>
        ${S.usuarios.map((u) => html`<tr><th>${u.correo}</th><td>${campo('usuarios', u.correo, 'nombre', u.nombre)}</td><td>${campo('usuarios', u.correo, 'rol', u.rol, { opciones: [['admin', 'Administrador'], ['equipo', 'Equipo']] })}</td></tr>`)}</tbody></table></div></section>
    </div>`;
  },
  acciones: {
    todas: (el) => guardar('usuarios', el.dataset.correo, { pantallas: el.dataset.v === '1' ? PANTALLAS.map((p) => p[0]).join(' ') : '' }),
    'borrar-usuario': (el) => borrar('usuarios', el.dataset.id, `¿Quitarle el acceso a ${el.dataset.id}?`),
    async 'pantalla'(el) {
      const u = S.usuarios.find((x) => x.correo === el.dataset.correo), ps = new Set(pantallasDe(u));
      if (el.checked) ps.add(el.dataset.pantalla); else ps.delete(el.dataset.pantalla);
      await guardar('usuarios', u.correo, { pantallas: [...ps].join(' ') }, { callado: true });
    },
  },
  formularios: {
    'usuario-nuevo': (f, d) => crear('usuarios', { correo: d.correo, nombre: d.nombre, rol: d.rol, pantallas: Object.keys(d).filter((k) => k.startsWith('p:')).map((k) => k.slice(2)).join(' ') }),
  },
};

// ───────── Buscar en todo ─────────
export function buscarTodo(q) {
  const b = q.trim().toLowerCase();
  if (b.length < 2) return [];
  const r = [], tiene = (...xs) => xs.join(' ').toLowerCase().includes(b);
  for (const d of S.distribuidores) if (tiene(d.empresa, d.nombre, d.zonas, d.zona, d.whatsapp, d.correo, d.ciudad)) r.push({ tipo: 'Distribuidor', titulo: d.empresa, detalle: `${d.estado} · ${d.zonas || d.zona || ''}`, liga: `#/distribuidores/${d.id}` });
  for (const p of S.pedidos) if (tiene('#' + p.id, p.notas, dist(p.distribuidor_id)?.empresa)) r.push({ tipo: 'Pedido', titulo: `#${p.id} · ${dist(p.distribuidor_id)?.empresa || ''}`, detalle: `${p.estado} · ${num(p.piezas)} piezas · ${dinero(p.total)}`, liga: `#/pedidos/${p.id}` });
  for (const t of S.tareas) if (tiene(t.titulo, t.notas, t.seccion)) r.push({ tipo: 'Tarea', titulo: t.titulo, detalle: `${t.estado} · ${t.seccion}`, liga: `#/proyecto/${t.id}` });
  for (const x of S.proveedores || []) if (tiene(x.nombre, x.contacto, x.insumos, x.ciudad)) r.push({ tipo: 'Proveedor', titulo: x.nombre, detalle: x.estado, liga: `#/compras/proveedor-${x.id}` });
  for (const c of S.compras || []) if (tiene('#' + c.id, c.factura, c.notas, prov(c.proveedor_id)?.nombre)) r.push({ tipo: 'Compra', titulo: `#${c.id} · ${prov(c.proveedor_id)?.nombre || ''}`, detalle: `${c.estado} · ${dinero(c.total)}`, liga: `#/compras/${c.id}` });
  for (const x of S.puestos || []) if (tiene(x.nombre, x.persona, x.area)) r.push({ tipo: 'Puesto', titulo: x.nombre, detalle: x.persona || x.estado, liga: `#/equipo/${x.id}` });
  for (const m of S.mercados || []) if (tiene(m.nombre, m.descripcion)) r.push({ tipo: m.tipo, titulo: m.nombre, detalle: m.estado, liga: `#/mercado/${m.id}` });
  for (const x of S.rutas || []) if (tiene(x.repartidor, x.fecha, x.notas)) r.push({ tipo: 'Ruta', titulo: `${fecha(x.fecha)} · ${x.repartidor}`, detalle: x.estado, liga: `#/rutas/${x.id}` });
  return r.slice(0, 40);
}
void _RLR; void _k; void _rev;
