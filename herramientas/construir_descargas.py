# RLR · La Vela — hojas descargables (PDF tamaño carta) e imágenes de liga — Ricardo López Reyero
# Dibuja cada hoja en HTML y la imprime con Chrome sin ventana. Una hoja = una página carta, siempre.
# Uso: python3 herramientas/construir_descargas.py
import subprocess
import sys
from pathlib import Path

from PIL import Image

from vela_svg import qr, vela

_RLR = "Ricardo López Reyero"; _k = "EYE"; _rev = 181218  # RLR

RAIZ = Path(__file__).resolve().parent.parent
SITIO = RAIZ / "sitio"
TMP = RAIZ / ".tmp_descargas"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
VERSION = "v1_2026-10-03"
CASA = "https://vela.capitaltorreon.com"

BASE = """
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#fff;color:#111;font-family:Helvetica,Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
h1,h2,h3,.patines{font-family:'Iowan Old Style',Palatino,Georgia,serif;font-weight:400;letter-spacing:-.01em}
.etiqueta{font-size:8.5pt;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:#6b6b6b}
b{font-weight:700}
"""

HOJA = BASE + """
@page{size:8.5in 11in;margin:0}
.hoja{width:8.5in;height:11in;padding:.5in .55in .42in;display:flex;flex-direction:column;position:relative}
.cabeza{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1.5pt solid #111;padding-bottom:7pt}
.marca{font-family:'Iowan Old Style',Palatino,Georgia,serif;font-size:15pt}
h1{font-size:29pt;line-height:1.04;margin-top:12pt}
.bajada{font-size:12pt;line-height:1.33;margin-top:6pt;color:#333;max-width:6.6in}
h2{font-size:14.5pt;line-height:1.1;margin-bottom:5pt}
p,li{font-size:9.2pt;line-height:1.34}
.seccion{margin-top:11.5pt}
.cols{display:grid;gap:14pt}
.c2{grid-template-columns:1fr 1fr}.c3{grid-template-columns:repeat(3,1fr)}.c4{grid-template-columns:repeat(4,1fr)}
.paso{border-top:1pt solid #111;padding-top:6pt}
.paso .n{font-family:'Iowan Old Style',Palatino,Georgia,serif;font-size:23pt;line-height:1;display:block;margin-bottom:3pt}
.paso h3{font-size:11.5pt;line-height:1.15;margin-bottom:2pt}
.caja{border:1.5pt solid #111;padding:10pt 12pt}
.negra{background:#111;color:#fff;padding:10pt 12pt}.negra .etiqueta{color:#c8c8c8}
.gris{background:#f3f3f3;padding:10pt 12pt}
ul{list-style:none}
ul li{padding-left:11pt;position:relative;margin-top:3pt}
ul li::before{content:'';position:absolute;left:0;top:.5em;width:5pt;height:1.5pt;background:#111}
.pie{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;gap:14pt;border-top:1.5pt solid #111;padding-top:9pt}
.pie p{font-size:8.4pt;color:#444}
.pie svg{display:block}
.qr{display:flex;gap:9pt;align-items:center}
.qr p{max-width:1.7in}
.linea{border-bottom:1pt solid #111;display:inline-block;min-width:1.6in;height:11pt}
table{width:100%;border-collapse:collapse;font-size:8.6pt}
th,td{border:1pt solid #111;padding:3pt 5pt;text-align:left;height:15pt}
th{background:#111;color:#fff;font-weight:700;font-size:7.6pt;letter-spacing:.06em;text-transform:uppercase}
"""

FLECHA = '<svg viewBox="0 0 40 16" width="34" height="14"><path d="M0 8h34M27 2l8 6-8 6" fill="none" stroke="#111" stroke-width="1.8"/></svg>'


def cabeza(para):
    return f'<div class="cabeza"><span class="marca">La Vela</span><span class="etiqueta">{para}</span></div>'


