# 14 · Guía de estilos

Blanco y negro. Aquí no manda el diseño: manda que la información llegue. Esta guía es corta a propósito y vive en código en [`sitio/estilos.css`](../sitio/estilos.css).

## Principios

1. **Blanco y negro, y nada más.** Sin color de marca, sin degradados de color, sin fotos a color. Si algo necesita destacar, se hace más grande o se pone sobre negro.
2. **Primero la frase, luego la explicación.** Cada sección abre con una frase que se entiende sola; el párrafo de abajo es para quien quiere saber más.
3. **Una idea por sección.** Si una sección dice dos cosas, son dos secciones.
4. **Letra grande.** La leen tenderos, distribuidores y gente mayor, casi siempre en el teléfono.
5. **La vela es la única imagen.** No hay iconos ni ilustraciones de adorno: el modelo 3D y sus renders hacen ese trabajo.

## Color

| Nombre | Valor | Uso |
|---|---|---|
| `--negro` | `#000` | Fondo del inicio, de las secciones negras y del pie |
| `--tinta` | `#111` | Texto sobre blanco, líneas, botón lleno |
| `--gris-700` | `#444` | Texto secundario sobre blanco |
| `--gris-500` | `#6b6b6b` | Etiquetas sobre blanco (lo más claro que se permite para texto) |
| `--gris-300` | `#c8c8c8` | Texto secundario sobre negro |
| `--gris-100` | `#f3f3f3` | Fondo de las secciones grises |
| `--blanco` | `#fff` | Fondo general y texto sobre negro |

Las secciones alternan blanco → gris → blanco, con una negra cuando hay algo que subrayar. Nunca dos negras seguidas.

## Letra

- **Títulos:** con patines (`Iowan Old Style`, `Palatino`, `Georgia`), peso normal, nunca negrita. Es la voz del manifiesto.
- **Texto:** sin patines, la del sistema (`system-ui`). No se cargan fuentes de internet.
- **Tamaño base:** 18 px en teléfono, 20 px en escritorio. Todo lo demás va en `rem`.

| Estilo | Tamaño | Dónde |
|---|---|---|
| `h1` | 2.6–5 rem | Una sola vez: el inicio |
| `h2` | 1.9–3 rem | La frase de cada sección |
| `h3` | 1.3 rem | Pasos y columnas |
| `.grande` | 1.25 rem | El primer párrafo de una sección |
| Texto | 1 rem | Todo lo demás, a 62 caracteres de ancho máximo |
| `.etiqueta` | 0.72 rem, mayúsculas, espaciado 0.16em | La palabra chica arriba de cada sección |

## Espacio y trazo

- Espacios en múltiplos de 8: `8 · 16 · 24 · 32 · 48 · 64 · 96`.
- Ancho máximo del contenido: 1120 px, con 24 px de margen lateral.
- Cada sección se separa con una línea de 1 px en tinta. No hay sombras ni esquinas redondeadas.

## Piezas

| Pieza | Clase | Regla |
|---|---|---|
| Botón lleno | `.boton.lleno` | La acción principal de la pantalla. Uno por sección. |
| Botón de contorno | `.boton` | La acción secundaria. |
| Pasos | `.pasos` | Lista numerada de 4: número grande con patines, título y una línea. |
| Dos columnas | `.dos` | Frase a la izquierda, explicación a la derecha. En teléfono se apilan. |
| Cita | `.cita` | Una frase dicha por alguien, entre comillas angulares «». |
| Columnas con línea | `.ganan` | Tres partes que se comparan lado a lado. |

Todos los botones miden al menos 48 px de alto.

## La vela en 3D

- El modelo vive en [`sitio/vela3d.js`](../sitio/vela3d.js) y es **uno solo**: el inicio y los dos renders de casa usan la misma vela.
- Medidas en centímetros, tomadas de [02 · Ingeniería](02-ingenieria-de-la-vela.md): vaso de 6 cm de diámetro interior y 17 cm de alto, pared de 3 mm.
- Tres estados, que son el modelo de negocio: **encendida**, **sale el cartucho**, **vaso de agua**.
- Siempre en escala de grises: materiales neutros y, por seguridad, `filter: grayscale(1)` en el lienzo.
- La flama es blanca. El vidrio se dibuja con sus reflejos, no con color.
- **Por validar:** la altura del cartucho. El modelo lo dibuja como una copa baja de aluminio (2.6 cm) con la columna de cera encima; [08 · Cartucho retornable](08-cartucho-retornable.md) todavía no fija esa medida. Se cambia en la constante `CART` y todo lo demás se ajusta.

## Voz

Las reglas de copy están en [10 · Sitio web](10-sitio-web.md). Las que más importan:

- «Diseñada para durar lo más posible», no «la que más dura». Nada de «7 días» hasta que las pruebas lo confirmen.
- «Vaso y base 100% reciclables», no «100% reciclable».
- Frases cortas, en segunda persona, sin signos de admiración.
- No se publican precios ni márgenes.
