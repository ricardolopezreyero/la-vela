# RLR · La Vela — reconstruye el modelo de negocio v2 a partir del v1 — Ricardo López Reyero
# Conserva las 5,525 fórmulas del v1 y encima:
#   1) lo viste con la guía de estilos (blanco y negro, docs/14),
#   2) agrega el cartucho retornable (supuestos, hoja «Cartucho» y selector en el costeo),
#   3) agrega la hoja «Distribuidor» (cuánto gana un distribuidor según su tamaño),
#   4) rehace la gráfica del Resumen en grises.
# Uso: python3 herramientas/construir_modelo.py   (luego recalcular con LibreOffice)
import copy
import sys
from pathlib import Path

import openpyxl
from openpyxl.chart import BarChart, LineChart, Reference
from openpyxl.formatting.rule import CellIsRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.workbook.defined_name import DefinedName

_RLR = "Ricardo López Reyero"; _k = "EYE"; _rev = 181218  # RLR

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / "modelo" / "Modelo_Negocio_Velas_Rinde.xlsx"
DESTINO = Path(sys.argv[1]) if len(sys.argv) > 1 else RAIZ / "modelo" / "La_Vela_Modelo_de_Negocio_v4.xlsx"

# ── Guía de estilos (docs/14): negro, blanco y grises ──
NEGRO, TINTA, G700, G500, G300, G100, BLANCO = "000000", "111111", "444444", "6B6B6B", "C8C8C8", "F3F3F3", "FFFFFF"
relleno = lambda c: PatternFill("solid", fgColor=c)
DELGADO = Side(style="thin", color=G500)
GRUESO = Side(style="medium", color=NEGRO)
MARCO = Border(left=DELGADO, right=DELGADO, top=DELGADO, bottom=DELGADO)        # dato que se puede cambiar
MARCO_CLAVE = Border(left=GRUESO, right=GRUESO, top=GRUESO, bottom=GRUESO)      # selector o supuesto clave
F_PESOS = '\\$#,##0.00;"($"#,##0.00\\);\\-'
F_ENTERO = '#,##0;(#,##0);\\-'
F_PESOS0 = '\\$#,##0;"($"#,##0\\);\\-'
F_PCT = '0.0%;\\(0.0%\\);\\-'


def fuente(c, **k):
    base = dict(name=c.font.name or "Arial", sz=c.font.sz or 10, b=c.font.b, i=c.font.i, color=NEGRO)
    base.update(k)
    return Font(**base)


# RLR · traduce el formato de color del v1 a blanco y negro, celda por celda
def vestir(c):
    f = c.font
    col = f.color.rgb if f.color is not None and f.color.type == "rgb" else None
    fondo = c.fill.fgColor.rgb if c.fill.fill_type else None
    azul, verde = col == "FF0000FF", col == "FF008000"
    if col == "FF1F3A5F":  # títulos
        c.font = Font(name="Georgia", sz=18, color=NEGRO) if (f.sz or 0) >= 14 else Font(name="Arial", sz=11, b=True, color=NEGRO)
        return
    if fondo == "FF1F3A5F":  # encabezado de tabla
        c.font = fuente(c, b=True, color=BLANCO); c.fill = relleno(NEGRO); return
    if azul and fondo == "FFFFFF00":  # supuesto clave
        c.font = fuente(c, b=True); c.fill = PatternFill(fill_type=None); c.border = MARCO_CLAVE; return
    if azul and fondo == "FFDCE6F1":  # ejes de las tablas de sensibilidad
        c.font = fuente(c, b=True); c.fill = relleno(G300); c.border = MARCO; return
    if azul:  # dato editable
        c.font = fuente(c); c.border = MARCO; return
    if fondo in ("FFE2EFDA", "FFFFFF00"):  # resultado clave
        c.font = fuente(c, b=True, color=BLANCO); c.fill = relleno(TINTA); return
    if fondo == "FFDCE6F1":
        c.font = fuente(c); c.fill = relleno(G300); return
    if fondo == "FFF2F2F2":
        c.font = fuente(c); c.fill = relleno(G100); return
    if verde:
        c.font = fuente(c); return
    if col == "FF595959":
        c.font = fuente(c, color=G500); return
    c.font = fuente(c)


wb = openpyxl.load_workbook(ORIGEN)
for ws in wb:
    for fila in ws.iter_rows():
        for c in fila:
            if c.value is not None or c.fill.fill_type:
                vestir(c)
    ws.sheet_view.showGridLines = False
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr = openpyxl.worksheet.properties.PageSetupProperties(fitToPage=True)

# ── Estilos para lo nuevo ──
def titulo(ws, texto, sub=None):
    ws["A1"] = texto; ws["A1"].font = Font(name="Georgia", sz=18, color=NEGRO); ws.row_dimensions[1].height = 26
    if sub:
        ws["A2"] = sub; ws["A2"].font = Font(name="Arial", sz=9, color=G500)

def seccion(ws, fila, texto, hasta):
    for col in range(1, hasta + 1):
        c = ws.cell(fila, col); c.fill = relleno(G300); c.font = Font(name="Arial", sz=10, b=True, color=NEGRO)
    ws.cell(fila, 1).value = texto

def encabezado(ws, fila, textos):
    for i, t in enumerate(textos, 1):
        c = ws.cell(fila, i, t); c.fill = relleno(NEGRO); c.font = Font(name="Arial", sz=10, b=True, color=BLANCO)
        c.alignment = Alignment(horizontal="left" if i == 1 else "right", vertical="center", wrap_text=True)

def celda(ws, ref, valor, fmt=None, negrita=False, entrada=False, clave=False, nota=False, resultado=False):
    c = ws[ref]; c.value = valor
    c.font = Font(name="Arial", sz=9 if nota else 10, b=negrita or clave or resultado, color=BLANCO if resultado else (G500 if nota else NEGRO))
    if fmt: c.number_format = fmt
    if entrada: c.border = MARCO
    if clave: c.border = MARCO_CLAVE
    if resultado: c.fill = relleno(TINTA)
    if nota: c.alignment = Alignment(wrap_text=True, vertical="top")
    return c

def nombre(clave, hoja, ref):
    wb.defined_names[clave] = DefinedName(clave, attr_text=f"{hoja}!{ref}")

# ── 1. Nombre del producto y leyendas (ya no hay colores) ──
for hoja, ref in (("Supuestos", "B19"), ("Supuestos", "B20"), ("Costeo", "C4"), ("Costeo", "D4")):
    wb[hoja][ref].value = wb[hoja][ref].value.replace(" Rinde+", "")
ini = wb["Inicio"]
ini["A1"] = "Modelo de negocio · La Vela"
ini["A2"] = ("Veladora diseñada para durar, con cartucho retornable, distribuida en tiendas y misceláneas a través de "
             "distribuidores con rutas, más canales directos y línea premium. Modelo a 36 meses en pesos mexicanos, con el plan de protección, el de crecimiento por países y el escenario Rentable. Versión 4 · octubre de 2026.")
ini["A5"] = "1. En 'Supuestos', celda D5: elige 1 = Base (lo que platicamos), 2 = Optimizado o 3 = Rentable. Celda D6: volumen Conservador, Medio o Alto."
ini["A6"] = "2. Cambia cualquier celda con marco. Todo se recalcula solo. Las de marco grueso son las que más mueven el resultado."
ini["A8"] = ini["A8"].value  # sin cambio
for f in range(9, 40):
    for col in (1, 2):
        c = ini.cell(f, col); c.value = None; c.border = Border(); c.fill = PatternFill(fill_type=None)
