-- RLR · La Vela — la empresa completa en el tablero: compras, pagos, rutas, equipo y mercado (docs/11).
-- Se corre UNA sola vez, después de 0002_tablero.sql. Ricardo López Reyero

-- Pedidos: empaque y ruta. Las rejas y los kilos se calculan al crear o cambiar el pedido.
ALTER TABLE pedidos ADD COLUMN rejas REAL NOT NULL DEFAULT 0;
ALTER TABLE pedidos ADD COLUMN kg REAL NOT NULL DEFAULT 0;
ALTER TABLE pedidos ADD COLUMN ruta_id INTEGER;
ALTER TABLE pedidos ADD COLUMN parada INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS pedidos_ruta ON pedidos (ruta_id);

-- Productos: cuántas piezas caben en una reja y cuánto pesa cada pieza
ALTER TABLE productos ADD COLUMN piezas_reja INTEGER NOT NULL DEFAULT 24;
ALTER TABLE productos ADD COLUMN peso_kg REAL NOT NULL DEFAULT 0.72;

-- Distribuidores: canal, dirección de entrega y centro que lo atiende
ALTER TABLE solicitudes ADD COLUMN canal TEXT NOT NULL DEFAULT 'tienditas';
ALTER TABLE solicitudes ADD COLUMN direccion TEXT NOT NULL DEFAULT '';
ALTER TABLE solicitudes ADD COLUMN ciudad TEXT NOT NULL DEFAULT '';
ALTER TABLE solicitudes ADD COLUMN centro_id INTEGER;

-- Compras: proveedores y órdenes de compra
CREATE TABLE IF NOT EXISTS proveedores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  insumos TEXT NOT NULL DEFAULT '',        -- claves del inventario que surte, separadas por espacio
  contacto TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  correo TEXT NOT NULL DEFAULT '',
  ciudad TEXT NOT NULL DEFAULT '',
  liga TEXT NOT NULL DEFAULT '',
  dias_entrega INTEGER NOT NULL DEFAULT 7,
  credito_dias INTEGER NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'Por cotizar', -- Por cotizar · Cotizado · Activo · En pausa
  notas TEXT NOT NULL DEFAULT '',
  creado TEXT NOT NULL,
  actualizado TEXT
);
CREATE TABLE IF NOT EXISTS compras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proveedor_id INTEGER,
  estado TEXT NOT NULL DEFAULT 'Por pedir', -- Por pedir · Pedida · Recibida · Pagada · Cancelada
  lineas TEXT NOT NULL DEFAULT '[]',        -- [{clave, cantidad, costo}]
  total REAL NOT NULL DEFAULT 0,
  fecha TEXT NOT NULL DEFAULT '',
  fecha_esperada TEXT NOT NULL DEFAULT '',
  recibida_fecha TEXT,
  pagada_fecha TEXT,
  recibida INTEGER NOT NULL DEFAULT 0,      -- ya entró al inventario
  factura TEXT NOT NULL DEFAULT '',
  notas TEXT NOT NULL DEFAULT '',
  creado TEXT NOT NULL,
  actualizado TEXT,
  por TEXT NOT NULL DEFAULT ''
);

-- Dinero: cada peso que entra o sale. Los cobros de pedidos y los pagos de compras se anotan solos.
CREATE TABLE IF NOT EXISTS movimientos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL,                       -- Cobro · Pago
  categoria TEXT NOT NULL DEFAULT 'Otro',   -- Ventas · Depósitos · Insumos · Nómina · Renta · Transporte · Servicios · Marketing · Impuestos · Equipo · Inversión · Otro
  concepto TEXT NOT NULL DEFAULT '',
  monto REAL NOT NULL DEFAULT 0,
  fecha TEXT NOT NULL,
  metodo TEXT NOT NULL DEFAULT 'Transferencia',
  referencia TEXT NOT NULL DEFAULT '',
  pedido_id INTEGER,
  compra_id INTEGER,
  distribuidor_id INTEGER,
  proveedor_id INTEGER,
  notas TEXT NOT NULL DEFAULT '',
  creado TEXT NOT NULL,
  por TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS movimientos_fecha ON movimientos (fecha);
CREATE INDEX IF NOT EXISTS movimientos_pedido ON movimientos (pedido_id);
CREATE INDEX IF NOT EXISTS movimientos_compra ON movimientos (compra_id);

