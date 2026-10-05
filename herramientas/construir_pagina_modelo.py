# RLR · La Vela — la página «Modelo», escrita desde el Excel — Ricardo López Reyero
# Ningún número de la página se teclea: todos se leen del libro recalculado y de modelo/escenarios.json.
# Si cambia el Excel, se corre esto y la página queda al día.
# Uso: python3 herramientas/construir_modelo.py && python3 herramientas/escenarios.py
#      && python3 herramientas/construir_pagina_modelo.py && python3 herramientas/construir_sitio.py
import json
import shutil
from datetime import datetime
from pathlib import Path

import openpyxl

_RLR = "Ricardo López Reyero"; _k = "EYE"; _rev = 181218  # RLR
RAIZ = Path(__file__).resolve().parent.parent
LIBRO = RAIZ / "modelo" / "La_Vela_Modelo_de_Negocio_v4.xlsx"
wb = openpyxl.load_workbook(LIBRO, data_only=True)
E = json.loads((RAIZ / "modelo" / "escenarios.json").read_text(encoding="utf-8"))
SUP, COS, CAS, TOD, RES, REZ, SEN, PAL, DIS = (wb[n] for n in ("Supuestos", "Costeo", "Cascada", "Todos_ganan", "Resumen", "Resultados", "Sensibilidad", "Palancas", "Distribuidor"))
assert RES["A2"].value.startswith("Escenario activo: Rentable"), "El libro debe estar en el escenario Rentable (Supuestos D5 = 3)"


# ───────── Cómo se escriben los números ─────────
def p(x, d=0):
    return ("−$" if x < 0 else "$") + f"{abs(x):,.{d}f}"

def miles(x):
    a, s = abs(x), "−" if x < 0 else ""
    if a >= 995_000: return f"{s}${a / 1e6:.2f} M".replace(".00 M", " M")
    if a >= 1_000: return f"{s}${a / 1000:,.0f} mil"
    return f"{s}${a:,.0f}"

n = lambda x, d=0: f"{x:,.{d}f}"
pct = lambda x, d=0: f"{x * 100:.{d}f}%"
mas = lambda x: ("+" if x >= 0 else "") + miles(x)


def tabla(cab, filas, clase="fin"):
    h = "".join(f"<th>{c}</th>" for c in cab)
    b = "".join("<tr>" + "".join((f'<th scope="row">{c}</th>' if i == 0 else f"<td>{c}</td>") for i, c in enumerate(f)) + "</tr>" for f in filas)
    return f'<div class="tabla-caja"><table class="tabla {clase}"><thead><tr>{h}</tr></thead><tbody>{b}</tbody></table></div>'

def barras(items, total, d=2):
    mx = max(v for _, v, _ in items)
    return ('<ul class="barras">' + "".join(
        f'<li><span class="b-nombre">{nom}{f"<small>{nota}</small>" if nota else ""}</span><span class="b-pista"><i style="width:{v / mx * 100:.1f}%"></i></span><span class="b-valor">{p(v, d)}</span></li>'
        for nom, v, nota in items) + f'<li class="b-total"><span class="b-nombre">{total[0]}</span><span class="b-pista"></span><span class="b-valor">{p(total[1], d)}</span></li></ul>')

def peso(nombre, precio, partes):
    segs = "".join(f'<i class="s{i}" style="width:{v / precio * 100:.2f}%" title="{t}: {p(v, 2)}"></i>' for i, (t, v) in enumerate(partes))
    ley = "".join(f'<li><i class="s{i}"></i><span>{t}</span><b>{p(v, 2)}</b><em>{v / precio * 100:.0f}%</em></li>' for i, (t, v) in enumerate(partes))
    return f'<figure class="peso"><figcaption>{nombre} · el cliente paga <b>{p(precio)}</b></figcaption><div class="peso-barra" role="img" aria-label="Reparto de los {p(precio)} de la {nombre}">{segs}</div><ul class="peso-ley">{ley}</ul></figure>'

def cifras(xs):
    return '<div class="cifras">' + "".join(f"<div><b>{v}</b><span>{t}</span>{f'<small>{nota}</small>' if nota else ''}</div>" for v, t, nota in xs) + "</div>"

def sec(ident, etq, h2, cuerpo, clase=""):
    return f'''
<section class="seccion {clase}" id="{ident}">
  <div class="caja">
    <p class="etiqueta">{etq}</p>
    <h2>{h2}</h2>
{cuerpo}
  </div>
</section>'''


# ───────── Lo que se lee del libro ─────────
PROD = ["Semanal", "Cartucho", "Temporada", "Personalizada"]
col = lambda hoja, fila: [hoja.cell(fila, c).value for c in (2, 3, 4, 5)]
precio, gana_t, gana_d, neto, costo, gana_n, margen = (col(CAS, f) for f in (5, 9, 11, 12, 13, 14, 15))
iva_n = [precio[i] - gana_t[i] - gana_d[i] - neto[i] for i in range(4)]
mezcla = [SUP[f"F{r}"].value for r in (81, 82, 83, 84)]
m_tienda, m_dist, refresco = SUP["F31"].value, SUP["F32"].value, SUP["F17"].value
gph, horas, gramos, kilo = SUP["F36"].value, SUP["F35"].value, COS["C8"].value, COS["C9"].value
pond, llega = CAS["B28"].value, (1 - m_tienda) * (1 - m_dist) / 1.16
ebitda, neta, ingresos = [RES.cell(9, c).value for c in (2, 3, 4)], [RES.cell(11, c).value for c in (2, 3, 4)], [RES.cell(5, c).value for c in (2, 3, 4)]
mbruto, mebitda, velas = [RES.cell(7, c).value for c in (2, 3, 4)], [RES.cell(10, c).value for c in (2, 3, 4)], [RES.cell(12, c).value for c in (2, 3, 4)]
capital, mes, flujo36, equilibrio, pzas_mes, planta = (RES[f"B{r}"].value for r in (16, 17, 18, 20, 21, 24))
tienda_mes, dist_mes, ebitda_mes, neta_mes = TOD["B14"].value, TOD["B18"].value, TOD["B19"].value, TOD["B20"].value
pzas_tienda, gasto_comp, gasto_nos, ahorro, ltv, abrir, util_tienda, meses_exh = (TOD[f"B{r}"].value for r in (13, 26, 27, 28, 29, 30, 31, 32))
anual = lambda fila: [REZ.cell(fila, c).value for c in (39, 40, 41)]
c_ventas, g_var, g_fijos = anual(31), anual(45), anual(62)
ING = [round(REZ.cell(20, c).value) for c in range(3, 39)]
EBM = [round(REZ.cell(63, c).value) for c in range(3, 39)]
parte_tiendas = sum(REZ.cell(r, 40).value for r in range(8, 12)) / REZ.cell(20, 40).value
contrib, fijos_mes, semanas = SEN["B9"].value, SEN["B10"].value, SUP["F14"].value
oct_nov, arranque = SUP["F181"].value, sum(SUP[f"F{r}"].value for r in range(147, 151))
R, O, firme = E["rentable"], E["optimizado"], E["rentable"]["mes_firme"]
normales = sorted(EBM[12:24])[:9]

# Bloque del costo
c_cera, c_vaso, c_mecha, c_etq, c_caja, c_flete, c_merma, c_maq = (COS[f"C{r}"].value for r in (10, 11, 12, 13, 18, 19, 21, 24))
costo_cart = COS["D28"].value

# Sensibilidad: parafina cara y mecha que quema de más
col_precio = next(c for c in range(2, 9) if SEN.cell(14, c).value == precio[0])
parafina_38 = SEN.cell(21, col_precio).value
gph_35 = SEN.cell(54, 3).value