celda(ini, "A9", "5. En 'Supuestos', celda D184: elige 1 = repuesto con funda o 2 = cartucho retornable. La hoja 'Cartucho' explica la diferencia.")
ini["A11"] = "Cómo se lee"; ini["A11"].font = Font(name="Arial", sz=11, b=True)
for f, (a, b) in enumerate([("Marco delgado", "Dato que puedes cambiar."), ("Marco grueso", "Selector o supuesto clave: lo que más mueve el resultado."),
                            ("Fondo negro", "Resultado clave, o encabezado de tabla."), ("Sin marco", "Fórmula: no tocar.")], 12):
    celda(ini, f"A{f}", a); celda(ini, f"B{f}", b)
ini["A12"].border = MARCO; ini["A13"].border = MARCO_CLAVE; ini["A13"].font = Font(name="Arial", sz=10, b=True)
ini["A14"].fill = relleno(TINTA); ini["A14"].font = Font(name="Arial", sz=10, b=True, color=BLANCO)
ini["A17"] = "Hojas"; ini["A17"].font = Font(name="Arial", sz=11, b=True)
HOJAS = [
    ("Resumen", "Resultados por año, capital, punto de equilibrio y comparación Base vs Optimizado."),
    ("Supuestos", "Todos los datos editables con su fuente. Selectores de escenario."),
    ("Rentable", "NUEVA. El escenario 3: las palancas que casi duplican la utilidad, cuánto vale cada una y de qué depende."),
    ("Costeo", "Costo por pieza de cada producto, de la cera a la caja."),
    ("Cartucho", "NUEVA. El cartucho retornable: cuánto cuesta cada llenado, cuántos hay que comprar y qué cambia contra la funda."),
    ("Cascada", "Quién gana qué en cada pieza, a dónde se va cada peso y economía de canales directos."),
    ("Todos_ganan", "Lo que gana el cliente, la tienda, el distribuidor y nosotros."),
    ("Distribuidor", "NUEVA. Cuánto gana un distribuidor según cuántas tiendas surte, y cómo se califica una solicitud."),
    ("Proteccion", "NUEVA. Las capas que cuidan el negocio: registros, marcas en el vidrio y el aluminio, contratos, y lo que cuestan."),
    ("Expansion", "NUEVA. Cómo se crece por países: México, América Latina y Estados Unidos, a 15 años."),
    ("Volumen", "Tiendas, piezas y canales mes a mes."),
    ("Resultados", "Estado de resultados mensual y anual."),
    ("Flujo", "Flujo de efectivo, capital de trabajo, necesidad de capital y recuperación."),
    ("Capex_Capacidad", "Equipo por nivel, costo de transformación propia y capacidad de planta."),
    ("Palancas", "Cuánto dinero deja cada mejora de eficiencia, e ideas extra."),
    ("Sensibilidad", "Tablas de qué pasa si cambian parafina, precio, márgenes, volumen y vaso."),
    ("Competencia", "Precios de competencia y captura de pruebas de horas reales."),
    ("Prueba_encendido", "Plantilla para registrar las pruebas de encendido."),
    ("Riesgos", "Supuestos por validar con responsable y fecha."),
    ("Fuentes", "De dónde salió cada dato."),
]
ini._hyperlinks = []  # las ligas del v1 apuntaban a las filas viejas
for f in range(1, 40):
    ini.cell(f, 1).hyperlink = None
for f, (a, b) in enumerate(HOJAS, 18):
    celda(ini, f"A{f}", a, negrita=True); celda(ini, f"B{f}", b)
    ini[f"A{f}"].hyperlink = f"#'{a}'!A1"
    ini[f"A{f}"].font = Font(name="Arial", sz=10, b=True, color=NEGRO, u="single")
for f, t in ((39, "Página del modelo: https://vela.capitaltorreon.com/modelo"), (40, "Ing. Ricardo López Reyero · Torreón, Coahuila")):
    celda(ini, f"A{f}", t, nota=True); ini[f"A{f}"].alignment = Alignment(wrap_text=False)

sup = wb["Supuestos"]
sup["A2"] = ("Marco delgado = dato que puedes cambiar · Marco grueso = selector o supuesto clave · La columna F (Activo) es la que usa "
             "todo el modelo. Todos los precios al público incluyen IVA; los costos de insumos son sin IVA.")
sen = wb["Sensibilidad"]
sen["A2"] = "Fondo negro = perdemos. Todo lo demás se queda como está en el escenario activo."
wb["Prueba_encendido"]["A2"] = wb["Prueba_encendido"]["A2"].value.replace("Celdas azules = captura", "Celdas con marco = captura")
# Sensibilidad: una sola regla, en blanco y negro
rangos = [str(cf.sqref) for cf in sen.conditional_formatting]
sen.conditional_formatting = openpyxl.formatting.formatting.ConditionalFormattingList()
for r in dict.fromkeys(rangos):
    sen.conditional_formatting.add(r, CellIsRule(operator="lessThan", formula=["0"], fill=relleno(TINTA), font=Font(color=BLANCO, b=True)))

# ── 2. Supuestos del cartucho retornable (docs/08) ──
F = 183
seccion(sup, F, "17. CARTUCHO RETORNABLE (el repuesto que regresa a la tienda)", 7)
filas = [
    # clave, concepto, unidad, base, optimizado, formato, nota
    ("cart_costo", "Costo de un cartucho de aluminio nuevo", "$ / pza", 3.2, 2.6, F_PESOS, "ESTIMADO: cotizar por millar con un proveedor de estampado o troquel."),
    ("cart_vueltas", "Vueltas que aguanta un cartucho antes de reciclarse", "vueltas", 8, 12, F_ENTERO, "ESTIMADO: medir en prototipo cuántas veces se rellena sin deformarse."),
    ("cart_retorno", "Cartuchos que el cliente regresa a la tienda", "%", 0.7, 0.8, F_PCT, "ESTIMADO: medir en el piloto de 50 tiendas. Es el supuesto que más pesa."),
    ("cart_deposito", "Depósito que paga el cliente por cartucho (con IVA)", "$ / pza", 5, 5, F_PESOS, "Como el envase de refresco retornable. Se descuenta al regresar el vacío."),
    ("cart_reproceso", "Reproceso por vuelta (calentar, sacar el cabo, revisar)", "$ / pza", 0.5, 0.35, F_PESOS, "ESTIMADO. No se lava: el residuo se integra a la cera nueva."),
    ("cart_log_inv", "Logística inversa por cartucho (caja de 24 en la ruta)", "$ / pza", 0.1, 0.05, F_PESOS, "ESTIMADO. Regresa en la misma visita semanal del distribuidor."),
    ("cart_ciclo", "Semanas que tarda un cartucho en dar la vuelta completa", "semanas", 5, 4, F_ENTERO, "Casa (1) + tienda + ruta + planta. Define cuántos cartuchos hay en circulación."),
]
celda(sup, f"A{F+1}", "sel_rep"); celda(sup, f"B{F+1}", "FORMATO DEL REPUESTO (1 = con funda, como en la versión 1 · 2 = cartucho retornable)", negrita=True)
celda(sup, f"C{F+1}", "1 / 2"); celda(sup, f"D{F+1}", 1, clave=True)
celda(sup, f"F{F+1}", f'=IF(D{F+1}=1,"Repuesto con funda","Cartucho retornable")', negrita=True)
celda(sup, f"G{F+1}", "Con 2, el costeo cambia la funda por el costo neto del cartucho (hoja Cartucho) y todo el modelo se recalcula.", nota=True)
nombre("sel_rep", "Supuestos", f"$D${F+1}")
for i, (clave, concepto, unidad, base, opt, fmt, nota) in enumerate(filas, F + 2):
    celda(sup, f"A{i}", clave); celda(sup, f"B{i}", concepto); celda(sup, f"C{i}", unidad)
    celda(sup, f"D{i}", base, fmt, entrada=True); celda(sup, f"E{i}", opt, fmt, entrada=True)
    celda(sup, f"F{i}", f"=IF(sel_costos=1,D{i},E{i})", fmt)
    celda(sup, f"G{i}", nota, nota=True); sup[f"G{i}"].alignment = Alignment(wrap_text=False)
    sup[f"A{i}"].font = copy.copy(sup["A19"].font); sup[f"C{i}"].font = copy.copy(sup["C19"].font)
    nombre(clave, "Supuestos", f"$F${i}")
