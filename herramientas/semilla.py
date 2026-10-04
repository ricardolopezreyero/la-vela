# RLR · La Vela — semilla del tablero — Ricardo López Reyero
# Convierte lo que ya está escrito en docs/ en datos para arrancar el tablero:
#   · tareas: el checklist (docs/05), los supuestos por validar (docs/12) y los pasos de protección
#   · recetas y pruebas de encendido (docs/02 y docs/03)
#   · catálogo, inventario y ajustes
# Escribe SQL con INSERT OR IGNORE (se puede correr dos veces sin duplicar).
# Uso: python3 herramientas/semilla.py > .tmp_descargas/semilla.sql
import json
import re
from pathlib import Path

_RLR = "Ricardo López Reyero"; _k = "EYE"; _rev = 181218  # RLR

RAIZ = Path(__file__).resolve().parent.parent
AHORA = "2026-10-03T00:00:00.000Z"
q = lambda v: "NULL" if v is None else (str(v) if isinstance(v, (int, float)) else "'" + str(v).replace("'", "''") + "'")
limpio = lambda t: re.sub(r"\*\*(.+?)\*\*", r"\1", t).strip()

sql = ["-- RLR · semilla del tablero de La Vela (generada por herramientas/semilla.py)"]

# ───────── Tareas ─────────
FASE = {"Producción": 1, "Producto": 1, "Comercialización": 2, "Distribución": 2, "Talento": 1, "Fábrica nivel 2": 3, "Fábrica nivel 3": 4}
ALTAS = ("Comprar el kit", "Hacer 3 prototipos", "Protocolo de prueba", "Acuerdo de socios", "Congelar la receta", "Costeo real")
tareas, seccion = [], None
for linea in (RAIZ / "docs" / "05-checklist-proyecto.md").read_text(encoding="utf-8").split("\n"):
    m = re.match(r"## \d+\. ([^(\n]+)", linea)
    if m:
        nombre = m.group(1).strip()
        seccion = next((s for s in FASE if nombre.startswith(s)), None)
        continue
    if linea.startswith("## "):
        seccion = None
    if seccion and linea.startswith("- "):
        t = limpio(linea[2:])
        fase = FASE[seccion]
        if re.search(r"[Ff]ase 3", t): fase = 3
        if re.search(r"\(fase 2\)", t): fase = 2
        tareas.append((t, seccion, fase, "Alta" if t.startswith(ALTAS) else "Media", ""))

for linea in (RAIZ / "docs" / "12-riesgos-y-supuestos.md").read_text(encoding="utf-8").split("\n"):
    m = re.match(r"\| (\d+) \| (.+?) \| (Alto|Medio) \| (.+?) \|", linea)
    if m:
        n, supuesto, impacto, como = int(m.group(1)), limpio(m.group(2)), m.group(3), limpio(m.group(4))
        fase = 2 if n in (5, 6, 10, 15, 18) else 3 if n == 17 else 1
        tareas.append((f"Validar: {supuesto[0].lower() + supuesto[1:]}", "Validar", fase, "Alta" if impacto == "Alto" else "Media", como))

for t, nota in [
    ("Pasar el repositorio de GitHub a privado", "Mientras esté abierto, la receta y los márgenes no cuentan como secreto industrial."),
    ("Elegir el nombre definitivo y hacer la búsqueda fonética en el IMPI", "«La Vela» describe el producto: es probable que no se pueda registrar como marca de velas."),
    ("Cita con un despacho de propiedad industrial", "Marca, frase, diseños del vaso y del cartucho, y modelo de utilidad. Fecha límite práctica: antes de octubre de 2027."),
    ("Convenios de confidencialidad antes de cotizar", "Con maquiladores, vidrieras, troqueladores y diseñadores, antes de enseñar nada."),
    ("Diseñar la llave del vaso que solo recibe nuestro cartucho", "Probarla en prototipo antes de presentar el modelo de utilidad."),
    ("Decidir la empresa dueña de la marca y los registros", "Va junto con el acuerdo de socios."),
]:
    tareas.append((t, "Protección", 1, "Alta", nota))

