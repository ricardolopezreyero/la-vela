# La Vela · como Dios manda

**Ver en vivo:** https://vela.capitaltorreon.com

Este repositorio junta todo lo que hemos aprendido y decidido sobre el proyecto: desde la receta de la cera hasta el modelo de negocio, el sitio web y el tablero de operación.

**Qué es:** una veladora mexicana hecha con ingeniería. Está diseñada para durar lo más posible, se rellena con un cartucho retornable, el vaso se queda en casa como vaso de agua, y el vaso, la base y el cartucho son 100% reciclables. Se distribuye de forma masiva en tienditas y misceláneas a través de distribuidores con rutas.

**Origen:** en un recorrido por la bodega de un distribuidor que surte a ~1,000 tiendas y misceláneas, Ricardo preguntó cuál era el producto que más vendía. La respuesta fue: **"las velas"**.

**Autor:** Ing. Ricardo López Reyero · Torreón, Coahuila · Octubre 2026

---

## Índice

| # | Archivo | De qué trata |
|---|---|---|
| 01 | [Origen y visión](docs/01-origen-y-vision.md) | La historia, la tesis y los principios del proyecto |
| 02 | [Ingeniería de la vela](docs/02-ingenieria-de-la-vela.md) | Ceras, recetas, mecha, duración máxima, la Vela Récord, el vaso y el sistema de recarga |
| 03 | [Pruebas de encendido](docs/03-pruebas-de-encendido.md) | El protocolo para validar duración, mecha y receta |
| 04 | [Proveedores y kit de arranque](docs/04-proveedores-arranque.md) | Qué comprar para los prototipos y dónde |
| 05 | [Checklist del proyecto](docs/05-checklist-proyecto.md) | Todas las secciones y tareas, de prototipo a fábrica nivel 3 |
| 06 | [Go-to-market](docs/06-go-to-market.md) | El atajo, los 10 canales y la economía alrededor de la vela |
| 07 | [Modelo de negocio](docs/07-modelo-de-negocio.md) | Productos, precios, márgenes, escenarios y palancas de eficiencia |
| 08 | [Cartucho retornable](docs/08-cartucho-retornable.md) | El repuesto que regresa a la tienda y se rellena sin lavar |
| 09 | [Manifiesto](docs/09-manifiesto.md) | La vela, como Dios manda |
| 10 | [Sitio web](docs/10-sitio-web.md) | Copy de Home, Manifiesto y Quiero distribuir, formulario y calificación de distribuidores |
| 11 | [Tablero de operación](docs/11-tablero-operacion.md) | Los 7 módulos del dashboard, flujos y bases de datos |
| 12 | [Riesgos y supuestos por validar](docs/12-riesgos-y-supuestos.md) | Qué falta confirmar antes de escalar |
| 13 | [Fuentes](docs/13-fuentes.md) | De dónde salió cada dato |
| 14 | [Guía de estilos](docs/14-guia-de-estilos.md) | Blanco y negro: color, letra, piezas y la vela en 3D |

El modelo financiero completo (20 hojas, 36 meses; la versión 3 se genera con `python3 herramientas/construir_modelo.py` a partir de la versión 1 y se recalcula con LibreOffice) está en [`modelo/La_Vela_Modelo_de_Negocio_v3.xlsx`](modelo/La_Vela_Modelo_de_Negocio_v3.xlsx).

## El sitio

Vive en [`sitio/`](sitio/) y se publica como Worker de Cloudflare en `vela.capitaltorreon.com` (`la-vela.` y `lavela.` redirigen ahí):

| Página | Archivo | Qué es |
|---|---|---|
| `/` | `index.html` + `vela3d.js` | Home con la vela en 3D y los dos renders en casa |
| `/manifiesto` | `manifiesto.html` | El manifiesto firmado |
| `/modelo` | `modelo.html` | El modelo de negocio explicado con los números del Excel, y la descarga del Excel (`sitio/descargas/`) |
| `/distribuir` | `distribuir.html` | Solicitud de 8 preguntas; se guarda en D1 (`esquema.sql`, `src/worker.js`) |
| `/entrar` | `entrar.html` | Inicio de sesión (solo la puerta; aún sin tablero) |
| `/blog` | `blog/*.html` | Cinco artículos; el texto vive en `contenido/blog/*.md` |

Lo que se repite se genera, no se escribe a mano:

- `python3 herramientas/construir_descargas.py` — las tres hojas PDF tamaño carta (cliente, tienda, distribuidor) y las imágenes de liga de cada página (`sitio/og/`). Usa Chrome sin ventana y falla si alguna hoja no cabe en una sola página carta.
- `python3 herramientas/construir_sitio.py` — cabecera SEO, barra y pie de todas las páginas, el blog, las preguntas del inicio, la sección de descargas, `sitemap.xml` y `robots.txt`.
- `python3 herramientas/construir_modelo.py` — el Excel.

La lumbre es lo único con color en todo el sitio (ver la guía de estilos).

Si cambia el Excel, hay que copiarlo de nuevo a `sitio/descargas/` (con versión y fecha en el nombre) y actualizar los números de `modelo.html`. Para desplegar:

```bash
npx wrangler deploy
```

---

## Lo más importante en 10 líneas

1. **El producto masivo no es la vela premium.** La Vela Récord (cera de abeja y vidrio de borosilicato de doble pared) es la marca premium; a las tiendas va una veladora de parafina con mecha optimizada, a precio de miscelánea.
2. **El negocio es la recompra.** El vaso se compra una vez; el cartucho se compra cada semana en la misma tienda.
3. **El cartucho retornable** se mete completo al vaso, se regresa vacío a la tienda con depósito y se rellena en planta sin lavar.
4. **Con los precios y márgenes de la primera propuesta, el negocio pierde dinero** (−$2.45 por pieza) una vez que se descuenta el IVA y se usa el precio real de la parafina.
5. **Optimizado, gana +$7.21 por pieza:** precio Semanal $49, Cartucho $34, tienda 27%, distribuidor 17%, parafina por tonelada, mecha de 2.3 g/h, vaso de $4.20.
6. **Escenario medio (500 tiendas × 8 piezas por semana):** EBITDA ~$1 M en el año 2, capital máximo ~$763 mil, se recupera en el mes 19.
7. **No construir planta propia** hasta pasar ~47 mil piezas al mes: antes, maquilar es más barato.
8. **El argumento de venta es la duración garantizada, no el precio:** "7 días o te damos otra", comprobado con pruebas contra la competencia.
9. **El atajo comercial:** vender a quien compra por cientos (distribuidores, regalos corporativos, parroquias, restaurantes), no vela por vela.
10. **Lo que hay que validar ya:** precio de parafina por tonelada, gramos por hora reales, costo del vaso, márgenes reales del canal y cuota de maquila.
