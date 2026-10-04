/* RLR · La Vela en 3D — Ricardo López Reyero
   Un solo modelo (vaso + cartucho + cera + mecha + flama) que se usa en tres lugares:
   el escenario del inicio y los dos renders «en casa». Todo en blanco y negro.
   Unidades: centímetros. Medidas del vaso tomadas de docs/02 (vaso de veladora ~6 cm de diámetro). */
import * as THREE from './vendor/three.module.min.js';

const _RLR = 'Ricardo López Reyero';
const _k = 'EYE', _rev = 181218; // RLR · candado de autoría

/* Medidas. La altura del cartucho está por validar (docs/08): cambiarla aquí cambia todo el modelo. */
const VASO = { r: 3.3, pared: 0.3, alto: 17, fondo: 0.9 };
const CART = { r: 2.9, alto: 2.6, lamina: 0.06 };
const CERA = { r: 2.72, alto: 13 };

const gris = (v) => new THREE.Color(v, v, v);
const V2 = (pts) => pts.map(([x, y]) => new THREE.Vector2(x, y));
// Perfil suave para tornear: pasa una curva por los puntos
const curva = (pts, n = 48) => new THREE.SplineCurve(V2(pts)).getPoints(n);

/* ───────── RLR · texturas hechas a mano (nada se descarga) ───────── */
function lienzo(w, h, pintar) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  pintar(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
// Azar con semilla, para que cada carga pinte lo mismo
function azar(semilla) {
  let s = semilla;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

function radial(paradas) {
  return lienzo(256, 256, (g) => {
    const d = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    paradas.forEach(([p, c]) => d.addColorStop(p, c));
    g.fillStyle = d; g.fillRect(0, 0, 256, 256);
  });
}
const texturaHalo = () => radial([[0, 'rgba(255,255,255,.6)'], [0.22, 'rgba(255,255,255,.2)'], [0.6, 'rgba(255,255,255,.04)'], [1, 'rgba(255,255,255,0)']]);
const texturaSombra = () => radial([[0, 'rgba(0,0,0,.5)'], [0.5, 'rgba(0,0,0,.22)'], [1, 'rgba(0,0,0,0)']]);
const texturaPiso = () => radial([[0, '#ffffff'], [0.1, '#a0a0a0'], [0.22, '#3a3a3a'], [0.36, '#0c0c0c'], [0.5, '#000000'], [1, '#000000']]);

// Cera encendida: brilla arriba, donde está la flama, y se apaga hacia abajo
function texturaBrilloCera() {
  return lienzo(8, 256, (g, w, h) => {
    const d = g.createLinearGradient(0, 0, 0, h);
    [[0, '#ffffff'], [0.12, '#b9b9b9'], [0.4, '#4e4e4e'], [1, '#161616']].forEach(([p, c]) => d.addColorStop(p, c));
    g.fillStyle = d; g.fillRect(0, 0, w, h);
  });
}
// Grabado del cartucho: la marca y el lote, estampados en la pared de aluminio (docs/15)
function texturaGrabado() {
  const t = lienzo(2048, 512, (g, w, h) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#8a8a8a'; g.font = '600 34px Georgia, serif'; g.textBaseline = 'middle';
    const texto = 'LA VELA  ·  CARTUCHO RETORNABLE  ·  LOTE 0001  ·  ';
    const paso = g.measureText(texto).width;
    for (let x = 0; x < w + paso; x += paso) g.fillText(texto, x, h * 0.5);
    g.fillRect(0, h * 0.5 - 30, w, 2); g.fillRect(0, h * 0.5 + 28, w, 2);
  });
  t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1;
  return t;
}
// Madera: vetas largas y onduladas
function texturaMadera(base = 150, semilla = 7) {
  const t = lienzo(1024, 512, (g, w, h) => {
    const r = azar(semilla);
    g.fillStyle = `rgb(${base},${base},${base})`; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      const y = r() * h, tono = base + (r() - 0.6) * 70, fase = r() * 6, onda = 2 + r() * 9;
      g.strokeStyle = `rgba(${tono | 0},${tono | 0},${tono | 0},${0.08 + r() * 0.22})`;
      g.lineWidth = 0.6 + r() * 2.6;
      g.beginPath();
      for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x / (90 + onda * 14) + fase) * onda);
      g.stroke();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
// Aplanado del muro: grano fino
function texturaAplanado(base = 200, semilla = 3) {
  const t = lienzo(512, 512, (g, w, h) => {
    const r = azar(semilla);
    g.fillStyle = `rgb(${base},${base},${base})`; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      const v = base + (r() - 0.5) * 34;
      g.fillStyle = `rgba(${v | 0},${v | 0},${v | 0},.5)`;
      g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2.5);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
// Retrato viejo: un paisaje borroso, sin nadie reconocible
function texturaRetrato() {
  return lienzo(256, 360, (g, w, h) => {
    const cielo = g.createLinearGradient(0, 0, 0, h);
    cielo.addColorStop(0, '#e9e9e9'); cielo.addColorStop(0.6, '#bdbdbd'); cielo.addColorStop(1, '#8c8c8c');
    g.fillStyle = cielo; g.fillRect(0, 0, w, h);
    g.filter = 'blur(5px)';
    g.fillStyle = '#f6f6f6'; g.beginPath(); g.arc(w * 0.68, h * 0.3, 26, 0, 7); g.fill();
    g.fillStyle = '#777'; g.beginPath(); g.moveTo(-20, h * 0.72);
    g.bezierCurveTo(w * 0.25, h * 0.5, w * 0.45, h * 0.62, w * 0.62, h * 0.56); g.bezierCurveTo(w * 0.8, h * 0.5, w, h * 0.66, w + 20, h * 0.6);
    g.lineTo(w + 20, h + 20); g.lineTo(-20, h + 20); g.fill();
    g.fillStyle = '#4c4c4c'; g.beginPath(); g.moveTo(-20, h * 0.86);
    g.bezierCurveTo(w * 0.3, h * 0.74, w * 0.6, h * 0.9, w + 20, h * 0.78); g.lineTo(w + 20, h + 20); g.lineTo(-20, h + 20); g.fill();
    g.filter = 'none';
  });
}

/* RLR · entorno de estudio hecho a mano: da los reflejos del vidrio y del aluminio.
   paneles = [ángulo en grados, ancho, alto, altura del centro, intensidad]; intensidad 0 = panel negro */
function entorno(renderer, fondo, paneles, techo = 1.6) {
  const s = new THREE.Scene();
  s.background = gris(fondo);
  const panel = (x, y, z, w, h, i) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: gris(i), side: THREE.DoubleSide }));
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

/* ───────── RLR · el vaso solo (sirve de vela, de vaso y de florero) ───────── */
function crearVaso({ brilloEntorno = 1, tinte = false } = {}) {
  const V = VASO, ri = V.r - V.pared;
  const perfil = V2([
    [0, 0], [V.r - 0.45, 0], [V.r - 0.12, 0.1], [V.r, 0.45], [V.r, V.alto - 0.12],
    [V.r - V.pared / 2, V.alto + 0.05], [ri, V.alto - 0.12],
    [ri, V.fondo + 0.5], [ri - 0.18, V.fondo + 0.14], [ri - 0.6, V.fondo], [0, V.fondo],
  ]);
  const vaso = new THREE.Mesh(
    new THREE.LatheGeometry(perfil, 96),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff, roughness: 0.03, metalness: 0, transmission: 1, ior: 1.5, thickness: 0.4,
      envMapIntensity: brilloEntorno, specularIntensity: 1, depthWrite: false,
      ...(tinte ? { attenuationColor: new THREE.Color(0x8c8c8c), attenuationDistance: 1.1 } : {}),
    })
  );
  return vaso;
}