-- Logística: centros, vehículos y rutas. Una ruta es un día, un repartidor, un vehículo y sus paradas en orden.
CREATE TABLE IF NOT EXISTS centros (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  ciudad TEXT NOT NULL DEFAULT '',
  tipo TEXT NOT NULL DEFAULT 'Centro',      -- Planta · Maquila · Centro
  estado TEXT NOT NULL DEFAULT 'Planeado',  -- Planeado · Activo · Cerrado
  piezas_semana INTEGER NOT NULL DEFAULT 0, -- capacidad
  abre TEXT NOT NULL DEFAULT '',            -- cuándo se planea abrir
  notas TEXT NOT NULL DEFAULT '',
  orden INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS vehiculos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  tarimas INTEGER NOT NULL DEFAULT 1,
  rejas INTEGER NOT NULL DEFAULT 32,
  kg INTEGER NOT NULL DEFAULT 1000,
  costo_km REAL NOT NULL DEFAULT 0,
  propio INTEGER NOT NULL DEFAULT 1,
  activo INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS rutas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL,
  repartidor TEXT NOT NULL DEFAULT '',
  vehiculo_id INTEGER,
  centro_id INTEGER,
  estado TEXT NOT NULL DEFAULT 'Planeada',  -- Planeada · Cargada · En camino · Terminada
  km REAL NOT NULL DEFAULT 0,
  costo REAL NOT NULL DEFAULT 0,
  notas TEXT NOT NULL DEFAULT '',
  creado TEXT NOT NULL,
  actualizado TEXT
);

-- Equipo: los puestos antes que la gente. Cada puesto dice cuándo toca contratarlo (piezas por semana).
CREATE TABLE IF NOT EXISTS puestos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden INTEGER NOT NULL DEFAULT 0,
  nombre TEXT NOT NULL,
  area TEXT NOT NULL DEFAULT 'Operación',   -- Dirección · Producción · Comercial · Logística · Compras · Dinero · Personas · Datos · Calidad
  hace TEXT NOT NULL DEFAULT '',
  perfil TEXT NOT NULL DEFAULT '',
  mide TEXT NOT NULL DEFAULT '',
  disparador INTEGER NOT NULL DEFAULT 0,    -- piezas por semana a partir de las cuales se contrata
  por_piezas INTEGER NOT NULL DEFAULT 0,    -- una plaza por cada tantas piezas por semana (0 = una sola plaza)
  sueldo REAL NOT NULL DEFAULT 0,           -- mensual, bruto, con prestaciones
  donde TEXT NOT NULL DEFAULT '',           -- dónde buscar
  prueba TEXT NOT NULL DEFAULT '',          -- cómo elegir
  ocupadas INTEGER NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'Después',   -- Después · Buscar · Entrevistando · Contratado
  persona TEXT NOT NULL DEFAULT '',
  notas TEXT NOT NULL DEFAULT '',
  actualizado TEXT
);
CREATE TABLE IF NOT EXISTS candidatos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  puesto_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  whatsapp TEXT NOT NULL DEFAULT '',
  fuente TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'Nuevo',     -- Nuevo · Entrevista · Prueba · Oferta · Contratado · Descartado
  calificacion INTEGER NOT NULL DEFAULT 0,
  notas TEXT NOT NULL DEFAULT '',
  creado TEXT NOT NULL,
  actualizado TEXT
);
CREATE INDEX IF NOT EXISTS candidatos_puesto ON candidatos (puesto_id);

-- Mercado: canales, regiones y dónde buscar comercializadores (docs/06)
CREATE TABLE IF NOT EXISTS mercados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden INTEGER NOT NULL DEFAULT 0,
  tipo TEXT NOT NULL DEFAULT 'Canal',       -- Canal · Región · Fuente
  clave TEXT NOT NULL DEFAULT '',           -- para ligar el canal con los distribuidores
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  tamano TEXT NOT NULL DEFAULT '',
  estrategia TEXT NOT NULL DEFAULT '',
  como TEXT NOT NULL DEFAULT '',            -- cómo entrar o dónde buscar
  fase INTEGER NOT NULL DEFAULT 2,
  prioridad TEXT NOT NULL DEFAULT 'Media',
  estado TEXT NOT NULL DEFAULT 'Después',   -- Después · Explorando · Piloto · Activo · Descartado
  responsable TEXT NOT NULL DEFAULT '',
  meta_semana INTEGER NOT NULL DEFAULT 0,   -- piezas por semana que se le piden a este canal o región
  notas TEXT NOT NULL DEFAULT '',
  actualizado TEXT
);
