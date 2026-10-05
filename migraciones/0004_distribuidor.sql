-- RLR · La Vela — el panel del distribuidor: su cuenta de Google, pagos, anticipados y promoción.
-- Se corre UNA sola vez, después de 0003_empresa.sql. Ricardo López Reyero

-- El distribuidor entra con el Login de CapitalTorreon: su correo de Google se liga aquí desde el tablero
ALTER TABLE solicitudes ADD COLUMN correo TEXT NOT NULL DEFAULT '';
CREATE UNIQUE INDEX IF NOT EXISTS solicitudes_correo ON solicitudes (correo) WHERE correo <> '';
CREATE TABLE IF NOT EXISTS sesiones_dist (hash TEXT PRIMARY KEY, distribuidor_id INTEGER NOT NULL, vence INTEGER NOT NULL, creada INTEGER NOT NULL);

-- Pedidos: anticipados (con fecha de entrega lejana), cómo se pagó, aviso de transferencia y material de promoción
ALTER TABLE pedidos ADD COLUMN anticipado INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pedidos ADD COLUMN pago_metodo TEXT NOT NULL DEFAULT '';      -- Stripe · Transferencia · Efectivo · '' (al entregar)
ALTER TABLE pedidos ADD COLUMN pago_aviso TEXT NOT NULL DEFAULT '';       -- referencia que manda el distribuidor al transferir
ALTER TABLE pedidos ADD COLUMN pago_aviso_fecha TEXT;
ALTER TABLE pedidos ADD COLUMN stripe_sid TEXT;
ALTER TABLE pedidos ADD COLUMN promos TEXT NOT NULL DEFAULT '[]';         -- [{clave, cantidad}]
ALTER TABLE pedidos ADD COLUMN promos_total REAL NOT NULL DEFAULT 0;

-- Material de promoción: exhibidores, hojas, carteles. Gratis o con precio; algunos se descargan.
CREATE TABLE IF NOT EXISTS promos (
  clave TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  precio REAL NOT NULL DEFAULT 0,           -- 0 = gratis
  condicion TEXT NOT NULL DEFAULT '',       -- cuándo se da gratis o cuántos por tienda
  liga TEXT NOT NULL DEFAULT '',            -- si se descarga
  activo INTEGER NOT NULL DEFAULT 1,
  orden INTEGER NOT NULL DEFAULT 0
);