for i, (titulo, sec, fase, prio, notas) in enumerate(tareas, 1):
    sql.append(f"INSERT OR IGNORE INTO tareas (id, titulo, seccion, fase, prioridad, notas, creada) VALUES ({i}, {q(titulo)}, {q(sec)}, {fase}, {q(prio)}, {q(notas)}, {q(AHORA)});")

# ───────── Recetas (docs/02) ─────────
RECETAS = [
    (1, "La Vela · masiva (parafina)", {
        "linea": "Masiva", "estado": "En prueba",
        "para": "Tiendas y misceláneas, parroquias y restaurantes. Es la que da el volumen.",
        "ingredientes": [{"nombre": "Parafina totalmente refinada", "cantidad": 398, "unidad": "g"}],
        "mecha": "Algodón trenzado cuadrado, sin alma. Calibre por definir en las pruebas: 1/0 contra 2/0. Preencerada.",
        "vaso": "Vaso de veladora liso y transparente, ~6 cm de diámetro interior y 17 cm de alto.",
        "cartucho": "Copa de aluminio de ~5.8 cm de diámetro, con la cera y la mecha ya puestas. La altura está por definir.",
        "parametros": {"gph": 2.3, "horas": 168, "residual": 0.03},
        "pasos": [
            "Pesar la cera del lote y derretirla sin pasar de la temperatura de trabajo.",
            "Poner la mecha en la base del cartucho y centrarla: ±1 mm.",
            "Vaciar, dejar enfriar lento y rellenar el hundimiento si aparece.",
            "Curar 48 horas en el rack antes de empacar.",
            "Control de calidad por pieza: mecha centrada, superficie lisa, peso correcto y número de lote.",
            "De cada lote, encender una pieza y medir gramos por hora antes de liberar.",
        ],
        "notas": "Sin aroma ni colorante: los dos aceleran el consumo. La base conservadora del modelo es 2.6 g/h; la meta optimizada, 2.3 g/h. No prometer «7 días» hasta que las pruebas lo confirmen.",
    }),
    (2, "Vela Récord (cera de abeja)", {
        "linea": "Premium", "estado": "En prueba",
        "para": "Regalos, boutiques y corporativos. Es la vitrina de ingeniería.",
        "ingredientes": [{"nombre": "Cera de abeja pura, filtrada, amarilla", "cantidad": 475, "unidad": "g"},
                         {"nombre": "Aceite de coco refinado (5%)", "cantidad": 25, "unidad": "g"}],
        "mecha": "100% algodón, trenza cuadrada, sin alma, calibre 1/0 (probar 2/0). Las «V» del tejido hacia abajo. 225 mm de largo. Encerada 60 s en cera de abeja a 75–80 °C y dos baños rápidos más.",
        "vaso": "Borosilicato 3.3 bajo en hierro, doble pared: Ø interior 60 mm, altura 200 mm, cámara de aire de 4 mm. Recocido a ~560 °C.",
        "cartucho": "Copita de aluminio 1100 o 3003: Ø exterior 59 mm, lámina de 0.6 mm, cuello central de 6 mm de alto con ranura de 1 × 4 mm que pellizca la mecha.",
        "parametros": {"gph": 2.8, "horas": 168, "residual": 0.03},
        "pasos": [
            "Calentar el vaso a 50 °C.",
            "Dejar caer la copita al fondo: la pared la centra sola.",
            "Meter la mecha en el cuello y pellizcar suave.",
            "Barra centradora: mecha recta y centrada ±1 mm.",
            "Vaciar 475 g de abeja + 25 g de coco a 70 °C, hasta 18.5 cm.",
            "Enfriar lento y rellenar el hundimiento al día siguiente.",
            "Curar 48 horas, recortar la mecha a 5 mm y encender.",
        ],
        "notas": "Recarga: se apaga sola cuando la flama llega al cuello. Con la cera del fondo aún líquida (o 20 min al horno a 80 °C), abrir la ranura con una aguja, sacar el cabo, poner mecha nueva y rellenar a 70 °C. No quitar la base metálica.",
    }),
]
for rid, nombre, datos in RECETAS:
    sql.append(f"INSERT OR IGNORE INTO recetas (id, nombre, datos, actualizada, por) VALUES ({rid}, {q(nombre)}, {q(json.dumps(datos, ensure_ascii=False))}, {q(AHORA)}, 'semilla');")

