# 11 · Tablero de operación (dashboard)

## Cómo quedó construido (octubre de 2026)

Vive en `vela.capitaltorreon.com/tablero/` y se entra desde el ícono de persona del sitio, con un enlace que llega al correo (sin contraseña). Todo está en una sola aplicación: nada abre otra página.

| Pantalla | Qué resuelve | De qué módulo es |
|---|---|---|
| **Hoy** | Lo que pide atención, de lo más urgente a lo menos; la fase y su métrica; las temporadas que vienen | 7 |
| **Distribuidores** | Cada solicitud del sitio entra sola, ya calificada A/B/C y con su plazo (A: 24 h, B: 72 h). Tablero por etapas o tabla; WhatsApp con el mensaje escrito; zona y exclusividad; próxima acción; bitácora | 2 |
| **Pedidos** | Del pedido al cobro en nueve etapas. El total incluye el depósito de cartuchos y descuenta los vacíos | 4 |
| **Liga de pedidos** | `/pedir?d=…`: liga privada por distribuidor, con catálogo por caja, saldo, historial y «repetir mi último pedido» | 3 |
| **Producción** | Qué fabricar según los pedidos confirmados, material que hace falta, compra sugerida, inventario con mínimos y lotes con su prueba | 5 |
| **Cartuchos** | Cuántos andan fuera, cuántos regresan, por distribuidor, y el saldo de depósitos | 6 |
| **Indicadores** | Venta de la semana contra la meta, recompra, embudo, cobranza por antigüedad, entregas a tiempo | 7 |
| **Proyecto** | El checklist (docs/05), los supuestos por validar (docs/12) y los pasos de protección, como tarjetas | 1 |
| **Receta** | Las recetas, editables en pantalla, y las pruebas de encendido con sus gramos por hora y horas proyectadas | — |
| **Modelo** | El modelo de negocio y la descarga del Excel | — |

### La empresa completa (segunda entrega, octubre de 2026)

El principio cambió de orden: **primero el sistema, luego la gente.** Cada puesto existe en el tablero antes que la persona, y cada peso, cada reja y cada parada tienen su pantalla. Migración `0003_empresa.sql`; semilla en `herramientas/semilla.py` (que también genera `docs/15-equipo-y-mercado.md`).

| Pantalla | Qué resuelve |
|---|---|
| **Datos** | La sala de datos: el negocio en una pantalla (piezas por semana y participación de mercado, ventas y EBITDA del mes, caja, por cobrar y por pagar, tiendas y distribuidores, cartuchos, equipo, pedidos por etapa, operación, dinero, pendientes y supuestos por validar). Botón para copiar el resumen |
| **Ventas** | Por mes, por canal, por producto y por distribuidor; piezas por semana contra la meta y contra el plan Rentable; lo que trae el embudo en propuesta y piloto |
| **Mercado** | La meta (25% de las velas de México) con la escalera de escalones: piezas, tiendas, distribuidores, centros, personas y EBITDA en cada uno. Tres pestañas: **canales** (10), **regiones** (La Laguna → Norte → Bajío → Centro → Occidente → Sur → Centroamérica y Colombia → Estados Unidos) y **dónde buscar comercializadores** (9 fuentes, en orden de rapidez). Cada uno con estrategia, cómo entrar, fase, prioridad, responsable y meta de piezas por semana |
| **Compras** | Sugerencia de compra (pedidos confirmados + mínimos) que se vuelve orden de compra con un clic; órdenes por etapas (Por pedir → Pedida → Recibida → Pagada); al recibirse entra al inventario y actualiza el costo por unidad; al pagarse se anota el pago. Proveedores con qué surten, días de entrega y crédito. Cobertura en días por material |
| **Rutas** | Todos los pedidos listos, de todas las ciudades, en una lista; el repartidor los acomoda en rutas (fecha, repartidor, vehículo, centro de salida) con las paradas en orden. Cada pedido trae sus rejas y kilos; la ruta se mide contra el vehículo y avisa si no cabe. «Llenar con lo que haya listo» acomoda por ciudad hasta donde quepa. Cargar la ruta pasa los pedidos a «En ruta»; cada parada se marca entregada; aviso por WhatsApp al distribuidor. Costo por pieza de cada ruta |
| **Pagos** | Cada peso que entra o sale. Los cobros de pedidos y los pagos de compras se anotan solos; lo demás se captura (nómina, renta, transporte, servicios, aportaciones). Caja, por cobrar, por pagar, en qué se va |
| **Contabilidad** | Estado de resultados de 12 meses (ventas sin IVA, costo de ventas por pieza, gastos por categoría, EBITDA, cobrado, IVA estimado), costo por pieza al día y dos CSV para el contador |
| **Equipo** | 19 puestos con qué hace, perfil, qué mide, desde cuántas piezas por semana se contrata, una plaza por cada cuántas, sueldo, dónde buscar y la prueba para elegir. El tablero dice cuándo toca contratar y cuántas personas pide cada escalón. Candidatos por puesto |

