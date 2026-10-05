-- RLR · La Vela — control fino: pantallas por usuario, liga del repartidor, merma, conciliación.
-- Se corre UNA sola vez, después de 0004_distribuidor.sql. Ricardo López Reyero

-- Qué pantallas ve cada quien (lista separada por espacios; vacío + rol admin = todas)
ALTER TABLE usuarios ADD COLUMN pantallas TEXT NOT NULL DEFAULT '';

-- La liga del repartidor: abre su ruta en el teléfono sin login y marca cada parada
ALTER TABLE rutas ADD COLUMN liga TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS rutas_liga ON rutas (liga) WHERE liga IS NOT NULL;

-- Merma por lote y conciliación bancaria
ALTER TABLE lotes ADD COLUMN rechazadas INTEGER NOT NULL DEFAULT 0;
ALTER TABLE movimientos ADD COLUMN conciliado INTEGER NOT NULL DEFAULT 0;