sup[f"A{F+1}"].font = copy.copy(sup["A19"].font)
sup[f"G{F+1}"].alignment = Alignment(wrap_text=False)

# ── 3. Hoja Cartucho ──
ca = wb.create_sheet("Cartucho", index=wb.sheetnames.index("Costeo") + 1)
ca.sheet_view.showGridLines = False
titulo(ca, "El cartucho retornable", "El repuesto es una copa de aluminio con la cera y la mecha ya puestas. Regresa vacío a la tienda, se rellena y vuelve a salir. Los datos vienen de Supuestos, sección 17.")
for col, ancho in zip("ABCD", (62, 16, 16, 78)):
    ca.column_dimensions[col].width = ancho

seccion(ca, 4, "EL CICLO", 4)
for i, t in enumerate([
    "1. El cliente mete el cartucho completo al vaso y lo prende. La cera arde dentro del aluminio; el vaso no se ensucia.",
    "2. Cuando se acaba, regresa el cartucho vacío a la misma tienda y le descuentan el depósito en el siguiente.",
    "3. La tienda junta los vacíos en una caja de 24. La ruta del distribuidor se los lleva en su visita de siempre.",
    "4. En planta no se lava: se calienta, se saca el cabo, se pone mecha nueva y se rellena. El residuo se integra a la cera nueva.",
    "5. Cuando un cartucho ya no sirve, el aluminio se recicla.",
], 5):
    celda(ca, f"A{i}", t)

seccion(ca, 11, "CUÁNTO CUESTA CADA LLENADO", 4)
encabezado(ca, 12, ["Concepto", "Valor", "Unidad", "Cómo se calcula"])
datos = [
    (13, "Costo de un cartucho nuevo", "=cart_costo", F_PESOS, "$ / pza", "Supuestos."),
    (14, "Cartuchos que regresan", "=cart_retorno", F_PCT, "%", "Supuestos. De cada 100 cartuchos vendidos, cuántos vuelven a la tienda."),
    (15, "Vueltas máximas por cartucho", "=cart_vueltas", F_ENTERO, "vueltas", "Supuestos."),
    (16, "Llenados que da un cartucho en su vida", "=IF(cart_retorno>=1,cart_vueltas,(1-cart_retorno^cart_vueltas)/(1-cart_retorno))", "0.00", "llenados",
     "En cada vuelta se pierde el que no regresa. Con 80% de retorno y 12 vueltas, un cartucho se llena 4.7 veces en promedio."),
    (17, "Aluminio por llenado", "=B13/B16", F_PESOS, "$ / llenado", "Costo del cartucho repartido entre sus llenados."),
    (18, "Reproceso y logística inversa por llenado", "=cart_retorno*(cart_reproceso+cart_log_inv)", F_PESOS, "$ / llenado", "Solo aplica a los que regresan."),
    (19, "Depósito que nadie reclama, sin IVA", "=(1-cart_retorno)*cart_deposito/(1+iva)", F_PESOS, "$ / llenado",
     "El cliente que no regresa el cartucho deja su depósito. Supone que ese depósito llega hasta nosotros: VALIDAR con el distribuidor."),
]
for f, concepto, formula, fmt, unidad, nota in datos:
    celda(ca, f"A{f}", concepto); celda(ca, f"B{f}", formula, fmt); celda(ca, f"C{f}", unidad); celda(ca, f"D{f}", nota, nota=True)
celda(ca, "A20", "COSTO NETO DEL CARTUCHO POR LLENADO", resultado=True); celda(ca, "B20", "=B17+B18-B19", F_PESOS, resultado=True)
celda(ca, "C20", "$ / llenado", resultado=True); celda(ca, "D20", "Aluminio + reproceso − depósitos no reclamados. Es lo que entra al costeo cuando el selector está en 2.", nota=True)
nombre("cart_neto", "Cartucho", "$B$20")
celda(ca, "A21", "Costo sin contar los depósitos (lectura conservadora)"); celda(ca, "B21", "=B17+B18", F_PESOS); celda(ca, "C21", "$ / llenado")
celda(ca, "D21", "Si el depósito no reclamado se queda en la tienda o en el distribuidor.", nota=True)
celda(ca, "A22", "Funda del repuesto (versión 1)"); celda(ca, "B22", "=funda_rep", F_PESOS); celda(ca, "C22", "$ / pza"); celda(ca, "D22", "Lo que hoy usa el modelo con el selector en 1.", nota=True)
celda(ca, "A23", "Ahorro por repuesto contra la funda", negrita=True); celda(ca, "B23", "=B22-B20", F_PESOS, negrita=True); celda(ca, "C23", "$ / pza")
celda(ca, "D23", "Positivo = el cartucho retornable sale más barato que la funda.", nota=True)

seccion(ca, 25, "QUÉ CAMBIA EN UN AÑO (año 2 del escenario activo)", 4)
encabezado(ca, 26, ["Concepto", "Valor", "Unidad", "Cómo se calcula"])
datos = [
    (27, "Velas con vaso al año", "=Palancas!B6", F_ENTERO, "pzas", "Cada una sale con su primer cartucho."),
    (28, "Repuestos al año", "=Palancas!B7", F_ENTERO, "pzas", "Cada uno es un llenado."),
    (29, "Llenados al año", "=B27+B28", F_ENTERO, "llenados", ""),
    (30, "Cartuchos nuevos que hay que comprar al año", "=B29/B16", F_ENTERO, "pzas", "Llenados ÷ llenados por cartucho."),
    (31, "Compra anual de cartuchos", "=B30*B13", F_PESOS0, "$", ""),
    (32, "Reproceso y logística inversa al año", "=B29*B18", F_PESOS0, "$", ""),
    (33, "Depósitos no reclamados al año, sin IVA", "=B29*B19", F_PESOS0, "$", "Ingreso que compensa los cartuchos perdidos."),
    (34, "Costo neto anual del sistema de cartucho", "=B31+B32-B33", F_PESOS0, "$", ""),
    (35, "Costo anual de las fundas (versión 1)", "=B28*B22", F_PESOS0, "$", "Solo los repuestos llevan funda."),
]
for f, concepto, formula, fmt, unidad, nota in datos:
    celda(ca, f"A{f}", concepto); celda(ca, f"B{f}", formula, fmt); celda(ca, f"C{f}", unidad); celda(ca, f"D{f}", nota, nota=True)
celda(ca, "A36", "DIFERENCIA AL AÑO: CARTUCHO RETORNABLE CONTRA FUNDA", resultado=True); celda(ca, "B36", "=B35-B34", F_PESOS0, resultado=True)
celda(ca, "C36", "$", resultado=True); celda(ca, "D36", "Positivo = el cartucho deja más dinero. No incluye la merma (1.5%) ni el vidrio que se ahorra en ruta.", nota=True)

