/* RLR · La Vela en 3D — Ricardo López Reyero
   Un solo modelo (vaso + cartucho + cera + mecha + flama) que se usa en tres lugares:
   el escenario del inicio y los dos renders «en casa». Todo en blanco y negro.
   Unidades: centímetros. Medidas del vaso tomadas de docs/02 (vaso de veladora ~6 cm de diámetro). */
import * as THREE from './vendor/three.module.min.js';

const _RLR = 'Ricardo López Reyero';
const _k = 'EYE', _rev = 181218; // RLR · candado de autoría

/* Medidas. La altura del cartucho está por validar (docs/08): cambiarla aquí cambia todo el modelo. */
const VASO = { r: 3.3, pared: 0.3, alto: 17, fondo: 0.6 };
const CART = { r: 2.9, alto: 2.6, lamina: 0.06 };
const CERA = { r: 2.72, alto: 13.2 };
const AGUA = { alto: 12.5 };

const gris = (v) => new THREE.Color(v, v, v);

/* RLR · entorno de estudio hecho a mano: da los reflejos del vidrio y del aluminio.
   paneles = [ángulo en grados, ancho, alto, altura del centro, intensidad]; intensidad 0 = panel negro */
function entorno(renderer, fondo, paneles, techo = 1.6) {
  const s = new THREE.Scene();
  s.background = gris(fondo);
  const panel = (x, y, z, w, h, i) => {
    const p = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: gris(i), side: THREE.DoubleSide })
    );
    p.position.set(x, y, z);
    p.lookAt(0, y, 0);
    s.add(p);
  };
  for (const [ang, w, h, y, i] of paneles) {
    const a = (ang * Math.PI) / 180;
    panel(Math.sin(a) * 55, y, Math.cos(a) * 55, w, h, i);
  }
  const t = new THREE.Mesh(new THREE.PlaneGeometry(44, 44), new THREE.MeshBasicMaterial({ color: gris(techo), side: THREE.DoubleSide }));
  t.position.y = 62; t.rotation.x = Math.PI / 2; s.add(t);
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(s, 0.02).texture;
  pm.dispose();
  return tex;
}

function texturaPiso() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const d = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  d.addColorStop(0, '#fff');
  d.addColorStop(0.45, '#666');
  d.addColorStop(1, '#000');
  g.fillStyle = d;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

function texturaHalo() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const d = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  d.addColorStop(0, 'rgba(255,255,255,.55)');
  d.addColorStop(0.25, 'rgba(255,255,255,.18)');
  d.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = d;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function texturaSombra() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const d = g.createRadialGradient(64, 64, 10, 64, 64, 64);
  d.addColorStop(0, 'rgba(0,0,0,.42)');
  d.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = d;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/* RLR · la vela: devuelve el grupo y sus piezas para poder animarlas */
