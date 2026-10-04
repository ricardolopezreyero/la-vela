# 07 · Modelo de negocio

El modelo completo está en [`modelo/Modelo_Negocio_Velas_Rinde.xlsx`](../modelo/Modelo_Negocio_Velas_Rinde.xlsx): 16 hojas, 36 meses, 5,525 fórmulas, selectores de escenario en `Supuestos` (D5: Base u Optimizado; D6: Conservador, Medio o Alto).

## El modelo en una frase

El cliente compra el vaso una vez y después compra el repuesto en la misma tienda. Para miscelánea **no va la Vela Récord** (costaría $600–900 al público); va una veladora de parafina con la ingeniería aplicada, a precio de tienda ($12–35 es el rango de la competencia).

## Productos y precios al público (con IVA)

| Producto | Base (primera propuesta) | **Optimizado** | Qué es |
|---|---|---|---|
| Semanal | $45 | **$49** | Vaso + 7 días garantizados |
| Repuesto / Cartucho | $32 | **$34** | Sin vaso; competencia semanal $34.90 |
| Temporada | $59 | **$65** | San Judas, Guadalupe, Muertos |
| Personalizada | $89 | **$99** | Foto, nombre o intención, por WhatsApp |
| Corporativa con logo | $229 | **$249** | Venta directa |
| Repuesto a parroquias | $40 | **$42** | Directo |
| Repuesto a restaurantes y hoteles | $38 | **$40** | Contrato |
| Vela Récord (neto recibido) | $790 | **$850** | Premium |
| Recarga Vela Récord | $290 | **$320** | Premium |
| Ticket de insumos en línea | $289 | **$329** | Por pedido |
| Taller por persona | $650 | **$750** | |

## La corrección importante

La primera propuesta (tienda 30%, distribuidor 20%, Semanal $45) **pierde dinero** cuando se hace bien la cuenta:

- No descontaba el **IVA (16%)**.
- Usaba parafina a ~$26/kg; el precio real puesto en planta es **$29–34/kg** (USD 1,461/t en Norteamérica, Q2-2026, × tipo de cambio $18.37 × factor de flete e importación).

**Regla de la cascada:** la tienda gana su margen sobre el precio con IVA; el distribuidor gana su margen sobre lo que le vende a la tienda; a nosotros nos llega:

> **Precio al público × (1 − margen tienda) × (1 − margen distribuidor) ÷ 1.16**
> Base: 48.3% del precio · Optimizado: 52.2% del precio

## Costo de la Semanal (sin IVA)

| Concepto | Base | Optimizado |
|---|---|---|
| Parafina puesta en planta | $33.55/kg | $29.52/kg |
| Gramos por pieza (g/h × 168 h × residual) | 459 g (2.6 g/h, 5%) | 398 g (2.3 g/h, 3%) |
| Cera | $15.39 | $11.75 |
| Vaso | $5.50 | $4.20 |
| Mecha + base | $0.50 | $0.40 |
| Etiqueta | $0.90 | $0.75 |
| Caja master | $0.45 | $0.35 |
| Flete a bodega | $0.49 | $0.25 |
| Merma | 3% | 1.5% |
| Transformación (maquila) | $2.20 | $2.20 |
| **Costo total** | **$26.12** | **~$20.17** |

Transformación con planta propia: ~$1.24/pza (operario a 1.15 × salario mínimo 2026 de $315.04, carga social 1.35, 550 pzas/día, energía $0.25, consumibles $0.10). Pero la planta tiene ~$45.5 mil al mes de costo fijo (renta, supervisor, depreciación), así que **solo conviene arriba de ~47 mil piezas al mes**. Antes, maquila.

## Quién gana qué por pieza (Optimizado, con maquila)

| | Semanal $49 | Repuesto $34 | Temporada $65 | Personalizada $99 |
|---|---|---|---|---|
| La tienda gana | $13.23 | $9.18 | $17.55 | $26.73 |
| El distribuidor gana | $6.08 | $4.22 | $8.07 | $12.29 |
| Nosotros ganamos | $5.43 | $2.98 | $12.57 | $26.47 |

- **Utilidad ponderada por pieza:** Base −$2.45 → Optimizado **+$7.21**.
- Semanal en Base: **−$4.40** por pieza.
- **El repuesto deja menos que la Semanal.** Su valor es retener al cliente en la tienda, no el margen.
- La tienda gana 27%, más que con refrescos de marca (22–23%).

## Economía de canales directos (Optimizado)

| Canal | Utilidad por unidad | Margen |
|---|---|---|
| Parroquias (repuesto) | $22.15 | 61% |
| Restaurantes y hoteles | $20.43 | 59% |
| Recaudación (el organizador se queda 30%) | $10.36 | 35% |
| Corporativa con logo | $167.23 | 78% |
| Vela Récord | $412.76 | 56% |
| Recarga Récord | $155.86 | 56% |
| Insumos en línea (por pedido, tras comisión 17%, envío y publicidad) | $48.30 | 17% |
| Taller (por persona) | $381.55 | 59% |

