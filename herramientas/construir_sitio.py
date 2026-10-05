# RLR · La Vela — arma lo que se repite en el sitio — Ricardo López Reyero
#   · cabecera SEO, barra y pie iguales en todas las páginas (con su imagen de liga)
#   · blog: contenido/blog/*.md → sitio/blog/<liga>.html y sitio/blog/index.html
#   · en el inicio: preguntas frecuentes y lista de artículos; en Distribuir: las descargas
#   · sitemap.xml y robots.txt
# Uso: python3 herramientas/construir_sitio.py   (se puede correr las veces que sea)
import html
import json
import re
from pathlib import Path

_RLR = "Ricardo López Reyero"; _k = "EYE"; _rev = 181218  # RLR

RAIZ = Path(__file__).resolve().parent.parent
SITIO = RAIZ / "sitio"
CASA = "https://vela.capitaltorreon.com"
FECHA = "2026-10-03"
FECHA_LARGA = "3 de octubre de 2026"

LLAMA = '<svg viewBox="0 0 15 24" aria-hidden="true"><path fill="currentColor" d="M7.5 0C9 4 13 6.5 13 11a5.5 5.5 0 0 1-11 0C2 6.5 6 4 7.5 0Z"/><rect fill="currentColor" x="1" y="19" width="13" height="5"/></svg>'
PERSONA = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 21c.8-4.4 4.3-6.8 8.5-6.8s7.700 2.400 8.500 6.800" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'

ORGANIZACION = {
    "@type": "Organization", "@id": CASA + "/#organizacion", "name": "La Vela", "url": CASA + "/",
    "slogan": "La vela, como Dios manda", "logo": CASA + "/og/inicio.jpg",
    "founder": {"@type": "Person", "name": "Ricardo López Reyero"},
    "address": {"@type": "PostalAddress", "addressLocality": "Torreón", "addressRegion": "Coahuila", "addressCountry": "MX"},
}


def barra(inicio=False):
    b = "" if inicio else "/"
    return f'''<header class="barra">
  <div class="caja">
    <a class="marca" href="/" aria-label="La Vela, inicio">
      {LLAMA}
      La Vela
    </a>
    <nav aria-label="Secciones">
      <a href="{b}#como">Cómo funciona</a>
      <a href="/manifiesto">Manifiesto</a>
      <a href="/blog/">Blog</a>
      <a href="/modelo">Modelo</a>
      <a class="siempre" href="/distribuir">Distribuir</a>
      <a class="siempre entrar" href="/entrar" aria-label="Iniciar sesión" title="Iniciar sesión">{PERSONA}</a>
    </nav>
  </div>
</header>'''


# El login de la casa, en todas las páginas (ver README: el camino del login)
LOGIN = '''<!-- RLR · Login de CapitalTorreon: todo funciona sin entrar; entrar solo agrega -->
<div data-login-ct style="position:fixed;top:12px;right:12px;z-index:9999"></div>
<script src="https://login.capitaltorreon.com/login.js" data-prefs="vela.ui" defer></script>'''

PIE = '''<footer class="pie">
  <div class="caja">
    <span>La Vela · Torreón, Coahuila, México</span>
    <span><a href="/manifiesto">Manifiesto</a> · <a href="/blog/">Blog</a> · <a href="/distribuir">Quiero distribuir</a> · <a href="/entrar">Iniciar sesión</a></span>
  </div>
</footer>'''


def cabeza(titulo, desc, ruta, og, noindex=False, tipo="website", datos=None, extra=""):
    t, d = html.escape(titulo, quote=True), html.escape(desc, quote=True)
    ld = ""
    if datos:
        ld = '\n<script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@graph": datos}, ensure_ascii=False) + "</script>"
    robots = '<meta name="robots" content="noindex">' if noindex else '<meta name="robots" content="index, follow, max-image-preview:large">'
    return f'''<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{t}</title>
<meta name="description" content="{d}">
<meta name="author" content="{_RLR}">
{robots}
<meta name="theme-color" content="#000000">
<link rel="canonical" href="{CASA}{ruta}">
<meta property="og:site_name" content="La Vela">
<meta property="og:locale" content="es_MX">
<meta property="og:type" content="{tipo}">
<meta property="og:title" content="{t}">
<meta property="og:description" content="{d}">
<meta property="og:url" content="{CASA}{ruta}">
<meta property="og:image" content="{CASA}/og/{og}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{t}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{t}">
<meta name="twitter:description" content="{d}">
<meta name="twitter:image" content="{CASA}/og/{og}.jpg">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/estilos.css">{extra}{ld}
</head>'''