// Agua dentro del vaso: tinte suave y un menisco que la hace leerse como agua
function crearAgua(alto, brilloEntorno = 1) {
  const ri = VASO.r - VASO.pared - 0.03, g = new THREE.Group();
  const cuerpo = new THREE.Mesh(
    new THREE.CylinderGeometry(ri, ri - 0.25, alto, 64),
    new THREE.MeshPhysicalMaterial({ color: 0x8f8f8f, transparent: true, opacity: 0.2, roughness: 0.05, envMapIntensity: brilloEntorno, depthWrite: false })
  );
  cuerpo.position.y = VASO.fondo + alto / 2;
  cuerpo.renderOrder = 2;
  const menisco = new THREE.Mesh(
    new THREE.RingGeometry(0, ri, 64),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.38, roughness: 0.02, envMapIntensity: brilloEntorno * 1.5, depthWrite: false, side: THREE.DoubleSide })
  );
  menisco.rotation.x = -Math.PI / 2; menisco.position.y = VASO.fondo + alto; menisco.renderOrder = 3;
  g.add(cuerpo, menisco);
  return g;
}

/* ───────── RLR · la lumbre: lo único con color en toda la página ─────────
   Azul abajo, donde arde el gas; un hueco oscuro junto a la mecha; amarillo casi blanco al centro;
   naranja en la orilla y rojo en la punta. La mueve un ruido que sube, como el aire caliente. */