def pie(texto, liga, llamada):
    return f'''<div class="pie"><p>{texto}<br>La Vela · Torreón, Coahuila, México · {CASA.replace("https://", "")}</p>
<div class="qr"><p><b>{llamada}</b></p>{qr(liga, 62)}</div></div>'''


# ───────── Hoja 1 · para el cliente: se pega en la puerta o junto a la caja ─────────
def hoja_cliente():
    sans = 'font-size="12" font-family="Helvetica,Arial,sans-serif" fill="#444"'
    ciclo = f'''<svg viewBox="0 0 760 300" width="100%" style="display:block">
<defs><marker id="p" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#111"/></marker></defs>
<path d="M292 52 C332 24 428 24 468 52" fill="none" stroke="#111" stroke-width="2" marker-end="url(#p)"/>
<path d="M494 112 C514 152 508 200 484 234" fill="none" stroke="#111" stroke-width="2" marker-end="url(#p)"/>
<path d="M452 274 C422 290 338 290 308 274" fill="none" stroke="#111" stroke-width="2" marker-end="url(#p)"/>
<path d="M276 234 C252 200 246 152 266 112" fill="none" stroke="#111" stroke-width="2" marker-end="url(#p)"/>
<g font-family="Georgia,serif" fill="#111">
<text x="0" y="92" font-size="46">1</text><text x="38" y="74" font-size="20">Enciéndela</text>
<text x="38" y="94" {sans}>La cera arde dentro del cartucho.</text><text x="38" y="109" {sans}>El vaso no se mancha.</text>
<text x="536" y="92" font-size="46">2</text><text x="574" y="74" font-size="20">Trae el vacío</text>
<text x="574" y="94" {sans}>Cuando se acabe, regresa el</text><text x="574" y="109" {sans}>cartucho a esta tienda.</text>
<text x="536" y="246" font-size="46">3</text><text x="574" y="228" font-size="20">Llévate uno lleno</text>
<text x="574" y="248" {sans}>Te descuentan el depósito</text><text x="574" y="263" {sans}>del que entregaste.</text>
<text x="0" y="246" font-size="46">4</text><text x="38" y="228" font-size="20">Se vuelve a llenar</text>
<text x="38" y="248" {sans}>Tu cartucho vacío regresa a</text><text x="38" y="263" {sans}>la planta. Nada se tira.</text>
</g>
<g transform="translate(326 30) scale(.54)">{vela(200, ident="c").split(">", 1)[1].rsplit("</svg>", 1)[0]}</g>
</svg>'''
    return f'''<div class="hoja">{cabeza("Cómo funciona · para ti")}
<h1>La vela, como Dios manda.</h1>
<p class="bajada">Se enciende, se rellena y el vaso se queda en tu casa. Compras el vaso una sola vez; después, solo el cartucho.</p>
<div class="seccion" style="margin-top:10pt">{ciclo}</div>
<div class="seccion cols c3">
  <div class="paso"><h3>Más luz por tu dinero</h3><p>La mecha está diseñada para aprovechar cada gramo de cera. Cada lote se pesa y se prueba antes de salir.</p></div>
  <div class="paso"><h3>Un vaso que no se tira</h3><p>Sin el cartucho queda limpio: úsalo para el agua, de florero o para lo que quieras.</p></div>
  <div class="paso"><h3>Nada a la basura</h3><p>El cartucho de aluminio se rellena muchas veces. Al final, vidrio y aluminio se reciclan.</p></div>
</div>
<div class="seccion cols c2">
  <div class="gris"><p class="etiqueta">Para que te dure</p><ul>
    <li>La primera vez, déjala encendida hasta que la cera se derrita de orilla a orilla.</li>
    <li>Antes de prenderla, recorta la mecha a medio centímetro.</li>
    <li>Tenla lejos de corrientes de aire: el aire la hace gastar de más.</li></ul></div>
  <div class="caja"><p class="etiqueta">Con cuidado</p><ul>
    <li>No la dejes encendida sin que alguien esté cerca.</li>
    <li>Lejos de cortinas, papel y del alcance de los niños.</li>
    <li>Sobre una superficie firme y plana. No la muevas encendida.</li></ul></div>
</div>
<div class="seccion negra" style="display:flex;justify-content:space-between;align-items:center;gap:14pt">
  <p class="patines" style="font-size:19pt;line-height:1.1">Pregunta aquí por tu cartucho.</p>
  <p style="max-width:3.3in;color:#e6e6e6">Cada cartucho lleva la marca y el lote grabados en el aluminio. Si no los trae, no es La Vela.</p>
</div>
{pie("Vaso de vidrio y cartucho de aluminio 100% reciclables.", CASA, "Conoce cómo se hace")}
</div>'''