# Tabla de escala: tiendas × piezas por semana
FT, CP = {100: 38, 200: 39, 300: 40, 500: 41, 700: 42, 1000: 43}, {3: 2, 5: 3, 8: 4, 10: 5, 12: 6, 15: 7}
escala = []
for t, q in [(300, 5), (500, 8), (700, 10), (1000, 12), (1000, 15)]:
    pz = t * q * semanas
    r = SEN.cell(FT[t], CP[q]).value
    escala.append([f"{n(t)} × {q}", n(pz), p(fijos_mes / pz, 2), p(contrib, 2), ("+" if r >= 0 else "") + p(r)])

# Canales directos
directos = []
for fila, nombre in [(38, "Cartucho a parroquias"), (39, "Cartucho a restaurantes y hoteles"), (40, "Recaudación con colegios y parroquias <small>ellos venden y se quedan 30%</small>"),
                     (41, "Regalo corporativo con logo"), (42, "Vela Récord <small>premium, cera de abeja</small>"), (43, "Recarga de la Vela Récord"),
                     (45, "Taller de velas <small>por persona</small>"), (44, "Insumos en línea <small>por pedido</small>")]:
    b, d, e, f = (CAS.cell(fila, c).value for c in (2, 4, 5, 6))
    directos.append([nombre, p(b), p(d, 2), p(e, 2), pct(f)])

# Distribuidores por tamaño
tam = [[DIS.cell(r, c).value for c in (2, 3, 4)] for r in (6, 7, 8, 10, 12)]

# Gastos fijos de un mes normal
FIJ = [(50, "Dirección y comercial", "dos sueldos, con carga social"), (51, "Diseño y contenido", "por proyecto, sin plaza fija"), (52, "Atención por WhatsApp", "pedidos personalizados y garantías"),
       (55, "Contador", ""), (56, "Servicios", ""), (57, "Software", ""), (60, "Viáticos", ""), (59, "Pruebas de calidad", ""), (58, "Seguros y Protección Civil", "")]
fijos = sorted([(t, REZ.cell(r, 15).value, nota) for r, t, nota in FIJ], key=lambda x: -x[1])

# De perder a ganar: las palancas del Excel (Base → Optimizado)
PB = [(25, "Subir precios", "primera corrección: Semanal de $45 a $49, Cartucho de $32 a $34"), (15, "Comprar parafina por tonelada", ""), (16, "Mecha que quema menos", "de 2.6 a 2.3 gramos por hora"),
      (23, "Margen de la tienda", "de 30% a 27%; sigue ganando más que con refresco"), (24, "Margen del distribuidor", "de 20% a 17%, a cambio de exclusividad de zona"),
      (18, "Vaso por millar", "de $5.50 a $4.20"), (21, "Menos merma", ""), (17, "Menos cera sin quemar", ""), (19, "Mecha, etiqueta y caja", ""), (20, "Flete", ""), (26, "Más personalizadas", "")]
palancas_base = [(t, PAL.cell(r, 8).value, nota) for r, t, nota in PB]
base_pieza, opt_pieza = CAS["B67"].value, CAS["C67"].value
planta_cuesta = -PAL["H22"].value

# De ganar a ganar bien: las palancas del escenario Rentable
d2 = lambda clave: E[clave]["ebitda"][1] - O["ebitda"][1]
PR = [
    ("solo_semanal", "La vela con vaso, más cara", f"Semanal de $49 a {p(precio[0])}", "Decisión. El vaso se compra una vez: el cliente paga $6 más una sola vez."),
    ("solo_corporativos", "Más regalos corporativos", "De 5 a 10 pedidos en noviembre y en diciembre", f"Venta. Es lo que más deja por pieza: {p(CAS['E41'].value)}."),
    ("solo_personalizadas", "Más personalizadas", f"De 7% a {pct(mezcla[3])} de las piezas", f"Venta. Cada una deja {gana_n[3] / gana_n[0]:.0f} veces lo que una Semanal."),
    ("solo_temporada", "La edición de temporada, más cara", f"De $65 a {p(precio[2])}", "Decisión. No tiene comparación directa en el anaquel."),
    ("solo_diseno", "Diseño por proyecto", "De $12 mil a $6 mil al mes", "Decisión. Sin plaza fija hasta que el volumen la pida."),
    ("solo_directos", "Más parroquias, restaurantes y hoteles", "El doble de clientes directos", "Venta. Compran cartuchos cada semana, sin intermediario."),
    ("solo_recaudacion", "Más campañas de recaudación", "El doble, con colegios y parroquias", "Venta. Ellos venden y se quedan 30%."),
]
palancas_rent = [[t, cambio, mas(d2(k)), dep] for k, t, cambio, dep in sorted(PR, key=lambda x: -d2(x[0]))]

# ───────── El archivo que se descarga ─────────
DESC = RAIZ / "sitio" / "descargas"
for viejo in DESC.glob("La_Vela_Modelo_de_Negocio_*.xlsx"):
    viejo.unlink()
XL = f"La_Vela_Modelo_de_Negocio_v4_{datetime.now():%Y-%m-%d_%H%M}.xlsx"
shutil.copy(LIBRO, DESC / XL)
BOTON = f'<a class="boton lleno" href="/descargas/{XL}" download>Descargar el Excel</a>'

# ───────── La página, de arriba hacia abajo ─────────
S = [f'''
<section class="negra inicio">
  <div class="caja" style="display:block">
    <div class="dicho">
      <p class="etiqueta">El modelo de negocio</p>
      <h1>El vaso se vende una vez. El cartucho, cada semana.</h1>
      <p class="grande">Aquí está, con números, cómo gana dinero La Vela: cuánto cuesta hacerla, cuánto gana la tienda, cuánto gana el distribuidor, cuánto ganamos nosotros y por qué crece.</p>
      <div class="botones">{BOTON}<a class="boton" href="#idea">Leer la explicación</a></div>
      <p class="aviso">Todos los números salen del Excel, en su escenario «Rentable · volumen Medio»: {n(RES["B13"].value)} tiendas que venden 8 piezas por semana. Son estimados: todavía hay que comprobarlos con cotizaciones, pruebas y un piloto.</p>
    </div>
  </div>
</section>''']

S.append(sec("vistazo", "En una pantalla", "Tres negocios ganan con la misma vela.",
    cifras([(p(tienda_mes), "gana cada tienda al mes", f"Con {n(pzas_tienda)} piezas. Le queda {pct(m_tienda)} del precio."),
            (p(dist_mes), "gana el distribuidor al mes", f"Con {n(pzas_mes)} piezas, en las rutas que ya recorre."),
            (p(ebitda_mes), "nos queda a nosotros al mes", "Promedio del segundo año, antes de impuestos."),
            (f"Mes {mes}", "se recupera lo invertido", f"Lo máximo que hay que poner son {miles(capital)}.")])
    + f'\n    <p class="grande">Y el cliente paga lo mismo que hoy: {p(gasto_nos)} al año con nosotros contra {p(gasto_comp)} con la veladora de siempre. La diferencia es que ya no tira el vaso.</p>'))