# ───────── Pruebas de encendido (docs/02 y docs/03) ─────────
PRUEBAS = [(1, f"Masiva · {n}", d, 168) for n, d in [
    ("mecha 1/0", "Parafina, mecha trenzada cuadrada 1/0."),
    ("mecha 2/0", "Parafina, mecha trenzada cuadrada 2/0 (más delgada)."),
    ("con carnauba", "Parafina + 3% de cera de carnauba. Solo para prueba: más de 5% tapa la mecha."),
]] + [(2, f"Récord #{n} · {cera} · mecha {mecha}", f"Cera de abeja / coco: {cera} g. Mecha trenzada cuadrada {mecha}." + extra, 55) for n, cera, mecha, extra in [
    (1, "200/0", "1/0", ""), (2, "200/0", "#1", ""), (3, "200/0", "#2", ""),
    (4, "190/10", "1/0", ""), (5, "190/10", "#1", " Es la apuesta."), (6, "190/10", "#2", ""),
    (7, "180/20", "1/0", ""), (8, "180/20", "#1", ""), (9, "180/20", "#2", ""),
    (10, "190/10", "2/0", " En vaso alto y angosto (5 × 11 cm)."),
]]
for i, (receta, nombre, detalle, meta) in enumerate(PRUEBAS, 1):
    sql.append(f"INSERT OR IGNORE INTO pruebas (id, receta_id, nombre, detalle, meta_horas, creada) VALUES ({i}, {receta}, {q(nombre)}, {q(detalle)}, {meta}, {q(AHORA)});")

# ───────── Catálogo, inventario y ajustes (del Excel, escenario Optimizado) ─────────
for i, (clave, nombre, dist, pub, vaso) in enumerate([
    ("semanal", "Semanal (vaso + cartucho)", 29.69, 49, 1), ("cartucho", "Cartucho (repuesto)", 20.60, 34, 0),
    ("temporada", "Temporada", 39.38, 65, 1), ("personalizada", "Personalizada", 59.98, 99, 1),
], 1):
    sql.append(f"INSERT OR IGNORE INTO productos (clave, nombre, piezas_caja, precio_dist, precio_publico, lleva_vaso, orden) VALUES ({q(clave)}, {q(nombre)}, 12, {dist}, {pub}, {vaso}, {i});")
for clave, nombre, unidad, costo in [
    ("cera", "Parafina", "kg", 29.52), ("vaso", "Vasos de vidrio", "pza", 4.20), ("mecha", "Mechas con base", "pza", 0.40),
    ("cartucho", "Cartuchos de aluminio (nuevos y vacíos)", "pza", 2.60), ("etiqueta", "Etiquetas", "pza", 0.75), ("caja", "Cajas de 12", "pza", 4.20),
]:
    sql.append(f"INSERT OR IGNORE INTO inventario (clave, nombre, unidad, costo, actualizado) VALUES ({q(clave)}, {q(nombre)}, {q(unidad)}, {costo}, {q(AHORA)});")
for clave, valor in [("fase_actual", 1), ("deposito", 5), ("dias_entrega", 5), ("dias_cobro", 30), ("meta_semanal", 0), ("receta_activa", 1),
                     ("bajas_cartuchos", 0), ("capacidad_dia", 0), ("pedido_minimo_cajas", 1)]:
    sql.append(f"INSERT OR IGNORE INTO ajustes (clave, valor) VALUES ({q(clave)}, {q(str(valor))});")

print("\n".join(sql))