seccion(ca, 38, "CARTUCHOS EN CIRCULACIÓN (año 2)", 4)
encabezado(ca, 39, ["Concepto", "Valor", "Unidad", "Cómo se calcula"])
datos = [
    (40, "Llenados al mes", "=B29/12", F_ENTERO, "llenados", ""),
    (41, "Semanas que tarda la vuelta completa", "=cart_ciclo", F_ENTERO, "semanas", "Supuestos."),
    (42, "Cartuchos en circulación", "=B40*B41/semanas_mes", F_ENTERO, "pzas", "Los que hay en casas, tiendas, ruta y planta al mismo tiempo."),
    (43, "Inversión en la flotilla de cartuchos", "=B42*B13", F_PESOS0, "$", "Se compra una vez, al arrancar. No está en la hoja Flujo."),
    (44, "Depósitos cobrados por los cartuchos en circulación", "=B42*cart_deposito", F_PESOS0, "$", "Es dinero del cliente: se le debe hasta que regrese el cartucho."),
    (45, "Cartuchos que se dan de baja al año", "=B30", F_ENTERO, "pzas", "Perdidos o reciclados; son los que se reponen."),
]
for f, concepto, formula, fmt, unidad, nota in datos:
    celda(ca, f"A{f}", concepto); celda(ca, f"B{f}", formula, fmt); celda(ca, f"C{f}", unidad); celda(ca, f"D{f}", nota, nota=True)

seccion(ca, 47, "LO QUE HAY QUE VALIDAR", 4)
for i, t in enumerate([
    "Cuántas vueltas aguanta un cartucho antes de deformarse (prototipo).",
    "Qué porcentaje de los clientes regresa el cartucho, por tienda (piloto de 50 tiendas, 4 semanas).",
    "El costo del cartucho por millar (troquel) y el costo de reproceso por vuelta.",
    "La mecha calibrada para el diámetro del cartucho (~5.8 cm).",
    "Quién se queda con el depósito no reclamado: la tienda, el distribuidor o nosotros.",
    "Que el borde de aluminio se vea bien dentro del vaso.",
], 48):
    celda(ca, f"A{i}", "· " + t)
ca.freeze_panes = "A4"

# El costeo usa el cartucho cuando el selector está en 2
co = wb["Costeo"]
co["A17"] = "Funda del repuesto o cartucho retornable"
for col in "CEFG":
    co[f"{col}17"] = "=IF(sel_rep=1,0,cart_neto)"
co["D17"] = "=IF(sel_rep=1,funda_rep,cart_neto)"
co["H17"] = "Supuestos D184: 1 = funda (versión 1) · 2 = cartucho retornable, en todas las piezas (ver hoja Cartucho)."
co["H17"].font = Font(name="Arial", sz=9, color=G500)

# ── 4. Hoja Distribuidor ──
di = wb.create_sheet("Distribuidor", index=wb.sheetnames.index("Todos_ganan") + 1)
di.sheet_view.showGridLines = False
titulo(di, "Lo que gana un distribuidor", "Para la llamada con cada distribuidor. Cambia las celdas con marco: tiendas que surte y piezas por tienda. Lo demás sale del escenario activo.")
di.column_dimensions["A"].width = 56
for col in "BCDE":
    di.column_dimensions[col].width = 18
di.column_dimensions["F"].width = 60
seccion(di, 4, "POR TAMAÑO DE DISTRIBUIDOR", 6)
encabezado(di, 5, ["Concepto", "C · Chico", "B · Mediano", "A · Grande", "Tu caso", "Cómo se calcula"])
entradas = {"B": (100, 5), "C": (300, 8), "D": (1000, 8), "E": (500, 8)}
celda(di, "A6", "Tiendas que surte"); celda(di, "A7", "Piezas que vende cada tienda por semana")
celda(di, "F6", "Dato del distribuidor.", nota=True); celda(di, "F7", "ESTIMADO: se mide en el piloto. El escenario Medio usa 8.", nota=True)
renglones = [
    (8, "Piezas al mes", "={c}6*{c}7*semanas_mes", F_ENTERO, "Tiendas × piezas × 4.33 semanas.", False),
    (9, "El distribuidor gana por pieza", "=Cascada!$B$32", F_PESOS, "Promedio ponderado por la mezcla de productos (hoja Cascada).", False),
    (10, "EL DISTRIBUIDOR GANA AL MES", "={c}8*{c}9", F_PESOS0, "", True),
    (11, "El distribuidor gana al año", "={c}10*12", F_PESOS0, "Sin contar la estacionalidad.", False),
    (12, "Cada tienda gana al mes", "={c}7*semanas_mes*Cascada!$B$31", F_PESOS0, "Piezas de la tienda × lo que gana por pieza.", False),
    (13, "Su compra mensual a nosotros, con IVA", "={c}8*Cascada!$B$30*(1-m_tienda)*(1-m_dist)", F_PESOS0, "Lo que nos paga el distribuidor cada mes.", False),
    (14, "Repuestos al mes (cartuchos que van y vienen)", "={c}8*mix_rep", F_ENTERO, "Piezas × parte de la mezcla que es repuesto.", False),
    (15, "Nosotros: utilidad bruta al mes con este distribuidor", "={c}8*Cascada!$B$28", F_PESOS0, "Antes de gastos fijos.", False),
]
for col, (tiendas, piezas) in entradas.items():
    celda(di, f"{col}6", tiendas, F_ENTERO, entrada=True); celda(di, f"{col}7", piezas, F_ENTERO, entrada=True)
for f, concepto, formula, fmt, nota, clave in renglones:
    celda(di, f"A{f}", concepto, resultado=clave)
    for col in entradas:
        celda(di, f"{col}{f}", formula.format(c=col), fmt, resultado=clave)
    celda(di, f"F{f}", nota, nota=True)

seccion(di, 17, "CÓMO SE CALIFICA UNA SOLICITUD (interno, no se publica)", 6)
encabezado(di, 18, ["Pregunta del formulario", "1 punto", "2 puntos", "3 puntos", "", ""])
for f, fila in enumerate([
    ("Puntos de venta que surte", "Menos de 100", "100–300", "Más de 300"),
    ("Cada cuánto visita cada tienda", "Cada mes", "Cada 2 semanas", "Cada semana"),
    ("Veladoras que ya vende al mes", "No vende o menos de 1,000", "1,000–10,000", "Más de 10,000"),
    ("Vehículos de reparto", "1–2", "3–10", "Más de 10"),
    ("Tamaño del primer pedido", "Menos de $10 mil", "$10–50 mil", "Más de $50 mil"),
], 19):
    for col, t in zip("ABCD", fila):
        celda(di, f"{col}{f}", t); di[f"{col}{f}"].alignment = Alignment(horizontal="left" if col == "A" else "right", wrap_text=True)
encabezado(di, 25, ["Puntaje", "Tipo", "Qué hacer", "", "", ""])
di["C25"].alignment = Alignment(horizontal="left")
for f, (a, b, c) in enumerate([
    ("12 a 15", "A · Grande", "Llamada en menos de 24 horas y visita a su bodega. Ofrecer exclusividad de zona."),
    ("8 a 11", "B · Mediano", "Videollamada en 72 horas. Piloto con 30 a 50 tiendas."),
    ("5 a 7", "C · Chico", "Mensaje con catálogo y pedido mínimo. Sin llamada."),
], 26):
    celda(di, f"A{f}", a); celda(di, f"B{f}", b, negrita=True); celda(di, f"C{f}", c)
celda(di, "A30", "Más de 10,000 veladoras al mes es A directo. Zona con exclusividad ya asignada: lista de espera.", nota=True)
celda(di, "A31", "Las solicitudes del sitio (vela.capitaltorreon.com/distribuir) se guardan ya calificadas con esta tabla.", nota=True)
di.freeze_panes = "B6"

