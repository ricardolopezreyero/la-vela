-- RLR · La Vela — tablero de operación (docs/11). Se corre UNA sola vez, después de esquema.sql.
-- Ricardo López Reyero

-- Acceso por enlace mágico: solo se guardan huellas (SHA-256), nunca el enlace ni la sesión
CREATE TABLE IF NOT EXISTS usuarios (
  correo TEXT PRIMARY KEY,
  nombre TEXT NOT NULL DEFAULT '',
  rol TEXT NOT NULL DEFAULT 'equipo',      -- admin · equipo
  creado TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS enlaces (hash TEXT PRIMARY KEY, correo TEXT NOT NULL, vence INTEGER NOT NULL, creado INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sesiones (hash TEXT PRIMARY KEY, correo TEXT NOT NULL, vence INTEGER NOT NULL, creada INTEGER NOT NULL);

-- Distribuidores: la solicitud del sitio se vuelve la tarjeta del embudo
ALTER TABLE solicitudes ADD COLUMN zona TEXT NOT NULL DEFAULT '';
ALTER TABLE solicitudes ADD COLUMN exclusividad INTEGER NOT NULL DEFAULT 0;
ALTER TABLE solicitudes ADD COLUMN responsable TEXT NOT NULL DEFAULT '';
ALTER TABLE solicitudes ADD COLUMN proxima_accion TEXT NOT NULL DEFAULT '';
ALTER TABLE solicitudes ADD COLUMN proxima_fecha TEXT NOT NULL DEFAULT '';
ALTER TABLE solicitudes ADD COLUMN notas TEXT NOT NULL DEFAULT '';
ALTER TABLE solicitudes ADD COLUMN credito REAL NOT NULL DEFAULT 0;
ALTER TABLE solicitudes ADD COLUMN tiendas INTEGER NOT NULL DEFAULT 0;
ALTER TABLE solicitudes ADD COLUMN liga TEXT;
ALTER TABLE solicitudes ADD COLUMN origen TEXT NOT NULL DEFAULT 'formulario';
ALTER TABLE solicitudes ADD COLUMN actualizado TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS solicitudes_liga ON solicitudes (liga) WHERE liga IS NOT NULL;

-- Bitácora de todo: quién hizo qué y cuándo
CREATE TABLE IF NOT EXISTS bitacora (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cosa TEXT NOT NULL,                      -- distribuidores · pedidos · tareas
  cosa_id INTEGER NOT NULL,
  texto TEXT NOT NULL,
  por TEXT NOT NULL,
  fecha TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS bitacora_cosa ON bitacora (cosa, cosa_id);

-- Proyecto: el checklist de docs/05, una tarjeta por tarea
CREATE TABLE IF NOT EXISTS tareas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  seccion TEXT NOT NULL DEFAULT 'General',
  fase INTEGER NOT NULL DEFAULT 1,
  estado TEXT NOT NULL DEFAULT 'Por hacer', -- Por hacer · En curso · Hecho · Después · Descartado
  responsable TEXT NOT NULL DEFAULT '',
  fecha TEXT NOT NULL DEFAULT '',
  prioridad TEXT NOT NULL DEFAULT 'Media',  -- Alta · Media · Baja
  notas TEXT NOT NULL DEFAULT '',
  creada TEXT NOT NULL,
  actualizada TEXT
);

-- Catálogo por caja
CREATE TABLE IF NOT EXISTS productos (
  clave TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  piezas_caja INTEGER NOT NULL DEFAULT 12,
  precio_dist REAL NOT NULL DEFAULT 0,      -- lo que paga el distribuidor por pieza, con IVA
  precio_publico REAL NOT NULL DEFAULT 0,
  lleva_vaso INTEGER NOT NULL DEFAULT 1,
  activo INTEGER NOT NULL DEFAULT 1,
  orden INTEGER NOT NULL DEFAULT 0
);

-- Pedidos: de aquí nace todo lo demás
CREATE TABLE IF NOT EXISTS pedidos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  distribuidor_id INTEGER NOT NULL,
  estado TEXT NOT NULL DEFAULT 'Recibido',
  lineas TEXT NOT NULL DEFAULT '[]',        -- [{clave, cajas}]
  piezas INTEGER NOT NULL DEFAULT 0,
  piezas_vaso INTEGER NOT NULL DEFAULT 0,
  cajas INTEGER NOT NULL DEFAULT 0,
  subtotal REAL NOT NULL DEFAULT 0,
  deposito REAL NOT NULL DEFAULT 0,         -- depósito por cartucho con el que se calculó
  total REAL NOT NULL DEFAULT 0,
  vacios INTEGER NOT NULL DEFAULT 0,        -- cartuchos vacíos que entrega
  fecha_prometida TEXT NOT NULL DEFAULT '',
  lote_id INTEGER,
  cobro TEXT NOT NULL DEFAULT 'Pendiente',
  cobrado_fecha TEXT,
  entregado_fecha TEXT,
  descontado INTEGER NOT NULL DEFAULT 0,    -- ya se bajó el material del inventario
  notas TEXT NOT NULL DEFAULT '',
  origen TEXT NOT NULL DEFAULT 'tablero',   -- tablero · liga
  creado TEXT NOT NULL,
  actualizado TEXT
);
CREATE INDEX IF NOT EXISTS pedidos_dist ON pedidos (distribuidor_id);

CREATE TABLE IF NOT EXISTS inventario (
  clave TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  unidad TEXT NOT NULL DEFAULT 'pza',
  existencia REAL NOT NULL DEFAULT 0,
  minimo REAL NOT NULL DEFAULT 0,
  costo REAL NOT NULL DEFAULT 0,
  actualizado TEXT
);

CREATE TABLE IF NOT EXISTS lotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT NOT NULL,
  receta_id INTEGER,
  piezas INTEGER NOT NULL DEFAULT 0,
  fecha TEXT NOT NULL DEFAULT '',
  gph REAL,
  horas REAL,
  resultado TEXT NOT NULL DEFAULT 'En prueba', -- En prueba · Aprobado · Rechazado
  notas TEXT NOT NULL DEFAULT ''
);

-- La receta vive aquí, no en una página: se edita en pantalla
CREATE TABLE IF NOT EXISTS recetas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  datos TEXT NOT NULL DEFAULT '{}',
  actualizada TEXT,
  por TEXT NOT NULL DEFAULT ''
);

-- Pruebas de encendido (docs/03)
CREATE TABLE IF NOT EXISTS pruebas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receta_id INTEGER,
  nombre TEXT NOT NULL,
  detalle TEXT NOT NULL DEFAULT '',
  peso_inicial REAL,
  residual REAL NOT NULL DEFAULT 0.03,
  meta_horas REAL NOT NULL DEFAULT 168,
  cerrada INTEGER NOT NULL DEFAULT 0,
  notas TEXT NOT NULL DEFAULT '',
  creada TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS prueba_sesiones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prueba_id INTEGER NOT NULL,
  fecha TEXT NOT NULL,
  horas REAL NOT NULL,
  peso_final REAL NOT NULL,
  flama_mm REAL,
  temp_c REAL,
  tunel INTEGER NOT NULL DEFAULT 0,
  hollin INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS sesiones_prueba ON prueba_sesiones (prueba_id);

CREATE TABLE IF NOT EXISTS ajustes (clave TEXT PRIMARY KEY, valor TEXT NOT NULL);