export function crearVela({ brilloEntorno = 1, tinte = false } = {}) {
  const vela = new THREE.Group();
  const V = VASO, ri = V.r - V.pared;

  // Vaso de vidrio: perfil torneado, pared de 3 mm y borde redondeado
  const perfil = [
    [0, 0], [V.r - 0.35, 0], [V.r, 0.35], [V.r, V.alto - 0.1],
    [V.r - V.pared / 2, V.alto + 0.06], [ri, V.alto - 0.1],
    [ri, V.fondo + 0.3], [ri - 0.3, V.fondo], [0, V.fondo],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const vaso = new THREE.Mesh(
    new THREE.LatheGeometry(perfil, 72),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff, roughness: 0.04, metalness: 0, transmission: 1, ior: 1.5,
      thickness: 0.35, envMapIntensity: brilloEntorno, specularIntensity: 1,
      ...(tinte ? { attenuationColor: new THREE.Color(0x8c8c8c), attenuationDistance: 0.9 } : {}),
    })
  );
  vela.add(vaso);

  // Cartucho: copa de aluminio con la cera y la mecha ya puestas (docs/08)
  const cartucho = new THREE.Group();
  cartucho.position.y = V.fondo + 0.02;
  const C = CART;
  const copa = new THREE.Mesh(
    new THREE.LatheGeometry([
      [0, 0], [C.r - 0.25, 0], [C.r, 0.25], [C.r, C.alto],
      [C.r - C.lamina, C.alto], [C.r - C.lamina, C.lamina + 0.2], [0, C.lamina],
    ].map(([x, y]) => new THREE.Vector2(x, y)), 72),
    new THREE.MeshStandardMaterial({ color: 0xd4d4d4, metalness: 1, roughness: 0.32, envMapIntensity: brilloEntorno * 1.3 })
  );
  copa.castShadow = true;
  cartucho.add(copa);

  const matCera = new THREE.MeshPhysicalMaterial({
    color: 0xf1f1f1, roughness: 0.55, sheen: 0.4, emissive: 0xffffff, emissiveIntensity: 0,
    envMapIntensity: brilloEntorno * 0.5,
  });
  const cera = new THREE.Mesh(new THREE.CylinderGeometry(CERA.r, CERA.r, CERA.alto, 64), matCera);
  cera.position.y = C.lamina + CERA.alto / 2;
  cera.castShadow = true;
  cartucho.add(cera);

  const cima = C.lamina + CERA.alto;
  // Charco de cera derretida alrededor de la mecha
  const charco = new THREE.Mesh(
    new THREE.CircleGeometry(CERA.r - 0.25, 48),
    new THREE.MeshPhysicalMaterial({ color: 0xdddddd, roughness: 0.08, clearcoat: 1, envMapIntensity: brilloEntorno })
  );
  charco.rotation.x = -Math.PI / 2;
  charco.position.y = cima + 0.01;
  cartucho.add(charco);

  const mecha = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.09, 0.9, 10),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1 })
  );
  mecha.position.y = cima + 0.45;
  cartucho.add(mecha);

  // Flama: gota torneada, blanca, con halo
  const pf = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const r = 0.44 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.62)), 1.15) * (1 - 0.25 * t);
    pf.push(new THREE.Vector2(Math.max(r, 0.0001), t * 2.3));
  }
  const flama = new THREE.Group();
  flama.position.y = cima + 0.62;
  const gota = new THREE.Mesh(
    new THREE.LatheGeometry(pf, 28),
    new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })
  );
  const nucleo = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0x555555, toneMapped: false })
  );
  nucleo.scale.set(1, 1.5, 1);
  nucleo.position.y = 0.42;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texturaHalo(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
  }));
  halo.scale.set(13, 13, 1);
  halo.position.y = 1.1;
  const luz = new THREE.PointLight(0xffffff, 260, 0, 2);
  luz.position.y = 1.2;
  flama.add(gota, nucleo, halo, luz);
  cartucho.add(flama);
  vela.add(cartucho);

  // Agua: el mismo vaso, usado como vaso
  const agua = new THREE.Mesh(
    new THREE.CylinderGeometry(ri - 0.02, ri - 0.02, AGUA.alto, 64),
    new THREE.MeshPhysicalMaterial({
      color: 0xf4f4f4, roughness: 0, transmission: 1, ior: 1.33, thickness: 5,
      attenuationColor: tinte ? 0x7a7a7a : 0xa8a8a8, attenuationDistance: tinte ? 3 : 7, envMapIntensity: brilloEntorno,
    })
  );
  agua.position.y = V.fondo + AGUA.alto / 2 + 0.02;
  agua.visible = false;
  // Superficie del agua: lo que hace que se lea como agua
  const espejo = new THREE.Mesh(
    new THREE.CircleGeometry(ri - 0.03, 48),
    new THREE.MeshStandardMaterial({ color: tinte ? 0xb8b8b8 : 0x3a3a3a, roughness: 0.06, metalness: 0.2, envMapIntensity: brilloEntorno * 1.2 })
  );
  espejo.rotation.x = -Math.PI / 2;
  espejo.position.y = 0.5 + 0.004;
  agua.add(espejo);
  vela.add(agua);

  return { vela, vaso, cartucho, cera: matCera, flama, gota, halo, luz, agua };
}

/* RLR · pone la vela en uno de sus tres estados sin animar (para los renders fijos) */
function fijarEstado(p, estado) {
  const lit = estado === 'encendida';
  p.flama.visible = lit;
  p.cera.emissiveIntensity = lit ? 0.3 : 0;
  p.cartucho.visible = estado !== 'vaso';
  p.agua.visible = estado === 'vaso';
}

function nuevoRenderer(canvas, sombras) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.outputColorSpace = THREE.SRGBColorSpace;
  if (sombras) { r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; }
  return r;
}

function ajustar(renderer, camara, canvas) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return false;
  renderer.setSize(w, h, false);
  camara.aspect = w / h;
  camara.updateProjectionMatrix();
  return true;
}