# ───────── Hoja 2 · para la miscelánea: se queda detrás del mostrador ─────────
def hoja_tienda():
    filas = "".join("<tr><td></td><td></td><td></td><td></td><td></td></tr>" for _ in range(3))
    return f'''<div class="hoja">{cabeza("Guía del mostrador · para la tienda")}
<h1>Una vela que hace regresar a tu cliente.</h1>
<p class="bajada">El vaso se vende una vez. El cartucho se vende cada semana, y solo se cambia donde se compró: en tu tienda.</p>
<div class="seccion negra"><p class="etiqueta">Dilo en diez segundos</p>
<p class="patines" style="font-size:14.5pt;line-height:1.25;margin-top:4pt">«Es una veladora que se rellena. Te llevas el vaso una vez y luego nada más compras el cartucho. Me traes el vacío y te descuento el depósito.»</p></div>
<div class="seccion"><h2>Lo que pasa en tu mostrador</h2>
<div class="cols c4">
  <div class="paso"><span class="n">1</span><h3>Vendes la vela</h3><p>Con vaso y su primer cartucho. Cobras la vela y el depósito del cartucho.</p></div>
  <div class="paso"><span class="n">2</span><h3>Regresa con el vacío</h3><p>Revisa que traiga la marca grabada y que no venga aplastado.</p></div>
  <div class="paso"><span class="n">3</span><h3>Le das uno lleno</h3><p>Le cobras el cartucho y le descuentas el depósito del que entregó.</p></div>
  <div class="paso"><span class="n">4</span><h3>Guardas el vacío</h3><p>En la caja de 24. Tu distribuidor se la lleva en su visita de siempre.</p></div>
</div></div>
<div class="seccion cols c2">
  <div><h2>Lo que ganas</h2><ul>
    <li><b>Recompra.</b> El cliente vuelve a tu tienda por su cartucho, y de paso compra lo demás.</li>
    <li><b>Buen margen.</b> Tu distribuidor te da los precios y lo que te queda por pieza.</li>
    <li><b>Exhibidor y carteles sin costo</b> con tu primer pedido.</li>
    <li><b>Venta garantizada.</b> Lo que no se mueva, se cambia.</li>
    <li><b>Temporadas listas:</b> San Judas, Día de Muertos, Guadalupe, 10 de mayo.</li></ul></div>
  <div><h2>Reglas del cartucho</h2><ul>
    <li>Un depósito por cada cartucho que sale; se descuenta por cada vacío que regresa.</li>
    <li>Recibe solo cartuchos con la marca y el lote grabados.</li>
    <li>Si el cliente no trae el vacío, paga el depósito otra vez.</li>
    <li>Entrega la caja de vacíos a tu distribuidor y anota cuántos van.</li>
    <li>El vaso no se regresa: es del cliente.</li></ul></div>
</div>
<div class="seccion cols c2">
  <div class="gris"><p class="etiqueta">Dónde ponerla</p><ul>
    <li>El exhibidor, en el mostrador, junto a la caja y a la vista.</li>
    <li>La hoja del cliente, pegada en la puerta o junto al exhibidor.</li>
    <li>La caja de vacíos, abajo del mostrador, cerrada.</li></ul></div>
  <div class="gris"><p class="etiqueta">Si te preguntan</p><ul>
    <li><b>¿Cuánto dura?</b> Lo que dice la etiqueta. Cada lote se prueba antes de salir.</li>
    <li><b>¿El vaso sirve para otra cosa?</b> Sí: queda limpio, es un vaso.</li>
    <li><b>¿Y si salió mala?</b> Se cambia. Avísale a tu distribuidor.</li></ul></div>
</div>
<div class="seccion"><table><tr><th style="width:22%">Semana del</th><th>Velas vendidas</th><th>Cartuchos vendidos</th><th>Vacíos recibidos</th><th>Vacíos entregados</th></tr>{filas}</table></div>
{pie('Tu distribuidor: <span class="linea"></span> &nbsp; Teléfono: <span class="linea"></span>', CASA, "Cómo funciona La Vela")}
</div>'''