# ── 5. Gráfica del Resumen, en grises ──
res, resultados = wb["Resumen"], wb["Resultados"]
barras = BarChart(); barras.type = "col"; barras.title = "Ingresos y EBITDA por mes"; barras.style = 1
barras.y_axis.title = "Pesos"; barras.x_axis.title = "Mes"; barras.height = 9; barras.width = 22; barras.gapWidth = 40
meses = Reference(resultados, min_col=3, max_col=38, min_row=3)
barras.add_data(Reference(resultados, min_col=2, max_col=38, min_row=20), from_rows=True, titles_from_data=True)
barras.set_categories(meses)
barras.series[0].graphicalProperties.solidFill = G300; barras.series[0].graphicalProperties.line.solidFill = G300
barras.series[0].tx = openpyxl.chart.series.SeriesLabel(v="Ingresos")
linea = LineChart()
linea.add_data(Reference(resultados, min_col=2, max_col=38, min_row=63), from_rows=True, titles_from_data=True)
linea.series[0].graphicalProperties.line.solidFill = NEGRO; linea.series[0].graphicalProperties.line.width = 28000
linea.series[0].smooth = False; linea.series[0].tx = openpyxl.chart.series.SeriesLabel(v="EBITDA")
barras += linea
barras.legend.position = "b"; barras.y_axis.number_format = '\\$#,##0'; barras.y_axis.delete = False; barras.x_axis.delete = False
res.add_chart(barras, "G3")

# ── 6. Riesgos: el del cartucho apunta a su hoja ──
rie = wb["Riesgos"]
for fila in rie.iter_rows(min_row=4):
    if fila[1].value and "artucho" in str(fila[1].value):
        fila[3].value = "Supuestos · sección 17 y hoja Cartucho"


# ── 7. Hoja Expansion: México → América Latina → Estados Unidos ──
ex = wb.create_sheet("Expansion", index=wb.sheetnames.index("Distribuidor") + 1)
ex.sheet_view.showGridLines = False
titulo(ex, "Crecer por países", "Primero México, luego América Latina, luego Estados Unidos. Población, consumo y participación son SUPUESTOS para dimensionar: hay que validarlos con datos de cada país antes de decidir.")
ex.column_dimensions["A"].width = 44
for col in "BCDEFGHIJ":
    ex.column_dimensions[col].width = 15
ex.column_dimensions["K"].width = 34; ex.column_dimensions["L"].width = 70
seccion(ex, 4, "MERCADOS", 12)
encabezado(ex, 5, ["Mercado", "Fase", "Año de entrada", "Población (millones)", "Consumo vs México", "Veladoras por persona al año", "Mercado (millones de piezas)",
                   "Participación meta", "Años para llegar", "Piezas al año en la meta (millones)", "Cómo se entra", "Nota"])
ex.row_dimensions[5].height = 42
MERCADOS = [
    # nombre, fase, entrada, población, consumo relativo, participación, años, precio relativo, cómo, nota
    ("México · resto del país", 1, 4, 130, 1.0, 0.01, 8, "Distribuidores con exclusividad por zona; maquila regional.",
     "Mercado: 697 millones de piezas al año (Solunion, 2024). Población: ESTIMADO."),
    ("Guatemala", 2, 6, 18, 0.8, 0.01, 5, "Distribuidor maestro; se exporta desde México.", "SUPUESTO sin fuente: población y consumo por validar."),
    ("Colombia", 2, 7, 52, 0.35, 0.005, 5, "Distribuidor maestro o licencia de fabricación.", "SUPUESTO sin fuente: población y consumo por validar."),
    ("Perú", 2, 8, 34, 0.35, 0.005, 5, "Distribuidor maestro o licencia de fabricación.", "SUPUESTO sin fuente: población y consumo por validar."),
    ("Estados Unidos · mercado hispano", 3, 9, 65, 0.5, 0.005, 6, "Importador y cadenas del suroeste; cumplir normas ASTM de velas.",
     "SUPUESTO sin fuente. Normas a cumplir: ASTM F2417 (seguridad contra incendio), F2058 (etiquetado) y F2179 (vasos de vidrio)."),
]
celda(ex, "A6", "México · La Laguna (lo que ya está en el modelo)"); celda(ex, "B6", 1, F_ENTERO); celda(ex, "C6", 1, F_ENTERO, entrada=True)
celda(ex, "G6", 697, F_ENTERO, entrada=True); celda(ex, "H6", "=J6/G6", '0.000%'); celda(ex, "I6", 2, F_ENTERO, entrada=True)
celda(ex, "J6", "=Palancas!B8/1000000", "0.00"); celda(ex, "K6", "Un distribuidor, 500 tiendas (escenario activo).")
celda(ex, "L6", "Piezas del año 2 del modelo de 36 meses. El mercado de 697 millones es todo México.", nota=True)
for f, (nom, fase, ent, pob, rel, part, anos, como, nota) in enumerate(MERCADOS, 7):
    celda(ex, f"A{f}", nom); celda(ex, f"B{f}", fase, F_ENTERO); celda(ex, f"C{f}", ent, F_ENTERO, entrada=True)
    celda(ex, f"D{f}", pob, F_ENTERO, entrada=True); celda(ex, f"E{f}", rel, "0.00", entrada=True)
    celda(ex, f"F{f}", f"=$G$6/$D$7*E{f}", "0.00"); celda(ex, f"G{f}", f"=D{f}*F{f}", "#,##0.0")
    celda(ex, f"H{f}", part, "0.0%", entrada=True); celda(ex, f"I{f}", anos, F_ENTERO, entrada=True)
    celda(ex, f"J{f}", f"=G{f}*H{f}", "0.00"); celda(ex, f"K{f}", como); celda(ex, f"L{f}", nota, nota=True)
for f in range(6, 12):
    ex[f"L{f}"].alignment = Alignment(wrap_text=False); ex[f"K{f}"].alignment = Alignment(wrap_text=True, vertical="top")
    ex.row_dimensions[f].height = 28
ULT = 11
celda(ex, "A13", "Ingreso neto por pieza hoy (sin IVA)"); celda(ex, "B13", "=Cascada!$B$33", F_PESOS)
celda(ex, "A14", "Utilidad bruta por pieza hoy"); celda(ex, "B14", "=Cascada!$B$28", F_PESOS)
celda(ex, "A15", "Precio fuera de México contra el de México"); celda(ex, "B15", 1.0, "0.00", entrada=True)
celda(ex, "C15", "1.00 = mismo precio en pesos. Súbelo o bájalo para ver el efecto del tipo de cambio y de los aranceles.", nota=True); ex["C15"].alignment = Alignment(wrap_text=False)

seccion(ex, 17, "PIEZAS POR AÑO (millones)", 17)
encabezado(ex, 18, ["Mercado"] + [f"Año {n}" for n in range(1, 16)] + [""])
from openpyxl.utils import get_column_letter as L_
for i, f in enumerate(range(6, ULT + 1)):
    r = 19 + i
    celda(ex, f"A{r}", f"=A{f}")
    for n in range(1, 16):
        col = L_(n + 1)
        celda(ex, f"{col}{r}", f"=$J{f}*MIN(1,MAX(0,({n}-$C{f}+1)/$I{f}))", "0.00")
