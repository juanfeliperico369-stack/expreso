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
  await ctx.addInitScript(() => { window.__wa = []; window.open = (u) => { window.__wa.push(u); return {}; }; });
  const page = await ctx.newPage(); watch(page);
  await page.goto(URL, { waitUntil: 'load' });
  console.log('Carga y estructura');
  const n = await page.locator('#grid .card').count();
  ok(!(await page.isVisible('#waSheet')), 'botón de respaldo de WhatsApp oculto al cargar');
  await page.click('#cartBtn'); ok(!(await page.isVisible('#pedido')), 'carrito vacío oculta el formulario de pedido'); await page.keyboard.press('Escape');
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
  for (const [q, n, inc] of [['reishi', 18, ''], ['pelo', 2, 'Shampoo'], ['te', 1, 'Rooibos'], ['cafe sin azucar', 3, 'Tinto']]) {
    await page.fill('#q', q); await page.waitForTimeout(250);
    const c = await page.locator('#grid .card').count();
    ok(c === n && (!inc || (await page.textContent('#grid')).includes(inc)), `búsqueda "${q}" = ${n} (${c})`);
  }
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
  ok(/^https:\/\/wa\.me\/\d*\?text=/.test(wa), 'abre WhatsApp con el pedido (número de CONFIG)');
  ok(msg.includes('2 × Tinto Clásico [GX-TINTO]') && msg.includes('1 × Cápsulas de Ganoderma') && /Total: \$\s?628\.300/.test(msg) && msg.includes('Medellín'), 'mensaje del pedido completo');
  if (shotsDir) await page.screenshot({ path: path.join(shotsDir, 'desk-cart.png') });
  await page.keyboard.press('Escape');
  await page.click('#cartBtn');
  await page.click('[data-q="capsulas"][data-d="-1"]');
  ok((await page.textContent('#cartN')) === '2', 'restar cantidad actualiza contador');
  await page.evaluate(() => { window.__open = window.open; window.open = () => null; });
  await page.click('#sendBtn');
  ok(await page.isVisible('#waSheetA') && /^https:\/\/wa\.me\//.test(await page.getAttribute('#waSheetA', 'href')), 'si se bloquea la ventana, aparece botón "Abrir WhatsApp"');
  await page.click('#waSheetX'); await page.evaluate(() => { window.open = window.__open; });
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

  // ---------- v0.3: recomendador, referidos/UTM, enlace directo, vendedor ----------
  console.log('Recomendador, referidos y enlaces');
  const c3 = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  await c3.addInitScript(() => { window.__wa = []; window.open = (u) => { window.__wa.push(u); return {}; }; });
  const p3 = await c3.newPage(); watch(p3);
  await p3.goto(URL + '?ref=Ana&utm_source=ig&utm_campaign=mitos', { waitUntil: 'load' });
  await p3.click('#reco [data-ro="0"]'); await p3.click('#reco [data-ro="1"]'); await p3.click('#reco [data-ro="0"]');
  ok(/Tinto Clásico/.test(await p3.textContent('#reco')), 'recomendador: Café → Sin azúcar → Negro = Tinto');
  await p3.click('#reco [data-add="tinto"]');
  ok((await p3.textContent('#cartN')) === '1', 'agregar desde el recomendador');
  await p3.click('#reco [data-ro="inicio"]');
  ok(/¿Cómo lo prefieres\?/.test(await p3.textContent('#reco')), 'recomendador reinicia');
  await p3.click('#cartBtn');
  await p3.fill('#pedido [name=nombre]', 'Leo'); await p3.fill('#pedido [name=ciudad]', 'Bogotá');
  await p3.check('#pedido [name=mes]'); await p3.click('#sendBtn');
  const m3 = decodeURIComponent((await p3.evaluate(() => window.__wa[0] || '')).split('text=')[1] || '');
  ok(m3.includes('Recomendado por: Ana') && m3.includes('Origen: ig / mitos') && m3.includes('cada mes'), 'pedido incluye referido, origen UTM y pedido mensual');
  await p3.keyboard.press('Escape');
  await p3.fill('#refForm [name=ref]', 'Ana María'); await p3.click('#refForm [type=submit]');
  ok(/\?ref=Ana%20Mar%C3%ADa/.test(await p3.textContent('#refOut')), 'genera enlace de referido');
  await p3.goto(URL + '#p-mocha', { waitUntil: 'load' });
  ok(await p3.isVisible('#ficha') && /Mocha Rico/.test(await p3.textContent('#ficha')), 'enlace directo #p-mocha abre la ficha');
  ok(await p3.locator('#ficha [data-share="mocha"]').count() === 1, 'ficha tiene botón Compartir');
  await p3.keyboard.press('Escape'); await p3.waitForTimeout(150);
  ok(!(await p3.evaluate(() => location.hash)), 'cerrar ficha limpia el enlace');
  await p3.goto(URL + 'index.html#vendedor', { waitUntil: 'load' });
  ok(await p3.isVisible('#vendedor') && /\$\s?27\.19\d/.test(await p3.textContent('#vendOut')), 'calculadora del vendedor: utilidad antes de pauta = $27.194');
  await p3.fill('#vendForm [name=ent]', '60');
  ok(/\$\s?8\.316/.test(await p3.textContent('#vendOut')), 'calculadora recalcula con 60 % de entrega');
  await p3.keyboard.press('Escape'); await p3.waitForTimeout(150);
  const k0 = Number(await p3.textContent('#cartN'));
  ok(await p3.locator('#kits .kit').count() === 4, 'combos: 4 visibles');
  await p3.click('[data-kit="desayuno"]');
  ok(Number(await p3.textContent('#cartN')) === k0 + 2, 'agregar combo suma sus 2 productos');
  ok(/180 mg/.test(await p3.textContent('#cafRes')), 'calculadora de cafeína: ejemplo 2 cafés = 180 mg');
  await p3.click('[data-cf="1"][data-cd="1"]');
  ok((await p3.textContent('#cafTot')) === '260 mg', 'sumar un espresso = 260 mg');
  await p3.check('#cafEmb');
  ok(/de 200 mg/.test(await p3.textContent('#cafRes')) && await p3.locator('#cafRes .bar.over').count() === 1, 'embarazo: límite 200 mg y aviso de exceso');
  await p3.setViewportSize({ width: 1000, height: 800 });
  ok(await p3.evaluate(() => document.documentElement.scrollWidth) <= 1000, 'sin scroll horizontal a 1000px (menú de escritorio)');
  ok(await p3.locator('.art details').count() === 3, 'revista: 3 artículos');
  await p3.click('#a-cafeina summary');
  ok(/400 mg/.test(await p3.textContent('#a-cafeina details')) && await p3.isVisible('#a-cafeina details p'), 'artículo se despliega');
  await c3.close();

  const c4 = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  await c4.addInitScript(() => { try { if (!sessionStorage.getItem('x')) { localStorage.setItem('expreso.ultimo', JSON.stringify({ mocha: 2, prensa: 1, nada: 3 })); sessionStorage.setItem('x', '1'); } } catch (e) {} });
  const p4 = await c4.newPage(); watch(p4); await p4.goto(URL, { waitUntil: 'load' });
  await p4.click('#cartBtn');
  ok(await p4.isVisible('[data-repetir]'), 'carrito vacío ofrece "Repetir mi último pedido"');
  await p4.click('[data-repetir]');
  ok((await p4.textContent('#cartN')) === '2', 'repetir carga solo productos vendibles (2 × Mocha)');
  await c4.close();

  console.log('Operación: agotado, promo, recordatorio');
  const c5 = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  await c5.addInitScript(() => { try { if (!sessionStorage.getItem('y')) { localStorage.setItem('expreso.cart', JSON.stringify({ latte: 2 })); localStorage.setItem('expreso.visto', JSON.stringify(Date.now() - 48 * 3600e3)); sessionStorage.setItem('y', '1'); } } catch (e) {} });
  const p5 = await c5.newPage(); watch(p5); await p5.goto(URL, { waitUntil: 'load' }); await p5.waitForTimeout(1200);
  ok(/Tu pedido te espera: 2 productos/.test(await p5.textContent('#toast')), 'recordatorio de carrito al volver después de 48 h');
  ok(!(await p5.isVisible('#promo')), 'sin promo configurada no se muestra la franja');
  await p5.evaluate(() => { const E = window.EXPRESO; E.PRODUCTOS.find(p => p.id === 'latte').estado = 'agotado'; E.CONFIG.promo = { texto: 'Envío gratis esta semana', hasta: '2099-12-31' }; E.rerender(); });
  ok(/Envío gratis esta semana/.test(await p5.textContent('#promo')) && await p5.isVisible('#promo'), 'promo vigente visible');
  ok(await p5.locator('[data-open="latte"] .card-tag', { hasText: 'Agotado' }).count() === 1 && await p5.locator('[data-add="latte"]').count() === 0, 'producto agotado: etiqueta y sin botón Agregar');
  ok((await p5.textContent('#cartN')) === '0' || (await p5.isHidden('#cartN')), 'agotado sale del carrito');
  ok(await p5.locator('#kits [data-kit="diaynoche"]').count() === 0, 'combo con producto agotado se oculta');
  ok(!(await p5.isVisible('#who')), 'sin vendedor configurado no aparece "Te atiende"');
  await p5.evaluate(() => { window.EXPRESO.CONFIG.vendedor = { nombre: 'Juan Pérez', ciudad: 'Medellín', frase: 'Te ayudo a elegir.' }; window.EXPRESO.rerender(); });
  ok(/JP/.test(await p5.textContent('#who i')) && /Juan Pérez/.test(await p5.textContent('#who')) && /Medellín/.test(await p5.textContent('#who')), 'bloque "Te atiende" con iniciales, nombre y ciudad');
  await p5.evaluate(() => { window.EXPRESO.CONFIG.promo = { texto: 'Vieja', hasta: '2020-01-01' }; window.EXPRESO.rerender(); });
  ok(!(await p5.isVisible('#promo')), 'promo vencida se oculta sola');
  await c5.close();

  console.log('Analítica con consentimiento');
  const c6 = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  await c6.route(/googletagmanager\.com|connect\.facebook\.net/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  const p6 = await c6.newPage(); watch(p6); await p6.goto(URL, { waitUntil: 'load' });
  ok(!(await p6.isVisible('#cookies')) && !(await p6.isVisible('#ckPref')), 'sin IDs de analítica: ni banner ni cookies');
  await p6.evaluate(() => { window.EXPRESO.CONFIG.analitica = { ga4: 'G-TEST1234', metaPixel: '1234567890' }; window.EXPRESO.consentimiento(); });
  ok(await p6.isVisible('#cookies') && !(await p6.evaluate(() => !!window.gtag)), 'con IDs: banner visible y nada cargado antes de aceptar');
  await p6.click('[data-ck="si"]');
  ok(await p6.evaluate(() => !!window.gtag && !!window.fbq && !!document.querySelector('script[src*="googletagmanager.com/gtag/js?id=G-TEST1234"]')), 'al aceptar carga GA4 y Meta Pixel');
  await p6.click('[data-add="tinto"]');
  ok(await p6.evaluate(() => [...window.dataLayer].some(a => a[0] === 'event' && a[1] === 'add_to_cart' && a[2].items[0].item_id === 'GX-TINTO') && window.fbq.queue.some(a => a[0] === 'track' && a[1] === 'AddToCart')), 'evento add_to_cart / AddToCart con SKU');
  await p6.click('#ckPref'); ok(await p6.isVisible('#cookies'), 'Preferencias de cookies reabre el banner');
  await c6.close();

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
      await p.click('[data-add="latte"]');
      ok(await p.isVisible('#miniCart'), 'barra de pedido visible en móvil al agregar');
      const ov = await p.evaluate(() => { const a = document.querySelector('#miniCart').getBoundingClientRect(), b = document.querySelector('#waFloat').getBoundingClientRect(); return a.right > b.left && a.bottom > b.top; });
      ok(!ov, 'barra de pedido no tapa el botón de WhatsApp');
    }
    if (shotsDir) { await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(150); await p.screenshot({ path: path.join(shotsDir, `m-${tema}.png`) }); }
    await c.close();
  }

  let axePath = null; try { axePath = require.resolve('axe-core/axe.min.js', { paths: [ROOT] }); } catch (e) {}
  if (axePath) {
    console.log('Accesibilidad (axe-core)');
    const axeSrc = fs.readFileSync(axePath, 'utf8');
    for (const tema of ['revista', 'cafe', 'bosque', 'contraste']) {
      const c = await browser.newContext({ viewport: { width: 375, height: 800 }, reducedMotion: 'reduce' });
      await c.addInitScript(t => { try { localStorage.setItem('expreso.tema', JSON.stringify(t)); } catch (e) {} }, tema);
      const p = await c.newPage(); await p.goto(URL, { waitUntil: 'load' });
      await p.evaluate(() => document.querySelectorAll('.rv').forEach(e => e.classList.add('in')));
      await p.addScriptTag({ content: axeSrc });
      const v = await p.evaluate(async () => (await axe.run(document, { resultTypes: ['violations'] })).violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => v.id + '×' + v.nodes.length));
      ok(v.length === 0, `${tema}: sin fallas graves de accesibilidad ${v.join(' ')}`);
      await c.close();
    }
  } else console.log('  (axe-core no instalado: corre "npm install" para incluir la auditoría de accesibilidad)');
  ok(errors.length === 0, 'sin errores de consola/red ' + (errors.length ? '\n    ' + errors.join('\n    ') : ''));
  await browser.close(); server.close();
  console.log(fails ? `\n${fails} prueba(s) fallaron` : '\nTodas las pruebas pasaron');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
