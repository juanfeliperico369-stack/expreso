// Pruebas de humo de index.html con Playwright (Chromium).
// Uso: node tools/test_site.js [--shots carpeta]
// Sale con código 1 si alguna prueba falla.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.resolve(__dirname, '..');
const shotsDir = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  ✔ ' : '  ✘ ') + msg); if (!cond) fails++; };

(async () => {
  await new Promise(r => server.listen(0, r));
  const URL = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();
  const errors = [];
  const watch = page => {
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
    page.on('requestfailed', r => { if (!/fonts\.(googleapis|gstatic)/.test(r.url())) errors.push('requestfailed: ' + r.url().slice(0, 80)); });
  };

  // ---------- Escritorio ----------
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  await ctx.addInitScript(() => { window.__wa = []; window.open = (u) => { window.__wa.push(u); return null; }; });
  const page = await ctx.newPage(); watch(page);
  await page.goto(URL, { waitUntil: 'load' });
  console.log('Carga y estructura');
  const n = await page.locator('#grid .card').count();
  ok(n === 21, `21 productos renderizados: 18 + 3 próximamente (${n})`);
  const blank = await page.$$eval('#grid img', ims => ims.filter(i => !i.src.startsWith('data:image/webp') || i.naturalWidth < 10).length);
  ok(blank === 0, `todas las fotos de producto cargan (${blank} sin foto)`);
  ok(await page.$$eval('img:not([alt])', x => x.length) === 0, 'toda <img> tiene alt');
  const dup = await page.$$eval('[id]', els => { const s = new Set(), d = []; els.forEach(e => s.has(e.id) ? d.push(e.id) : s.add(e.id)); return d; });
  ok(dup.length === 0, 'sin ids duplicados ' + (dup.length ? dup.join(',') : ''));
  ok(await page.$$eval('a[target=_blank]', as => as.every(a => /noopener/.test(a.rel))), 'enlaces externos con rel=noopener');
  ok(await page.$$eval('script[type="application/ld+json"]', s => s.every(x => { try { JSON.parse(x.textContent); return true; } catch (e) { return false; } }) && s.length >= 2), 'JSON-LD válido');
  if (shotsDir) await page.screenshot({ path: path.join(shotsDir, 'desk-cover.png') });

  console.log('Catálogo');
  await page.click('[data-chip="suplementos"]');
  ok(await page.locator('#grid .card').count() === 4, 'filtro Suplementos = 4');
  await page.click('[data-chip="accesorios"]');
  ok(await page.locator('#grid .card.soon').count() === 3 && await page.locator('#grid [data-add]').count() === 0, 'Accesorios = 3 próximamente, sin botón Agregar');
  ok(/wa\.me\/.*DS-PRENSA/.test(await page.getAttribute('#grid .card.soon a.btn', 'href')), 'Avísame abre WhatsApp con SKU');
  await page.click('[data-chip="todos"]');
  await page.fill('#q', 'chocolate'); await page.waitForTimeout(250);
  ok(await page.locator('#grid .card').count() === 3, 'búsqueda "chocolate" = 3');
  await page.fill('#q', 'zzzz'); await page.waitForTimeout(250);
  ok(await page.locator('#grid .empty').count() === 1, 'búsqueda sin resultados muestra aviso');
  await page.fill('#q', ''); await page.waitForTimeout(250);
  await page.selectOption('#orden', 'asc');
  const precios = await page.$$eval('#grid .precio b', b => b.map(x => x.textContent.replace(/\D/g, '')).filter(Boolean).map(Number));
  ok(precios.every((p, i) => i === 0 || precios[i - 1] <= p), 'orden por precio ascendente');
  await page.selectOption('#orden', 'rel');

  console.log('Ficha y carrito');
  await page.click('[data-open="tinto"]');
  ok(await page.isVisible('#ficha'), 'ficha abre');
  await page.click('[data-fq="1"]');
  await page.click('[data-addf="tinto"]');
  ok(!(await page.isVisible('#ficha')), 'ficha cierra al agregar');
  await page.click('[data-add="capsulas"]');
  ok((await page.textContent('#cartN')) === '3', 'contador del carrito = 3');
  await page.reload({ waitUntil: 'load' });
  ok((await page.textContent('#cartN')) === '3', 'carrito persiste tras recargar');
  await page.click('#cartBtn');
  ok(await page.isVisible('#cart'), 'carrito abre');
  ok((await page.textContent('#subT')).replace(/\D/g, '') === '628300', 'subtotal 2×147.900 + 332.500 = 628.300');
  await page.click('#sendBtn');
  ok((await page.evaluate(() => window.__wa.length)) === 0, 'no envía pedido sin nombre/ciudad');
  await page.fill('#pedido [name=nombre]', 'Ana Prueba');
  await page.fill('#pedido [name=ciudad]', 'Medellín');
  await page.click('#sendBtn');
  const wa = await page.evaluate(() => window.__wa[0] || '');
  const msg = decodeURIComponent(wa.split('text=')[1] || '');
  ok(wa.startsWith('https://wa.me/573000000000?text='), 'abre WhatsApp con el número configurado');
  ok(msg.includes('2 × Tinto Clásico [GX-TINTO]') && msg.includes('1 × Cápsulas de Ganoderma') && /Total: \$\s?628\.300/.test(msg) && msg.includes('Medellín'), 'mensaje del pedido completo');
  if (shotsDir) await page.screenshot({ path: path.join(shotsDir, 'desk-cart.png') });
  await page.keyboard.press('Escape');
  await page.click('#cartBtn');
  await page.click('[data-q="capsulas"][data-d="-1"]');
  ok((await page.textContent('#cartN')) === '2', 'restar cantidad actualiza contador');
  await page.keyboard.press('Escape');

  console.log('Tema, quiz y formularios');
  const t0 = await page.getAttribute('html', 'data-theme');
  await page.click('#temaBtn');
  const t1 = await page.getAttribute('html', 'data-theme');
  ok(t0 !== t1, `cambia tema ${t0} → ${t1}`);
  await page.reload({ waitUntil: 'load' });
  ok((await page.getAttribute('html', 'data-theme')) === t1, 'tema persiste');
  const nq = await page.evaluate(() => document.querySelectorAll('#ev .evc').length);
  ok(nq >= 6, `tarjetas de evidencia (${nq})`);
  if (await page.isVisible('#quiz')) {
    let i = 0;
    while (await page.locator('[data-qa]').count() && i < 20) { await page.click('[data-qa="Mito"]'); await page.click('[data-qn]'); i++; }
    ok(/Acertaste \d+ de \d+/.test(await page.textContent('#quiz')), `quiz completo (${i} preguntas)`);
  } else ok(false, 'quiz visible');
  await page.evaluate(() => { window.__wa = []; });
  await page.fill('#clubForm [name=nombre]', 'Luis'); await page.fill('#clubForm [name=ciudad]', 'Cali');
  await page.click('#clubForm [type=submit]');
  ok((await page.evaluate(() => window.__wa.length)) === 0, 'club exige autorización de datos');
  await page.check('#clubForm [name=ok]'); await page.click('#clubForm [type=submit]');
  ok((await page.evaluate(() => window.__wa.length)) === 1, 'club abre WhatsApp');
  await page.click('footer [data-legal="datos"]');
  ok(/Ley 1581/.test(await page.textContent('#legal')), 'política de datos abre');
  await page.keyboard.press('Escape');
  await ctx.close();

  // ---------- Móvil, todos los temas ----------
  console.log('Móvil 375px');
  for (const tema of ['revista', 'cafe', 'bosque', 'contraste']) {
    const c = await browser.newContext({ viewport: { width: 375, height: 760 }, isMobile: true, hasTouch: true });
    await c.addInitScript(t => { try { localStorage.setItem('expreso.tema', JSON.stringify(t)); } catch (e) {} }, tema);
    const p = await c.newPage(); watch(p);
    await p.goto(URL, { waitUntil: 'load' });
    const sw = await p.evaluate(() => document.documentElement.scrollWidth);
    ok(sw <= 375, `${tema}: sin scroll horizontal (${sw}px)`);
    if (tema === 'revista') {
      await p.click('#menuBtn'); ok(await p.isVisible('#links a[href="#catalogo"]'), 'menú móvil abre');
      await p.click('#links a[href="#catalogo"]'); ok(!(await p.isVisible('#links a[href="#ciencia"]')), 'menú móvil cierra al navegar');
      const small = await p.$$eval('button:not(.sr):not(.linkb), .btn', bs => bs.filter(b => { const r = b.getBoundingClientRect(); return r.width && r.height && r.height < 40; }).map(b => b.textContent.trim().slice(0, 20)));
      ok(small.length === 0, 'botones táctiles ≥ 40px ' + small.join('|'));
    }
    if (shotsDir) { await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(150); await p.screenshot({ path: path.join(shotsDir, `m-${tema}.png`) }); }
    await c.close();
  }

  ok(errors.length === 0, 'sin errores de consola/red ' + (errors.length ? '\n    ' + errors.join('\n    ') : ''));
  await browser.close(); server.close();
  console.log(fails ? `\n${fails} prueba(s) fallaron` : '\nTodas las pruebas pasaron');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