# ───────── Hoja 3 · para el distribuidor ─────────
def hoja_distribuidor():
    ruta = '''<svg viewBox="0 0 700 150" width="100%" style="display:block">
<defs><marker id="q" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#111"/></marker></defs>
<g font-family="Georgia,serif" font-size="17" text-anchor="middle">
''' + "".join(f'<rect x="{8 + i * 140}" y="44" width="122" height="46" fill="{"#111" if i in (0,) else "#fff"}" stroke="#111" stroke-width="1.6"/><text x="{69 + i * 140}" y="73" fill="{"#fff" if i == 0 else "#111"}">{t}</text>'
                for i, t in enumerate(["Planta", "Tu bodega", "Tu ruta", "La tienda", "El cliente"])) + "".join(
        f'<path d="M{132 + i * 140} 60h14" stroke="#111" stroke-width="1.8" marker-end="url(#q)"/><path d="M{146 + i * 140} 76h-14" stroke="#111" stroke-width="1.8" stroke-dasharray="3 3" marker-end="url(#q)"/>' for i in range(4)) + '''
</g>
<g font-family="Helvetica,Arial,sans-serif" font-size="11.5" fill="#111">
<path d="M22 22h34" stroke="#111" stroke-width="1.8" marker-end="url(#q)"/><text x="64" y="26">Van llenos: velas con vaso y cartuchos</text>
<path d="M330 22h34" stroke="#111" stroke-width="1.8" stroke-dasharray="3 3" marker-end="url(#q)"/><text x="372" y="26">Regresan vacíos, en la misma visita, sin flete extra</text>
<text x="8" y="116" fill="#444">Los vacíos viajan en cajas de 24. En planta no se lavan: se calientan, se les cambia la mecha y se vuelven a llenar.</text>
<text x="8" y="133" fill="#444">Sin vidrio de regreso: caben más piezas por tarima y hay menos rotura.</text>
</g></svg>'''
    temporadas = "".join(f'<div class="paso"><h3>{a}</h3><p>{b}</p></div>' for a, b in [
        ("28 de cada mes", "San Judas Tadeo"), ("Marzo o abril", "Semana Santa"), ("10 de mayo", "Día de las Madres"),
        ("1 y 2 de nov.", "Día de Muertos, la más fuerte"), ("12 de dic.", "Virgen de Guadalupe"), ("Diciembre", "Posadas y Navidad")])
    return f'''<div class="hoja">{cabeza("Para distribuidores con rutas")}
<h1>Distribuye la vela que tus clientes van a volver a pedir.</h1>
<p class="bajada">La veladora es de lo que más se vende en una tienda. Esta se rellena: el vaso se vende una vez y el cartucho cada semana, en la misma tienda, en la ruta que ya recorres.</p>
<div class="seccion"><h2>Cómo corre en tu ruta</h2>{ruta}</div>
<div class="seccion cols c2">
  <div><h2>Por qué te conviene</h2><ul>
    <li><b>Recompra.</b> Cada vaso vendido es un cliente que vuelve por su cartucho.</li>
    <li><b>Margen atractivo</b> para ti y para la tienda. Te lo mostramos en la llamada.</li>
    <li><b>Exhibidor y material de punto de venta</b> sin costo.</li>
    <li><b>Venta garantizada.</b> Lo que no se mueva, se cambia.</li>
    <li><b>Exclusividad por zona</b> para quien llegue primero y cumpla volumen.</li>
    <li><b>Marca cuidada.</b> Vaso y cartucho llevan la marca y el lote grabados.</li></ul></div>
  <div><h2>Lo que te pedimos</h2><ul>
    <li>Visitar cada tienda cada semana, o cada dos como máximo.</li>
    <li>Recoger los cartuchos vacíos en la misma visita.</li>
    <li>Cuidar que el exhibidor esté surtido y a la vista.</li>
    <li>Reportar las piezas por tienda: con eso movemos inventario y armamos temporadas.</li>
    <li>Respetar la zona y los precios al público.</li></ul></div>
</div>
<div class="seccion"><h2>Cómo empezamos</h2>
<div class="cols c4">
  <div class="paso"><span class="n">1</span><h3>Solicitud</h3><p>Ocho preguntas, dos minutos, en la liga de abajo.</p></div>
  <div class="paso"><span class="n">2</span><h3>Llamada</h3><p>Revisamos tu zona y te enseñamos los números.</p></div>
  <div class="paso"><span class="n">3</span><h3>Piloto</h3><p>50 tiendas durante 4 semanas, con exhibidor y venta garantizada.</p></div>
  <div class="paso"><span class="n">4</span><h3>Zona y contrato</h3><p>Si rota, firmamos tu exclusividad y tus mínimos.</p></div>
</div></div>
<div class="seccion"><h2>Las temporadas ya vienen armadas</h2><div class="cols" style="grid-template-columns:repeat(6,1fr);gap:9pt">{temporadas}</div></div>
{pie("Revisamos cada solicitud a mano. Si tu zona está disponible, te escribimos por WhatsApp.", CASA + "/distribuir", "Llena la solicitud")}
</div>'''