# ───────── RLR · de Markdown sencillo a HTML (solo lo que usan los artículos) ─────────
def en_linea(t):
    t = html.escape(t, quote=False)
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    def liga(m):
        externa = m.group(2).startswith("http")
        return f'<a href="{m.group(2)}"' + (' rel="noopener" target="_blank"' if externa else "") + f">{m.group(1)}</a>"
    return re.sub(r"\[([^\]]+)\]\(([^)]+)\)", liga, t)


def a_html(md):
    salida, lineas, i = [], md.strip().split("\n"), 0
    while i < len(lineas):
        l = lineas[i]
        if not l.strip():
            i += 1; continue
        if l.startswith("## "):
            salida.append(f"<h2>{en_linea(l[3:])}</h2>"); i += 1
        elif l.startswith("### "):
            salida.append(f"<h3>{en_linea(l[4:])}</h3>"); i += 1
        elif l.startswith("> "):
            salida.append(f"<blockquote>{en_linea(l[2:])}</blockquote>"); i += 1
        elif l.startswith("|"):
            filas = []
            while i < len(lineas) and lineas[i].startswith("|"):
                filas.append([c.strip() for c in lineas[i].strip().strip("|").split("|")]); i += 1
            cab, cuerpo = filas[0], filas[2:]
            salida.append('<div class="tabla-caja"><table class="tabla"><thead><tr>' + "".join(f"<th>{en_linea(c)}</th>" for c in cab) + "</tr></thead><tbody>"
                          + "".join("<tr>" + "".join((f'<th scope="row">{en_linea(c)}</th>' if n == 0 else f"<td>{en_linea(c)}</td>") for n, c in enumerate(f)) + "</tr>" for f in cuerpo)
                          + "</tbody></table></div>")
        elif re.match(r"(- |\d+\. )", l):
            ordenada = not l.startswith("- ")
            patron = r"\d+\. " if ordenada else r"- "
            items = []
            while i < len(lineas) and re.match(patron, lineas[i]):
                items.append(re.sub("^" + patron, "", lineas[i])); i += 1
            et = "ol" if ordenada else "ul"
            salida.append(f"<{et}>" + "".join(f"<li>{en_linea(x)}</li>" for x in items) + f"</{et}>")
        else:
            salida.append(f"<p>{en_linea(l)}</p>"); i += 1
    return "\n".join(salida)


def leer_articulos():
    arts = []
    for f in sorted((RAIZ / "contenido" / "blog").glob("*.md")):
        crudo = f.read_text(encoding="utf-8")
        frente, cuerpo = crudo.split("\n---\n", 1)
        meta = dict(l.split(": ", 1) for l in frente.strip().split("\n"))
        meta["liga"] = re.sub(r"^\d+-", "", f.stem)
        meta["html"] = a_html(cuerpo)
        meta["palabras"] = len(cuerpo.split())
        arts.append(meta)
    return arts


def pagina(cab, cuerpo, inicio=False, guion=""):
    return f'''<!doctype html>
<!-- RLR · La Vela, como Dios manda — {_RLR} · Torreón, Coahuila · octubre 2026 -->
<html lang="es-MX" data-k="eye" data-rev="181218">
{cab}
<body>

{barra(inicio)}

{cuerpo}

{PIE}
{guion}<!-- RLR · {_RLR} -->
{LOGIN}
</body>
</html>
'''