Empaque: reja de 24 piezas (dos cajas de 12) y tarima de 32 rejas (768 piezas). La liga de pedidos del distribuidor sugiere completar la reja y la tarima; el pedido guarda sus rejas y sus kilos.

Acceso: con la cuenta de Google por el Login de CapitalTorreon (`/api/entrar-pase` verifica el pase con la llave pública) o con el enlace al correo. Solo entra quien esté en `usuarios`.

### El panel del distribuidor (`/distribuidor/`)

Entra con su cuenta de Google por el Login de CapitalTorreon; su correo se liga a su ficha desde el tablero (campo «Su cuenta de Google»). Lo que ve:

- **Pedir en un clic:** «Repetir mi último pedido» crea el pedido al instante. «Llenar una tarima» arma 64 cajas con su mezcla. El formulario sugiere completar la reja y la tarima, muestra lo que gana con ese pedido y avisa si rebasa su crédito.
- **Anticipados:** elige la fecha de entrega (botones de temporada: San Judas, Muertos, Guadalupe…); más de una semana después del plazo normal se marca como anticipado y se produce con tiempo.
- **Cómo va cada pedido:** barra de ocho pasos, historia con fechas, cuándo sale la ruta, cuánto gana con él.
- **Pagos:** con tarjeta (Stripe Checkout; al volver se le pregunta a Stripe si se pagó y el pedido pasa a Confirmado) o por transferencia (ve la CLABE de Ajustes, avisa con su referencia y el equipo la confirma en Pagos). También puede pagar al recibir.
- **Lo que gana:** por pieza y por caja, con el margen de la tienda; estimación mensual por sus tiendas; lo ganado con lo entregado.
- **Material de promoción:** exhibidor, cartel, calcomanía, lona y las hojas PDF; lo gratis va en su siguiente pedido.

La liga privada `/pedir?d=…` sigue sirviendo para quien no tenga Google.

### Quién ve qué (`Usuarios`)

Solo los administradores entran a Usuarios y a Ajustes. La pantalla es una matriz: usuarios hacia abajo, pantallas a la derecha, una palomita por celda que se guarda al instante. Un usuario «equipo» ve solo sus pantallas palomeadas; el servidor recorta lo que manda (`todo()` no entrega movimientos, compras o puestos a quien no tiene esas pantallas) y rechaza escrituras fuera de ellas (`PERMISO` en `src/tablero.js`). Administradores en producción: los correos de Ricardo (superleads, gmail e ingenieriadigital) y el de Conecta Velas.

### Las siguientes 100

La lista de lo que el tablero iba a necesitar vive en Proyecto, sección «Tablero» (100 tarjetas, 59 hechas en la primera pasada) y en `docs/16-las-siguientes-100.md`. Entre lo hecho: buscador de todo (tecla «/»), refrescar y hora, copiar pendientes, posponer, alertas de días sin pedir, anticipados por producir, capacidad corta y retorno bajo; filtros, orden y CSV en Distribuidores y Pedidos; remisión y etiquetas de reja imprimibles; plan de la semana, merma y ajuste de inventario con motivo; sugerencia de compra por semanas de cobertura, historial de precios, WhatsApp al proveedor; hoja de ruta imprimible y **liga del repartidor** (`/ruta?r=…`); conciliación, repetir fijos, pagar nómina y flujo de cuatro semanas; contratar en un clic y organigrama; correo al distribuidor cuando su pedido cambia de paso; mensajes de WhatsApp editables en Ajustes.

### En vivo (`src/vivo.js`)

Un Durable Object («Vivo») guarda los WebSockets abiertos del tablero, de cada panel de distribuidor y de cada hoja de ruta, y la versión del tablero. Toda escritura del Worker lo avisa (`avisar()`), sube la versión y manda el cambio a quien le toca: al tablero todo; al distribuidor lo de sus pedidos y el catálogo; al repartidor su ruta. El cliente (`sitio/vivo.js`) recarga en cuanto llega el aviso (unos 100 ms después de la escritura) sin pisar lo que alguien esté escribiendo, ignora sus propios cambios (cabecera `x-vivo`), se reconecta solo y, si el socket no entra, pregunta la versión cada 8 segundos. El tablero muestra «● en vivo» y quién más está conectado.

Lo que se automatizó:

- Una solicitud nueva o un pedido hecho desde la liga manda un correo a los administradores.
- Al pasar un pedido a «Curando» baja del inventario la cera, los vasos, las mechas, los cartuchos, las etiquetas y las cajas, según la receta activa.
- Al entregarse, los cartuchos vacíos que regresa el distribuidor entran al inventario.
- Al cobrarse un pedido, entran al libro la venta y los depósitos; al pagarse una compra, sale el pago.
- Al recibirse una compra, entra al inventario y pone al día el costo por unidad.
- «Hoy» avisa de compras que no llegan, pagos por hacer, rutas del día, pedidos listos sin ruta y puestos que ya toca contratar.
- Cada cambio de etapa queda en la bitácora con quién lo hizo.

