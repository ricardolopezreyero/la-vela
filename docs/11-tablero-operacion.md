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

Lo que se automatizó:

- Una solicitud nueva o un pedido hecho desde la liga manda un correo a los administradores.
- Al pasar un pedido a «Curando» baja del inventario la cera, los vasos, las mechas, los cartuchos, las etiquetas y las cajas, según la receta activa.
- Al entregarse, los cartuchos vacíos que regresa el distribuidor entran al inventario.
- Cada cambio de etapa queda en la bitácora con quién lo hizo.

Pendiente: aviso por WhatsApp (hoy es por correo), fotos para las personalizadas y registros de garantía por QR.

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