HOJAS = {"Cliente": hoja_cliente, "Tienda": hoja_tienda, "Distribuidor": hoja_distribuidor}

# ───────── Imágenes de liga (1200×630): una por página ─────────
LIGAS = {
    "inicio": ("Veladora mexicana · hecha con ingeniería", "La vela, como Dios manda.", "Hecha para durar lo más posible, rellenarse y quedarse en tu casa como vaso."),
    "manifiesto": ("Manifiesto", "Una vela no es solo cera y pabilo.", "Es fe, memoria y compañía. Merece hacerse bien."),
    "distribuir": ("Para distribuidores", "Distribuye la vela que tus clientes van a volver a pedir.", "El vaso se vende una vez. El cartucho, cada semana."),
    "entrar": ("Tablero", "Iniciar sesión", "Acceso para el equipo y los distribuidores de La Vela."),
    "modelo": ("El modelo de negocio", "El vaso se vende una vez. El cartucho, cada semana.", "Costo, márgenes, quién gana qué y la proyección a tres años."),
    "blog": ("Blog", "Todo sobre la veladora: cómo dura, cómo se vende, cómo se distribuye.", "Guías para quien la enciende, la vende o la reparte."),
}


def html_liga(etiqueta, titulo, bajada):
    largo = len(titulo)
    cuerpo = 86 if largo < 28 else 68 if largo < 48 else 56
    return f'''<!doctype html><meta charset="utf-8"><style>{BASE}
html,body{{width:1200px;height:630px;background:#000;color:#fff;overflow:hidden}}
.l{{position:absolute;left:72px;top:64px;width:760px;height:502px;display:flex;flex-direction:column}}
.marca{{font-family:'Iowan Old Style',Palatino,Georgia,serif;font-size:34px}}
.etiqueta{{font-size:17px;color:#c8c8c8;margin-top:auto}}
h1{{font-size:{cuerpo}px;line-height:1.04;margin-top:18px}}
p{{font-size:27px;line-height:1.3;color:#c8c8c8;margin-top:22px;max-width:700px}}
.v{{position:absolute;right:92px;top:38px}}
.r{{position:absolute;left:72px;bottom:44px;font-size:19px;color:#8a8a8a;letter-spacing:.04em}}
</style><div class="l"><span class="marca">La Vela</span><span class="etiqueta">{etiqueta}</span><h1>{titulo}</h1><p>{bajada}</p></div>
<div class="v">{vela(252, oscuro=True, ident="o")}</div>'''


