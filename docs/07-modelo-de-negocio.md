# 07 · Modelo de negocio

El modelo completo está en [`modelo/La_Vela_Modelo_de_Negocio_v4.xlsx`](../modelo/La_Vela_Modelo_de_Negocio_v4.xlsx): 21 hojas, 36 meses y tres escenarios de precios y costos (`Supuestos!D5`: 1 = Base, 2 = Optimizado, 3 = Rentable) por tres de volumen (`D6`: Conservador, Medio, Alto). **El plan vigente es Rentable · Medio.** La explicación larga está en https://vela.capitaltorreon.com/modelo.

<sub>Este documento lo escribe `herramientas/construir_pagina_modelo.py` a partir del Excel: no se edita a mano.</sub>

## El modelo en una frase

El cliente compra el vaso una vez y después compra el cartucho en la misma tienda. Para miscelánea **no va la Vela Récord** (costaría $600–900 al público); va una veladora de parafina con la ingeniería aplicada, a precio de tienda.

## Productos y precios al público (con IVA)

| Producto | Base | Optimizado | **Rentable** | Qué es |
|---|---|---|---|---|
| Semanal | $45 | $49 | **$55** | Vaso + cartucho |
| Cartucho (repuesto) | $32 | $34 | **$34** | Sin vaso; competencia semanal $34.90 |
| Temporada | $59 | $65 | **$69** | San Judas, Guadalupe, Muertos |
| Personalizada | $89 | $99 | **$99** | Foto, nombre o intención, por WhatsApp |
| Corporativa con logo | $229 | $249 | **$249** | Venta directa |
| Cartucho a parroquias | $40 | $42 | **$42** | Directo |
| Cartucho a restaurantes y hoteles | $38 | $40 | **$40** | Contrato |
| Vela Récord | $790 | $850 | **$850** | Premium |
| Recarga Vela Récord | $290 | $320 | **$320** | Premium |
| Taller por persona | $650 | $750 | **$750** |  |

## La regla de la cascada

La tienda gana su margen sobre el precio con IVA; el distribuidor gana el suyo sobre lo que le vende a la tienda; a nosotros nos llega:

> **Precio al público × (1 − margen tienda) × (1 − margen distribuidor) ÷ 1.16**
> Base: 48.3% del precio · Optimizado y Rentable: 52.2% del precio

La primera propuesta (tienda 30%, distribuidor 20%, Semanal $45) **perdía dinero**: no descontaba el IVA y usaba parafina a ~$26/kg, cuando puesta en planta cuesta $29–34/kg.

## Costo de la Semanal (sin IVA)

| Concepto | Base | Optimizado y Rentable |
|---|---|---|
| Parafina puesta en planta, por kilo | $33.55 | $29.52 |
| Gramos de cera por pieza | 459 | 398 |
| Cera | $15.39 | $11.75 |
| Transformación (maquila) | $2.20 | $2.20 |
| **Costo de la Semanal** | **$26.12** | **$20.17** |
| Costo del Cartucho | $19.20 | $14.77 |
| Costo de la Temporada | $27.66 | $21.38 |
| Costo de la Personalizada | $33.84 | $25.24 |

Con planta propia la transformación baja a $1.24 por pieza, pero la planta trae costo fijo: **solo conviene arriba de ~47 mil piezas al mes**. Antes, maquila.

## Quién gana qué por pieza (Rentable, con maquila)

|  | Semanal $55 | Cartucho $34 | Temporada $69 | Personalizada $99 |
|---|---|---|---|---|
| La tienda gana | $14.85 | $9.18 | $18.63 | $26.73 |
| El distribuidor gana | $6.83 | $4.22 | $8.56 | $12.29 |
| Nosotros ganamos | $8.56 | $2.98 | $14.66 | $26.47 |
| Nuestro margen | 30% | 17% | 41% | 51% |

- **Utilidad ponderada por pieza:** Base −$2.45 → Optimizado $7.21 → Rentable **$9.22**.
- **El cartucho deja menos que la Semanal.** Su valor es retener al cliente en la tienda, no el margen.
- La tienda gana 27%, más que con refrescos de marca (22.5%).

## Lo que gana cada quien al mes (promedio del año 2)

|  | Al mes |
|---|---|
| Cada tienda | $551 |
| El distribuidor | $126,540 |
| Nosotros, antes de impuestos | $151,647 |
| Nosotros, utilidad neta | $90,717 |

## Canales directos

| Canal | Precio | Nos cuesta | Utilidad por unidad | Margen |
|---|---|---|---|---|
| Cartucho a parroquias | $42 | $14.77 | $21.43 | 59% |
| Cartucho a restaurantes y hoteles | $40 | $14.77 | $19.71 | 57% |
| Recaudación con colegios y parroquias  (ellos venden y se quedan 30%) | $55 | $20.17 | $13.02 | 39% |
| Regalo corporativo con logo | $249 | $48.38 | $166.27 | 77% |
| Vela Récord  (premium, cera de abeja) | $850 | $320.00 | $412.76 | 56% |
| Recarga de la Vela Récord | $320 | $120.00 | $155.86 | 56% |
| Taller de velas  (por persona) | $750 | $265.00 | $381.55 | 59% |
| Insumos en línea  (por pedido) | $329 | $235.32 | $48.30 | 17% |