T = 19 + (ULT - 6) + 1
celda(ex, f"A{T}", "PIEZAS AL AÑO, TODOS LOS MERCADOS (millones)", resultado=True)
celda(ex, f"A{T+1}", "Ingresos netos (millones de pesos)", negrita=True)
celda(ex, f"A{T+2}", "Utilidad bruta (millones de pesos)", negrita=True)
celda(ex, f"A{T+3}", "Países con venta")
for n in range(1, 16):
    col = L_(n + 1)
    celda(ex, f"{col}{T}", f"=SUM({col}19:{col}{T-1})", "0.00", resultado=True)
    celda(ex, f"{col}{T+1}", f"=({col}19+{col}20)*$B$13+SUM({col}21:{col}{T-1})*$B$13*$B$15", "#,##0.0", negrita=True)
    celda(ex, f"{col}{T+2}", f"=({col}19+{col}20)*$B$14+SUM({col}21:{col}{T-1})*($B$13*$B$15-($B$13-$B$14))", "#,##0.0", negrita=True)
    celda(ex, f"{col}{T+3}", f"=IF({col}19+{col}20>0,1,0)+COUNTIF({col}21:{col}{T-1},\">0\")", F_ENTERO)
celda(ex, f"A{T+5}", "La utilidad bruta es antes de gastos fijos, fletes de exportación, aranceles y del margen del distribuidor maestro en cada país: es el techo, no el resultado.", nota=True)
ex[f"A{T+5}"].alignment = Alignment(wrap_text=False)

P = T + 7
seccion(ex, P, "QUÉ HAY QUE TENER ANTES DE ENTRAR A UN PAÍS", 12)
for i, t in enumerate([
    "1. La marca registrada en ese país, a nuestro nombre, por lo menos dos años antes de vender (hoja Proteccion).",
    "2. El diseño del vaso y del cartucho protegido ahí, o presentado dentro del plazo de prioridad de la solicitud mexicana.",
    "3. Un distribuidor maestro con contrato: exclusividad a cambio de mínimos, uso de marca con licencia y cartuchos que regresan.",
    "4. Etiquetado y normas del país. En Estados Unidos: ASTM F2417, F2058 y F2179.",
    "5. Decidir de dónde sale el producto: exportar desde México o licenciar el llenado local. El cartucho pesa poco; el vaso, mucho.",
    "6. La prueba de encendido repetida con la cera que se consiga ahí.",
], P + 1):
    celda(ex, f"A{i}", t)
ex.freeze_panes = "B6"

# ── 8. Hoja Proteccion: las capas que cuidan el negocio ──
pr = wb.create_sheet("Proteccion", index=wb.sheetnames.index("Expansion"))
pr.sheet_view.showGridLines = False
titulo(pr, "Cómo se protege el negocio", "Capas que se suman: lo legal, lo que va marcado en el producto y lo que amarra la operación. Todos los costos son ESTIMADOS para presupuestar; hay que cotizarlos con un despacho de propiedad industrial. No es asesoría legal.")
pr.column_dimensions["A"].width = 46; pr.column_dimensions["B"].width = 44; pr.column_dimensions["C"].width = 30
for col in "DEF":
    pr.column_dimensions[col].width = 16
pr.column_dimensions["G"].width = 16; pr.column_dimensions["H"].width = 70
seccion(pr, 4, "LAS CAPAS", 8)
encabezado(pr, 5, ["Capa", "Qué cuida", "Cuánto dura", "Costo de una vez", "Costo al año", "Costo por pieza", "Estado", "Cómo y dónde"])
CAPAS = [
    ("Lo legal", None),
    ("Marca: nombre y logotipo", "Que nadie más venda con nuestro nombre", "10 años, renovable sin límite", 22000, 0, 0, "IMPI, clases 4 (velas), 21 (vasos) y 35 (comercialización). Es lo único que dura 50 años: aquí va la mayor parte del esfuerzo."),
    ("Frase «…como Dios manda» (aviso comercial)", "La frase con la que se nos reconoce", "10 años, renovable", 7000, 0, 0, "IMPI. Revisar con el abogado si la frase es registrable tal cual."),
    ("Diseño industrial del vaso y del cartucho", "La forma: que no hagan uno igual", "5 años, renovable hasta 25", 18000, 0, 0, "IMPI. Dos solicitudes. Presentar antes de enseñar el diseño final."),
    ("Modelo de utilidad del sistema vaso + cartucho", "Cómo embona, se centra y se apaga", "15 años", 25000, 1500, 0, "IMPI. Protege el mecanismo, no la idea de rellenar. Incluye anualidades."),
    ("Secreto industrial", "Receta, especificación de mecha y protocolo de prueba", "Mientras se guarde", 15000, 0, 0, "No se registra: se cuida. Convenios de confidencialidad y acceso por partes."),
    ("Lo que va marcado en el producto", None),
    ("Marca y número de molde en el fondo del vaso", "Reconocer un vaso nuestro a simple vista", "La vida del molde", 0, 0, 0, "Va en relieve en el molde propio del vaso (Capex nivel 3). Hasta entonces, grabado o etiqueta permanente."),
    ("Marca y lote estampados en el cartucho", "Que la tienda solo reciba cartuchos nuestros", "Cada cartucho", 0, 0, 0.02, "En el troquel del aluminio. Sin marca no se devuelve el depósito."),
    ("Código único por cartucho", "Contar vueltas, garantía y detectar copias", "Cada cartucho", 0, 0, 0.05, "QR o DataMatrix grabado. El cliente lo escanea para la garantía; nosotros vemos si un código aparece dos veces."),
    ("Sello de garantía sobre el cartucho lleno", "Saber que lo llenamos nosotros", "Cada llenado", 0, 0, 0.08, "Sello que se rompe al abrir. Un cartucho rellenado por otro no trae sello."),
    ("Lo que amarra la operación", None),
    ("Depósito y logística inversa", "Los cartuchos siempre regresan a nosotros", "Siempre", 0, 0, 0, "Ya está en la hoja Cartucho. Quien copie el producto tiene que copiar también la red de regreso."),
    ("Contratos con distribuidores y maquilador", "Zona, uso de marca, confidencialidad, moldes", "Lo que dure la relación", 30000, 0, 0, "Los moldes y troqueles son nuestros aunque estén en la planta de otro. Sin competir con producto parecido."),
    ("Dominios y nombres en redes", "Que no los tome alguien más", "Renovación anual", 0, 3000, 0, "El .com, el .mx y las cuentas, antes de anunciar el nombre definitivo."),
    ("Vigilancia de marca", "Enterarse a tiempo de registros parecidos", "Anual", 0, 6000, 0, "Servicio de alertas del despacho. Oponerse cuesta mucho menos que pelear después."),
    ("Empresa dueña de la marca y los registros", "Que la propiedad no dependa de la operadora", "Siempre", 40000, 0, 0, "Una sociedad tiene la propiedad intelectual y se la licencia a la que opera. Decidirlo junto con el acuerdo de socios."),
]
f = 6
primera = None
for capa in CAPAS:
    if capa[1] is None:
        for col in range(1, 9):
            c = pr.cell(f, col); c.fill = relleno(G100); c.font = Font(name="Arial", sz=10, b=True)
        pr.cell(f, 1).value = capa[0]; f += 1; continue
    nom, que, dura, unico, anual, pieza, como = capa
    primera = primera or f
    celda(pr, f"A{f}", nom, negrita=True); celda(pr, f"B{f}", que); celda(pr, f"C{f}", dura)
    celda(pr, f"D{f}", unico, F_PESOS0, entrada=True); celda(pr, f"E{f}", anual, F_PESOS0, entrada=True); celda(pr, f"F{f}", pieza, F_PESOS, entrada=True)
    celda(pr, f"G{f}", "Pendiente", entrada=True); celda(pr, f"H{f}", como, nota=True); pr[f"H{f}"].alignment = Alignment(wrap_text=False)
    f += 1