function crearFlama() {
  const geo = new THREE.PlaneGeometry(5.4, 6.8);
  geo.translate(0, 3.4, 0);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, toneMapped: false,
    uniforms: { uTiempo: { value: 0 }, uFuerza: { value: 1 } },
    vertexShader: `
      varying vec2 vUv;
      uniform float uFuerza;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        vec3 arriba = normalize((modelViewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
        vec3 lado = normalize(cross(arriba, vec3(0.0, 0.0, 1.0)));
        mv.xyz += lado * position.x * (0.55 + 0.45 * uFuerza) + arriba * position.y * uFuerza;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTiempo;
      uniform float uFuerza;
      float azar(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float ruido(vec2 p) {
        vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(azar(i), azar(i + vec2(1.0, 0.0)), f.x), mix(azar(i + vec2(0.0, 1.0)), azar(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      float nubes(vec2 p) { return ruido(p) * 0.6 + ruido(p * 2.1) * 0.28 + ruido(p * 4.3) * 0.12; }
      void main() {
        float y = vUv.y;
        float x = (vUv.x - 0.5) * 2.0;
        // el aire caliente sube: el ruido corre hacia arriba y mece más la punta que la base
        float t = uTiempo;
        float mece = (nubes(vec2(y * 2.2 - t * 1.7, t * 0.6)) - 0.5) * 0.55 * y * y
                   + sin(t * 2.3 + y * 3.0) * 0.035 * y;
        float late = 1.0 + (nubes(vec2(t * 2.4, 3.7)) - 0.5) * 0.16;
        float yy = clamp(y / (0.9 * late), 0.0, 1.0);
        // silueta de gota: panza abajo, punta larga arriba
        float ancho = 0.66 * pow(sin(3.14159 * pow(yy, 0.5)), 1.35) * (1.0 - 0.42 * yy) + 0.02;
        float borde = (nubes(vec2(x * 3.0, y * 5.0 - t * 3.2)) - 0.5) * 0.16 * y;
        float d = abs(x - mece) / max(ancho + borde, 0.001);

        float cuerpo = smoothstep(1.0, 0.62, d) * step(yy, 0.999) * smoothstep(0.0, 0.03, y);
        // colores de una flama de vela
        vec3 blanco = vec3(1.0, 0.97, 0.86);
        vec3 amarillo = vec3(1.0, 0.82, 0.32);
        vec3 naranja = vec3(1.0, 0.47, 0.08);
        vec3 rojo = vec3(0.86, 0.14, 0.03);
        vec3 azul = vec3(0.12, 0.34, 1.0);
        vec3 c = mix(naranja, amarillo, smoothstep(0.95, 0.5, d));
        c = mix(c, blanco, smoothstep(0.55, 0.05, d) * smoothstep(0.22, 0.42, yy) * smoothstep(0.98, 0.5, yy));
        c = mix(c, rojo, smoothstep(0.55, 1.0, yy) * smoothstep(0.25, 1.0, d) * 0.85);
        c = mix(c, naranja, smoothstep(0.8, 1.0, yy) * 0.5);
        // base azul y el hueco oscuro que rodea la mecha
        float abajo = smoothstep(0.3, 0.02, yy);
        c = mix(c, azul, abajo * smoothstep(0.1, 0.75, d + 0.25));
        float hueco = smoothstep(0.5, 0.0, d) * smoothstep(0.03, 0.1, yy) * smoothstep(0.34, 0.16, yy);
        float alfa = cuerpo * mix(1.0, 0.62, abajo) * (1.0 - 0.72 * hueco);
        // velo de calor alrededor
        float velo = smoothstep(1.9, 0.9, d) * (1.0 - cuerpo) * 0.22 * smoothstep(0.02, 0.2, y) * smoothstep(1.0, 0.6, y);
        vec3 color = c * 1.25 * cuerpo + mix(naranja, rojo, y) * velo;
        gl_FragColor = vec4(color, clamp(alfa + velo, 0.0, 1.0) * smoothstep(0.0, 0.25, uFuerza));
      }`,
  });
  const m = new THREE.Mesh(geo, mat);
  m.renderOrder = 6; m.frustumCulled = false;
  return m;
}