S.append(sec("idea", "1 · La idea", "Un cliente que regresa a la misma tienda cada semana.", '''    <ol class="pasos">
      <li><span class="n">1</span><div><h3>Compra la vela con vaso.</h3><p>Una sola vez. El vaso se queda en su casa.</p></div></li>
      <li><span class="n">2</span><div><h3>Cuando se acaba, compra el cartucho.</h3><p>Es más barato que una vela nueva, porque ya no paga el vaso.</p></div></li>
      <li><span class="n">3</span><div><h3>Lo compra en la misma tienda.</h3><p>Ahí regresa el cartucho vacío y le descuentan el depósito.</p></div></li>
      <li><span class="n">4</span><div><h3>Y vuelve la semana siguiente.</h3><p>La tienda vende más, el distribuidor surte más, nosotros producimos más.</p></div></li>
    </ol>
    <p class="grande">En México se venden 697 millones de velas y veladoras al año: un mercado de $5,484 millones de pesos. No hay que convencer a nadie de comprar velas. Hay que darle una razón para comprar la nuestra, y para volver.</p>''', "gris"))

S.append(sec("productos", "2 · Lo que se vende", "Cuatro productos en la tienda.",
    '    <p class="grande">Los cuatro llevan la misma cera y la misma mecha. Lo que cambia es el vaso, la etiqueta y el precio.</p>\n'
    + tabla(["Producto", "Qué es", "Precio al público", "De cada 100 piezas"], [
        ["Semanal", "Vaso + cartucho. La primera compra.", p(precio[0]), n(mezcla[0] * 100)],
        ["Cartucho", "El repuesto, sin vaso. La recompra.", p(precio[1]), n(mezcla[1] * 100)],
        ["Temporada", "San Judas, Guadalupe, Día de Muertos.", p(precio[2]), n(mezcla[2] * 100)],
        ["Personalizada", "Con foto, nombre o intención. Se pide por WhatsApp.", p(precio[3]), n(mezcla[3] * 100)]], "")
    + f'\n    <p>Una veladora semanal de la competencia cuesta $34.90 en tienda. La nuestra cuesta más la primera vez, porque incluye un vaso que se queda, y lo mismo de ahí en adelante: el cartucho vale {p(precio[1])}.</p>'))

S.append(sec("costo", "3 · Lo que cuesta", f"Hacer una vela nos cuesta {p(costo[0], 2)}.",
    '    <p class="grande">Más de la mitad es cera. Por eso la mecha importa tanto: una mecha que quema menos gramos por hora necesita menos cera para durar lo mismo.</p>\n'
    + barras([("Cera", c_cera, f"{n(gramos)} gramos de parafina a {p(kilo, 2)} el kilo"), ("Vaso de vidrio", c_vaso, "comprado por millar"), ("Maquila", c_maq, "una fábrica de veladoras la llena por nosotros"),
              ("Etiqueta", c_etq, ""), ("Mecha y base", c_mecha, ""), ("Caja", c_caja, ""), ("Merma", c_merma, "1.5% que se rompe o sale mal"), ("Flete a la bodega", c_flete, "")], ("Costo de la Semanal", costo[0]))
    + "\n" + cifras([(p(costo_cart, 2), "cuesta el Cartucho", "Lleva la misma cera, pero no lleva vaso ni etiqueta."),
                     (pct(c_cera / costo[0]), "del costo es cera", f"En el cartucho, {pct(c_cera / costo_cart)}."),
                     (f"{gph} g", "de cera por hora", "La meta de la mecha. Hay que comprobarla en las pruebas de encendido.")]), "gris"))

S.append(sec("peso", "4 · Quién gana qué", "A dónde se va cada peso que paga el cliente.",
    f'''    <p class="grande">El precio baja como una cascada: la tienda se queda con su parte, luego el distribuidor, luego el IVA. Lo que llega a nosotros es el {pct(llega)} del precio. De ahí sale el costo, y lo que sobra es nuestra utilidad.</p>
    <div class="pesos">
''' + peso("Semanal", precio[0], [("La tienda", gana_t[0]), ("El distribuidor", gana_d[0]), ("IVA", iva_n[0]), ("Costo de hacerla", costo[0]), ("Nosotros", gana_n[0])])
    + peso("Cartucho", precio[1], [("La tienda", gana_t[1]), ("El distribuidor", gana_d[1]), ("IVA", iva_n[1]), ("Costo de hacerlo", costo[1]), ("Nosotros", gana_n[1])])
    + "\n    </div>\n" + tabla(["Por pieza"] + PROD, [
        ["El cliente paga"] + [p(x) for x in precio], ["La tienda gana"] + [p(x, 2) for x in gana_t], ["El distribuidor gana"] + [p(x, 2) for x in gana_d],
        ["Nos llega, sin IVA"] + [p(x, 2) for x in neto], ["Nos cuesta"] + [p(x, 2) for x in costo], ["Nosotros ganamos"] + [p(x, 2) for x in gana_n], ["Nuestro margen"] + [pct(x) for x in margen]])
    + f'\n    <p>La tienda gana {pct(m_tienda)} del precio. El distribuidor gana {pct(m_dist)} de lo que le vende a la tienda. Con la mezcla normal de productos, nos quedan <b>{p(pond, 2)} por pieza</b> en promedio.</p>'))

S.append(sec("tienda", "5 · Lo que gana la tienda", f"{p(tienda_mes)} al mes, y un cliente que vuelve.",
    f'''    <div class="dos"><div>
      <p class="grande">Por cada vela con vaso la tienda gana {p(gana_t[0], 2)}; por cada cartucho, {p(gana_t[1], 2)}. Le queda {pct(m_tienda)} del precio: más que el {pct(refresco, 1)} que le deja un refresco de marca.</p>
    </div><div>
      <p>Con {n(pzas_tienda)} piezas al mes son <b>{p(tienda_mes)}</b>, sin refrigerador, sin caducidad y sin poner un peso: el exhibidor y los carteles llegan sin costo, y lo que no se venda se cambia.</p>
      <p style="margin-top:16px">Pero lo que más le conviene no está en esa cuenta. El depósito del cartucho se descuenta donde se compró, así que <b>el cliente regresa a esa tienda cada semana</b>, y cada vez que entra se lleva algo más.</p>
      <p style="margin-top:16px">Los cartuchos vacíos no le estorban: se guardan en una caja de 24 y el distribuidor se la lleva en su visita.</p>
    </div></div>''', "gris"))

S.append(sec("distribuidor", "6 · Lo que gana el distribuidor", f"{p(dist_mes)} al mes, en las rutas que ya recorre.",
    f'''    <p class="grande">Gana {p(gana_d[0], 2)} por cada vela con vaso y {p(gana_d[1], 2)} por cada cartucho. No abre rutas nuevas ni compra camiones: mete un producto más en la visita que ya hace.</p>
''' + tabla(["Según su tamaño", "Chico", "Mediano", "Grande"], [
        ["Tiendas que surte"] + [n(x) for x in tam[0]], ["Piezas por tienda por semana"] + [n(x) for x in tam[1]], ["Piezas al mes"] + [n(x) for x in tam[2]],
        ["El distribuidor gana al mes"] + [f"<b>{p(x)}</b>" for x in tam[3]], ["Cada una de sus tiendas gana al mes"] + [p(x) for x in tam[4]]])
    + '''
    <p>Además recibe <b>exclusividad de su zona</b> a cambio de volumen, exhibidores sin costo para sus tiendas, venta garantizada y las temporadas ya armadas. Los cartuchos vacíos regresan en su mismo camión, sin flete extra, y como no llevan vidrio caben más piezas por tarima y se rompe menos.</p>
    <p>Lo que se le pide: visitar cada tienda cada semana, recoger los vacíos y reportar las piezas por tienda.</p>'''))