/* ───────── RLR · Escenario del inicio: gira, se arrastra y cambia de estado ───────── */
export function escenario(canvas, { alCambiar } = {}) {
  const renderer = nuevoRenderer(canvas, false);
  const escena = new THREE.Scene();
  escena.background = new THREE.Color(0x000000);
  escena.environment = entorno(renderer, 0.01, [[-70, 30, 60, 22, 5], [-150, 14, 60, 22, 4], [35, 10, 60, 22, 4], [110, 26, 60, 22, 3.5], [170, 8, 50, 22, 3], [-15, 6, 40, 20, 2]]);

  const p = crearVela({ brilloEntorno: 0.9 });
  escena.add(p.vela);

  const piso = new THREE.Mesh(
    new THREE.CircleGeometry(46, 64),
    new THREE.MeshStandardMaterial({
      color: 0x242424, roughness: 0.5, metalness: 0.1, envMapIntensity: 0.15,
      alphaMap: texturaPiso(), transparent: true,
    })
  );
  piso.rotation.x = -Math.PI / 2;
  escena.add(piso);

  // Luz de estudio: una principal y un contraluz, para que se lea la cera y el borde del vidrio
  const principal = new THREE.DirectionalLight(0xffffff, 1.5);
  principal.position.set(-30, 40, 45);
  const contra = new THREE.DirectionalLight(0xffffff, 1.1);
  contra.position.set(35, 25, -40);
  escena.add(principal, contra);

  const camara = new THREE.PerspectiveCamera(27, 1, 1, 400);
  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hacia dónde va cada estado: altura del cartucho, flama, agua y encuadre
  const METAS = {
    encendida: { y: 0, flama: 1, agua: 0, mira: 9.2, lejos: 56 },
    cartucho: { y: 15.5, flama: 0, agua: 0, mira: 15.5, lejos: 84 },
    vaso: { y: 60, flama: 0, agua: 1, mira: 8.6, lejos: 54 },
  };
  let estado = 'encendida';
  const a = { y: 0, flama: 1, agua: 0, mira: 9.2, lejos: 56 };
  const base = VASO.fondo + 0.02;

  let giro = 0.6, arrastrando = false, x0 = 0, ultimoToque = 0;
  canvas.addEventListener('pointerdown', (e) => { arrastrando = true; x0 = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!arrastrando) return;
    giro += (e.clientX - x0) * 0.012; x0 = e.clientX; ultimoToque = performance.now();
  });
  const soltar = () => { arrastrando = false; ultimoToque = performance.now(); };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);

  let visible = true, t0 = performance.now();
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  new ResizeObserver(() => ajustar(renderer, camara, canvas)).observe(canvas);
  ajustar(renderer, camara, canvas);

  // RLR · cuadro a cuadro
  function cuadro(ahora) {
    requestAnimationFrame(cuadro);
    if (!visible) { t0 = ahora; return; }
    const dt = Math.min((ahora - t0) / 1000, 0.05); t0 = ahora;
    const m = METAS[estado], k = 1 - Math.exp(-dt * 4.2);
    for (const c in a) a[c] += (m[c] - a[c]) * k;

    p.cartucho.position.y = base + a.y;
    p.cartucho.visible = a.y < 50;
    const f = a.flama;
    p.flama.visible = f > 0.02;
    const s = ahora / 1000;
    const titila = quieto ? 1 : 1 + 0.05 * Math.sin(s * 11) + 0.035 * Math.sin(s * 17.3 + 1) + 0.02 * Math.sin(s * 29.1);
    p.gota.scale.set(f * (2 - titila), f * titila, f * (2 - titila));
    if (!quieto) p.gota.rotation.z = 0.03 * Math.sin(s * 6.1);
    p.luz.intensity = 260 * f * titila;
    p.halo.material.opacity = f * (0.85 + (titila - 1) * 2);
    p.cera.emissiveIntensity = 0.16 * f;
    p.agua.visible = a.agua > 0.01;
    p.agua.scale.y = Math.max(a.agua, 0.001);
    p.agua.position.y = VASO.fondo + (AGUA.alto * a.agua) / 2 + 0.02;

    if (!arrastrando && !quieto && ahora - ultimoToque > 1800) giro += dt * 0.16;
    const alto = canvas.clientHeight / Math.max(canvas.clientWidth, 1);
    const lejos = a.lejos * (alto > 1.25 ? 1 : Math.min(1.25 / alto, 1.5) * 0.82);
    camara.position.set(Math.sin(giro) * lejos, a.mira + 5.5, Math.cos(giro) * lejos);
    camara.lookAt(0, a.mira, 0);
    renderer.render(escena, camara);
  }
  requestAnimationFrame(cuadro);

  return {
    poner(nuevo) { if (METAS[nuevo]) { estado = nuevo; if (alCambiar) alCambiar(nuevo); } },
    get estado() { return estado; },
  };
}