/* ───────── RLR · la vela: devuelve el grupo y sus piezas para poder animarlas ───────── */
export function crearVela({ brilloEntorno = 1, tinte = false } = {}) {
  const vela = new THREE.Group();
  const vaso = crearVaso({ brilloEntorno, tinte });
  vela.add(vaso);

  // Cartucho: copa de aluminio con la cera y la mecha ya puestas (docs/08)
  const cartucho = new THREE.Group();
  cartucho.position.y = VASO.fondo + 0.02;
  const C = CART;
  const grabado = texturaGrabado();
  const aluminio = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, metalness: 1, roughness: 0.3, envMapIntensity: brilloEntorno * 1.3, map: grabado, bumpMap: grabado, bumpScale: 0.6 });
  const copa = new THREE.Mesh(
    new THREE.LatheGeometry(V2([
      [0, 0], [C.r - 0.3, 0], [C.r - 0.08, 0.08], [C.r, 0.3], [C.r, C.alto],
      [C.r - C.lamina, C.alto], [C.r - C.lamina, C.lamina + 0.25], [0, C.lamina],
    ]), 96),
    aluminio
  );
  const ceja = new THREE.Mesh(new THREE.TorusGeometry(C.r - 0.02, 0.07, 10, 96), aluminio); // borde enrollado
  ceja.rotation.x = Math.PI / 2; ceja.position.y = C.alto;
  copa.castShadow = true;
  cartucho.add(copa, ceja);

  const matCera = new THREE.MeshPhysicalMaterial({
    color: 0xf4f4f4, roughness: 0.5, sheen: 0.5, sheenRoughness: 0.6, emissive: 0xffb469, emissiveMap: texturaBrilloCera(),
    emissiveIntensity: 0, envMapIntensity: brilloEntorno * 0.5,
  });
  const cera = new THREE.Mesh(new THREE.CylinderGeometry(CERA.r, CERA.r, CERA.alto, 72, 1, true), matCera);
  cera.position.y = C.lamina + CERA.alto / 2;
  cera.castShadow = true;
  cartucho.add(cera);

  const cima = C.lamina + CERA.alto;
  // Arriba: orilla de cera sólida y, al centro, el charco derretido (hundido y brillante)
  const matCima = new THREE.MeshPhysicalMaterial({ color: 0xf6f6f6, roughness: 0.45, emissive: 0xffb469, emissiveIntensity: 0, envMapIntensity: brilloEntorno * 0.5 });
  const orilla = new THREE.Mesh(
    new THREE.LatheGeometry(V2([[CERA.r, 0], [CERA.r - 0.1, 0.05], [CERA.r - 0.5, 0], [CERA.r - 0.75, -0.14], [0, -0.2]]), 72), matCima);
  orilla.position.y = cima;
  const matCharco = new THREE.MeshPhysicalMaterial({ color: 0xe9e9e9, roughness: 0.04, clearcoat: 1, emissive: 0xffc27a, emissiveIntensity: 0, envMapIntensity: brilloEntorno * 1.2 });
  const charco = new THREE.Mesh(new THREE.CircleGeometry(CERA.r - 0.78, 56), matCharco);
  charco.rotation.x = -Math.PI / 2; charco.position.y = cima - 0.12;
  cartucho.add(orilla, charco);

  // Mecha: un poco curva, con la punta quemada
  const mecha = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, cima - 0.2, 0), new THREE.Vector3(0.02, cima + 0.35, 0), new THREE.Vector3(0.12, cima + 0.75, 0.02),
    ]), 12, 0.075, 8),
    new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 1 })
  );
  cartucho.add(mecha);

  // Flama: un plano que siempre mira a la cámara, pintado por un sombreador (ver crearFlama)
  const flama = new THREE.Group();
  flama.position.set(0.1, cima + 0.42, 0);
  const lumbre = crearFlama();
  const th = texturaHalo();
  const sprite = (escala, opacidad, color, y) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: th, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: opacidad }));
    s.scale.set(escala, escala, 1); s.position.y = y; s.renderOrder = 7; s.userData.opacidad = opacidad;
    return s;
  };
  const halos = [sprite(8, 0.5, 0xffb347, 2.5), sprite(17, 0.3, 0xff7a1a, 2.6), sprite(3.4, 0.5, 0x3d6bff, 0.4)];
  const luz = new THREE.PointLight(0xffa24a, 260, 0, 2);
  luz.position.y = 2.4;
  flama.add(lumbre, ...halos, luz);
  cartucho.add(flama);
  vela.add(cartucho);

  // RLR · enciende o apaga en proporción f (0 a 1) con un titileo t alrededor de 1; seg mueve la lumbre
  const encender = (f, t = 1, fuerza = 260, seg = 0) => {
    flama.visible = f > 0.02;
    lumbre.material.uniforms.uFuerza.value = f;
    lumbre.material.uniforms.uTiempo.value = seg;
    luz.intensity = fuerza * f * t;
    halos.forEach((h) => { h.material.opacity = h.userData.opacidad * f * (1 + (t - 1) * 2); });
    matCera.emissiveIntensity = 0.62 * f * t;
    matCima.emissiveIntensity = 0.5 * f * t;
    matCharco.emissiveIntensity = 0.75 * f * t;
  };
  encender(1);
  return { vela, vaso, cartucho, flama, luz, encender };
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

  // Piso que se pierde en el negro: no hay horizonte
  const piso = new THREE.Mesh(
    new THREE.CircleGeometry(70, 96),
    new THREE.MeshLambertMaterial({ color: 0x8a8a8a, map: texturaPiso() })
  );
  piso.rotation.x = -Math.PI / 2;
  escena.add(piso);

  // Luz de estudio: una principal y un contraluz, para que se lea la cera y el borde del vidrio
  const principal = new THREE.DirectionalLight(0xffffff, 1.3);
  principal.position.set(-30, 40, 45);
  const contra = new THREE.DirectionalLight(0xffffff, 1.0);
  contra.position.set(35, 25, -40);
  escena.add(principal, contra);

  const camara = new THREE.PerspectiveCamera(27, 1, 1, 400);
  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hacia dónde va cada estado: altura del cartucho, flama y encuadre
  const METAS = {
    encendida: { y: 0, flama: 1, mira: 10.2, lejos: 52 },
    cartucho: { y: 15.5, flama: 0, mira: 15.5, lejos: 84 },
    nuevo: { y: 0, flama: 1, mira: 10.2, lejos: 52 },
  };
  let estado = 'encendida';
  const a = { y: 0, flama: 1, mira: 10.2, lejos: 52 };
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
    const m = METAS[estado], k = 1 - Math.exp(-dt * 3.4);
    a.y += (m.y - a.y) * k; a.mira += (m.mira - a.mira) * k; a.lejos += (m.lejos - a.lejos) * k;
    // La flama solo prende cuando el cartucho ya está sentado en el vaso
    const sentado = a.y < 0.25 ? 1 : 0;
    a.flama += (m.flama * sentado - a.flama) * (1 - Math.exp(-dt * 5));

    p.cartucho.position.y = base + a.y;
    const s = ahora / 1000;
    const titila = quieto ? 1 : 1 + 0.05 * Math.sin(s * 11) + 0.035 * Math.sin(s * 17.3 + 1) + 0.02 * Math.sin(s * 29.1);
    p.encender(a.flama, titila, 260, quieto ? 2.4 : s);

    if (!arrastrando && !quieto && ahora - ultimoToque > 1800) giro += dt * 0.16;
    const alto = canvas.clientHeight / Math.max(canvas.clientWidth, 1);
    const lejos = a.lejos * (alto > 1.25 ? 1 : Math.min(1.25 / alto, 1.5) * 0.82);
    camara.position.set(Math.sin(giro) * lejos, a.mira + 5.5, Math.cos(giro) * lejos);
    camara.lookAt(0, a.mira, 0);
    renderer.render(escena, camara);
  }
  requestAnimationFrame(cuadro);

  return {
    poner(nuevo) {
      if (!METAS[nuevo]) return;
      // El cartucho nuevo entra desde arriba, apagado
      if (nuevo === 'nuevo' && estado !== 'nuevo') { a.y = 30; a.flama = 0; }
      estado = nuevo;
      if (alCambiar) alCambiar(nuevo);
    },
    get estado() { return estado; },
  };
}