S.append(sec("nosotros", "7 · Lo que ganamos nosotros", f"{p(ebitda_mes)} al mes en el segundo año.",
    cifras([(p(pond, 2), "nos deja cada pieza, en promedio", f"De {p(gana_n[1], 2)} un cartucho a {p(gana_n[3], 2)} una personalizada."),
            (miles(ebitda[1]), "queda en el año 2, antes de impuestos", f"{pct(mebitda[1])} de lo que se vende."),
            (miles(neta[1]), "de utilidad neta en el año 2", f"{p(neta_mes)} al mes, ya pagados los impuestos."),
            (miles(capital), "es lo máximo que hay que poner", f"Se recupera en el mes {mes} y ya no vuelve a quedar abajo.")])
    + f'''
    <p>Un mes normal deja entre {miles(normales[0])} y {miles(normales[-1])}. Octubre, noviembre y diciembre son otra cosa: {miles(EBM[23])}, {miles(EBM[12])} y {miles(EBM[13])}.</p>
    <p>No hay planta ni renta: al principio las velas las llena una fábrica que ya existe. Y los sueldos de quien dirige y de quien vende ya están descontados antes de esa utilidad.</p>''', "negra"))

S.append(sec("cliente", "8 · Lo que gana el cliente", "Paga lo mismo, y deja de tirar el vaso.",
    f'''    <div class="dos"><div>
      <p class="grande">Quien prende una veladora cada semana gasta {p(gasto_comp)} al año con la de siempre. Con La Vela gasta {p(gasto_nos)}: una Semanal y 51 cartuchos.</p>
    </div><div>
      <p>Ahorra {p(ahorro)}: casi nada. Lo que recibe a cambio es una vela que dura lo que dice, un vaso limpio que se queda en su casa y nada que tirar a la basura.</p>
      <p style="margin-top:16px"><b>El argumento de venta es la duración comprobada, no el precio.</b> Por eso cada lote se pesa y se prueba antes de salir.</p>
    </div></div>'''))

S.append(sec("recompra", "9 · El cartucho", "El cartucho deja menos. Y es lo más importante.",
    f'''    <div class="dos"><div>
      <p class="grande">Por cada cartucho ganamos {p(gana_n[1], 2)}, contra {p(gana_n[0], 2)} de una vela con vaso. No está ahí la ganancia: está en que el cliente no se va.</p>
    </div><div>
      <p>Un cliente que compra una vela a la semana nos deja unos <b>{p(ltv)} de utilidad al año</b>.</p>
      <p style="margin-top:16px">Abrir una tienda nos cuesta <b>{p(abrir)}</b> entre el exhibidor y el material. Esa tienda nos deja <b>{p(util_tienda)} al mes</b>: el exhibidor se paga en {"un mes" if meses_exh < 1.2 else f"{meses_exh:.1f} meses"}.</p>
      <p style="margin-top:16px">El número que dice si el modelo funciona es uno solo: <b>qué porcentaje de las piezas vendidas son cartuchos</b>. Si la gente regresa por el repuesto, todo lo demás se sostiene.</p>
    </div></div>''', "gris"))

S.append(sec("directos", "10 · Sin intermediarios", "Donde más se gana es vendiendo directo.",
    '    <p class="grande">En la tienda se reparte el precio entre tres. Cuando vendemos directo, la parte de la tienda y la del distribuidor se quedan con nosotros.</p>\n'
    + tabla(["Canal", "Precio", "Nos cuesta", "Ganamos", "Margen"], directos)
    + f'\n    <p>En el segundo año, las tiendas traen el {pct(parte_tiendas)} del ingreso y los canales directos el {pct(1 - parte_tiendas)}. Las tiendas dan el volumen; los directos, el margen. Los regalos corporativos de fin de año son los que más pesan: diez pedidos de 120 piezas en noviembre y otros diez en diciembre.</p>'))

S.append(sec("fijos", "11 · Lo que cuesta existir", f"{p(fijos_mes)} al mes, se venda o no se venda.",
    '    <p class="grande">Estos gastos no dependen de cuántas velas se vendan. Son el piso que hay que cubrir cada mes.</p>\n'
    + barras(fijos, ("Gastos fijos al mes", fijos_mes), 0)
    + f'\n    <p>No hay renta ni planta. Arrancar cuesta {p(arranque)} una sola vez: marca, empaque, legal, fotos y prototipos.</p>', "gris"))

S.append(sec("escala", "12 · Por qué escala", "Cada vela extra deja lo mismo. Los gastos fijos no crecen.",
    f'''    <p class="grande">Después de producirla y de pagar garantías y marketing, cada pieza vendida en tienda deja <b>{p(contrib, 2)}</b>. Los gastos fijos son {p(fijos_mes)} al mes, con 100 tiendas o con 1,000. Entre más piezas, menos gasto fijo carga cada una.</p>
''' + tabla(["Tiendas × piezas por semana", "Piezas al mes", "Gasto fijo por pieza", "Lo que deja cada pieza", "Resultado del mes"], escala)
    + f'''
    <p>Esa tabla es solo el canal de tiendas, cargando con todos los gastos fijos. Como los canales directos ya pagan casi todos esos gastos, el punto de equilibrio en tiendas baja a <b>{n(equilibrio)} piezas al mes</b>; el plan del segundo año es vender {n(pzas_mes)}.</p>
    <p><b>Lo que crece con el volumen no es el margen por pieza</b>, que se queda cerca de {pct(mbruto[1])}. Lo que crece es lo que sobra después de los gastos fijos: {pct(mebitda[0])} del ingreso en el primer año y {pct(mebitda[1])} en el segundo.</p>
    <p>El siguiente escalón llega arriba de <b>{n(planta / 1000)} mil piezas al mes</b>: ahí conviene planta propia y llenar cada vela baja de {p(c_maq, 2)} a {p(COS["C25"].value, 2)}. Antes de ese volumen, la planta cuesta {miles(planta_cuesta)} más al año que maquilar.</p>'''))

S.append(sec("proyeccion", "13 · La proyección", "Tres años, mes por mes.",
    f'''    <p class="grande">El primer año ya deja {miles(ebitda[0])}. El segundo, {miles(ebitda[1])}.</p>
    <figure class="grafica"><div id="grafica"></div><figcaption><span><i class="g-ing"></i>Ingresos del mes</span><span><i class="g-eb"></i>Lo que queda después de todos los gastos (EBITDA)</span></figcaption></figure>
''' + tabla(["", "Año 1", "Año 2", "Año 3"], [
        ["Velas producidas"] + [n(x) for x in velas], ["Ingresos"] + [p(x) for x in ingresos], ["Costo de producir"] + [p(x) for x in c_ventas],
        ["Gastos que suben con la venta <small>marketing, envíos, garantía, exhibidores</small>"] + [p(x) for x in g_var], ["Gastos fijos"] + [p(x) for x in g_fijos],
        ["Lo que queda (EBITDA)"] + [p(x) for x in ebitda], ["Como % del ingreso"] + [pct(x) for x in mebitda], ["Utilidad neta, después de impuestos"] + [p(x) for x in neta]])
    + "\n" + cifras([(miles(capital), "es lo máximo que hay que poner", "Para aguantar el arranque, el inventario y los 30 días que tarda en pagar el distribuidor."),
                     (f"Mes {mes}", "se recupera lo invertido", "Y el flujo ya no vuelve a quedar en negativo."), (miles(flujo36), "de flujo acumulado al mes 36", "")])
    + f'\n    <p>Los picos son de octubre a diciembre: Día de Muertos, Guadalupe y Navidad. Solo octubre y noviembre traen cerca del {pct(oct_nov)} de la venta del año, así que hay que producir antes, de junio a septiembre.</p>', "gris"))

