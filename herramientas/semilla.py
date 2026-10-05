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
    if m and int(m.group(1)) <= 20:  # los riesgos nuevos van al final (EXTRAS), para no recorrer los números de tarea
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

# Lo que se agregó después: siempre al final
tareas.append(("Validar: el precio de la Semanal, con un piloto a dos precios", "Validar", 2, "Alta", "Mitad de las tiendas con la Semanal a $49 y mitad a $55. Medir piezas por tienda y cuántos regresan por el cartucho."))
tareas.append(("Cerrar 10 pedidos corporativos para noviembre y 10 para diciembre", "Comercialización", 2, "Alta", "Es lo que más deja por pieza. Sale de la red de colegios, universidades y parques industriales; cerrar antes del 15 de noviembre."))
tareas.append(("Poner el QR de personalizadas en el exhibidor", "Comercialización", 2, "Media", "El plan supone que 10% de las piezas son personalizadas: el QR abre el pedido por WhatsApp."))

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

# ───────── Catálogo, inventario y ajustes (del Excel, escenario Rentable) ─────────
for i, (clave, nombre, dist, pub, vaso) in enumerate([
    ("semanal", "Semanal (vaso + cartucho)", 33.32, 55, 1), ("cartucho", "Cartucho (repuesto)", 20.60, 34, 0),
    ("temporada", "Temporada", 41.81, 69, 1), ("personalizada", "Personalizada", 59.98, 99, 1),
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

# ═══════════ La empresa completa (migración 0003): siempre al final ═══════════
# Empaque: reja de 24 (dos cajas de 12; 6 × 4 vasos de 7.5 cm en una reja de 50 × 33 × 25 cm), 32 rejas por tarima
# (8 por cama × 4 camas, tarima de 1.0 × 1.2 m, 1.15 m de alto). El Excel supone 800 piezas por tarima; aquí son 768.
for clave, valor in [("rejas_tarima", 32), ("reja_kg", 1.8), ("tarima_kg", 25), ("iva", 16), ("transf_pieza", 2.2),
                     ("mercado_piezas_anio", 697000000), ("meta_participacion", 25), ("piezas_tienda_semana", 8), ("tiendas_distribuidor", 150),
                     ("piezas_centro_semana", 60000), ("gasto_fijo_mes", 0), ("piezas_semana_hoy", 0), ("ebitda_pieza", 9.22)]:
    sql.append(f"INSERT OR IGNORE INTO ajustes (clave, valor) VALUES ({q(clave)}, {q(str(valor))});")
for clave, reja, kg in [("semanal", 24, 0.72), ("cartucho", 24, 0.43), ("temporada", 24, 0.72), ("personalizada", 24, 0.72)]:
    sql.append(f"UPDATE productos SET piezas_reja = {reja}, peso_kg = {kg} WHERE clave = {q(clave)} AND piezas_reja = 24 AND peso_kg = 0.72;")

# ───────── Centros y vehículos ─────────
for i, (nombre, ciudad, tipo, estado, cap, abre, notas) in enumerate([
    ("Planta Torreón", "Torreón, Coahuila", "Maquila", "Activo", 6000, "2026-11", "Arranque con maquila; planta propia cuando se pasen 47 mil piezas al mes (Excel)."),
    ("Centro Norte", "Monterrey, Nuevo León", "Centro", "Planeado", 60000, "2027-10", "Nuevo León es el estado que más exporta velas: ahí están las maquilas."),
    ("Centro Bajío", "León, Guanajuato", "Centro", "Planeado", 60000, "2028-06", "A 4 horas de Guadalajara, Querétaro y San Luis."),
    ("Centro Centro", "Ciudad de México / Estado de México", "Centro", "Planeado", 120000, "2028-10", "La mitad de las tienditas del país están a 3 horas."),
    ("Centro Occidente", "Guadalajara, Jalisco", "Centro", "Planeado", 60000, "2029-06", ""),
    ("Centro Sur", "Puebla u Oaxaca", "Centro", "Planeado", 60000, "2029-10", "Día de Muertos pesa más en el sur."),
], 1):
    sql.append(f"INSERT OR IGNORE INTO centros (id, nombre, ciudad, tipo, estado, piezas_semana, abre, notas, orden) VALUES ({i}, {q(nombre)}, {q(ciudad)}, {q(tipo)}, {q(estado)}, {cap}, {q(abre)}, {q(notas)}, {i});")
for i, (nombre, tarimas, rejas, kg, costo_km, propio) in enumerate([
    ("Camioneta de 1.5 toneladas (propia)", 2, 70, 1500, 4.5, 1), ("Camión de 3.5 toneladas (propio)", 5, 170, 3500, 7.0, 1), ("Flete por tarima (externo)", 12, 384, 8000, 14.0, 0),
], 1):
    sql.append(f"INSERT OR IGNORE INTO vehiculos (id, nombre, tarimas, rejas, kg, costo_km, propio) VALUES ({i}, {q(nombre)}, {tarimas}, {rejas}, {kg}, {costo_km}, {propio});")

# ───────── Proveedores (docs/04) ─────────
for i, (nombre, insumos, ciudad, liga, dias, estado, notas) in enumerate([
    ("Amazon México", "cera mecha", "En línea", "https://www.amazon.com.mx", 3, "Activo", "Kit de arranque: cera de abeja Hexpro-Mex, bases y centradores de mecha."),
    ("Amazon US · PremiumCraft", "mecha", "En línea", "https://www.amazon.com/clp/B004GEXTTK", 12, "Activo", "Mecha trenzada cuadrada 1/0, 2/0 y #1. En México nadie la vende bien especificada: hueco de negocio."),
    ("Mercado Libre", "vaso", "En línea", "https://listado.mercadolibre.com.mx/vasos-de-vidrio-grande-para-veladora", 5, "Activo", "Vasos de veladora lisos y transparentes, ~6 × 20 cm, para los prototipos."),
    ("Pochteca", "cera", "Monterrey / nacional", "", 7, "Por cotizar", "Parafina totalmente refinada por tonelada. Cotizar también con un importador directo y un distribuidor local."),
    ("Vidriera 1 (por elegir)", "vaso", "", "", 15, "Por cotizar", "Vaso de veladora por millar. Pedir tres cotizaciones."),
    ("Vidriera 2 (por elegir)", "vaso", "", "", 15, "Por cotizar", ""),
    ("Vidriera 3 (por elegir)", "vaso", "", "", 15, "Por cotizar", ""),
    ("Troquelador de aluminio (por elegir)", "cartucho", "Zona industrial de Torreón", "", 20, "Por cotizar", "Cartucho de aluminio con cuello, con plano. Un tornero local hace los primeros; el troquel viene con volumen."),
    ("Maquiladora de veladoras 1 (por elegir)", "", "Nuevo León", "", 10, "Por cotizar", "Maquila de la línea masiva a $2.20 por pieza (supuesto del Excel). Convenio de confidencialidad antes de cotizar."),
    ("Maquiladora de veladoras 2 (por elegir)", "", "Nuevo León", "", 10, "Por cotizar", ""),
    ("Apicultores de La Laguna", "cera", "La Laguna", "", 10, "Por cotizar", "Cera de abeja más barata y trazable; es una historia que vende."),
    ("Etiquetas, cajas y exhibidores (por elegir)", "etiqueta caja", "Torreón", "", 10, "Por cotizar", "Etiquetas o mangas, cajas master de 12 y exhibidor de mostrador."),
    ("GEZA · cristalería de laboratorio", "vaso", "Toluca", "https://www.cristaleriadelaboratorio.com/", 30, "Por cotizar", "Vaso de doble pared de borosilicato para la Vela Récord (fase 2)."),
], 1):
    sql.append(f"INSERT OR IGNORE INTO proveedores (id, nombre, insumos, ciudad, liga, dias_entrega, estado, notas, creado) VALUES ({i}, {q(nombre)}, {q(insumos)}, {q(ciudad)}, {q(liga)}, {dias}, {q(estado)}, {q(notas)}, {q(AHORA)});")

# ───────── Puestos: el sistema primero, la gente después ─────────
# (orden, nombre, área, qué hace, perfil, qué mide, se contrata a partir de X piezas/semana, una plaza por cada Y piezas/semana (0 = una sola), sueldo mensual, dónde buscar, cómo elegir)
PUESTOS = [
    ("Dirección general", "Dirección", "Decide el plan, cierra los distribuidores grandes y los corporativos, cuida el dinero y la marca.", "Ricardo. Fundador comercial: vende, mide y no se enamora del producto sin datos.", "EBITDA del mes contra el plan Rentable; distribuidores activos.", 0, 0, 0, "", ""),
    ("Operador de producción", "Producción", "Pesa, derrite, vacía, centra la mecha, cura, revisa pieza por pieza y empaca por reja. Anota el lote.", "Manos cuidadosas y constancia. Sabe seguir una receta al gramo y no se salta el control de calidad. No necesita experiencia en velas: se enseña en una semana.", "Piezas por hora sin rechazo; piezas rechazadas por lote (meta: menos de 1%).", 500, 3000, 11000, "Vecinos de la planta, familiares de operadores, bolsa de trabajo del municipio, Facebook de empleos en Torreón. Las veleras artesanales de la ciudad ya saben vaciar.", "Prueba de medio día: vaciar 24 piezas con la receta en la mano. Se mide centrado de mecha (±1 mm), superficie y peso. Pasa quien saque 22 de 24."),
    ("Repartidor de ruta", "Logística", "Carga las rejas por tarima, entrega en el orden de la ruta, recoge los cartuchos vacíos y las rejas, cobra cuando toca y marca cada parada en el tablero desde el teléfono.", "Licencia vigente, conoce la ciudad, honesto con el efectivo, cuida el producto (vidrio). Se le paga por ruta cumplida, no por hora.", "Paradas entregadas a tiempo; vacíos recogidos contra lo anotado; diferencias de efectivo (meta: cero).", 1000, 6000, 12000, "Ex repartidores de Bimbo, Coca-Cola, Sabritas y Lala que quieren horario de día; grupos de Facebook de choferes en La Laguna; recomendados de distribuidores.", "Ruta de prueba acompañado: 8 paradas en una mañana. Se revisa orden, trato con el tendero, conteo de vacíos y cuadre de efectivo."),
    ("Comercial de distribuidores", "Comercial", "Busca, visita y cierra distribuidores; los acompaña en el piloto de 50 tiendas; cuida la recompra y la cartera de cada uno.", "Vendedor de ruta con experiencia en abarrotes, no de oficina. Entiende márgenes del tendero, sabe hablar con un mayorista y con el dueño de la tiendita. Carro propio.", "Distribuidores activos y tiendas activas por mes; recompra (cartuchos sobre el total) de sus distribuidores; cartera vencida.", 2000, 10000, 18000, "Ex supervisores de ruta de Sabritas, Bimbo, Coca-Cola, Marinela, Jumex; vendedores de mayoristas de abarrotes; OCC y Facebook de ventas en Torreón. El sueldo lleva comisión por pieza recomprada, no por pieza vendida.", "Caso real: le damos la liga de un distribuidor tipo B y en 48 horas debe traer la llamada hecha, la zona dibujada y la propuesta de piloto. Luego un día de ruta acompañado."),
    ("Administración y cobranza", "Dinero", "Factura, cobra, paga a proveedores, cuadra caja y bancos, lleva los movimientos del tablero y le entrega al contador externo lo que pide.", "Ordenada, puntual con los números, sabe Excel y facturación electrónica (CFDI 4.0). Cobra sin pelear.", "Días de cartera (meta: 30); facturas sin timbrar (meta: cero); cierre mensual antes del día 5.", 3000, 30000, 18000, "Egresadas de contaduría o administración de la UAdeC, el Tec de La Laguna y la Ibero Torreón; recomendadas por el despacho contable.", "Prueba de 2 horas con pedidos y compras reales del tablero: conciliar, encontrar la diferencia sembrada y timbrar una factura de prueba."),
    ("Jefe de producción y calidad", "Producción", "Planea la producción por semana a partir de los pedidos confirmados, dirige a los operadores, libera cada lote con su prueba de encendido y es dueño de la receta congelada.", "Ingeniero industrial o químico, o jefe de turno con años en planta de alimentos o cosméticos. Metódico: registra todo. Ha manejado gente.", "Piezas por operador por día; lotes rechazados; entregas a tiempo de producción; gramos por hora del lote contra la receta.", 5000, 25000, 28000, "Plantas de la zona industrial de Torreón y Gómez Palacio (Lala, Chilchota, Peñoles, maquiladoras); ingenieros de la UAdeC y el Tec; LinkedIn con filtro La Laguna.", "Le damos un lote con un problema (mecha descentrada, g/h fuera de rango) y debe encontrarlo con el protocolo de docs/03 y proponer la corrección."),
    ("Atención a distribuidores y tiendas", "Comercial", "Contesta el WhatsApp del negocio, confirma pedidos, resuelve garantías y personalizadas, llama a quien lleva dos semanas sin pedir y manda las ligas de pedidos.", "Rápida escribiendo, cálida, no deja mensajes sin contestar. Sabe usar el tablero de memoria.", "Tiempo de respuesta (meta: menos de 15 minutos en horario); distribuidores que llevan 14 días sin pedir y fueron contactados; garantías cerradas.", 8000, 20000, 14000, "Ex agentes de atención de Telcel, Coppel o bancos; mamás que quieren medio tiempo; recomendadas del equipo.", "Media hora contestando 10 mensajes reales de distribuidores (preparados). Se califica claridad, tono y si usó el tablero para responder con datos."),
    ("Compras e inventario", "Compras", "Cotiza con tres proveedores cada insumo, hace las órdenes de compra, recibe y cuenta lo que llega, cuida los mínimos y negocia precio por volumen y plazo.", "Negociadora, desconfiada en el buen sentido, sabe leer una cotización con flete e IVA. Ha comprado para producción.", "Costo por pieza de materiales contra el Excel; faltantes que pararon producción (meta: cero); días de inventario.", 8000, 50000, 20000, "Compradoras de plantas de la región y de constructoras; egresadas de negocios internacionales; recomendadas de proveedores.", "Caso: cotizar parafina por tonelada con tres fuentes en una semana y presentar la comparación con flete, IVA y plazo. Se mide el proceso, no solo el precio."),
    ("Logística y rutas", "Logística", "Arma las rutas del día con todos los pedidos listos, llena los vehículos por tarima, contrata fletes cuando hay que salir de la ciudad y abre cada centro de distribución nuevo.", "Ha coordinado repartos o flotillas. Piensa en tarimas, kilos y kilómetros. Sabe negociar con transportistas.", "Costo de transporte por pieza; rejas por viaje contra la capacidad; entregas a tiempo.", 12000, 40000, 25000, "Coordinadores de logística de Lala, Coca-Cola FEMSA, Soriana y Grupo Simsa; egresados de logística del Tec de La Laguna.", "Le damos 20 pedidos en 3 ciudades y 2 vehículos; debe armar las rutas en el tablero y explicar por qué."),
    ("Marketing y contenido", "Comercial", "Lleva las temporadas (San Judas, Muertos, Guadalupe), las personalizadas por WhatsApp y QR, el blog, las redes y el material para tiendas (exhibidor, hojas).", "Escribe bien y rápido, hace fotos y videos sencillos con el teléfono, mide lo que publica. Ha vendido con contenido.", "Piezas de temporada y personalizadas por semana; solicitudes de distribuidores que llegan del sitio por mes.", 15000, 100000, 25000, "Creadores de contenido locales con resultados medibles; egresados de comunicación y mercadotecnia; agencias chicas de Torreón para empezar por proyecto.", "Encargo real pagado: una campaña de San Judas (28 del mes) con meta de piezas. Se contrata a quien la cumpla."),
    ("Jefe de planta", "Producción", "Abre y opera la planta propia cuando el volumen la justifique: maquinaria, turnos, mantenimiento, seguridad y permisos.", "Ingeniero con experiencia en planta de proceso continuo (alimentos, cosméticos, plásticos). Ha montado una línea.", "Costo de transformación por pieza (meta: $1.24 con planta propia); paros no planeados; accidentes (meta: cero).", 11000, 60000, 40000, "Jefes de planta de maquiladoras de Nuevo León y Coahuila; LinkedIn; headhunter regional.", "Visita técnica a la maquila actual: debe entregar en una semana el plan de la planta propia con layout, equipo y costo por pieza."),
    ("Gerente comercial regional", "Comercial", "Abre una región nueva: encuentra los primeros 5 distribuidores, arma el equipo comercial local y cuida que el centro de distribución tenga volumen.", "Ha dirigido ventas de consumo en esa región. Conoce a los mayoristas y las rutas de la plaza. Vive ahí.", "Distribuidores activos y piezas por semana de su región contra la meta; meses para llegar al punto de equilibrio del centro.", 20000, 60000, 45000, "Gerentes regionales de marcas de consumo (botanas, panificación, bebidas, veladoras de la competencia); referidos de distribuidores de la región.", "Plan de 90 días para la región, con nombres reales de los primeros distribuidores a visitar. Se contrata por 90 días con bono por cumplir."),
    ("Mantenimiento y maquinaria", "Producción", "Mantiene vaciadoras, fundidoras, racks de curado y vehículos; diseña las mejoras de la línea.", "Técnico electromecánico con años en planta. Resuelve con lo que hay.", "Horas de paro por falla; costo de mantenimiento por pieza.", 30000, 100000, 18000, "Técnicos del CONALEP y la UTT; mantenimiento de plantas de la zona industrial.", "Diagnóstico en sitio de una falla sembrada en un equipo."),
    ("Gente y cultura", "Personas", "Recluta con las pruebas de cada puesto, hace la nómina y las prestaciones, cuida la rotación y arma la capacitación de operadores y repartidores.", "Ha llevado nómina y reclutamiento en empresa de 30 a 300 personas. Firme con la ley laboral, cercana con la gente.", "Días para cubrir una vacante (meta: 15); rotación mensual (meta: menos de 3%); incidencias de nómina.", 25000, 150000, 28000, "Generalistas de recursos humanos de plantas de la región; egresadas de psicología organizacional.", "Caso: cubrir la vacante de repartidor en 15 días con el proceso del tablero, incluyendo la ruta de prueba."),
    ("Datos y sistemas", "Datos", "Mantiene el tablero, conecta facturación, WhatsApp y pagos, automatiza los avisos y arma la sala de datos para el equipo y los socios.", "Programa en JavaScript y SQL, entiende el negocio antes que la herramienta. Le gusta que nada se capture dos veces.", "Procesos que aún se hacen a mano (meta: cero); minutos de captura por pedido; errores de datos encontrados por el equipo.", 30000, 150000, 45000, "Desarrolladores de Torreón con portafolio; egresados del Tec y la UAdeC; comunidades de programación de La Laguna.", "Tarea pagada: agregar una pantalla al tablero (repo) siguiendo la guía de estilos, en una semana."),
    ("Dirección de operaciones", "Dirección", "Dueño de producción, compras, logística y calidad en todas las plantas y centros. Hace que cada centro nuevo abra en tiempo y costo.", "Ha operado varias plantas o centros de distribución. Mide todo, delega y no micro-administra.", "Costo total por pieza; entregas a tiempo; piezas por persona.", 40000, 0, 80000, "Directores de operaciones de empresas de consumo regionales; headhunter.", "Presenta el plan de los siguientes tres centros con costos y fechas; se contrasta con el Excel."),
    ("Dirección de finanzas", "Dinero", "Flujo, crédito, inversionistas, impuestos y control: que el crecimiento no se coma la caja. Dueño del Excel del modelo.", "Contador o financiero con experiencia en empresas que crecieron rápido. Conservador con el efectivo.", "Caja al cierre de cada mes contra el plan; días de cartera; costo del financiamiento.", 40000, 0, 60000, "Directores de finanzas de empresas medianas de La Laguna; despachos grandes de la región; referidos de inversionistas.", "Rehace el flujo de 12 meses del Excel con los datos reales del tablero y señala los tres riesgos mayores."),
    ("Legal y propiedad industrial (externo)", "Dirección", "Marca, modelo de utilidad del cartucho y la llave del vaso, diseños, contratos con distribuidores y maquilas, convenios de confidencialidad.", "Despacho de propiedad industrial con registros en el IMPI y experiencia en consumo. Iguala mensual, no interno.", "Registros presentados antes de octubre de 2027 (plazo de novedad); contratos firmados antes de cada piloto.", 0, 0, 8000, "Despachos de propiedad industrial en Torreón, Monterrey y Ciudad de México; recomendación de la CANACINTRA.", "Primera cita: deben decir en qué se puede proteger el cartucho y qué no, sin vender de más."),
    ("Dirección de expansión", "Dirección", "Lleva La Vela a Centroamérica, Colombia y al mercado hispano de Estados Unidos: socios locales, registros, importación y los primeros distribuidores de cada país.", "Ha abierto países para una marca de consumo. Habla con importadores y con reguladores. Viaja la mitad del mes.", "Países con distribuidor activo; piezas por semana fuera de México; meses al punto de equilibrio por país.", 200000, 0, 120000, "Directores de exportación de marcas mexicanas de consumo; cámaras binacionales; referidos de inversionistas.", "Plan de entrada a un país con tres candidatos reales a socio y el costo de llegar a la primera tarima vendida."),
]
for i, (nombre, area, hace, perfil, mide, disp, por, sueldo, donde, prueba) in enumerate(PUESTOS, 1):
    ocupadas, estado = (1, "Contratado") if i == 1 else (0, "Después")
    sql.append(f"INSERT OR IGNORE INTO puestos (id, orden, nombre, area, hace, perfil, mide, disparador, por_piezas, sueldo, donde, prueba, ocupadas, estado, persona) VALUES ({i}, {i}, {q(nombre)}, {q(area)}, {q(hace)}, {q(perfil)}, {q(mide)}, {disp}, {por}, {sueldo}, {q(donde)}, {q(prueba)}, {ocupadas}, {q(estado)}, {q('Ricardo López Reyero' if i == 1 else '')});")

# ───────── Mercado: canales, regiones y dónde buscar comercializadores (docs/06) ─────────
# (tipo, clave, nombre, descripción, tamaño, estrategia, cómo entrar o dónde buscar, fase, prioridad, estado)
MERCADOS = [
    ("Canal", "tienditas", "Tienditas por distribuidor", "El núcleo del modelo: el distribuidor con rutas surte a las tiendas de abarrotes y misceláneas, que venden la Semanal y el cartucho de repuesto.", "Cerca de 1.2 millones de tiendas de abarrotes en México (ANPEC); la veladora es de lo que más rota en ellas.", "Un distribuidor por zona con exclusividad, piloto de 50 tiendas por 4 semanas, exhibidor gratis y venta garantizada. La tienda gana 27%, más que con refrescos. El cartucho con depósito hace que el cliente regrese a la misma tienda.", "Formulario del sitio, mayoristas de abarrotes, rutas que ya surten veladoras. Ver «Dónde buscar».", 2, "Alta", "Explorando"),
    ("Canal", "corporativo", "Regalos corporativos", "Empresas que regalan a clientes y empleados en diciembre: una persona decide 100 o 500 piezas.", "Deciden entre el 15 de octubre y el 15 de noviembre. Red de colegios, universidades y parques industriales de Ricardo.", "Vela con logo, tarjeta «Una semana de luz» y recarga de cortesía. Cerrar 10 pedidos para noviembre y 10 para diciembre. Es lo que más deja por pieza.", "Recursos humanos y dirección de empresas de La Laguna; clientes de SuperLeads; parques industriales; cámaras.", 2, "Alta", "Explorando"),
    ("Canal", "parroquia", "Parroquias", "La lámpara del sagrario arde siempre: unas 52 recargas al año por parroquia, más veladoras de fieles y cirio pascual de cera de abeja.", "51 parroquias en la Diócesis de Torreón; miles en el país.", "Entrar por la oficina diocesana, piloto con 3 parroquias, contrato de suministro mensual. El párroco además sabe quién surte veladoras en el barrio.", "Oficina de la diócesis, párrocos de las colonias donde ya hay distribuidor.", 2, "Alta", "Después"),
    ("Canal", "restaurante", "Restaurantes y hoteles", "20 mesas × 5 horas por noche son unas 240 velas al año por restaurante; hoteles boutique y spas igual.", "Restaurantes y hoteles de Torreón, Gómez Palacio y Lerdo; luego cada ciudad con centro.", "Repuestos por suscripción con entrega en la ruta de la zona. Vaso que se queda en la mesa, cartucho que se cambia.", "Asociación de restauranteros (CANIRAC Laguna), hoteles del centro y de la zona de Senderos.", 2, "Media", "Después"),
    ("Canal", "recaudacion", "Recaudación con colegios y parroquias", "Ellos venden a sus familias y se quedan con el 30%. Una campaña por temporada.", "Colegios cliente de SuperLeads y parroquias activas.", "Kit de recaudación: catálogo, liga de pedidos y entrega consolidada. Repetir cada temporada (Muertos, Guadalupe, 10 de mayo).", "Directores y sociedades de padres de los colegios; párrocos.", 2, "Media", "Después"),
    ("Canal", "personalizada", "Personalizadas por WhatsApp", "Foto, nombre o intención en la vela. El producto con mejor margen: deja tres veces lo que una Semanal.", "Meta del plan: 10% de las piezas.", "QR en el exhibidor de cada tienda que abre el pedido por WhatsApp; entrega en la misma ruta. Fotos en el tablero cuando exista la captura.", "Las tiendas activas (QR), redes y el sitio.", 2, "Alta", "Después"),
    ("Canal", "eventos", "Florerías, bodas y eventos", "Combo flores + vela a consignación en San Valentín y 10 de mayo; centros de mesa y recuerdos por cientos.", "Florerías y organizadores de eventos de cada ciudad.", "Consignación por temporada con la florería; paquetes por cien para eventos con entrega una semana antes.", "Florerías del centro y de Senderos; wedding planners de La Laguna.", 3, "Baja", "Después"),
    ("Canal", "mayorista", "Mayoristas y centrales de abasto", "El volumen grande: bodegas que surten a cientos de tiendas y a tianguistas.", "Centrales de abasto de cada ciudad; mayoristas de abarrotes y de artículos religiosos.", "Precio de mayoreo por tarima completa, sin exclusividad, con depósito de cartucho. Entra cuando la marca ya se pide en tienda.", "Central de abasto de Torreón y de cada región; Expo Abarrotero.", 3, "Media", "Después"),
    ("Canal", "cadena", "Cadenas regionales y autoservicio", "Cimaco (nacida en Torreón, 7 tiendas) como marca lagunera; luego cadenas regionales y autoservicio.", "Fase 3, cuando haya volumen y planta propia.", "Entrar por Cimaco con la Vela Récord y la historia de ingeniería; el autoservicio exige surtido garantizado y plazo de pago largo: solo con caja fuerte.", "Compras de Cimaco; Expo ANTAD.", 3, "Baja", "Después"),
    ("Canal", "insumos", "Insumos, kits y talleres", "Mecha trenzada cuadrada calibrada, cera filtrada, kits «Haz tu vela» y talleres. Cada taller crea un creador que compra insumos; la competencia se vuelve cliente.", "Pequeñas marcas de velas y aficionados de todo el país (Mercado Libre y Amazon).", "Tienda en línea de insumos; talleres para empresas y colegios; mayoreo para marcas chicas.", "Mercado Libre, Amazon MX, redes de velas artesanales.", 3, "Baja", "Después"),
    ("Región", "laguna", "La Laguna", "Torreón, Gómez Palacio, Lerdo y los ejidos. Donde se prueba todo.", "Cerca de 1.5 millones de habitantes; miles de tienditas a menos de 40 minutos de la planta.", "Piloto de 50 tiendas, primeros 3 distribuidores, corporativos de diciembre y 3 parroquias. Aquí se congela la receta, el precio y el proceso.", "Rutas propias desde la planta en Torreón.", 1, "Alta", "Explorando"),
    ("Región", "norte", "Norte: Coahuila, Durango, Chihuahua y Nuevo León", "Saltillo, Monclova, Durango, Chihuahua, Juárez y Monterrey, desde el Centro Norte.", "Unos 14 millones de habitantes.", "Un gerente regional en Monterrey, maquila en Nuevo León, 5 distribuidores en 12 meses.", "Mayoristas de abarrotes de Monterrey; distribuidores de veladoras existentes; referidos.", 2, "Alta", "Después"),
    ("Región", "bajio", "Bajío", "León, Querétaro, San Luis Potosí, Aguascalientes, Celaya.", "Unos 13 millones de habitantes; región muy devota (San Judas, Guadalupe).", "Centro Bajío en León; entrar por mayoristas y parroquias.", "Centrales de abasto de León y Querétaro; diócesis.", 3, "Media", "Después"),
    ("Región", "centro", "Centro: Ciudad de México y Estado de México", "La mitad de las tienditas del país a tres horas.", "Más de 22 millones de habitantes en la zona metropolitana.", "Centro Centro en el Estado de México; varios distribuidores por alcaldía; mayoristas de la Central de Abasto.", "Central de Abasto de Iztapalapa (bodegas de veladoras y cerería); mayoristas de Tepito y La Merced.", 3, "Alta", "Después"),
    ("Región", "occidente", "Occidente: Jalisco, Michoacán, Colima y Nayarit", "Guadalajara y el Bajío de Jalisco; Michoacán es el corazón del Día de Muertos.", "Unos 14 millones de habitantes.", "Centro Occidente en Guadalajara; temporada de Muertos como puerta de entrada.", "Mercado de Abastos de Guadalajara; cerería tradicional de Michoacán como aliada, no competidora.", 3, "Media", "Después"),
    ("Región", "sur", "Sur y sureste", "Puebla, Veracruz, Oaxaca, Chiapas, Yucatán.", "Unos 25 millones de habitantes; la veladora pesa más en la vida diaria.", "Centro Sur en Puebla u Oaxaca; distribuidores con rutas largas; precio de volumen.", "Mayoristas de Puebla y Veracruz; parroquias; mercados.", 4, "Media", "Después"),
    ("Región", "latam", "Centroamérica y Colombia", "Guatemala, El Salvador, Honduras, Colombia: misma devoción, mismo canal de tienditas.", "Más de 100 millones de habitantes con cultura de veladora.", "Socio importador por país con exclusividad y maquila local cuando haya volumen; la marca y el cartucho registrados antes de entrar.", "Cámaras binacionales; importadores de consumo mexicano; ferias regionales.", 4, "Baja", "Después"),
    ("Región", "usa", "Estados Unidos hispano", "Texas, California, Illinois, Arizona: la veladora de siete días ya se vende en cada supermercado hispano.", "Más de 60 millones de hispanos; la veladora es un producto de anaquel establecido.", "Importador en Texas; cadenas hispanas (Fiesta, El Rancho, Northgate); el cartucho retornable como diferencia frente a la veladora desechable.", "Distribuidores de productos mexicanos en Dallas, Houston y Los Ángeles; cadenas hispanas.", 4, "Baja", "Después"),
    ("Fuente", "surtidor", "Preguntar en la tienda quién surte las veladoras", "El distribuidor que ya mueve veladoras es el candidato perfecto: tiene ruta, tiendas y cobranza. Solo le falta un producto mejor.", "", "En cada visita a una tienda, preguntar: «¿Quién te surte las veladoras y cada cuánto viene?». Anotar nombre y teléfono en el tablero.", "Tiendas de cada colonia; el comercial lo hace en cada visita.", 1, "Alta", "Explorando"),
    ("Fuente", "rutas", "Rutas de abarrotes y mayoristas chicos", "Quien surte botanas, pan o dulces de marcas chicas ya pasa cada semana por la tienda y busca más productos que paguen la ruta.", "", "Pedir al tendero el contacto de sus rutas; ofrecer La Vela como el producto que más margen deja por metro de camioneta.", "Tiendas, mayoristas de abarrotes de la Central de Abasto.", 1, "Alta", "Explorando"),
    ("Fuente", "central", "Centrales de abasto y bodegas de artículos religiosos", "Las bodegas de veladoras y cerería venden a tianguistas y a distribuidores: conocen a todos.", "", "Visitar las bodegas de veladoras de la central de abasto de cada ciudad; ofrecer tarima completa y pedir referidos.", "Central de Abasto de Torreón; de cada región cuando abra su centro.", 2, "Alta", "Después"),
    ("Fuente", "exvendedores", "Vendedores de ruta que quieren su negocio", "Ex repartidores y supervisores de Bimbo, Coca-Cola, Sabritas o Lala saben de ruta, cobranza y tienditas; muchos quieren ser dueños de su ruta.", "", "Anuncio: «Pon tu ruta de veladoras con exclusividad de zona». Se les da piloto, exhibidores y la liga de pedidos.", "Grupos de Facebook de empleo en La Laguna; OCC; referidos de repartidores.", 2, "Media", "Después"),
    ("Fuente", "sitio", "El sitio y el blog", "El formulario «Quiero distribuir» califica solo (A/B/C) y avisa; los artículos del blog traen a quien busca «distribuir veladoras».", "", "Mantener el blog con artículos de distribución; responder a los tipo A en 24 horas.", "vela.capitaltorreon.com/distribuir", 1, "Alta", "Activo"),
    ("Fuente", "referidos", "Referidos de distribuidores activos", "Un distribuidor contento conoce a los de las ciudades vecinas.", "", "Bono por referido que llegue a piloto; pedirlo en cada visita de seguimiento.", "Los distribuidores activos.", 2, "Media", "Después"),
    ("Fuente", "camaras", "Cámaras, asociaciones y directorios", "ANPEC (tienditas), CANACO, CANACOPE y CANACINTRA tienen directorios de mayoristas y distribuidores.", "", "Pedir el directorio de mayoristas de abarrotes y presentar en sus reuniones.", "CANACO Torreón; ANPEC.", 2, "Baja", "Después"),
    ("Fuente", "expos", "Expos y ferias", "Expo Abarrotero, Expo ANTAD y ferias regionales de abarrotes juntan a los mayoristas del país en un lugar.", "", "Stand chico con la vela encendida y el cartucho en la mano; recoger datos en el tablero.", "Expo Abarrotero (Guadalajara), Expo ANTAD (Guadalajara), ferias de cada región.", 3, "Media", "Después"),
    ("Fuente", "parrocos", "Párrocos y cererías", "El párroco y la cerería del barrio saben quién vende veladoras en la zona y a quién le compran.", "", "En cada parroquia piloto, pedir los contactos de quien surte veladoras a los fieles y a las tiendas cercanas.", "Parroquias activas; cererías de cada ciudad.", 2, "Media", "Después"),
    ("Fuente", "limpieza", "Distribuidores de productos de limpieza y velas aromáticas", "Pasan por las mismas tiendas con productos de rotación parecida y no tienen veladora.", "", "Ofrecer La Vela como línea nueva con exclusividad de zona.", "Mayoristas de limpieza de la Central de Abasto; marcas regionales de velas aromáticas.", 3, "Baja", "Después"),
]
for i, (tipo, clave, nombre, desc, tam, estr, como, fase, prio, estado) in enumerate(MERCADOS, 1):
    sql.append(f"INSERT OR IGNORE INTO mercados (id, orden, tipo, clave, nombre, descripcion, tamano, estrategia, como, fase, prioridad, estado) VALUES ({i}, {i}, {q(tipo)}, {q(clave)}, {q(nombre)}, {q(desc)}, {q(tam)}, {q(estr)}, {q(como)}, {fase}, {q(prio)}, {q(estado)});")

# ───────── Tareas nuevas: siempre al final ─────────
for n, (titulo, sec, fase, prio, notas) in enumerate([
    ("Definir la reja y la tarima reales con el primer distribuidor", "Distribución", 2, "Alta", "El tablero supone reja de 24 (dos cajas) y 32 rejas por tarima (768 piezas). Medir con la reja que se compre y corregir en Ajustes."),
    ("Contratar al primer operador de producción con la prueba de medio día", "Talento", 2, "Alta", "El perfil y la prueba están en Equipo. Toca al pasar de 500 piezas por semana."),
    ("Abrir cuenta bancaria de la empresa y cargar los movimientos al tablero", "Producción", 1, "Alta", "Desde el primer peso, todo cobro y pago en Pagos. Sin eso Contabilidad no dice nada."),
], len(tareas) + 1):
    sql.append(f"INSERT OR IGNORE INTO tareas (id, titulo, seccion, fase, prioridad, notas, creada) VALUES ({n}, {q(titulo)}, {q(sec)}, {fase}, {q(prio)}, {q(notas)}, {q(AHORA)});")

# ───────── El panel del distribuidor (migración 0004): promoción y ajustes de pago ─────────
for i, (clave, nombre, desc, precio, cond, liga) in enumerate([
    ("exhibidor", "Exhibidor de mostrador", "Exhibidor de cartón para 12 velas junto a la caja de la tienda. Trae el cartel «Aquí se cambia tu cartucho».", 0, "Gratis: uno por tienda con su primer pedido.", ""),
    ("cartel", "Cartel «Aquí se cambia tu cartucho»", "Cartel tamaño carta para la puerta o el mostrador. Es lo que hace que el cliente regrese a esa tienda.", 0, "Gratis, hasta dos por tienda.", ""),
    ("hoja_tienda", "Hoja para la tienda", "Una página: qué gana la tienda, cómo funciona el depósito y qué decirle al cliente.", 0, "Se descarga; imprímela para cada tienda nueva.", "/descargas/La_Vela_Hoja_Tienda_v1_2026-10-03.pdf"),
    ("hoja_cliente", "Hoja para el cliente", "Una página para dejar en el mostrador: cómo se cambia el cartucho y por qué conviene.", 0, "Se descarga.", "/descargas/La_Vela_Hoja_Cliente_v1_2026-10-03.pdf"),
    ("hoja_distribuidor", "Hoja del distribuidor", "Tu página: los números de tu ruta y cómo armar el piloto de 50 tiendas.", 0, "Se descarga.", "/descargas/La_Vela_Hoja_Distribuidor_v1_2026-10-03.pdf"),
    ("calcomania", "Calcomanía para la puerta", "Calcomanía de 15 cm con la vela y «Cartucho retornable aquí».", 0, "Gratis, una por tienda.", ""),
    ("lona", "Lona de temporada", "Lona de 1 × 0.6 m para la temporada en curso (San Judas, Muertos, Guadalupe).", 180, "Para tiendas que venden más de 20 piezas por semana.", ""),
], 1):
    sql.append(f"INSERT OR IGNORE INTO promos (clave, nombre, descripcion, precio, condicion, liga, orden) VALUES ({q(clave)}, {q(nombre)}, {q(desc)}, {precio}, {q(cond)}, {q(liga)}, {i});")
for clave, valor in [("margen_tienda", 27), ("banco_nombre", ""), ("banco_clabe", ""), ("banco_beneficiario", ""), ("whatsapp_negocio", "")]:
    sql.append(f"INSERT OR IGNORE INTO ajustes (clave, valor) VALUES ({q(clave)}, {q(str(valor))});")

# ───────── docs/15: el equipo y el mercado, escritos desde estos mismos datos ─────────
doc = ["# 15 · Equipo y mercado", "", "Generado por `herramientas/semilla.py`: lo que vive en las pantallas Equipo y Mercado del tablero. No se edita a mano; se edita el tablero o la semilla.", "",
       "## El sistema primero, la gente después", "", "Cada puesto existe en el tablero antes de que exista la persona. El tablero dice cuándo toca contratarlo (piezas por semana), cuántas plazas hacen falta a cada volumen, dónde buscar y con qué prueba elegir.", "",
       "| # | Puesto | Área | Se contrata desde | Una plaza por cada | Sueldo mensual |", "|---|---|---|---|---|---|"]
for i, p in enumerate(PUESTOS, 1):
    doc.append(f"| {i} | {p[0]} | {p[1]} | {'desde el inicio' if not p[5] else f'{p[5]:,} piezas/semana'} | {'una sola plaza' if not p[6] else f'{p[6]:,} piezas/semana'} | {'—' if not p[7] else f'${p[7]:,.0f}'} |")
for i, p in enumerate(PUESTOS, 1):
    doc += ["", f"### {i} · {p[0]}", "", f"**Qué hace.** {p[2]}", "", f"**Perfil.** {p[3]}", "", f"**Qué mide.** {p[4]}"]
    if p[8]: doc += ["", f"**Dónde buscar.** {p[8]}"]
    if p[9]: doc += ["", f"**Cómo elegir.** {p[9]}"]
for tipo, titulo, intro in [("Canal", "Los canales", "A quién se le vende y cómo."), ("Región", "Las regiones", "En qué orden crece la red de centros, de La Laguna a Estados Unidos."), ("Fuente", "Dónde buscar comercializadores", "Las fuentes de distribuidores, en orden de rapidez.")]:
    doc += ["", f"## {titulo}", "", intro, ""]
    for m in [x for x in MERCADOS if x[0] == tipo]:
        doc += [f"### {m[2]} · fase {m[7]} · prioridad {m[8].lower()}", "", m[3]] + ([f"", f"**Tamaño.** {m[4]}"] if m[4] else []) + ["", f"**Estrategia.** {m[5]}", "", f"**Cómo entrar o dónde buscar.** {m[6]}", ""]
(RAIZ / "docs" / "15-equipo-y-mercado.md").write_text("\n".join(doc).rstrip() + "\n", encoding="utf-8")

print("\n".join(sql))