celda(pr, f"A{f}", "TOTAL", resultado=True)
for col in "BC":
    pr[f"{col}{f}"].fill = relleno(TINTA)
celda(pr, f"D{f}", f"=SUM(D{primera}:D{f-1})", F_PESOS0, resultado=True); celda(pr, f"E{f}", f"=SUM(E{primera}:E{f-1})", F_PESOS0, resultado=True)
celda(pr, f"F{f}", f"=SUM(F{primera}:F{f-1})", F_PESOS, resultado=True)
TOT = f
celda(pr, f"A{f+2}", "Piezas del año 2 (escenario activo)"); celda(pr, f"D{f+2}", "=Palancas!B5", F_ENTERO)
celda(pr, f"A{f+3}", "Costo de marcar las piezas, al año"); celda(pr, f"D{f+3}", f"=F{TOT}*D{f+2}", F_PESOS0)
celda(pr, f"A{f+4}", "Costo anual de proteger (marcado + cuotas)", negrita=True); celda(pr, f"D{f+4}", f"=D{f+3}+E{TOT}", F_PESOS0, negrita=True)
celda(pr, f"A{f+5}", "Como parte de los ingresos del año 2"); celda(pr, f"D{f+5}", f"=D{f+4}/Resumen!C5", "0.00%")
celda(pr, f"A{f+6}", "Estos costos todavía NO están dentro del estado de resultados: son para decidir cuáles se suman.", nota=True); pr[f"A{f+6}"].alignment = Alignment(wrap_text=False)

R = f + 8
seccion(pr, R, "REGISTROS POR PAÍS (antes de entrar)", 8)
encabezado(pr, R + 1, ["País", "Qué se registra", "Por dónde", "Costo estimado", "Año de entrada", "Registrar en el año", "Estado", "Nota"])
PAISES = [
    ("México", "Marca, frase, diseños y modelo de utilidad", "IMPI", f"=SUM(D{primera}:D{primera+3})", "=Expansion!C6", "Ya: antes de vender. El plazo de novedad corre desde que se enseñó el producto."),
    ("Guatemala", "Marca y diseños", "Registro nacional", 35000, "=Expansion!C8", "No está en el sistema de Madrid: se presenta directo. CONFIRMAR."),
    ("Colombia", "Marca y diseños", "Sistema de Madrid o registro nacional", 35000, "=Expansion!C9", "Colombia sí está en Madrid: se puede extender la marca mexicana. CONFIRMAR."),
    ("Perú", "Marca y diseños", "Registro nacional", 35000, "=Expansion!C10", "CONFIRMAR si ya se puede por Madrid."),
    ("Estados Unidos", "Marca (2 clases) y patente de diseño", "USPTO, o Madrid para la marca", 60000, "=Expansion!C11", "Presentar con intención de uso. Las normas ASTM de velas se cumplen aparte."),
]
for i, (pais, que, via, costo, entrada, nota) in enumerate(PAISES, R + 2):
    celda(pr, f"A{i}", pais, negrita=True); celda(pr, f"B{i}", que); celda(pr, f"C{i}", via)
    celda(pr, f"D{i}", costo, F_PESOS0, entrada=not str(costo).startswith("=")); celda(pr, f"E{i}", entrada, F_ENTERO)
    celda(pr, f"F{i}", f"=MAX(1,E{i}-2)", F_ENTERO); celda(pr, f"G{i}", "Pendiente", entrada=True); celda(pr, f"H{i}", nota, nota=True); pr[f"H{i}"].alignment = Alignment(wrap_text=False)
celda(pr, f"A{R+7}", "TOTAL DE REGISTROS", resultado=True); celda(pr, f"D{R+7}", f"=SUM(D{R+2}:D{R+6})", F_PESOS0, resultado=True)
for col in "BC":
    pr[f"{col}{R+7}"].fill = relleno(TINTA)

A = R + 9
seccion(pr, A, "TRES COSAS QUE HAY QUE RESOLVER PRIMERO", 8)
for i, t in enumerate([
    "1. El nombre. «La Vela» describe el producto: es muy probable que no se pueda registrar como marca de velas. Hace falta un nombre distintivo, o registrar el logotipo con la frase.",
    "2. El reloj de la novedad. El diseño y el sistema ya se enseñaron en el sitio. En México hay 12 meses para presentar el modelo de utilidad y los diseños; en otros países, ninguno.",
    "3. Quién es el dueño. La marca y los registros deben quedar a nombre de la sociedad, no de una persona ni del maquilador. Va junto con el acuerdo de socios.",
], A + 1):
    celda(pr, f"A{i}", t)
pr.freeze_panes = "B6"


# ── 9. Escenario 3 · Rentable: las mismas piezas, mejor cobradas y mejor vendidas ──
re_ = wb.create_sheet("Rentable", index=wb.sheetnames.index("Supuestos") + 1)
re_.sheet_view.showGridLines = False
titulo(re_, "El escenario Rentable", "Es el Optimizado con doce cambios. Ninguno toca el costo ni el volumen de tiendas: suben dos precios, cambia la mezcla y crecen los canales donde no hay intermediario. Se activa con un 3 en Supuestos D5.")
re_.column_dimensions["A"].width = 50
for col in "BCDE":
    re_.column_dimensions[col].width = 17
re_.column_dimensions["F"].width = 92
seccion(re_, 4, "LAS PALANCAS", 6)
encabezado(re_, 5, ["Palanca", "Optimizado", "Rentable", "Unidad", "Vale al año (estimado)", "De qué depende"])
PAL = [
    # fila en Supuestos, nombre, valor rentable, formato, unidad, fórmula de impacto, de qué depende
    (19, "Precio de la Semanal (vaso + cartucho)", 55, F_PESOS, "$ al público",
     "=(C{f}-B{f})*(1-m_tienda)*(1-m_dist)/(1+iva)*Palancas!B9",
     "DECISIÓN. El vaso se compra una vez: el cliente paga $6 más una sola vez y su gasto del año casi no cambia. Probar en el piloto: mitad de las tiendas a $49 y mitad a $55."),
    (21, "Precio de la Temporada", 69, F_PESOS, "$ al público",
     "=(C{f}-B{f})*(1-m_tienda)*(1-m_dist)/(1+iva)*Palancas!B11",
     "DECISIÓN. Edición limitada con manga propia; no tiene comparación directa en el anaquel."),
    (84, "Personalizadas en la mezcla normal", 0.10, F_PCT, "% de las piezas",
     "=(C{f}-B{f})*Palancas!B8*(Cascada!E14-Cascada!B14)",
     "VENTA. Deja casi 5 veces lo que una Semanal. Se empuja con un QR en el exhibidor que abre el pedido por WhatsApp."),
    (81, "Semanal en la mezcla normal", "=B{f}-(C{a}-B{a})", F_PCT, "% de las piezas", None, "Baja lo mismo que suben las personalizadas, para que la mezcla siga sumando 100%."),
    (88, "Personalizadas en temporada alta", 0.10, F_PCT, "% de las piezas", None, "Incluido en la fila de personalizadas."),
    (85, "Semanal en temporada alta", "=B{f}-(C{a}-B{a})", F_PCT, "% de las piezas", None, "Baja lo mismo que suben las personalizadas."),
    (107, "Pedidos corporativos al mes (noviembre y diciembre)", 10, F_ENTERO, "pedidos",
     "=(C{f}-B{f})*pzas_pedido_corp*2*Cascada!E41",
     "VENTA. Es el canal que más deja por pieza. Sale de tu red: colegios, universidades y parques industriales. Cerrar antes del 15 de noviembre."),
    (104, "Campañas de recaudación al mes (temporada normal)", 4, F_ENTERO, "campañas",
     "=(C{f}-B{f})*pzas_campana*9*Cascada!E40", "VENTA. Colegios y parroquias venden y se quedan 30%."),
    (105, "Campañas de recaudación al mes (temporada alta)", 8, F_ENTERO, "campañas",
     "=(C{f}-B{f})*pzas_campana*3*Cascada!E40", "VENTA. Posadas, kermeses y Día de Muertos."),
    (93, "Parroquias de la diócesis que adoptan el repuesto", 0.5, F_PCT, "% de 51",
     "=(C{f}-B{f})*parroquias_total*rep_sem_parr*52*Cascada!E38", "VENTA. Entrar por la oficina diocesana, con un piloto de 3."),
    (97, "Restaurantes y hoteles con contrato", 40, F_ENTERO, "clientes",
     "=(C{f}-B{f})*mesas_rest*horas_noche*noches_mes/horas_gar*12*Cascada!E39", "VENTA. Repuestos por suscripción."),
    (136, "Diseño y contenido: sueldo mensual", 6000, F_PESOS0, "$ al mes",
     "=(B{f}-C{f})*carga_social*12", "DECISIÓN. Diseño por proyecto en lugar de plaza fija, hasta que el volumen lo pida."),
]
f0 = 6
fila_de = {}
for i, (r, nombre_, valor, fmt, unidad, impacto, depende) in enumerate(PAL):
    f = f0 + i
    fila_de[r] = f