fila_esc = lambda t, k, neg=False: [t] + [(f"<b>{miles(x)}</b>" if neg else miles(x)) for x in E[k]["ebitda"]] + [miles(E[k]["capital"]), f"mes {E[k]['mes']}"]
S.append(sec("escenarios", "14 · Si sale mejor o peor", "Tres volúmenes, mismos precios.",
    tabla(["Escenario", "Año 1", "Año 2", "Año 3", "Capital máximo", "Se recupera"], [
        fila_esc("Conservador <small>300 tiendas × 5 piezas</small>", "rentable_conservador"), fila_esc("<b>Medio</b> <small>500 tiendas × 8 piezas</small>", "rentable", True),
        fila_esc("Alto <small>800 tiendas × 12 piezas</small>", "rentable_alto")])
    + '\n    <p>Las cifras son lo que queda cada año después de todos los gastos. El distribuidor con el que empezó todo surte a cerca de 1,000 tiendas: el escenario medio supone llegar a la mitad.</p>'))

S.append(sec("palancas", "15 · De dónde sale la utilidad", "La primera cuenta perdía dinero. La tercera gana bien.",
    f'''    <p class="grande">El modelo se corrigió dos veces, y cada versión está en el Excel como un escenario: lo que platicamos, el optimizado y el rentable.</p>
    <h3 style="margin-top:48px">Paso uno: de perder {p(-base_pieza, 2)} por pieza a ganar {p(opt_pieza, 2)}</h3>
    <p>Con los primeros precios y márgenes que platicamos, cada pieza perdía dinero: faltaba descontar el IVA y la parafina estaba más cara de lo que creíamos. Estas son las correcciones, y lo que vale cada una al año:</p>
''' + barras(palancas_base, ("Total al año, aproximado", sum(v for _, v, _ in palancas_base)), 0)
    + f'''
    <h3 style="margin-top:64px">Paso dos: de {miles(O["ebitda"][1])} a {miles(R["ebitda"][1])} al año</h3>
    <p>Sin tocar el costo ni el número de tiendas. Son siete cambios: tres se deciden y cuatro se venden.</p>
''' + tabla(["Palanca", "Cambio", "Vale al año", "De qué depende"], palancas_rent, "fin palancas")
    + tabla(["", "Antes de estos cambios", "El plan de hoy"], [
        ["Lo que queda en el año 1", miles(O["ebitda"][0]), miles(R["ebitda"][0])], ["Lo que queda en el año 2", miles(O["ebitda"][1]), miles(R["ebitda"][1])],
        ["Lo que queda en el año 3", miles(O["ebitda"][2]), miles(R["ebitda"][2])], ["Utilidad neta del año 2", miles(O["neta"][1]), miles(R["neta"][1])],
        ["Lo máximo que hay que poner", miles(O["capital"]), miles(R["capital"])],
        ["Se recupera lo invertido", f"Mes {O['mes']}; en firme, mes {O['mes_firme']}", f"Mes {R['mes']}"], ["Flujo acumulado al mes 36", miles(O["flujo36"]), miles(R["flujo36"])]])
    + f'''
    <p><b>Si solo se toman las tres decisiones</b> y nada de lo que hay que salir a vender, el año 2 deja {miles(E["decisiones"]["ebitda"][1])} y la inversión se recupera en el mes {E["decisiones"]["mes"]}.</p>
    <p><b>Lo que se dejó fuera a propósito.</b> Subir el cartucho de {p(precio[1])} a $39 valdría otros {miles(E["mas_cartucho"]["ebitda"][1] - R["ebitda"][1])} al año, pero el cliente pagaría unos {p(-E["mas_cartucho"]["ahorro_cliente"])} más al año que con la veladora de la competencia: solo se sostiene si las pruebas demuestran que la nuestra dura más. Bajar el margen de la tienda de {pct(m_tienda)} a 25% valdría {miles(E["mas_tienda"]["ebitda"][1] - R["ebitda"][1])}, pero la tienda es quien decide si la exhibe. Con esas dos y el cartucho retornable, el techo del año 2 es de {miles(E["techo"]["ebitda"][1])}.</p>''', "gris"))

S.append(sec("riesgos", "16 · Lo que falta comprobar", "Seis números sostienen todo lo demás.",
    f'''    <p class="grande">Nada de esto está validado todavía. Antes de enseñarle números a un distribuidor hay que confirmar:</p>
    <ol class="pasos seis">
      <li><span class="n">1</span><div><h3>El precio de la parafina.</h3><p>Tres cotizaciones por tonelada. A $38 el kilo, la Semanal deja {p(parafina_38, 2)} en vez de {p(gana_n[0], 2)}.</p></div></li>
      <li><span class="n">2</span><div><h3>Los gramos por hora.</h3><p>Prueba de encendido de los prototipos. A 3.5 g por hora, la Semanal deja {p(gph_35, 2)}.</p></div></li>
      <li><span class="n">3</span><div><h3>El costo del vaso.</h3><p>Tres cotizaciones de vidrieras, por millar.</p></div></li>
      <li><span class="n">4</span><div><h3>Los márgenes del canal.</h3><p>Preguntarle al distribuidor cuánto gana él y cuánto la tienda hoy.</p></div></li>
      <li><span class="n">5</span><div><h3>El precio de la Semanal.</h3><p>El modelo no sabe si a {p(precio[0])} se vende igual que a $49. Piloto con dos precios: mitad de las tiendas con cada uno.</p></div></li>
      <li><span class="n">6</span><div><h3>Si la gente regresa.</h3><p>Piloto de 50 tiendas por 4 semanas: piezas por tienda y cuántas son cartuchos.</p></div></li>
    </ol>
    <p>El cartucho retornable está en el Excel, en su propia hoja, con un interruptor. Con los estimados de hoy cada llenado cuesta casi nada solo si el depósito que nadie reclama llega hasta nosotros; si se queda en la tienda, cuesta el doble que la funda. Por eso los números de esta página siguen calculados con funda, hasta medir cuántos cartuchos regresan.</p>
    <p>Y la promesa de «7 días» no se dice hasta que las pruebas la confirmen.</p>'''))

S.append(f'''
<section class="seccion negra" id="descargar">
  <div class="caja">
    <p class="etiqueta">El entregable</p>
    <h2>Todo esto vive en un Excel.</h2>
    <p class="grande">{len(wb.sheetnames)} hojas, 36 meses y tres escenarios. Incluye el cartucho retornable, lo que gana un distribuidor según su tamaño, las capas que protegen el negocio y el plan para crecer por países. Cambias cualquier celda con marco —el precio, la parafina, las tiendas— y todo se recalcula.</p>
    <div class="botones">{BOTON}<a class="boton" href="/distribuir">Quiero distribuir</a></div>
  </div>
</section>''')

