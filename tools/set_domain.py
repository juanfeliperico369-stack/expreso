#!/usr/bin/env python3
"""Configura el dominio final de la web.

Uso:  python3 tools/set_domain.py https://expreso.com.co
- Escribe canonical, og:url, og:image y twitter:card en index.html (entre <!-- DOMINIO --> y <!-- /DOMINIO -->).
- Genera robots.txt y sitemap.xml en la raíz.
Se puede correr varias veces (reemplaza lo anterior).
"""
import datetime, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
if len(sys.argv) != 2 or not re.fullmatch(r'https://[a-z0-9.-]+\.[a-z]{2,}', sys.argv[1].rstrip('/').lower()):
    sys.exit('Uso: python3 tools/set_domain.py https://tu-dominio.com')
d = sys.argv[1].rstrip('/').lower()

html = ROOT / 'index.html'
s = html.read_text(encoding='utf-8')
block = (f'<!-- DOMINIO: se llena solo con  python3 tools/set_domain.py https://tu-dominio.com -->\n'
         f'<link rel="canonical" href="{d}/">\n<meta property="og:url" content="{d}/">\n'
         f'<meta property="og:image" content="{d}/assets/og.jpg">\n<meta property="og:image:width" content="1200">\n'
         f'<meta property="og:image:height" content="630">\n<meta name="twitter:card" content="summary_large_image">\n<!-- /DOMINIO -->')
s, n = re.subn(r'<!-- DOMINIO:.*?<!-- /DOMINIO -->', lambda m: block, s, flags=re.S)
if n != 1:
    sys.exit('No encontré los marcadores <!-- DOMINIO --> en index.html')
html.write_text(s, encoding='utf-8')
(ROOT / 'robots.txt').write_text(f'User-agent: *\nAllow: /\nSitemap: {d}/sitemap.xml\n', encoding='utf-8')
(ROOT / 'sitemap.xml').write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    f'  <url><loc>{d}/</loc><lastmod>{datetime.date.today().isoformat()}</lastmod></url>\n</urlset>\n', encoding='utf-8')
print(f'Dominio configurado: {d}  (index.html, robots.txt, sitemap.xml)')
# también regenera el catálogo para Meta / marketplaces con el dominio nuevo
import subprocess
subprocess.run([sys.executable, str(ROOT / 'tools' / 'export_catalog.py'), d], check=False)