Pendiente: onboarding de seis pantallas para quien entra por primera vez, aviso por WhatsApp (hoy es por correo), fotos para las personalizadas, registros de garantía por QR y facturación electrónica conectada.

---

**Principio:** todo nace de un evento, el **pedido**. De ahí salen producción, compras, ruta, cobranza y regreso de cartuchos. Los distribuidores se atienden solos y el equipo solo ve excepciones.

## Los 7 módulos

| # | Módulo | Para qué | Cuándo |
|---|---|---|---|
| 1 | Proyecto | Hacerlo realidad (checklist del archivo 05) | Ya |
| 2 | Distribuidores | Recibir, calificar y activar distribuidores | Ya |
| 3 | Página de pedidos | El distribuidor pide solo | Piloto |
| 4 | Tablero de pedidos | Del pedido al cobro | Piloto |
| 5 | Producción e inventario | Qué fabricar y qué comprar | Piloto |
| 6 | Cartuchos retornables | El ciclo del cartucho | Lanzamiento |
| 7 | Indicadores | Saber si el negocio va bien en 30 segundos | Lanzamiento |

### 1 · Proyecto

Tablero con las secciones del checklist (Producción, Producto, Comercialización, Distribución, Talento, Fábrica N2, Fábrica N3, Maquinaria). Columnas: Por hacer · En curso · Hecho · Después · Descartado. Propiedades: Sección, Fase, Responsable, Fecha, Prioridad.

### 2 · Distribuidores

- **Entrada automática:** cada formulario "Quiero distribuir" crea una tarjeta con su puntaje A/B/C.
- **Columnas:** Nuevo → Calificado → Contactado → Llamada o visita → Propuesta → Piloto → Activo → En pausa / Descartado.
- **Datos:** respuestas del formulario, puntaje y tipo, zona y si tiene exclusividad, responsable, próxima acción y fecha, tiempo máximo de respuesta (A: 24 h, B: 72 h).
- **Alertas:** A nuevo → aviso por WhatsApp; zona tomada → lista de espera; tarjeta vencida → roja.
- Puede vivir en el CRM SuperLeads.

### 3 · Página de pedidos

- Un link privado por distribuidor.
- Catálogo por caja de 12: Semanal, Cartucho, Temporada, Personalizada; temporada activa arriba.
- Crédito disponible, saldo, historial y botón "repetir último pedido".
- Campo de cartuchos vacíos que entrega (se descuentan).
- Personalizadas: subir foto y nombre.
- Pedido mínimo y fecha estimada de entrega automáticos.

### 4 · Tablero de pedidos

- **Columnas:** Recibido → Confirmado (crédito o pago) → En producción → Curando (48 h) → Control de calidad → Listo → En ruta → Entregado → Cobrado.
- **Tarjeta:** distribuidor, piezas por producto, lote, cartuchos que regresan, fecha prometida, estado de cobro.
- **Alertas:** pedido en riesgo de retraso; distribuidor con más de 30 días vencido.

### 5 · Producción e inventario

- Pedidos confirmados → kilos de cera, vasos, mechas y cartuchos necesarios.
- Inventario bajo el mínimo → orden de compra.
- Lotes con prueba de calidad (g/h, horas proyectadas, aprobado/rechazado), ligados a sus pedidos.
- Capacidad vs demanda, con aviso de pre-producir para Muertos y Navidad.

### 6 · Cartuchos retornables

- En circulación, en tienda, en ruta y en planta.
- Tasa de retorno por distribuidor y tienda.
- Vueltas promedio y bajas a reciclaje.
- Saldo de depósitos.

### 7 · Indicadores (una pantalla)

- **Venta:** piezas y pesos de la semana vs meta, por distribuidor, zona y producto.
- **Recompra:** % de cartuchos sobre el total. La métrica que dice si el modelo funciona.
- **Red:** tiendas activas, distribuidores por tipo, embudo de distribuidores.
- **Operación:** pedidos a tiempo, días de inventario, lotes rechazados.
- **Dinero:** cuentas por cobrar por antigüedad, margen por producto.
- **Garantía:** registros por QR y reclamos.
- **Calendario:** días para la próxima temporada.

## Bases de datos y relaciones

- Distribuidores → Zonas → Tiendas
- Pedidos → Líneas de pedido → Productos
- Pedidos ↔ Lotes de producción ↔ Inventario
- Cartuchos (movimientos) ↔ Pedidos ↔ Tiendas
- Cobranza ↔ Pedidos
- Garantías ↔ Lotes

## Orden de construcción

1. **Ya (sin programar):** Notion con las bases relacionadas, formulario del sitio conectado a Distribuidores, avisos por WhatsApp.
2. **Piloto:** página de pedidos (link por distribuidor), tableros de pedidos e inventario.
3. **Escala (más de ~5 distribuidores):** app propia desarrollada en Claude Code, con Notion como respaldo.
