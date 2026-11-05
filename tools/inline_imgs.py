#!/usr/bin/env python3
"""Incrusta las imágenes de assets/img/*.webp dentro de index.html (bloque <script id="imgs">).

Uso:  python3 tools/inline_imgs.py
- p-<id>.webp  -> foto del producto con ese id (siempre se incluye).
- h-<nombre>.webp -> foto de sección; solo se incluye si el HTML la menciona ("h-nombre").
Para agregar un producto nuevo: guarda su foto como assets/img/p-<id>.webp (ideal 440px, WebP) y vuelve a correr esto.
"""
import base64, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = ROOT / 'index.html'
IMG = ROOT / 'assets' / 'img'
pat = re.compile(r'(<script type="application/json" id="imgs">)(.*?)(</script>)', re.S)

src = HTML.read_text(encoding='utf-8')
m = pat.search(src)
if not m:
    sys.exit('No encontré el bloque <script id="imgs"> en index.html')
body = src[:m.start()] + src[m.end():]
data, total = {}, 0
for f in sorted(IMG.glob('*.webp')):
    k = f.stem
    if k.startswith('p-') or f'"{k}"' in body or f"'{k}'" in body:
        raw = f.read_bytes(); total += len(raw)
        data[k] = base64.b64encode(raw).decode('ascii')
blob = json.dumps(data, separators=(',', ':')).replace('","', '",\n"')
out = src[:m.start()] + m.group(1) + blob + m.group(3) + src[m.end():]
HTML.write_text(out, encoding='utf-8')
print(f'{len(data)} imágenes · {total//1024} KB binario · index.html = {len(out.encode())//1024} KB')
