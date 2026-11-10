#!/usr/bin/env python3
"""Exporta el catálogo de index.html para vender en otras plataformas.

Uso:  python3 tools/export_catalog.py [https://tu-dominio.com]
(si no das dominio, usa el canonical de index.html; si tampoco hay, usa https://TU-DOMINIO)

Genera:
- assets/catalogo/<id>.jpg   fotos cuadradas 800×800 en JPG (Meta/WhatsApp/Mercado Libre no aceptan bien WebP)
- export/catalogo-meta.csv   para Commerce Manager (catálogo de Facebook, Instagram y WhatsApp Business)
- export/publicaciones.csv   títulos (≤60), precio y descripción listos para pegar en Mercado Libre u otros marketplaces
Solo exporta productos vendibles (con precio y sin estado 'proximamente').
"""
import csv, json, pathlib, re, subprocess, sys
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
html = (ROOT / 'index.html').read_text(encoding='utf-8')

def js_const(name):
    m = re.search(r'const ' + name + r' = (\{.*?\}|\[.*?\]);\n', html, re.S)
    if not m: sys.exit(f'No encontré {name} en index.html')
    return m.group(1)

# El arreglo es JS (no JSON): node lo evalúa en un contexto aislado y lo devuelve como JSON.
code = 'const vm=require("vm");const s=require("fs").readFileSync(0,"utf8");process.stdout.write(JSON.stringify(vm.runInNewContext("("+s+")",{},{timeout:1000})))'
def js_eval(src):
    return json.loads(subprocess.run(['node', '-e', code], input=src, capture_output=True, text=True, check=True).stdout)

productos, cats = js_eval(js_const('PRODUCTOS')), js_eval(js_const('CATS'))
m = re.search(r'<link rel="canonical" href="(https://[^"/]+)/?">', html)
dominio = (sys.argv[1] if len(sys.argv) > 1 else (m.group(1) if m else 'https://TU-DOMINIO')).rstrip('/')

vendibles = [p for p in productos if p.get('estado') != 'proximamente' and isinstance(p.get('precio'), (int, float))]
(ROOT / 'export').mkdir(exist_ok=True)
fotos = ROOT / 'assets' / 'catalogo'; fotos.mkdir(parents=True, exist_ok=True)

for p in vendibles:
    src = ROOT / 'assets' / 'img' / f"p-{p['id']}.webp"
    if not src.exists(): continue
    im = Image.open(src).convert('RGBA')
    bbox = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    if bbox: im = im.crop(bbox)  # recorta el borde transparente
    k = 680 / max(im.size); im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)  # llena el cuadro
    lienzo = Image.new('RGB', (800, 800), (245, 239, 224))  # mismo fondo crema de las tarjetas
    lienzo.paste(im, ((800 - im.width) // 2, (800 - im.height) // 2), im)
    lienzo.save(fotos / f"{p['id']}.jpg", 'JPEG', quality=86, optimize=True)

def sku(p): return p.get('sku') or ('DS-' if p.get('proveedor') == 'drop' else 'GX-') + p['id'].upper()
def legal(p):
    base = {'cuidado': 'Producto cosmético.', 'accesorios': ''}.get(p['cat'], 'Suplemento dietario. No es un medicamento y no reemplaza una alimentación equilibrada.')
    return (base + (f" Registro/notificación INVIMA: {p['invima']}." if p.get('invima') else '')).strip()
def descripcion(p):
    partes = [p['desc'], 'Contiene: ' + ', '.join(p.get('contiene') or []) + '.', 'Cómo se usa: ' + p['uso'], legal(p),
              'Distribuidor independiente de productos Gano Excel. Envíos a toda Colombia.']
    return ' '.join(x for x in partes if x and x != 'Contiene: .')
def titulo(p):
    t = p['nombre'] + ('' if 'anoderma' in p['nombre'] else ' con Ganoderma')
    extra = p['linea'].split(' · ')[0]
    if 'anoderma' not in extra and len(t) + 3 + len(extra) <= 60: t += ' · ' + extra
    while len(t) > 60: t = t.rsplit(' ', 1)[0]
    return t

with open(ROOT / 'export' / 'catalogo-meta.csv', 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['id', 'title', 'description', 'availability', 'condition', 'price', 'link', 'image_link', 'brand', 'product_type'])
    for p in vendibles:
        w.writerow([sku(p), titulo(p), descripcion(p)[:5000], 'in stock', 'new', f"{p['precio']} COP",
                    f"{dominio}/?utm_source=meta&utm_campaign=catalogo#p-{p['id']}", f"{dominio}/assets/catalogo/{p['id']}.jpg",
                    'Gano Excel', cats.get(p['cat'], p['cat'])])
with open(ROOT / 'export' / 'publicaciones.csv', 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['sku', 'titulo (max 60)', 'precio_cop', 'categoria', 'descripcion', 'foto'])
    for p in vendibles:
        w.writerow([sku(p), titulo(p), p['precio'], cats.get(p['cat'], p['cat']), descripcion(p), f"assets/catalogo/{p['id']}.jpg"])
print(f'{len(vendibles)} productos · dominio {dominio} · export/catalogo-meta.csv, export/publicaciones.csv, assets/catalogo/*.jpg')