## Escenarios (36 meses)

| Escenario | EBITDA año 1 | Año 2 | Año 3 | Capital máximo | Se recupera |
|---|---|---|---|---|---|
| Optimizado · Medio (el plan anterior) | −$45 mil | $987 mil | $1.14 M | $763 mil | mes 19; en firme, mes 26 |
| Rentable · Conservador | −$19 mil | $599 mil | $673 mil | $445 mil | mes 15 |
| **Rentable · Medio** | **$583 mil** | **$1.82 M** | **$2.02 M** | **$416 mil** | **mes 14** |
| Rentable · Alto | $1.93 M | $4.55 M | $5.02 M | $523 mil | mes 11 |

**El peso del negocio son los gastos fijos ($101,150 al mes):** dirección y comercial, diseño por proyecto, atención por WhatsApp, contador, servicios, software, seguros, pruebas y viáticos.

## De Optimizado a Rentable

Siete cambios que no tocan el costo ni el número de tiendas. Lo que vale cada uno en el año 2, si fuera el único:

| Palanca | Cambio | Vale al año | De qué depende |
|---|---|---|---|
| La vela con vaso, más cara | Semanal de $49 a $55 | +$244 mil | Decisión. El vaso se compra una vez: el cliente paga $6 más una sola vez. |
| Más regalos corporativos | De 5 a 10 pedidos en noviembre y en diciembre | +$176 mil | Venta. Es lo que más deja por pieza: $166. |
| Más personalizadas | De 7% a 10% de las piezas | +$120 mil | Venta. Cada una deja 3 veces lo que una Semanal. |
| La edición de temporada, más cara | De $65 a $69 | +$108 mil | Decisión. No tiene comparación directa en el anaquel. |
| Diseño por proyecto | De $12 mil a $6 mil al mes | +$97 mil | Decisión. Sin plaza fija hasta que el volumen la pida. |
| Más parroquias, restaurantes y hoteles | El doble de clientes directos | +$52 mil | Venta. Compran cartuchos cada semana, sin intermediario. |
| Más campañas de recaudación | El doble, con colegios y parroquias | +$38 mil | Venta. Ellos venden y se quedan 30%. |

- Solo las tres decisiones (los dos precios y el diseño por proyecto): año 2 de $1.44 M, recuperación en el mes 15.
- Quedaron fuera: cartucho a $39 (+$208 mil, pero el cliente pagaría ~$229 más al año que con la competencia), margen de tienda a 25% (+$174 mil) y cartucho retornable (+$37 mil). Con las tres, el techo del año 2 es $2.24 M.
- **Límite del modelo:** las piezas por tienda no cambian con el precio. El piloto debe correr con dos precios de Semanal ($49 y $55).

## De Base a Optimizado

Impacto anual estimado de cada corrección, con las piezas del año 2:

| Palanca | Impacto |
|---|---|
| Subir precios (primera corrección: Semanal de $45 a $49, Cartucho de $32 a $34) | $519 mil |
| Comprar parafina por tonelada | $394 mil |
| Mecha que quema menos (de 2.6 a 2.3 gramos por hora) | $377 mil |
| Margen de la tienda (de 30% a 27%; sigue ganando más que con refresco) | $240 mil |
| Margen del distribuidor (de 20% a 17%, a cambio de exclusividad de zona) | $211 mil |
| Vaso por millar (de $5.50 a $4.20) | $205 mil |
| Menos merma | $65 mil |
| Menos cera sin quemar | $56 mil |
| Mecha, etiqueta y caja | $55 mil |
| Flete | $37 mil |
| Más personalizadas | $36 mil |
| Planta propia hoy, en vez de maquila | **−$310 mil** (no conviene aún) |

## Para el cliente

- Cliente devoto (una veladora por semana): competencia $1,815 al año contra $1,789 con nosotros (1 Semanal + 51 cartuchos). **El argumento es la duración comprobada, no el precio.**
- Valor de vida de ese cliente para nosotros: ~$161 de utilidad al año.
- El exhibidor y el material de una tienda ($370) se pagan en 1.1 meses.

## Cartucho retornable

Está en la hoja `Cartucho` y en `Supuestos`, sección 17, con su propio selector (`D184`: 1 = funda, 2 = cartucho). Viene en 1 porque los datos del cartucho son estimados y falta saber quién se queda con el depósito no reclamado.

## Hojas del Excel

Inicio · Resumen · Supuestos · Rentable · Costeo · Cartucho · Cascada · Volumen · Resultados · Flujo · Capex_Capacidad · Palancas · Sensibilidad · Todos_ganan · Distribuidor · Proteccion · Expansion · Competencia · Prueba_encendido · Riesgos · Fuentes.