def chrome(salida, *args):
    """Chrome sin ventana a veces no se cierra solo: se espera a que el archivo exista y deje de crecer, y se le cierra."""
    import time
    salida = Path(salida)
    if salida.exists():
        salida.unlink()
    p = subprocess.Popen([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", f"--user-data-dir={TMP / 'perfil'}", *args],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    previo, quieto, t0 = -1, 0, time.time()
    while time.time() - t0 < 90:
        if p.poll() is not None:
            break
        tam = salida.stat().st_size if salida.exists() else -1
        quieto = quieto + 1 if tam > 0 and tam == previo else 0
        previo = tam
        if quieto >= 4:
            break
        time.sleep(0.5)
    if p.poll() is None:
        p.terminate()
        try:
            p.wait(10)
        except subprocess.TimeoutExpired:
            p.kill()
    if not salida.exists() or salida.stat().st_size == 0:
        raise RuntimeError(f"Chrome no produjo {salida}")


def main():
    TMP.mkdir(exist_ok=True)
    (SITIO / "descargas").mkdir(exist_ok=True); (SITIO / "og").mkdir(exist_ok=True)
    for nombre, hoja in HOJAS.items():
        fuente = TMP / f"hoja_{nombre}.html"
        fuente.write_text(f'<!doctype html><html lang="es-MX" data-author="RLR"><meta charset="utf-8"><title>La Vela · Hoja para {nombre}</title><meta name="author" content="{_RLR}"><style>{HOJA}</style>{hoja()}</html>', encoding="utf-8")
        pdf = SITIO / "descargas" / f"La_Vela_Hoja_{nombre}_{VERSION}.pdf"
        for viejo in (SITIO / "descargas").glob(f"La_Vela_Hoja_{nombre}_*"):
            viejo.unlink()
        chrome(pdf, "--no-pdf-header-footer", f"--print-to-pdf={pdf}", fuente.as_uri())
        crudo = pdf.read_bytes()
        paginas = len(__import__("re").findall(rb"/Type\s*/Page[^s]", crudo))
        if paginas != 1 or b"/MediaBox [0 0 612 792]" not in crudo:
            raise SystemExit(f"{pdf.name}: {paginas} páginas; debe ser UNA hoja tamaño carta (se desbordó el contenido)")
        png = TMP / f"hoja_{nombre}.png"
        chrome(png, f"--screenshot={png}", "--window-size=816,1056", fuente.as_uri())
        Image.open(png).convert("RGB").resize((612, 792), Image.LANCZOS).save(SITIO / "descargas" / f"La_Vela_Hoja_{nombre}_{VERSION}.jpg", quality=84)
        print("hoja", pdf.name)
    for clave, datos in LIGAS.items():
        fuente = TMP / f"og_{clave}.html"
        fuente.write_text(html_liga(*datos), encoding="utf-8")
        png = TMP / f"og_{clave}.png"
        chrome(png, f"--screenshot={png}", "--window-size=1200,630", fuente.as_uri())
        Image.open(png).convert("RGB").save(SITIO / "og" / f"{clave}.jpg", quality=88)
        print("liga", clave)


if __name__ == "__main__":
    sys.exit(main())
