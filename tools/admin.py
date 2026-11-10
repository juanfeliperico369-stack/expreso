#!/usr/bin/env python3
"""Administra la tienda sin editar código a mano. Cambia index.html de forma segura.

  python3 tools/admin.py listar                         # productos, precios y estado
  python3 tools/admin.py whatsapp 573001234567          # número que recibe los pedidos
  python3 tools/admin.py precio tinto 149900            # cambia un precio (COP)
  python3 tools/admin.py agotado tinto                  # marca agotado
  python3 tools/admin.py disponible tinto               # vuelve a vender
  python3 tools/admin.py promo "Envío gratis desde $300.000" 2026-12-31
  python3 tools/admin.py promo off
  python3 tools/admin.py envio 12000 | off              # costo fijo de envío o "se confirma"
  python3 tools/admin.py envio-gratis 300000 | off
  python3 tools/admin.py ga4 G-ABC123XYZ | off          # Google Analytics 4
  python3 tools/admin.py pixel 123456789012345 | off    # Meta Pixel
  python3 tools/admin.py red Instagram https://instagram.com/expreso.co
  python3 tools/admin.py vendedor "Juan Felipe" "Medellín" "Te ayudo a elegir tu café"
  python3 tools/admin.py estado                          # qué falta para lanzar

Después de cambiar algo: node tools/test_site.js  (y publica la web).
"""
import json, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = ROOT / 'index.html'
s = HTML.read_text(encoding='utf-8')

def salir(msg): sys.exit('✘ ' + msg)
def sub1(pat, rep, txt, que):
    nuevo, n = re.subn(pat, rep, txt, count=1)
    if n != 1: salir(f'No encontré {que} en index.html (¿cambió el formato?)')
    return nuevo
def js_lit(v): return json.dumps(v, ensure_ascii=False).replace('"', "'") if isinstance(v, str) and "'" not in v else json.dumps(v, ensure_ascii=False)
def bloque(pid):
    m = re.search(r"\n  \{ id:'" + re.escape(pid) + r"',", s)
    if not m: salir(f"No existe el producto '{pid}'. Usa: python3 tools/admin.py listar")
    fin = min(x for x in (s.find('\n  {', m.end()), s.find('\n  /*', m.end()), s.find('\n];', m.end())) if x != -1)
    return m.start(), fin
def num(v, que):
    if not re.fullmatch(r'\d{3,9}', v): salir(f'{que} debe ser un número sin puntos, ej. 149900')
    return v

a = sys.argv[1:]
if not a: print(__doc__); sys.exit(0)
cmd = a[0]

if cmd == 'listar':
    arr = re.search(r'const PRODUCTOS = (\[.*?\]);\n', s, re.S).group(1)
    code = 'const vm=require("vm");const t=require("fs").readFileSync(0,"utf8");process.stdout.write(JSON.stringify(vm.runInNewContext("("+t+")",{},{timeout:1000})))'
    for p in json.loads(subprocess.run(['node', '-e', code], input=arr, capture_output=True, text=True, check=True).stdout):
        precio = f"${p['precio']:,}".replace(',', '.') if isinstance(p.get('precio'), int) else 'por confirmar'
        print(f"{p['id']:<15} {precio:>12}  {p.get('estado', 'disponible'):<13} {p['nombre']}")
    sys.exit(0)
elif cmd == 'whatsapp' and len(a) == 2:
    if not re.fullmatch(r'57\d{10}', a[1]): salir('Formato: 57 + celular de 10 dígitos, sin espacios ni +. Ej: 573001234567')
    s = sub1(r"whatsapp: '[^']*',", f"whatsapp: '{a[1]}',", s, 'CONFIG.whatsapp')
elif cmd == 'precio' and len(a) == 3:
    i, f = bloque(a[1]); seg = s[i:f]
    seg = sub1(r'precio:(?:\d+|null)', 'precio:' + num(a[2], 'El precio'), seg, 'el precio'); s = s[:i] + seg + s[f:]
elif cmd in ('agotado', 'disponible') and len(a) == 2:
    i, f = bloque(a[1]); seg = s[i:f]
    if "estado:'proximamente'" in seg: salir('Ese producto está "próximamente"; edítalo a mano cuando tenga proveedor y precio.')
    seg = seg.replace(" estado:'agotado',", '')
    if cmd == 'agotado': seg = sub1(r"(cat:'[a-z]+',)", r"\1 estado:'agotado',", seg, 'la categoría')
    s = s[:i] + seg + s[f:]