GUION = '''<script>
/* RLR · gráfica de 36 meses — Ricardo López Reyero */
(function () {
  var _RLR = 'Ricardo López Reyero', _k = 'EYE', _rev = 181218; // RLR
  var ING = %s, EB = %s;
  var W = 720, H = 300, izq = 46, aba = 34, arr = 10, n = ING.length, max = %d, min = -200000;
  var y = function (v) { return arr + (H - arr - aba) * (1 - (v - min) / (max - min)); };
  var paso = (W - izq) / n, s = '';
  [0, 500000, 1000000, 1500000].forEach(function (v) {
    if (v > max) return;
    s += '<line x1="' + izq + '" x2="' + W + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="' + (v ? '#c8c8c8' : '#111') + '" stroke-width="1"/>' +
      '<text x="' + (izq - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + (v ? '$' + v / 1e6 + ' M' : '$0') + '</text>';
  });
  ING.forEach(function (v, i) { s += '<rect x="' + (izq + i * paso + 2) + '" y="' + y(v) + '" width="' + (paso - 4) + '" height="' + (y(0) - y(v)) + '" fill="#c8c8c8"/>'; });
  s += '<polyline fill="none" stroke="#111" stroke-width="2.5" stroke-linejoin="round" points="' + EB.map(function (v, i) { return (izq + i * paso + paso / 2) + ',' + y(v); }).join(' ') + '"/>';
  ['Año 1 · nov 2026', 'Año 2', 'Año 3'].forEach(function (t, a) {
    var x = izq + a * 12 * paso;
    if (a) s += '<line x1="' + x + '" x2="' + x + '" y1="' + arr + '" y2="' + (H - aba + 6) + '" stroke="#111" stroke-dasharray="3 4"/>';
    s += '<text x="' + (x + 6) + '" y="' + (H - 10) + '">' + t + '</text>';
  });
  document.getElementById('grafica').innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Ingresos y EBITDA de los 36 meses, con picos cada fin de año.">' + s + '</svg>';
  void _RLR; void _k; void _rev;
})();
</script>''' % (ING, EBM, (max(ING) // 200000 + 1) * 200000)

pagina = f'''<!doctype html>
<!-- RLR · La Vela, como Dios manda — {_RLR} · Torreón, Coahuila · octubre 2026 -->
<!-- Esta página la escribe herramientas/construir_pagina_modelo.py a partir del Excel: no se edita a mano. -->
<html lang="es-MX" data-k="eye" data-rev="181218">
<head></head>
<body>
<script>if (/[?&]dentro=1/.test(location.search)) document.documentElement.classList.add("dentro"); // RLR · dentro del tablero</script>

<header class="barra"></header>

<main class="modelo">
<!-- RLR · el modelo de negocio, de arriba hacia abajo; números del Excel (Rentable · Medio) -->{"".join(S)}
</main>

<footer class="pie"></footer>
{GUION}
<!-- RLR · {_RLR} -->
<!-- RLR · Login de CapitalTorreon: todo funciona sin entrar; entrar solo agrega -->
<div data-login-ct style="position:fixed;top:12px;right:12px;z-index:9999"></div>
<script src="https://login.capitaltorreon.com/login.js" data-prefs="vela.ui" defer></script>
</body>
</html>
'''
(RAIZ / "sitio" / "modelo.html").write_text(pagina, encoding="utf-8")
print("modelo.html escrito;", len(S), "secciones; descarga:", XL)


# ═════════ El README y el documento 07 salen de los mismos números ═════════
SITIO = "https://vela.capitaltorreon.com"
t_md = lambda cab, filas: "| " + " | ".join(cab) + " |\n|" + "---|" * len(cab) + "\n" + "\n".join("| " + " | ".join(str(c) for c in f) + " |" for f in filas)
limpio = lambda t: t.replace("<small>", " (").replace("</small>", ")").replace("<b>", "**").replace("</b>", "**")

README = f"""# La Vela · como Dios manda

**Ver en vivo:** {SITIO} · **El modelo de negocio, con números:** {SITIO}/modelo

Una veladora mexicana hecha con ingeniería. El vaso se compra una vez y se queda en casa; lo que se compra cada semana es un cartucho de aluminio con la cera y la mecha, que regresa vacío a la misma tienda y se vuelve a llenar.

Empezó con una pregunta en la bodega de un distribuidor que surte a cerca de mil tiendas: ¿cuál es el producto que más se vende? La respuesta fue **«las velas»**.

---

## La idea en cuatro pasos

1. **El cliente compra la vela con vaso.** Una sola vez. El vaso se queda en su casa.
2. **Cuando se acaba, compra solo el cartucho.** Cuesta menos, porque ya no paga el vaso.
3. **Lo compra en la misma tienda.** Ahí entrega el cartucho vacío y le descuentan el depósito.
4. **Y vuelve la semana siguiente.** La tienda vende más, el distribuidor surte más, nosotros producimos más.

En México se venden 697 millones de velas y veladoras al año: un mercado de $5,484 millones de pesos. No hay que convencer a nadie de comprar velas. Hay que darle una razón para comprar esta, y para volver.

---

## Todos ganan

De los {p(precio[0])} que paga el cliente por una vela con vaso, así se reparte cada peso:

{t_md(["", "Vela con vaso", "Cartucho"], [
    ["El cliente paga", p(precio[0]), p(precio[1])], ["La tienda gana", p(gana_t[0], 2), p(gana_t[1], 2)], ["El distribuidor gana", p(gana_d[0], 2), p(gana_d[1], 2)],
    ["IVA", p(iva_n[0], 2), p(iva_n[1], 2)], ["Cuesta hacerla", p(costo[0], 2), p(costo[1], 2)], ["**Nosotros ganamos**", f"**{p(gana_n[0], 2)}**", f"**{p(gana_n[1], 2)}**"]])}

### La tienda · {p(tienda_mes)} al mes y un cliente que vuelve

- Se queda con **{pct(m_tienda)} del precio**: más que el {pct(refresco, 1)} que le deja un refresco de marca.
- Con {n(pzas_tienda)} piezas al mes gana **{p(tienda_mes)}**, sin refrigerador, sin caducidad y sin poner un peso: el exhibidor llega sin costo y lo que no se venda se cambia.
- Lo que más le conviene no está en esa cuenta: el depósito del cartucho se descuenta donde se compró, así que **el cliente regresa a esa tienda cada semana**.

### El distribuidor · {p(dist_mes)} al mes en las rutas que ya recorre

- Gana **{p(gana_d[0], 2)} por cada vela con vaso y {p(gana_d[1], 2)} por cada cartucho**, sin abrir rutas ni comprar camiones.
- Recibe exclusividad de su zona a cambio de volumen, exhibidores para sus tiendas, venta garantizada y las temporadas ya armadas.
- Los cartuchos vacíos regresan en su mismo camión, sin flete extra.

{t_md(["Según su tamaño", "Chico", "Mediano", "Grande"], [
    ["Tiendas que surte"] + [n(x) for x in tam[0]], ["Piezas por tienda por semana"] + [n(x) for x in tam[1]],
    ["**El distribuidor gana al mes**"] + [f"**{p(x)}**" for x in tam[3]], ["Cada una de sus tiendas gana al mes"] + [p(x) for x in tam[4]]])}

### Nosotros, los dueños · {p(ebitda_mes)} al mes en el segundo año

- Cada pieza nos deja **{p(pond, 2)} en promedio**: de {p(gana_n[1], 2)} un cartucho a {p(gana_n[3], 2)} una vela personalizada.
- En el año 2 quedan **{miles(ebitda[1])} antes de impuestos** y {miles(neta[1])} de utilidad neta.
- Lo máximo que hay que poner son **{miles(capital)}**, y se recupera en el **mes {mes}**.
- No hay planta ni renta: al principio las velas las llena una fábrica que ya existe.
- Donde más se gana es vendiendo directo: un regalo corporativo deja {p(CAS["E41"].value)} por pieza; un cartucho a una parroquia, {p(CAS["E38"].value, 2)}.

### Y el cliente · paga lo mismo y deja de tirar el vaso

Quien prende una veladora cada semana gasta {p(gasto_comp)} al año con la de siempre y {p(gasto_nos)} con La Vela. Casi lo mismo. Lo que recibe a cambio es una vela que dura lo que dice, un vaso limpio que se queda en su casa y nada que tirar.

---

## El plan en números

Escenario «Rentable · volumen Medio»: {n(RES["B13"].value)} tiendas que venden 8 piezas por semana.

{t_md(["", "Año 1", "Año 2", "Año 3"], [
    ["Velas producidas"] + [n(x) for x in velas], ["Ingresos"] + [miles(x) for x in ingresos],
    ["Lo que queda antes de impuestos"] + [miles(x) for x in ebitda], ["Utilidad neta"] + [miles(x) for x in neta]])}

{t_md(["Si el volumen sale…", "Año 2", "Capital máximo", "Se recupera"], [
    ["Conservador (300 tiendas × 5 piezas)", miles(E["rentable_conservador"]["ebitda"][1]), miles(E["rentable_conservador"]["capital"]), f"mes {E['rentable_conservador']['mes']}"],
    ["**Medio (500 × 8)**", f"**{miles(R['ebitda'][1])}**", f"**{miles(R['capital'])}**", f"**mes {R['mes']}**"],
    ["Alto (800 × 12)", miles(E["rentable_alto"]["ebitda"][1]), miles(E["rentable_alto"]["capital"]), f"mes {E['rentable_alto']['mes']}"]])}

El negocio es de temporada: un mes normal deja entre {miles(normales[0])} y {miles(normales[-1])}; noviembre y diciembre, cerca de {miles((EBM[12] + EBM[13]) / 2)} cada uno.

## Lo que falta comprobar

Nada de esto está validado todavía. Son estimados que hay que confirmar en este orden:

1. **El precio de la parafina**, con tres cotizaciones por tonelada.
2. **Los gramos de cera por hora**, con las pruebas de encendido. De ahí sale la duración; no se promete «7 días» antes.
3. **El costo del vaso**, por millar.
4. **Los márgenes reales del canal**, preguntándole al distribuidor.
5. **El precio de la vela con vaso**: el modelo no sabe si a {p(precio[0])} se vende igual que a $49. Se prueba en el piloto con dos precios.
6. **Si la gente regresa por el cartucho**: piloto de 50 tiendas durante 4 semanas.

---

## Qué hay aquí

| | |
|---|---|
| [`docs/`](docs/) | Los 15 documentos del proyecto: [origen](docs/01-origen-y-vision.md) · [ingeniería de la vela](docs/02-ingenieria-de-la-vela.md) · [pruebas de encendido](docs/03-pruebas-de-encendido.md) · [proveedores](docs/04-proveedores-arranque.md) · [checklist](docs/05-checklist-proyecto.md) · [salida al mercado](docs/06-go-to-market.md) · [modelo de negocio](docs/07-modelo-de-negocio.md) · [cartucho retornable](docs/08-cartucho-retornable.md) · [manifiesto](docs/09-manifiesto.md) · [sitio](docs/10-sitio-web.md) · [tablero](docs/11-tablero-operacion.md) · [riesgos](docs/12-riesgos-y-supuestos.md) · [fuentes](docs/13-fuentes.md) · [guía de estilos](docs/14-guia-de-estilos.md) · [equipo y mercado](docs/15-equipo-y-mercado.md) |
| [`modelo/`](modelo/) | El Excel del modelo ({len(wb.sheetnames)} hojas, 36 meses, tres escenarios) y `escenarios.json` |
| [`sitio/`](sitio/) | El sitio público, la liga de pedidos de los distribuidores y el tablero de operación |
| [`src/`](src/) | El Worker de Cloudflare: solicitudes, acceso (Login de CapitalTorreon o enlace al correo), tablero y pedidos |
| [`herramientas/`](herramientas/) | Los programas que generan todo lo que se repite |
| [`contenido/blog/`](contenido/blog/) | Los artículos del blog |

### Las páginas

| Página | Qué es |
|---|---|
| [`/`]({SITIO}/) | La vela en 3D y cómo funciona |
| [`/modelo`]({SITIO}/modelo) | El modelo de negocio explicado con los números del Excel, y la descarga del Excel |
| [`/manifiesto`]({SITIO}/manifiesto) | La vela, como Dios manda |
| [`/distribuir`]({SITIO}/distribuir) | La solicitud para distribuidores y las tres hojas para imprimir |
| [`/blog/`]({SITIO}/blog/) | Cinco artículos sobre la veladora |
| `/distribuidor/` | El panel del distribuidor: entra con su cuenta de Google (Login de CapitalTorreon), pide en un clic, ve cómo va cada pedido, paga con tarjeta (Stripe) o por transferencia, pide anticipado para las temporadas, ve lo que gana y pide material de promoción |
| `/tablero/` | La empresa completa: Hoy y Datos (sala de datos); Distribuidores, Pedidos, Ventas y Mercado; Producción, Compras, Rutas, Cartuchos e Indicadores; Pagos y Contabilidad; Equipo, Proyecto, Receta y Modelo. Pide sesión |
| `/pedir?d=…` | La liga privada con la que cada distribuidor hace sus pedidos |

### Cómo se actualiza

Ningún número se escribe a mano. Si cambia un supuesto, se cambia en el Excel y se corre esto:

```bash
python3 herramientas/construir_modelo.py          # arma el Excel y lo recalcula con LibreOffice
python3 herramientas/escenarios.py                # corre cada escenario → modelo/escenarios.json
python3 herramientas/construir_pagina_modelo.py   # escribe la página Modelo, este README y docs/07
python3 herramientas/construir_descargas.py       # las tres hojas PDF tamaño carta y las imágenes de liga
python3 herramientas/construir_sitio.py           # cabeceras, barra, pie, blog y mapa del sitio
npx wrangler deploy                               # publica
```

El tablero usa D1: `esquema.sql`, luego `migraciones/0002_tablero.sql` y `migraciones/0003_empresa.sql`; los datos de arranque (tareas, recetas, catálogo, proveedores, puestos, mercados, centros y vehículos) salen de `herramientas/semilla.py`, que también escribe `docs/15`. Se entra con la cuenta de Google por el Login de CapitalTorreon, o con un enlace que llega al correo; solo entra quien esté en la tabla `usuarios`. En la compu, `npx wrangler dev` con un archivo `.dev.vars` que diga `LOCAL=1` enseña el enlace en pantalla. Los pedidos se empacan por reja de 24 (dos cajas) y tarima de 32 rejas; las rutas se arman con todos los pedidos listos y se miden contra el vehículo. La lumbre es lo único con color en todo el sitio (ver la [guía de estilos](docs/14-guia-de-estilos.md)).

---

**Ver en vivo:** {SITIO} · **El modelo de negocio, con números:** {SITIO}/modelo

Ing. Ricardo López Reyero · Torreón, Coahuila · Octubre de 2026

<sub>Este archivo lo escribe `herramientas/construir_pagina_modelo.py` a partir del Excel.</sub>
"""
(RAIZ / "README.md").write_text(README, encoding="utf-8")

# docs/07: el mismo modelo, en formato de documento
basecol = lambda fila: (CAS.cell(fila, 2).value, CAS.cell(fila, 3).value)
D07 = f"""# 07 · Modelo de negocio

El modelo completo está en [`modelo/La_Vela_Modelo_de_Negocio_v4.xlsx`](../modelo/La_Vela_Modelo_de_Negocio_v4.xlsx): {len(wb.sheetnames)} hojas, 36 meses y tres escenarios de precios y costos (`Supuestos!D5`: 1 = Base, 2 = Optimizado, 3 = Rentable) por tres de volumen (`D6`: Conservador, Medio, Alto). **El plan vigente es Rentable · Medio.** La explicación larga está en {SITIO}/modelo.

<sub>Este documento lo escribe `herramientas/construir_pagina_modelo.py` a partir del Excel: no se edita a mano.</sub>

## El modelo en una frase

El cliente compra el vaso una vez y después compra el cartucho en la misma tienda. Para miscelánea **no va la Vela Récord** (costaría $600–900 al público); va una veladora de parafina con la ingeniería aplicada, a precio de tienda.

## Productos y precios al público (con IVA)

{t_md(["Producto", "Base", "Optimizado", "**Rentable**", "Qué es"], [
    [nom, p(SUP[f"D{r}"].value), p(SUP[f"E{r}"].value), f"**{p(SUP[f'F{r}'].value)}**", que] for nom, r, que in [
        ("Semanal", 19, "Vaso + cartucho"), ("Cartucho (repuesto)", 20, "Sin vaso; competencia semanal $34.90"), ("Temporada", 21, "San Judas, Guadalupe, Muertos"),
        ("Personalizada", 22, "Foto, nombre o intención, por WhatsApp"), ("Corporativa con logo", 23, "Venta directa"), ("Cartucho a parroquias", 24, "Directo"),
        ("Cartucho a restaurantes y hoteles", 25, "Contrato"), ("Vela Récord", 26, "Premium"), ("Recarga Vela Récord", 27, "Premium"), ("Taller por persona", 29, "")]])}

## La regla de la cascada

La tienda gana su margen sobre el precio con IVA; el distribuidor gana el suyo sobre lo que le vende a la tienda; a nosotros nos llega:

> **Precio al público × (1 − margen tienda) × (1 − margen distribuidor) ÷ 1.16**
> Base: {pct(CAS["B62"].value, 1)} del precio · Optimizado y Rentable: {pct(llega, 1)} del precio

La primera propuesta (tienda 30%, distribuidor 20%, Semanal $45) **perdía dinero**: no descontaba el IVA y usaba parafina a ~$26/kg, cuando puesta en planta cuesta $29–34/kg.

## Costo de la Semanal (sin IVA)

{t_md(["Concepto", "Base", "Optimizado y Rentable"], [
    ["Parafina puesta en planta, por kilo", p(basecol(49)[0], 2), p(basecol(49)[1], 2)], ["Gramos de cera por pieza", n(basecol(50)[0]), n(basecol(50)[1])],
    ["Cera", p(basecol(51)[0], 2), p(basecol(51)[1], 2)], ["Transformación (maquila)", p(basecol(57)[0], 2), p(basecol(57)[1], 2)],
    ["**Costo de la Semanal**", f"**{p(basecol(58)[0], 2)}**", f"**{p(basecol(58)[1], 2)}**"], ["Costo del Cartucho", p(basecol(59)[0], 2), p(basecol(59)[1], 2)],
    ["Costo de la Temporada", p(basecol(60)[0], 2), p(basecol(60)[1], 2)], ["Costo de la Personalizada", p(basecol(61)[0], 2), p(basecol(61)[1], 2)]])}

Con planta propia la transformación baja a {p(COS["C25"].value, 2)} por pieza, pero la planta trae costo fijo: **solo conviene arriba de ~{n(planta / 1000)} mil piezas al mes**. Antes, maquila.

## Quién gana qué por pieza (Rentable, con maquila)

{t_md([""] + [f"{PROD[i]} {p(precio[i])}" for i in range(4)], [
    ["La tienda gana"] + [p(x, 2) for x in gana_t], ["El distribuidor gana"] + [p(x, 2) for x in gana_d], ["Nosotros ganamos"] + [p(x, 2) for x in gana_n], ["Nuestro margen"] + [pct(x) for x in margen]])}

- **Utilidad ponderada por pieza:** Base {p(base_pieza, 2)} → Optimizado {p(opt_pieza, 2)} → Rentable **{p(pond, 2)}**.
- **El cartucho deja menos que la Semanal.** Su valor es retener al cliente en la tienda, no el margen.
- La tienda gana {pct(m_tienda)}, más que con refrescos de marca ({pct(refresco, 1)}).

## Lo que gana cada quien al mes (promedio del año 2)

{t_md(["", "Al mes"], [["Cada tienda", p(tienda_mes)], ["El distribuidor", p(dist_mes)], ["Nosotros, antes de impuestos", p(ebitda_mes)], ["Nosotros, utilidad neta", p(neta_mes)]])}

## Canales directos

{t_md(["Canal", "Precio", "Nos cuesta", "Utilidad por unidad", "Margen"], [[limpio(c) for c in f] for f in directos])}

## Escenarios (36 meses)

{t_md(["Escenario", "EBITDA año 1", "Año 2", "Año 3", "Capital máximo", "Se recupera"], [
    ["Optimizado · Medio (el plan anterior)"] + [miles(x) for x in O["ebitda"]] + [miles(O["capital"]), f"mes {O['mes']}; en firme, mes {O['mes_firme']}"],
    ["Rentable · Conservador"] + [miles(x) for x in E["rentable_conservador"]["ebitda"]] + [miles(E["rentable_conservador"]["capital"]), f"mes {E['rentable_conservador']['mes']}"],
    ["**Rentable · Medio**"] + [f"**{miles(x)}**" for x in R["ebitda"]] + [f"**{miles(R['capital'])}**", f"**mes {R['mes']}**"],
    ["Rentable · Alto"] + [miles(x) for x in E["rentable_alto"]["ebitda"]] + [miles(E["rentable_alto"]["capital"]), f"mes {E['rentable_alto']['mes']}"]])}

**El peso del negocio son los gastos fijos ({p(fijos_mes)} al mes):** dirección y comercial, diseño por proyecto, atención por WhatsApp, contador, servicios, software, seguros, pruebas y viáticos.

## De Optimizado a Rentable

Siete cambios que no tocan el costo ni el número de tiendas. Lo que vale cada uno en el año 2, si fuera el único:

{t_md(["Palanca", "Cambio", "Vale al año", "De qué depende"], palancas_rent)}

- Solo las tres decisiones (los dos precios y el diseño por proyecto): año 2 de {miles(E["decisiones"]["ebitda"][1])}, recuperación en el mes {E["decisiones"]["mes"]}.
- Quedaron fuera: cartucho a $39 ({mas(E["mas_cartucho"]["ebitda"][1] - R["ebitda"][1])}, pero el cliente pagaría ~{p(-E["mas_cartucho"]["ahorro_cliente"])} más al año que con la competencia), margen de tienda a 25% ({mas(E["mas_tienda"]["ebitda"][1] - R["ebitda"][1])}) y cartucho retornable ({mas(E["mas_retornable"]["ebitda"][1] - R["ebitda"][1])}). Con las tres, el techo del año 2 es {miles(E["techo"]["ebitda"][1])}.
- **Límite del modelo:** las piezas por tienda no cambian con el precio. El piloto debe correr con dos precios de Semanal ($49 y {p(precio[0])}).

## De Base a Optimizado

Impacto anual estimado de cada corrección, con las piezas del año 2:

{t_md(["Palanca", "Impacto"], [[t + (f" ({nota})" if nota else ""), miles(v)] for t, v, nota in palancas_base] + [["Planta propia hoy, en vez de maquila", f"**{miles(-planta_cuesta)}** (no conviene aún)"]])}

## Para el cliente

- Cliente devoto (una veladora por semana): competencia {p(gasto_comp)} al año contra {p(gasto_nos)} con nosotros (1 Semanal + 51 cartuchos). **El argumento es la duración comprobada, no el precio.**
- Valor de vida de ese cliente para nosotros: ~{p(ltv)} de utilidad al año.
- El exhibidor y el material de una tienda ({p(abrir)}) se pagan en {meses_exh:.1f} meses.

## Cartucho retornable

Está en la hoja `Cartucho` y en `Supuestos`, sección 17, con su propio selector (`D184`: 1 = funda, 2 = cartucho). Viene en 1 porque los datos del cartucho son estimados y falta saber quién se queda con el depósito no reclamado.

## Hojas del Excel

{" · ".join(wb.sheetnames)}.
"""
(RAIZ / "docs" / "07-modelo-de-negocio.md").write_text(D07, encoding="utf-8")
print("README.md y docs/07 escritos")