/* ───────── RLR · piezas de utilería para los renders ───────── */
function utileria(escena, brillo = 0.5) {
  const mate = (c, r = 0.85, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, envMapIntensity: brillo, ...extra });
  const poner = (m, x, y, z) => { m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; escena.add(m); return m; };
  const caja = (w, h, d, material, x, y, z) => poner(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material), x, y, z);
  const torno = (pts, material, x, y, z, suave = true) =>
    poner(new THREE.Mesh(new THREE.LatheGeometry(suave ? curva(pts) : V2(pts), 96), material), x, y, z);
  // Libro: pasta y, adentro, el canto de las hojas
  const libro = (w, h, d, tono, x, y, z, giro) => {
    const g = new THREE.Group();
    const pasta = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mate(tono, 0.7));
    const hojas = new THREE.Mesh(new THREE.BoxGeometry(w - 0.5, h - 0.5, d - 0.25), mate(0xe4e4e4, 0.95));
    hojas.position.set(0.3, 0, 0.2);
    [pasta, hojas].forEach((m) => { m.castShadow = true; m.receiveShadow = true; });
    g.add(pasta, hojas); g.position.set(x, y, z); g.rotation.y = giro; escena.add(g);
    return g;
  };
  // Tallo curvo entre puntos
  const tallo = (pts, grosor, material) => {
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q))), 24, grosor, 6), material);
    m.castShadow = true; escena.add(m); return m;
  };
  const ts = texturaSombra();
  const sombra = (w, d, x, z, giro = 0, fuerza = 1) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: ts, transparent: true, depthWrite: false, opacity: fuerza }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = giro; m.position.set(x, 0.04, z); escena.add(m); return m;
  };
  return { mate, poner, caja, torno, libro, tallo, sombra };
}