## Escenarios (36 meses)

Volumen del canal distribuidor: Conservador 300 tiendas × 5 piezas/semana; Medio 500 × 8; Alto 800 × 12. Crecimiento de 10% anual por tienda desde el año 2. Piloto de 50 tiendas por 2 meses y rampa de 6 meses. Estacionalidad: octubre–diciembre altos (Oct + Nov ≈ 27% del año).

| Escenario | EBITDA año 1 | Año 2 | Año 3 | Capital máximo | Se recupera |
|---|---|---|---|---|---|
| Base · Medio | −$1.89 M | −$1.84 M | −$1.92 M | ~$6.9 M | nunca |
| Optimizado · Conservador | −$490 mil | $41 mil | $98 mil | ~$826 mil | más de 36 meses |
| **Optimizado · Medio** | **−$45 mil** | **$987 mil** | **$1.14 M** | **~$763 mil** | **mes 19** |
| Optimizado · Alto | $964 mil | $3.1 M | $3.5 M | ~$969 mil | mes 15 |

Optimizado · Medio, promedio mensual del año 2: cada tienda gana ~$508, el distribuidor ~$117 mil, nosotros ~$82 mil de EBITDA.

**El peso del negocio son los gastos fijos (~$109 mil al mes):** dirección y comercial, diseño, atención por WhatsApp, contador, servicios, software, seguros, pruebas y viáticos. Con volumen conservador no se cubren.

## Palancas de eficiencia (impacto anual estimado, año 2, Optimizado · Medio)

| Palanca | Impacto |
|---|---|
| Precios al público más altos | ~$500 mil |
| Parafina por tonelada (factor 1.25 → 1.10) | ~$380 mil |
| Mecha optimizada (2.6 → 2.3 g/h) | ~$364 mil |
| Margen de tienda 30% → 27% | ~$240 mil |
| Margen de distribuidor 20% → 17% | ~$211 mil |
| Vaso por millar ($5.50 → $4.20) | ~$197 mil |
| Merma 3% → 1.5% | ~$63 mil |
| Menos cera residual | ~$54 mil |
| Mecha, etiqueta y caja | ~$53 mil |
| Flete (tarimas y viajes) | ~$36 mil |
| Mezcla con más personalizada | ~$36 mil |
| Planta propia hoy (vs maquila) | **−$318 mil** (no conviene aún) |

**Más ideas no cuantificadas:** cartucho/vaso retornable, usar el regreso vacío de los camiones del distribuidor, pre-producir en junio–septiembre para la temporada alta, derretir en horario eléctrico barato, recuperar cera de devoluciones, imprimir directo en el vaso, pedidos en múltiplos de caja, bases con mecha ya engargolada, una sola receta, usar los datos del QR para mover inventario entre tiendas, licenciar la especificación.

## Para el cliente

- Costo por hora de luz: Semanal $0.29/h, Repuesto $0.20/h; competencia semanal $0.21/h **si** sus 168 h declaradas son reales.
- Cliente devoto (1 veladora por semana): competencia $1,815 al año vs nosotros $1,783 (1 Semanal + 51 repuestos) → ahorro ~$32. **El argumento es la duración garantizada, no el precio.**
- Valor de vida de ese cliente para nosotros: ~$158 de utilidad al año.
- El exhibidor + material de una tienda (~$370) se paga en ~1.4 meses.

## Supuestos de gastos (Optimizado)

- Sueldos: dirección $25 mil, comercial $20 mil, diseño $12 mil, atención $10 mil (desde mes 3), supervisor $16 mil (solo con planta); carga social 1.35.
- Contador $5 mil, servicios $4 mil, software $3 mil, seguros y Protección Civil $1.8 mil, pruebas $2 mil, viáticos $3 mil.
- Arranque (mes 1): marca y empaque $35 mil, legal $25 mil, fotos y video $15 mil, prototipos $8 mil.
- Variables: garantía 1% del costo del canal, 4% de clientes escanean el QR ($0.80 por registro), marketing 3.5% de ingresos, comisión de ventas directas 3%, comisión bancaria 2.5%.
- Tienda nueva: exhibidor $320 + material $50; carga inicial de 24 piezas; venta garantizada con 4% de devolución.
- Capital de trabajo: cobro al distribuidor 30 días, directos 15, inventario 20 días, pago a proveedores 30 días, caja mínima $50 mil.
- Impuestos: ISR 30%, PTU 10%, con pérdidas acumuladas (aproximación).

## Hojas del Excel

Inicio · Resumen · Supuestos · Costeo · Cascada · Volumen · Resultados · Flujo · Capex_Capacidad · Palancas · Sensibilidad · Todos_ganan · Competencia · Prueba_encendido · Riesgos · Fuentes.

**Pendiente:** actualizar el costeo del repuesto al formato de cartucho retornable (depósito, costo del cartucho repartido entre vueltas, reproceso; sale la funda y parte del empaque).