elif cmd == 'promo' and len(a) in (2, 3):
    if a[1] == 'off': val = 'null'
    else:
        if len(a) != 3 or not re.fullmatch(r'20\d\d-\d\d-\d\d', a[2]): salir('Uso: promo "texto" AAAA-MM-DD')
        val = '{ texto:' + json.dumps(a[1], ensure_ascii=False) + ", hasta:'" + a[2] + "' }"
    s = sub1(r'  promo: [^\n]*?,( +//)', '  promo: ' + val + r',\1', s, 'CONFIG.promo')
elif cmd in ('envio', 'envio-gratis') and len(a) == 2:
    key = 'envio' if cmd == 'envio' else 'envioGratisDesde'
    val = 'null' if a[1] == 'off' else num(a[1], 'El valor')
    s = sub1(r'  ' + key + r': (?:null|\d+),', f'  {key}: {val},', s, 'CONFIG.' + key)
elif cmd in ('ga4', 'pixel') and len(a) == 2:
    key, ok = ('ga4', r'G-[A-Z0-9]{4,}') if cmd == 'ga4' else ('metaPixel', r'\d{6,20}')
    val = '' if a[1] == 'off' else a[1]
    if val and not re.fullmatch(ok, val): salir('ID con formato inválido (GA4: G-XXXXXXX · Pixel: solo números)')
    s = sub1(key + r": '[^']*'", f"{key}: '{val}'", s, 'CONFIG.analitica.' + key)
elif cmd == 'vendedor' and len(a) in (3, 4):
    q = lambda v: json.dumps(v.strip()[:80], ensure_ascii=False)
    s = sub1(r"  vendedor: \{[^\n]*?\},", f"  vendedor: {{ nombre: {q(a[1])}, ciudad: {q(a[2])}, frase: {q(a[3] if len(a) == 4 else '')} }},", s, 'CONFIG.vendedor')
elif cmd == 'estado':
    chk = lambda okv, txt: print(('  ✔ ' if okv else '  ☐ ') + txt)
    print('Lista de lanzamiento de Expreso\n— En el código —')
    chk(re.search(r"whatsapp: '57\d{10}'", s), 'Número de WhatsApp        → python3 tools/admin.py whatsapp 57XXXXXXXXXX')
    chk('<link rel="canonical"' in s, 'Dominio configurado       → python3 tools/set_domain.py https://tu-dominio.com')
    chk(re.search(r"vendedor: \{ nombre: ['\"][^'\"]+", s), 'Quién atiende (nombre)    → python3 tools/admin.py vendedor "Nombre" "Ciudad"')
    chk(re.search(r"(Instagram|TikTok|YouTube|Facebook): 'https://", s), 'Al menos una red social   → python3 tools/admin.py red Instagram https://…')
    chk(re.search(r"ga4: 'G-|metaPixel: '\d", s), 'Analítica (GA4 o Pixel)   → python3 tools/admin.py ga4 G-… / pixel …')
    chk(re.search(r"  envio: \d+", s), 'Costo de envío definido   → python3 tools/admin.py envio 12000 (opcional)')
    print("  · Productos agotados ahora:", s.count("estado:'agotado'"))
    print('— Fuera del código (márcalos tú) —')
    for t in ['Permiso de uso de las fotos del catálogo', 'Códigos INVIMA verificados en invima.gov.co', 'Política de distribuidores de Gano Excel por escrito (marketplaces, precios, marca)',
              'Margen real por producto confirmado (usa #vendedor)', 'RUT / DIAN al día (ver GUIA §3)', 'WhatsApp Business con catálogo, etiquetas y respuestas rápidas (docs/WHATSAPP-PLANTILLAS.md)']:
        print('  ☐ ' + t)
    sys.exit(0)
elif cmd == 'red' and len(a) == 3:
    if a[1] not in ('Instagram', 'TikTok', 'YouTube', 'Facebook'): salir('Red: Instagram, TikTok, YouTube o Facebook')
    if not re.fullmatch(r'https://[^\s\'"<>]+', a[2]): salir('La URL debe empezar por https://')
    s = sub1(a[1] + r": '[^']*'", f"{a[1]}: '{a[2]}'", s, 'CONFIG.redes.' + a[1])
else:
    print(__doc__); salir('Comando no reconocido o faltan datos.')

HTML.write_text(s, encoding='utf-8')
print('✔ Listo:', ' '.join(a), '\n  Ahora: node tools/test_site.js  y vuelve a publicar la web.')