for i, (r, nombre_, valor, fmt, unidad, impacto, depende) in enumerate(PAL):
    f = f0 + i
    celda(re_, f"A{f}", nombre_, negrita=bool(impacto)); celda(re_, f"B{f}", f"=Supuestos!E{r}", fmt)
    if isinstance(valor, str):
        a = fila_de[84] if r == 81 else fila_de[88]
        celda(re_, f"C{f}", valor.format(f=f, a=a), fmt)
    else:
        celda(re_, f"C{f}", valor, fmt, clave=True)
    celda(re_, f"D{f}", unidad)
    if impacto: celda(re_, f"E{f}", impacto.format(f=f), F_PESOS0)
    celda(re_, f"F{f}", depende, nota=True); re_[f"F{f}"].alignment = Alignment(wrap_text=False)
    sup[f"F{r}"] = f"=CHOOSE(sel_costos,D{r},E{r},Rentable!$C${f})"
FT = f0 + len(PAL)
celda(re_, f"A{FT}", "TODAS JUNTAS, AL AÑO", resultado=True)
for col in "BCD":
    re_[f"{col}{FT}"].fill = relleno(TINTA)
celda(re_, f"E{FT}", f"=SUM(E{f0}:E{FT-1})", F_PESOS0, resultado=True)
celda(re_, f"A{FT+1}", "Es un estimado con las piezas del año 2. El número exacto sale al poner 3 en Supuestos D5 y leer la hoja Resumen.", nota=True)
re_[f"A{FT+1}"].alignment = Alignment(wrap_text=False)

Q = FT + 3
seccion(re_, Q, "LAS QUE QUEDARON FUERA DEL ESCENARIO, Y POR QUÉ", 6)
encabezado(re_, Q + 1, ["Palanca", "Hoy", "Sería", "Unidad", "Valdría al año (estimado)", "Por qué no está"])
celda(re_, f"A{Q+2}", "Cartucho más caro"); celda(re_, f"B{Q+2}", "=Supuestos!E20", F_PESOS); celda(re_, f"C{Q+2}", 39, F_PESOS, entrada=True); celda(re_, f"D{Q+2}", "$ al público")
celda(re_, f"E{Q+2}", f"=(C{Q+2}-B{Q+2})*(1-m_tienda)*(1-m_dist)/(1+iva)*Palancas!B10", F_PESOS0)
celda(re_, f"F{Q+2}", "El cliente pagaría unos $223 más al año que con la veladora de la competencia. Solo se sostiene si la prueba demuestra que la nuestra dura más horas que la suya.", nota=True)
celda(re_, f"A{Q+3}", "Margen de la tienda"); celda(re_, f"B{Q+3}", "=Supuestos!E31", F_PCT); celda(re_, f"C{Q+3}", 0.25, F_PCT, entrada=True); celda(re_, f"D{Q+3}", "% del precio")
celda(re_, f"E{Q+3}", f"=(B{Q+3}-C{Q+3})*Cascada!B30*(1-m_dist)/(1+iva)*Palancas!B8", F_PESOS0)
celda(re_, f"F{Q+3}", "Seguiría arriba del 22–23% del refresco, pero la tienda es quien decide si la exhibe. Primero hay que saber cuánto gana hoy con una veladora.", nota=True)
celda(re_, f"A{Q+4}", "Cartucho retornable con depósito"); celda(re_, f"B{Q+4}", "Funda"); celda(re_, f"C{Q+4}", "Cartucho"); celda(re_, f"D{Q+4}", "Supuestos D184")
celda(re_, f"E{Q+4}", "=Cartucho!B36", F_PESOS0)
celda(re_, f"F{Q+4}", "Tiene su propio interruptor. Depende de cuántos cartuchos regresan y de quién se queda con el depósito del que no vuelve.", nota=True)
for f in range(Q + 2, Q + 5):
    re_[f"F{f}"].alignment = Alignment(wrap_text=False)

U = Q + 7
seccion(re_, U, "LO QUE EL MODELO NO SABE", 6)
for i, t in enumerate([
    "El modelo deja fijas las piezas por tienda. Si la Semanal a $55 se vende menos que a $49, el efecto baja: por eso se prueba en el piloto con dos precios.",
    "La Semanal a $55 deja 58% más por pieza: aunque se vendiera un tercio menos de Semanales, se ganaría lo mismo con ellas. Pero cada Semanal que no se vende es un cliente que no compra cartuchos.",
    "Las palancas de venta (corporativos, recaudación, parroquias, restaurantes, personalizadas) dependen de salir a vender. Si no se logran, queda lo de las decisiones: los dos precios y el diseño por proyecto.",
], U + 1):
    celda(re_, f"A{i}", t)
re_.freeze_panes = "B6"

# El selector ahora tiene tres posiciones
sup["B5"] = "ESCENARIO DE COSTOS Y PRECIOS (1 = Base: lo que platicamos · 2 = Optimizado · 3 = Rentable)"
sup["C5"] = "1 / 2 / 3"
sup["F5"] = '=CHOOSE(D5,"Base","Optimizado","Rentable")'
sup["G5"] = "Cambia este número y todo el modelo se recalcula. El 3 usa los costos del Optimizado y los cambios de la hoja Rentable."
wb["Resumen"]["A2"] = '="Escenario activo: "&CHOOSE(sel_costos,"Base (lo que platicamos)","Optimizado","Rentable")&" · Volumen: "&CHOOSE(sel_vol,"Conservador","Medio","Alto")'

# Pestañas: negras las que se leen, grises las de trabajo
for ws in wb:
    ws.sheet_properties.tabColor = NEGRO if ws.title in ("Inicio", "Resumen", "Rentable", "Cartucho", "Todos_ganan", "Distribuidor", "Proteccion", "Expansion") else G300
wb.active = 0
wb.properties.creator = _RLR; wb.properties.title = "La Vela · Modelo de negocio v4"; wb.properties.keywords = f"{_k} {_rev}"
wb.save(DESTINO)
print("guardado", DESTINO)
