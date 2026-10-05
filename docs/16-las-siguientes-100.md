# 16 · Las siguientes 100 del tablero

Generado por `herramientas/semilla.py`. Lo que el tablero iba a necesitar, pantalla por pantalla; cada renglón es una tarjeta en Proyecto (sección «Tablero»). ✔ = ya está.

## Hoy

- ✔ Buscar en todo el tablero desde la barra (distribuidores, pedidos, proveedores, tareas, puestos) · Tecla «/» enfoca el buscador.
- ✔ Botón de refrescar y hora de la última actualización
- ✔ Copiar los pendientes de hoy como texto para WhatsApp
- ✔ Posponer un pendiente un día (próxima acción o tarea)
- ✔ Avisar de distribuidores activos que llevan N días sin pedir · N en Ajustes (14).
- ✔ Avisar de pedidos anticipados que ya hay que producir · Una semana antes de la fecha.
- ✔ Avisar cuando la demanda de la semana rebasa la capacidad por día
- ✔ Avisar de distribuidores con retorno de cartuchos por debajo de la meta · Meta en Ajustes (80 %).
- ✔ Atajos de teclado: «/» buscar, Esc cerrar el panel
- ○ Resumen semanal automático por correo a los administradores · Cron del Worker los lunes a las 7.

## Distribuidores

- ✔ Filtrar por etapa, por canal y «solo con pendiente»
- ✔ Ordenar la tabla al tocar el encabezado
- ✔ Exportar a CSV
- ✔ Botón «Siguiente etapa» en la ficha
- ✔ Días sin pedir, último pedido y totales en la ficha
- ✔ Semáforo de crédito en la tarjeta (saldo contra crédito)
- ✔ Mensajes de WhatsApp editables en Ajustes · {zonas}, {pedido}, {estado}, {detalle}.
- ✔ Mensaje de WhatsApp con la liga de su panel
- ✔ Asignarme como responsable con un clic
- ✔ Estado de cuenta imprimible por distribuidor
- ✔ Zonas con exclusividad, en una lista
- ○ Importar distribuidores desde un CSV
- ○ Adjuntar archivos (contrato, identificación) a la ficha · R2.
- ○ Contrato de distribución para firmar desde su panel
- ○ Mapa de zonas con los distribuidores activos

## Pedidos

- ✔ Filtrar por distribuidor y por estado
- ✔ Duplicar un pedido
- ✔ Días que faltan para la entrega en la tarjeta
- ✔ Avisar al distribuidor por WhatsApp del cambio de estado, con el mensaje escrito
- ✔ Totales de piezas y pesos por columna
- ✔ Exportar a CSV
- ✔ Nota de remisión imprimible · Con espacio para firma de recibido.
- ✔ Etiquetas de reja imprimibles (reja n de N, pedido, distribuidor)
- ✔ Corregir los cartuchos vacíos que de verdad entregó, aunque ya se haya fabricado
- ✔ Correo al distribuidor cuando su pedido se confirma, está listo, sale o se entrega · Solo si tiene correo.
- ○ Mover varios pedidos a la vez
- ○ Cancelar un pedido ya fabricado (regresa el material)
- ○ Subir foto del comprobante de entrega · R2.
- ○ Pedidos recurrentes (cada semana, solos)
- ○ Aviso por WhatsApp automático (no solo el botón) · API de WhatsApp Business.

## Producción

- ✔ Plan de la semana: piezas por día contra la capacidad
- ✔ Piezas rechazadas por lote (merma)
- ✔ Ajuste de inventario con motivo, en la bitácora
- ✔ Orden de producción imprimible por lote
- ✔ Pedidos por entregar esta semana y la que sigue
- ○ Código QR por lote en la etiqueta
- ○ Turnos y piezas por operador
- ○ Ligar varios pedidos a un lote desde el lote
- ○ Conteo físico guiado (inventario cíclico)
- ○ Historial de capacidad real por día

## Compras

- ✔ Sugerir compra para N semanas de cobertura · N en Ajustes (2).
- ✔ Historial de precios por insumo en la ficha del proveedor
- ✔ WhatsApp al proveedor con la orden escrita
- ✔ Orden de compra imprimible
- ✔ Exportar compras a CSV
- ○ Comparar tres cotizaciones por insumo
- ○ Recepción parcial de una orden
- ○ Adjuntar la factura (PDF o XML) · R2.
- ○ Calificar al proveedor (tiempo, calidad)
- ○ Aviso al proveedor por correo al pedir

## Rutas

- ✔ Hoja de ruta imprimible
- ✔ Liga del repartidor: su ruta en el teléfono sin login, marca entregado y anota el efectivo · /ruta?r=…
- ✔ Abrir cada parada en el mapa
- ✔ Duplicar una ruta (rutas recurrentes)
- ✔ Entregado y cobrado en efectivo en un paso
- ✔ La ruta se termina sola al entregar la última parada
- ○ Rejas que regresan vacías por ruta
- ○ Orden óptimo con mapa (distancias reales)
- ○ Ubicación del repartidor en vivo
- ○ Firma de recibido en el teléfono

## Cartuchos

- ✔ Meta de retorno editable
- ○ Retorno por tienda (no solo por distribuidor) · Necesita tiendas en la base.

## Indicadores

- ✔ Doce semanas de piezas, en barras
- ✔ Cada mes contra el anterior en Ventas
- ○ Exportar indicadores a CSV

## Pagos

- ✔ Marcar movimientos como conciliados con el banco
- ✔ Repetir los pagos fijos del mes pasado con un clic
- ✔ Pagar la nómina del mes desde Equipo con un clic
- ✔ Flujo de las próximas cuatro semanas (por cobrar y por pagar)
- ○ Presupuesto mensual por categoría contra el real
- ○ Conciliación automática con el estado de cuenta (CSV del banco)

## Contabilidad

- ○ Facturación electrónica (CFDI) desde el pedido · PAC.
- ○ Complemento de pago al cobrar

## Equipo

- ✔ Contratar a un candidato con un clic (sube la plaza y anota quién)
- ✔ Organigrama por área
- ○ Vacaciones y ausencias
- ○ Checklist de la primera semana por puesto
- ○ Evaluación mensual contra lo que mide cada puesto

## Mercado

- ✔ Distribuidores activos por región
- ○ Tiendas en el mapa por región

## Datos

- ○ Liga de solo lectura para socios e inversionistas · Hoy se resuelve con un usuario con la pantalla Datos.

## Panel del distribuidor

- ✔ Instalar como app en el teléfono
- ✔ Correo cuando su pedido cambia de paso
- ○ Descargar su estado de cuenta
- ○ Capturar piezas vendidas por tienda
- ○ Fotos para las personalizadas · R2.
- ○ Registro de garantías por QR
- ○ Pedir mandando un mensaje de WhatsApp (sin abrir el panel)

## Usuarios

- ✔ Usuarios con pantallas por palomita, en una matriz · Solo administradores. El servidor también lo revisa.
- ○ Bitácora de quién entró y cuándo

**59 hechas de 100.**