/* ───────── RLR · Render 1: en la repisa, de noche, encendida ───────── */
export function renderRepisa(canvas) {
  const renderer = nuevoRenderer(canvas, true);
  const escena = new THREE.Scene();
  escena.background = new THREE.Color(0x030303);
  escena.environment = entorno(renderer, 0.004, [[-60, 30, 60, 22, 0.5], [60, 20, 60, 22, 0.35]], 0.1);

  const mate = (c, r = 0.85) => new THREE.MeshStandardMaterial({ color: c, roughness: r, envMapIntensity: 0.3 });
  const caja = (w, h, d, c, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mate(c));
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; escena.add(m); return m;
  };
  const muro = new THREE.Mesh(new THREE.PlaneGeometry(260, 160), mate(0x9a9a9a, 0.95));
  muro.position.set(0, 30, -9); muro.receiveShadow = true; escena.add(muro);
  caja(120, 1.6, 20, 0x6e6e6e, 0, -0.8, 0); // repisa

  // Retrato enmarcado, recargado en el muro
  const marco = new THREE.Group();
  const aro = new THREE.Mesh(new THREE.BoxGeometry(12.5, 16.5, 0.9), mate(0x2a2a2a, 0.5));
  const foto = new THREE.Mesh(new THREE.PlaneGeometry(9.4, 13.4), mate(0xcfcfcf, 0.9));
  foto.position.z = 0.47;
  const figura = new THREE.Mesh(new THREE.CircleGeometry(2.1, 32), mate(0x8a8a8a, 0.9));
  figura.position.set(0, 1.6, 0.48);
  const hombros = new THREE.Mesh(new THREE.CircleGeometry(3.6, 32, 0, Math.PI), mate(0x8a8a8a, 0.9));
  hombros.position.set(0, -5.2, 0.48);
  aro.castShadow = true;
  marco.add(aro, foto, figura, hombros);
  marco.position.set(-12.5, 8.2, -6.2); marco.rotation.x = -0.16; marco.rotation.y = 0.18;
  escena.add(marco);

  // Dos libros acostados y un florero con ramas
  caja(15, 2.4, 10.5, 0x4a4a4a, 14.5, 1.2, -2).rotation.y = -0.12;
  caja(13.5, 1.8, 9.6, 0xb5b5b5, 14.2, 3.3, -2).rotation.y = 0.1;
  const florero = new THREE.Mesh(
    new THREE.LatheGeometry([[0, 0], [2.4, 0], [3.1, 2.5], [2.6, 6], [1.3, 8.4], [1.5, 9.6], [1.3, 9.6], [0, 9.2]].map(([x, y]) => new THREE.Vector2(x, y)), 40),
    mate(0xe6e6e6, 0.35)
  );
  florero.position.set(15, 4.2, -2.2); florero.castShadow = true; escena.add(florero);
  for (let i = 0; i < 5; i++) {
    const rama = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 15 + i * 1.3, 6), mate(0x3a3a3a));
    rama.position.set(15, 19, -2.2);
    rama.rotation.z = (i - 2) * 0.2; rama.rotation.x = (i % 2 ? 1 : -1) * 0.1;
    rama.translateY(1); rama.castShadow = true; escena.add(rama);
    const flor = new THREE.Mesh(new THREE.SphereGeometry(0.75 + (i % 3) * 0.18, 12, 10), mate(0xf0f0f0, 0.7));
    flor.position.copy(rama.position); flor.rotation.copy(rama.rotation); flor.translateY(7.6 + i * 0.6);
    flor.castShadow = true; escena.add(flor);
  }

  const p = crearVela({ brilloEntorno: 0.7 });
  fijarEstado(p, 'encendida');
  p.luz.intensity = 420; p.luz.castShadow = true;
  p.luz.shadow.mapSize.set(1024, 1024); p.luz.shadow.bias = -0.002; p.luz.shadow.radius = 6;
  p.cartucho.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  p.vela.position.set(0.5, 0, 1.5);
  escena.add(p.vela);
  escena.add(new THREE.AmbientLight(0xffffff, 0.06));

  const camara = new THREE.PerspectiveCamera(30, 1, 1, 500);
  const pintar = () => {
    if (!ajustar(renderer, camara, canvas)) return;
    const ancho = camara.aspect < 1 ? 92 : 74;
    camara.position.set(8, 16, ancho); camara.lookAt(1.5, 12.5, 0);
    renderer.render(escena, camara);
  };
  new ResizeObserver(pintar).observe(canvas);
  pintar();
}