/* ───────── RLR · Render 1: en la repisa, de noche, encendida ───────── */
export function renderRepisa(canvas) {
  const renderer = nuevoRenderer(canvas, true);
  renderer.toneMappingExposure = 1.15;
  const escena = new THREE.Scene();
  escena.background = new THREE.Color(0x020202);
  escena.environment = entorno(renderer, 0.004, [[-60, 30, 60, 22, 0.45], [60, 20, 60, 22, 0.3], [0, 40, 30, 12, 0.25]], 0.08);
  const u = utileria(escena, 0.35);

  // Muro aplanado y repisa de madera
  const aplanado = texturaAplanado(190); aplanado.repeat.set(5, 3);
  const muro = new THREE.Mesh(new THREE.PlaneGeometry(300, 180), u.mate(0xb4b4b4, 0.96, { map: aplanado, bumpMap: aplanado, bumpScale: 0.6 }));
  muro.position.set(0, 30, -10); muro.receiveShadow = true; escena.add(muro);
  const madera = texturaMadera(120, 11); madera.repeat.set(2, 1);
  const repisa = u.caja(140, 2.4, 22, u.mate(0x8a8a8a, 0.62, { map: madera }), 0, -1.2, 0);
  repisa.castShadow = false;
  // La repisa es la cubierta de una cómoda: abajo no hay muro, hay mueble
  const comoda = u.caja(140, 60, 21, u.mate(0x4a4a4a, 0.7, { map: madera }), 0, -32.4, -0.6); comoda.castShadow = false;

  // Retrato enmarcado, recargado en el muro: marco, paspartú y foto con cristal
  const marco = new THREE.Group();
  const negro = u.mate(0x1c1c1c, 0.4);
  [[13, 1.1, 0, 8.45], [13, 1.1, 0, -8.45], [1.1, 18, 5.95, 0], [1.1, 18, -5.95, 0]].forEach(([w, h, x, y]) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 1.2), negro); b.position.set(x, y, 0); b.castShadow = true; marco.add(b);
  });
  const paspartu = new THREE.Mesh(new THREE.PlaneGeometry(11, 16), u.mate(0xeeeeee, 0.9)); paspartu.position.z = -0.1;
  const foto = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 10.2),
    new THREE.MeshPhysicalMaterial({ map: texturaRetrato(), roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 0.5 }));
  foto.position.z = -0.05;
  const respaldo = new THREE.Mesh(new THREE.BoxGeometry(12.6, 17.6, 0.3), negro); respaldo.position.z = -0.4; respaldo.castShadow = true;
  marco.add(paspartu, foto, respaldo);
  marco.position.set(-12.2, 8.9, -6.4); marco.rotation.set(-0.17, 0.2, 0);
  escena.add(marco);

  // Tres libros y, encima, un florero de barro con ramas de algodón
  u.libro(15.5, 2.3, 10.5, 0x3c3c3c, 13.5, 1.15, -2.2, -0.1);
  u.libro(14.2, 1.7, 9.8, 0xa9a9a9, 13.1, 3.15, -2.3, 0.07);
  u.libro(12.6, 1.4, 9.2, 0x5e5e5e, 13.6, 4.7, -2.1, -0.16);
  const yF = 5.4;
  u.torno([[0, 0], [2.2, 0], [3.2, 1.6], [3.5, 4.2], [2.7, 7], [1.35, 8.8], [1.25, 10], [1.6, 10.8]],
    u.mate(0xdedede, 0.55, { side: THREE.DoubleSide }), 13.4, yF, -2.4);
  const rama = u.mate(0x2a2a2a, 0.9), mota = u.mate(0xf2f2f2, 1);
  const r = azar(21);
  [[-5.5, 15, -1], [-1.5, 19, 1.5], [2.2, 16.5, -1.8], [5.5, 12.5, 0.8], [0.5, 12, 2.4]].forEach(([dx, alto, dz]) => {
    const x0 = 13.4, y0 = yF + 9.5, z0 = -2.4;
    const punta = [x0 + dx, y0 + alto, z0 + dz];
    u.tallo([[x0, yF + 2, z0], [x0 + dx * 0.12, y0 + 1, z0 + dz * 0.1], [x0 + dx * 0.55, y0 + alto * 0.6, z0 + dz * 0.6], punta], 0.09, rama);
    // Capullo de algodón: cuatro motas apretadas y su cáliz
    const capullo = (cx, cy, cz, tam) => {
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + r() * 0.6;
        const m = new THREE.Mesh(new THREE.SphereGeometry(tam * (0.8 + r() * 0.3), 14, 10), mota);
        m.position.set(cx + Math.cos(a) * tam * 0.55, cy + (r() - 0.3) * tam * 0.5, cz + Math.sin(a) * tam * 0.55);
        m.castShadow = true; escena.add(m);
      }
      const caliz = new THREE.Mesh(new THREE.ConeGeometry(tam * 0.9, tam * 0.9, 5), rama);
      caliz.position.set(cx, cy - tam * 0.75, cz); caliz.rotation.x = Math.PI; escena.add(caliz);
    };
    capullo(...punta, 0.95);
    capullo(x0 + dx * 0.62 + 0.9, y0 + alto * 0.58, z0 + dz * 0.6, 0.75);
  });

  // Un platito con la caja de cerillos
  u.torno([[0, 0], [2.4, 0], [3.6, 0.5], [3.7, 0.75], [2.4, 0.3], [0, 0.3]], u.mate(0xd0d0d0, 0.35), -3.2, 0, 6.2, false);
  const cerillos = u.caja(3.4, 0.9, 2.2, u.mate(0x4a4a4a, 0.8), -3.2, 0.78, 6.2); cerillos.rotation.y = 0.5;
  const lija = u.caja(3.42, 0.5, 0.05, u.mate(0x161616, 1), -3.2, 0.78, 6.2); lija.rotation.y = 0.5; lija.translateZ(1.11);

  const p = crearVela({ brilloEntorno: 0.7 });
  p.encender(1, 1, 520, 2.4);
  p.luz.castShadow = true;
  p.luz.shadow.mapSize.set(2048, 2048); p.luz.shadow.bias = -0.003; p.luz.shadow.normalBias = 0.05;
  p.cartucho.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  p.vela.position.set(1, 0, 1.6);
  escena.add(p.vela);
  u.sombra(11, 11, 1, 1.6, 0, 0.75);
  // Apenas un poco de luz de la casa, para que lo oscuro no sea un hoyo negro
  escena.add(new THREE.AmbientLight(0xffffff, 0.05));
  const relleno = new THREE.DirectionalLight(0xffffff, 0.07); relleno.position.set(-40, 30, 60); escena.add(relleno);

  const camara = new THREE.PerspectiveCamera(30, 1, 1, 500);
  const pintar = () => {
    if (!ajustar(renderer, camara, canvas)) return;
    const lejos = camara.aspect < 1 ? 92 : 74;
    camara.position.set(7, 19, lejos); camara.lookAt(1.5, 15, 0);
    renderer.render(escena, camara);
  };
  new ResizeObserver(pintar).observe(canvas);
  pintar();
}

