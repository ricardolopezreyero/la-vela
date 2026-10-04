# RLR · La Vela — dibujo vectorial de la vela y código QR, para hojas descargables e imágenes de liga
# Ricardo López Reyero. La lumbre es lo único con color (docs/14).
import io
import qrcode
import qrcode.image.svg

_RLR = "Ricardo López Reyero"  # RLR


def vela(ancho=200, oscuro=False, ident="v", resplandor=True):
    """La vela de frente: vaso, cera, cartucho de aluminio y flama. viewBox 200×440."""
    trazo = "#f3f3f3" if oscuro else "#111"
    vidrio = "rgba(255,255,255,.07)" if oscuro else "rgba(0,0,0,.03)"
    alto = ancho * 440 / 200
    halo = f'<circle cx="100" cy="96" r="96" fill="url(#{ident}h)"/>' if resplandor else ""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 440" width="{ancho}" height="{alto:.0f}" role="img" aria-label="La Vela">
<defs>
<radialGradient id="{ident}h"><stop offset="0" stop-color="#ffb347" stop-opacity=".55"/><stop offset=".45" stop-color="#ff7a1a" stop-opacity=".16"/><stop offset="1" stop-color="#ff7a1a" stop-opacity="0"/></radialGradient>
<linearGradient id="{ident}f" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#2456ff"/><stop offset=".16" stop-color="#ff9a1f"/><stop offset=".55" stop-color="#ff7a12"/><stop offset="1" stop-color="#d9230a"/></linearGradient>
<linearGradient id="{ident}n" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffd76a" stop-opacity=".2"/><stop offset=".3" stop-color="#fff6d6"/><stop offset="1" stop-color="#ffd24a"/></linearGradient>
<linearGradient id="{ident}a" x1="0" x2="1"><stop offset="0" stop-color="#8d8d8d"/><stop offset=".22" stop-color="#f1f1f1"/><stop offset=".5" stop-color="#b9b9b9"/><stop offset=".78" stop-color="#ededed"/><stop offset="1" stop-color="#7e7e7e"/></linearGradient>
<linearGradient id="{ident}c" x1="0" x2="1"><stop offset="0" stop-color="#d9d9d9"/><stop offset=".3" stop-color="#ffffff"/><stop offset=".75" stop-color="#f1f1f1"/><stop offset="1" stop-color="#cfcfcf"/></linearGradient>
<linearGradient id="{ident}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf8a" stop-opacity=".9"/><stop offset=".35" stop-color="#ffcf8a" stop-opacity="0"/></linearGradient>
</defs>
{halo}
<rect x="38" y="118" width="124" height="312" rx="9" fill="{vidrio}" stroke="{trazo}" stroke-width="3"/>
<rect x="50" y="176" width="100" height="196" fill="url(#{ident}c)"/>
<rect x="50" y="176" width="100" height="196" fill="url(#{ident}b)"/>
<ellipse cx="100" cy="176" rx="50" ry="7" fill="#fff" stroke="#c9c9c9" stroke-width="1"/>
<rect x="46" y="366" width="108" height="52" rx="4" fill="url(#{ident}a)" stroke="#6b6b6b" stroke-width="1"/>
<line x1="46" y1="384" x2="154" y2="384" stroke="#6b6b6b" stroke-width=".8"/><line x1="46" y1="402" x2="154" y2="402" stroke="#6b6b6b" stroke-width=".8"/>
<text x="100" y="396.500" font-family="Georgia,serif" font-size="8" letter-spacing="2" text-anchor="middle" fill="#555">LA VELA · L-0001</text>
<path d="M100 176 C100 168 101 160 103 154" fill="none" stroke="#1a1a1a" stroke-width="2.6" stroke-linecap="round"/>
<path d="M102 62 C122 104 132 122 132 138 A30 30 0 0 1 72 138 C72 122 84 100 102 62 Z" fill="url(#{ident}f)"/>
<path d="M102 92 C113 116 119 128 119 140 A17 17 0 0 1 85 140 C85 128 92 114 102 92 Z" fill="url(#{ident}n)"/>
<line x1="52" y1="130" x2="52" y2="360" stroke="{trazo}" stroke-opacity=".35" stroke-width="2"/>
</svg>'''


def qr(liga, lado=120, oscuro=False):
    """QR en SVG, clicable desde donde se incruste."""
    q = qrcode.QRCode(border=0, box_size=10, error_correction=qrcode.constants.ERROR_CORRECT_M)
    q.add_data(liga); q.make(fit=True)
    img = q.make_image(image_factory=qrcode.image.svg.SvgPathImage)
    b = io.BytesIO(); img.save(b)
    svg = b.getvalue().decode()
    svg = svg[svg.index("<svg"):]
    import re
    svg = re.sub(r'width="[^"]*" height="[^"]*"', f'width="{lado}" height="{lado}"', svg, 1)
    if oscuro:
        svg = svg.replace("#000000", "#ffffff").replace('fill="#000"', 'fill="#fff"')
    return f'<a href="{liga}">{svg}</a>'