def construir_blog(arts):
    (SITIO / "blog").mkdir(exist_ok=True)
    for viejo in (SITIO / "blog").glob("*.html"):
        viejo.unlink()
    for a in arts:
        ruta = f"/blog/{a['liga']}"
        otros = "".join(f'<li><a href="/blog/{o["liga"]}"><span class="etiqueta">{o["para"]}</span><b>{html.escape(o["titulo"])}</b></a></li>' for o in arts if o is not a)
        datos = [ORGANIZACION, {
            "@type": "Article", "headline": a["titulo"], "description": a["descripcion"], "inLanguage": "es-MX",
            "datePublished": FECHA, "dateModified": FECHA, "image": f"{CASA}/og/blog.jpg", "mainEntityOfPage": CASA + ruta,
            "author": {"@type": "Person", "name": "Ricardo López Reyero"}, "publisher": {"@id": CASA + "/#organizacion"}, "wordCount": a["palabras"],
        }, {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Inicio", "item": CASA + "/"},
            {"@type": "ListItem", "position": 2, "name": "Blog", "item": CASA + "/blog/"},
            {"@type": "ListItem", "position": 3, "name": a["titulo"], "item": CASA + ruta}]}]
        cuerpo = f'''<main>
<!-- RLR · artículo -->
<article class="seccion articulo" style="border-top:0">
  <div class="caja">
    <p class="migas"><a href="/">Inicio</a> › <a href="/blog/">Blog</a></p>
    <p class="etiqueta">{a["para"]}</p>
    <h1>{html.escape(a["titulo"])}</h1>
    <p class="fecha">Por Ricardo López Reyero · <time datetime="{FECHA}">{FECHA_LARGA}</time> · {max(1, round(a["palabras"] / 200))} minutos de lectura</p>
    <div class="texto">
{a["html"]}
    </div>
    <div class="botones"><a class="boton lleno" href="/distribuir">Quiero distribuir La Vela</a><a class="boton" href="/#como">Cómo funciona</a></div>
  </div>
</article>
<section class="seccion gris">
  <div class="caja">
    <p class="etiqueta">Más artículos</p>
    <ul class="lista-blog">{otros}</ul>
  </div>
</section>
</main>'''
        cab = cabeza(f"{a['titulo']} | La Vela", a["descripcion"], ruta, "blog", tipo="article", datos=datos)
        (SITIO / "blog" / f"{a['liga']}.html").write_text(pagina(cab, cuerpo), encoding="utf-8")
    lista = "".join(f'<li><a href="/blog/{a["liga"]}"><span class="etiqueta">{a["para"]}</span><b>{html.escape(a["titulo"])}</b><span>{html.escape(a["descripcion"])}</span></a></li>' for a in arts)
    cuerpo = f'''<main>
<section class="seccion" style="border-top:0">
  <div class="caja">
    <p class="etiqueta">Blog</p>
    <h1 class="titulo-blog">Todo sobre la veladora.</h1>
    <p class="grande">Cómo dura, cómo se vende y cómo se distribuye. Guías cortas para quien la enciende, la vende o la reparte.</p>
    <ul class="lista-blog larga">{lista}</ul>
  </div>
</section>
</main>'''
    datos = [ORGANIZACION, {"@type": "Blog", "name": "Blog de La Vela", "url": CASA + "/blog/", "inLanguage": "es-MX", "publisher": {"@id": CASA + "/#organizacion"}}]
    cab = cabeza("Blog · Todo sobre la veladora | La Vela", "Guías sobre veladoras: cuánto duran, cómo funciona el cartucho retornable, cómo venderlas en la tienda y cómo distribuirlas.", "/blog/", "blog", datos=datos)
    (SITIO / "blog" / "index.html").write_text(pagina(cab, cuerpo), encoding="utf-8")