/* ───────── RLR · Render 2: en la mesa, de día, como vaso de agua ───────── */
export function renderMesa(canvas) {
  const renderer = nuevoRenderer(canvas, true);
  const escena = new THREE.Scene();
  escena.background = new THREE.Color(0xd9d9d9);
  escena.environment = entorno(renderer, 0.75, [[-95, 26, 70, 20, 0], [95, 26, 70, 20, 0], [-40, 30, 50, 34, 3.2], [180, 60, 20, 4, 0.05]], 1.2);

  const mate = (c, r = 0.8) => new THREE.MeshStandardMaterial({ color: c, roughness: r, envMapIntensity: 0.6 });
  const muro = new THREE.Mesh(new THREE.PlaneGeometry(400, 200), mate(0xdedede, 1));
  muro.position.set(0, 40, -34); muro.receiveShadow = true; escena.add(muro);
  const mesa = new THREE.Mesh(new THREE.BoxGeometry(260, 3, 160), mate(0xf3f3f3, 0.6));
  mesa.position.set(0, -1.5, 44); mesa.receiveShadow = true; escena.add(mesa);

  const torno = (pts, c, r) => {
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 56), mate(c, r));
    m.castShadow = true; m.receiveShadow = true; escena.add(m); return m;
  };
  // Jarra de barro
  const jarra = torno([[0, 0], [4.6, 0], [6.8, 4], [7.2, 9], [5.6, 15], [4.2, 19], [4.9, 22.5], [4.5, 22.5], [3.8, 19.2], [0, 18.5]], 0x3d3d3d, 0.5);
  jarra.position.set(-13.5, 0, -9); jarra.scale.setScalar(0.82);
  const asa = new THREE.Mesh(new THREE.TorusGeometry(4.6, 0.75, 12, 32, Math.PI), mate(0x3d3d3d, 0.5));
  asa.position.set(-18.7, 10.2, -9); asa.scale.setScalar(0.82); asa.rotation.z = Math.PI / 2; asa.castShadow = true; escena.add(asa);
  // Plato con pan
  const plato = torno([[0, 0], [5.5, 0], [10.5, 1.3], [10.5, 1.6], [5.5, 0.5], [0, 0.5]], 0xffffff, 0.3);
  plato.position.set(14, 0, 3);
  const pan = new THREE.Mesh(new THREE.SphereGeometry(4.6, 32, 20), mate(0x9c9c9c, 0.95));
  pan.scale.set(1.25, 0.55, 0.95); pan.position.set(14, 2.9, 3); pan.castShadow = true; escena.add(pan);
  // Servilleta doblada
  const serv = new THREE.Mesh(new THREE.BoxGeometry(11, 0.5, 11), mate(0xbdbdbd, 1));
  serv.position.set(-1.5, 0.25, 13); serv.rotation.y = 0.35; serv.receiveShadow = true; escena.add(serv);

  const p = crearVela({ brilloEntorno: 1.4, tinte: true });
  fijarEstado(p, 'vaso');
  p.vela.position.set(1, 0, 1);
  escena.add(p.vela);
  const sombra = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 12),
    new THREE.MeshBasicMaterial({ map: texturaSombra(), transparent: true, depthWrite: false })
  );
  sombra.rotation.x = -Math.PI / 2; sombra.position.set(6.5, 0.03, -0.8); sombra.rotation.z = 0.33;
  escena.add(sombra);

  // Luz de ventana, desde la izquierda
  const sol = new THREE.DirectionalLight(0xffffff, 3.1);
  sol.position.set(-60, 55, 30); sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048); sol.shadow.bias = -0.0006; sol.shadow.radius = 5;
  Object.assign(sol.shadow.camera, { left: -70, right: 70, top: 60, bottom: -40, near: 1, far: 220 });
  escena.add(sol, new THREE.HemisphereLight(0xffffff, 0xbbbbbb, 0.9));

  const camara = new THREE.PerspectiveCamera(30, 1, 1, 500);
  const pintar = () => {
    if (!ajustar(renderer, camara, canvas)) return;
    const ancho = camara.aspect < 1 ? 110 : 80;
    camara.position.set(-5, 21, ancho); camara.lookAt(-1, 8.5, 0);
    renderer.render(escena, camara);
  };
  new ResizeObserver(pintar).observe(canvas);
  pintar();
}

export const autor = _RLR; // RLR
void _k; void _rev;