/* ───────── RLR · Render 2: en la mesa, de día. El mismo vaso, ya sin cartucho: florero y vaso ───────── */
export function renderMesa(canvas) {
  const renderer = nuevoRenderer(canvas, true);
  renderer.toneMappingExposure = 1.05;
  const escena = new THREE.Scene();
  escena.background = new THREE.Color(0xcfcfcf);
  escena.environment = entorno(renderer, 0.6, [[-95, 26, 70, 20, 0], [95, 26, 70, 20, 0], [-40, 30, 50, 34, 3.4], [180, 60, 20, 4, 0.05]], 1.1);
  const u = utileria(escena, 0.6);

  const aplanado = texturaAplanado(214, 5); aplanado.repeat.set(6, 3);
  const muro = new THREE.Mesh(new THREE.PlaneGeometry(420, 220), u.mate(0xd2d2d2, 1, { map: aplanado, bumpMap: aplanado, bumpScale: 0.5 }));
  muro.position.set(0, 50, -30); muro.receiveShadow = true; escena.add(muro);
  const madera = texturaMadera(196, 4); madera.repeat.set(2.2, 1.6);
  const mesa = u.caja(280, 3, 170, u.mate(0xdadada, 0.5, { map: madera }), 0, -1.5, 42);
  mesa.castShadow = false;

  // Luz de ventana: un sol bajo que entra por un marco con cruceta (el marco no se ve, solo su sombra)
  const sol = new THREE.DirectionalLight(0xffffff, 4.2);
  const L = new THREE.Vector3(-74, 62, 46), T = new THREE.Vector3(1, 6, -2);
  sol.position.copy(L); sol.target.position.copy(T); sol.castShadow = true;
  sol.shadow.mapSize.set(4096, 4096); sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.04;
  Object.assign(sol.shadow.camera, { left: -75, right: 75, top: 75, bottom: -75, near: 1, far: 260 });
  escena.add(sol, sol.target, new THREE.HemisphereLight(0xffffff, 0xa8a8a8, 1.0));
  const ventana = new THREE.Group();
  const tapa = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  const barra = (w, h, x, y) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.6), tapa); b.position.set(x, y, 0); b.castShadow = true; ventana.add(b); };
  const AN = 46, AL = 54; // el claro de la ventana
  barra(140, 90, 0, AL / 2 + 45); barra(140, 90, 0, -AL / 2 - 45); barra(90, AL, -AN / 2 - 45, 0); barra(90, AL, AN / 2 + 45, 0);
  barra(1.8, AL, 0, 0); barra(AN, 1.8, 0, 4); // cruceta
  ventana.position.copy(L).lerp(T, 0.42); ventana.lookAt(L);
  escena.add(ventana);

  // Jarra de barro con asa
  const barro = u.mate(0x3a3a3a, 0.48, { side: THREE.DoubleSide });
  u.torno([[0, 0], [4.4, 0], [6.6, 3.2], [7, 8], [5.6, 13.5], [3.9, 17.2], [3.9, 19.6], [4.8, 21.4]], barro, -15, 0, -11);
  const asa = u.poner(new THREE.Mesh(new THREE.TorusGeometry(4.3, 0.72, 14, 40, Math.PI * 1.05), barro), -20.6, 12, -11);
  asa.rotation.z = Math.PI / 2 - 0.05;

  // Florero: el vaso con agua y flores de campo
  const FX = 7, FZ = -5;
  const florero = new THREE.Group();
  florero.add(crearVaso({ brilloEntorno: 1.5, tinte: true }), crearAgua(7.5, 1.4));
  florero.position.set(FX, 0, FZ);
  escena.add(florero);
  const verde = u.mate(0x4b4b4b, 0.8), petalo = u.mate(0xfafafa, 0.75), boton = u.mate(0x6a6a6a, 0.9);
  const r = azar(9);
  const flor = (x, y, z, tam, inclina) => {
    const g = new THREE.Group();
    const centro = new THREE.Mesh(new THREE.SphereGeometry(tam * 0.42, 16, 12), boton); centro.scale.y = 0.6; g.add(centro);
    for (let i = 0; i < 13; i++) {
      const a = (i / 13) * Math.PI * 2;
      const pt = new THREE.Mesh(new THREE.SphereGeometry(tam * 0.5, 10, 8), petalo);
      pt.scale.set(1, 0.14, 0.36); pt.position.set(Math.cos(a) * tam * 0.8, -0.05, Math.sin(a) * tam * 0.8); pt.rotation.y = -a; pt.rotation.z = 0.12;
      pt.castShadow = true; g.add(pt);
    }
    g.position.set(x, y, z); g.rotation.set(inclina[0], 0, inclina[1]); escena.add(g);
  };
  [[-4.6, 15, -1.5, 1.9], [-0.5, 19.5, 1.2, 2.2], [3.6, 16, -0.8, 1.8], [1.6, 12.5, 2.6, 1.6], [-2.6, 11, 2.2, 1.5], [5.2, 10.5, 1.6, 1.4]].forEach(([dx, alto, dz, tam]) => {
    const bx = FX, y0 = VASO.alto, punta = [bx + dx, y0 + alto, FZ + dz];
    u.tallo([[bx - dx * 0.25, VASO.fondo + 0.4, FZ - dz * 0.3], [bx + dx * 0.1, y0 * 0.6, FZ + dz * 0.1], [bx + dx * 0.4, y0 + alto * 0.35, FZ + dz * 0.45], punta], 0.11, verde);
    flor(...punta, tam, [0.95 + dz * 0.06, -dx * 0.07]);
    // una hoja a medio tallo
    const hoja = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 8), verde);
    hoja.scale.set(1.2, 0.07, 0.36); hoja.position.set(bx + dx * 0.36 + (r() - 0.5), y0 + alto * 0.28, FZ + dz * 0.4); hoja.rotation.set(r(), r() * 3, 0.5 + r() * 0.5);
    hoja.castShadow = true; escena.add(hoja);
  });
  u.sombra(26, 12, FX + 8, FZ - 2.2, 0.42, 0.8);

  // El otro uso: el mismo vaso, con agua para tomar
  const vasoAgua = new THREE.Group();
  vasoAgua.add(crearVaso({ brilloEntorno: 1.5, tinte: true }), crearAgua(12.4, 1.4));
  vasoAgua.position.set(-4.5, 0, 6);
  escena.add(vasoAgua);
  u.sombra(24, 11, 3, 3.5, 0.42, 0.8);

  // Plato con limones y una servilleta de tela
  u.torno([[0, 0], [5, 0], [9.6, 1.1], [9.8, 1.5], [5, 0.5], [0, 0.5]], u.mate(0xffffff, 0.28), 11.5, 0, 13, false);
  const cascara = texturaAplanado(150, 8);
  [[9.4, 3.1, 12.4, 2.7], [13.8, 3, 14.4, 2.6], [12.2, 3.2, 10, 2.8]].forEach(([x, y, z, t]) => {
    const limon = u.poner(new THREE.Mesh(new THREE.SphereGeometry(t, 32, 24), u.mate(0xbdbdbd, 0.5, { bumpMap: cascara, bumpScale: 0.25 })), x, y, z);
    limon.scale.set(1.12, 1, 1); limon.rotation.y = x;
  });
  const tela = u.mate(0xb9b9b9, 1);
  const s1 = u.caja(13, 0.35, 13, tela, -14, 0.18, 15); s1.rotation.y = 0.3;
  const s2 = u.caja(13, 0.35, 6.4, tela, -14, 0.52, 15); s2.rotation.y = 0.3; s2.translateZ(-3.2);

  const camara = new THREE.PerspectiveCamera(30, 1, 1, 600);
  const pintar = () => {
    if (!ajustar(renderer, camara, canvas)) return;
    const lejos = camara.aspect < 1 ? 112 : 86;
    camara.position.set(-3, 25, lejos); camara.lookAt(0.5, 14, 0);
    renderer.render(escena, camara);
  };
  new ResizeObserver(pintar).observe(canvas);
  pintar();
}

export const autor = _RLR; // RLR
void _k; void _rev;