PREGUNTAS = [
    ("¿Qué es La Vela?", "Una veladora mexicana hecha con ingeniería: un vaso de vidrio que se queda en tu casa y un cartucho de aluminio, con la cera y la mecha, que se cambia cuando se acaba."),
    ("¿Cómo se rellena?", "No se rellena en casa. Sacas el cartucho vacío, lo llevas a la tienda donde lo compraste y te llevas uno lleno. El vacío regresa a la planta y ahí se vuelve a llenar."),
    ("¿Qué es el depósito del cartucho?", "Una cantidad pequeña que pagas por el cartucho, como con el envase de refresco retornable. Te la descuentan cuando regresas el vacío a la misma tienda."),
    ("¿Para qué sirve el vaso cuando no tiene vela?", "Para lo que quieras. La cera arde dentro del cartucho y no toca el vidrio, así que el vaso queda limpio: sirve de vaso para el agua, de florero o de lapicero."),
    ("¿Cuánto dura?", "Estamos en pruebas de encendido: pesamos cada vela antes y después de cada sesión para saber cuántos gramos quema por hora. No prometemos un número de horas hasta haberlo comprobado."),
    ("¿Dónde la compro?", "Va a llegar a tiendas y misceláneas a través de distribuidores con rutas. Si tienes rutas o tiendas, puedes llenar la solicitud para distribuir."),
]

PAGINAS = {
    "index.html": dict(ruta="/", og="inicio", titulo="La Vela · Veladora con cartucho retornable, como Dios manda",
                       desc="Veladora mexicana hecha con ingeniería: diseñada para durar lo más posible, se rellena con un cartucho retornable y el vaso se queda en tu casa."),
    "manifiesto.html": dict(ruta="/manifiesto", og="manifiesto", titulo="Manifiesto · La vela, como Dios manda | La Vela",
                            desc="Por qué decidimos hacer la veladora como siempre debió de ser: con ingeniería, buena cera y un vaso que no se tira."),
    "distribuir.html": dict(ruta="/distribuir", og="distribuir", titulo="Distribuir veladoras · Quiero distribuir La Vela",
                            desc="Distribuye la veladora que tus clientes van a volver a pedir: recompra, exhibidor sin costo, venta garantizada y exclusividad por zona. Solicitud de 2 minutos."),
    "entrar.html": dict(ruta="/entrar", og="entrar", titulo="Iniciar sesión · La Vela", desc="Acceso al tablero de La Vela.", noindex=True),
    "modelo.html": dict(ruta="/modelo", og="modelo", titulo="Modelo de negocio · La Vela",
                        desc="Cómo gana dinero La Vela: costo, márgenes, quién gana qué y la proyección a tres años.", noindex=True),
}


def bloque(texto, clave, contenido, antes):
    """Pone (o reemplaza) un bloque marcado, justo antes del ancla."""
    marca = f"<!-- AUTO:{clave} -->"; fin = f"<!-- /AUTO:{clave} -->"
    nuevo = f"{marca}\n{contenido}\n{fin}\n"
    if marca in texto:
        return re.sub(re.escape(marca) + r".*?" + re.escape(fin) + r"\n", lambda m: nuevo, texto, flags=re.S)
    assert antes in texto, f"no encontré el ancla para {clave}"
    return texto.replace(antes, nuevo + antes, 1)


