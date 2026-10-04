-- RLR · La Vela — solicitudes de «Quiero distribuir» (docs/10 y docs/11, módulo 2)
CREATE TABLE IF NOT EXISTS solicitudes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  creada TEXT NOT NULL,            -- fecha y hora UTC (ISO)
  nombre TEXT NOT NULL,
  empresa TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  zonas TEXT NOT NULL,             -- ciudades o estados donde distribuye
  puntos TEXT NOT NULL,            -- puntos de venta que surte
  tipos TEXT NOT NULL,             -- tipos de punto de venta, separados por « · »
  visita TEXT NOT NULL,            -- cada cuánto visita cada tienda
  veladoras TEXT NOT NULL,         -- veladoras que ya vende al mes
  vehiculos TEXT NOT NULL,
  pedido TEXT NOT NULL,            -- tamaño del primer pedido
  puntaje INTEGER NOT NULL,        -- 5 a 15 (interno, no se publica)
  tipo TEXT NOT NULL,              -- A · B · C
  estado TEXT NOT NULL DEFAULT 'Nuevo'
);
CREATE INDEX IF NOT EXISTS solicitudes_creada ON solicitudes (creada);