def construir_paginas(arts):
    descargas = sorted((SITIO / "descargas").glob("La_Vela_Hoja_*.pdf"))
    por_nombre = {p.name.split("_")[3]: p.name for p in descargas}
    for archivo, c in PAGINAS.items():
        ruta = SITIO / archivo
        t = ruta.read_text(encoding="utf-8")
        datos, extra = None, ""
        if archivo == "index.html":
            extra = '\n<link rel="modulepreload" href="/vendor/three.module.min.js">'
            datos = [ORGANIZACION,
                     {"@type": "WebSite", "@id": CASA + "/#sitio", "url": CASA + "/", "name": "La Vela", "inLanguage": "es-MX", "publisher": {"@id": CASA + "/#organizacion"}},
                     {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": p, "acceptedAnswer": {"@type": "Answer", "text": r}} for p, r in PREGUNTAS]}]
            preguntas = "".join(f"<details><summary>{p}</summary><p>{r}</p></details>" for p, r in PREGUNTAS)
            lista = "".join(f'<li><a href="/blog/{a["liga"]}"><span class="etiqueta">{a["para"]}</span><b>{html.escape(a["titulo"])}</b></a></li>' for a in arts)
            t = bloque(t, "preguntas", f'''<section class="seccion" id="preguntas">
  <div class="caja dos">
    <div>
      <p class="etiqueta">Preguntas</p>
      <h2>Lo que nos preguntan.</h2>
    </div>
    <div class="preguntas">{preguntas}</div>
  </div>
</section>

<section class="seccion gris" id="aprende">
  <div class="caja">
    <p class="etiqueta">Para saber más</p>
    <h2>Todo sobre la veladora.</h2>
    <ul class="lista-blog">{lista}</ul>
    <div class="botones"><a class="boton" href="/blog/">Ver el blog</a></div>
  </div>
</section>
''', '<section class="seccion negra" id="distribuir">')
        elif archivo in ("manifiesto.html", "distribuir.html"):
            datos = [ORGANIZACION, {"@type": "WebPage", "url": CASA + c["ruta"], "name": c["titulo"], "description": c["desc"], "inLanguage": "es-MX", "isPartOf": {"@id": CASA + "/#sitio"}}]
        if archivo == "distribuir.html":
            HOJAS = [("Cliente", "Para el cliente", "El cartel que explica cómo funciona: se enciende, se regresa el cartucho, se lleva uno lleno. Para pegar en la puerta o junto a la caja."),
                     ("Tienda", "Para la tienda", "La guía del mostrador: cómo explicarla en diez segundos, las reglas del cartucho, dónde ponerla y un registro semanal."),
                     ("Distribuidor", "Para el distribuidor", "Cómo corre en tu ruta, qué ganas, qué te pedimos, cómo empezamos y el calendario de temporadas.")]
            tarjetas = "".join(f'''<li><a href="/descargas/{por_nombre[k]}" download><img src="/descargas/{por_nombre[k].replace(".pdf", ".jpg")}" alt="Vista previa de la hoja {titulo.lower()}" width="612" height="792" loading="lazy"></a>
        <h3>{titulo}</h3><p>{texto}</p><a class="boton" href="/descargas/{por_nombre[k]}" download>Descargar PDF</a></li>''' for k, titulo, texto in HOJAS)
            t = bloque(t, "descargas", f'''<section class="seccion" id="descargas">
  <div class="caja">
    <p class="etiqueta">Descargas</p>
    <h2>Tres hojas, listas para imprimir.</h2>
    <p class="grande">Una para cada quien: el cliente, la tienda y tú. Cada una es un PDF de una sola hoja tamaño carta.</p>
    <ul class="descargas">{tarjetas}</ul>
  </div>
</section>
''', "<!-- RLR · la solicitud")
        t = re.sub(r"<head>.*?</head>", lambda m: cabeza(c["titulo"], c["desc"], c["ruta"], c["og"], c.get("noindex", False), datos=datos, extra=extra), t, count=1, flags=re.S)
        t = re.sub(r'<header class="barra">.*?</header>', lambda m: barra(archivo == "index.html"), t, count=1, flags=re.S)
        t = re.sub(r'<footer class="pie">.*?</footer>', lambda m: PIE, t, count=1, flags=re.S)
        ruta.write_text(t, encoding="utf-8")


def mapa(arts):
    ligas = ["/", "/manifiesto", "/distribuir", "/blog/"] + [f"/blog/{a['liga']}" for a in arts]
    (SITIO / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                                       + "".join(f"  <url><loc>{CASA}{l}</loc><lastmod>{FECHA}</lastmod></url>\n" for l in ligas) + "</urlset>\n", encoding="utf-8")
    (SITIO / "robots.txt").write_text(f"User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /tablero/\nDisallow: /pedir\nDisallow: /acceso\n\nSitemap: {CASA}/sitemap.xml\n", encoding="utf-8")


if __name__ == "__main__":
    articulos = leer_articulos()
    construir_blog(articulos)
    construir_paginas(articulos)
    mapa(articulos)
    print(f"{len(articulos)} artículos, {sum(a['palabras'] for a in articulos)} palabras; páginas y mapa listos")
