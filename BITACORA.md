# BITÁCORA · Proyecto EXPRESO

> **Archivo de traspaso.** Si eres una IA (o una persona) que continúa este proyecto, lee esto primero. Aquí está el contexto completo, las decisiones tomadas, cómo editar todo y qué falta. **Actualiza el "Registro de sesiones" cada vez que cambies algo.**

---

## 1. Qué es Expreso

- **Dueño:** Juan Felipe (Colombia). Habla español; quiere respuestas cortas y trabajo "quirúrgico", sin gastar uso de más.
- **Negocio:** tienda online de **café y productos con Ganoderma lucidum (reishi) de Gano Excel**. Un amigo del dueño ya es distribuidor y le consigue los productos más baratos.
- **Modelo, fase 1 (actual):** reventa. El cliente pide en la web → el pedido llega por WhatsApp → el dueño compra el producto en Gano Excel → lo envía → gana el margen.
- **Modelo, fase 2:** entrar de lleno al multinivel de Gano Excel (Ley 1700 de 2013). Llegaría con capital y con una base de clientes a la que ofrecerle la oportunidad de ser socios.
- **Nicho:** Ganoderma, café y bienestar. La web debe aceptar **otros productos y nichos** más adelante.
- **Marketing:** contenido educativo y creativo, videos cortos hechos con IA (y monetizarlos), redes sociales dedicadas y anuncios pagados.
- **Guía de negocio completa:** `GUIA-NEGOCIO.md` (marketplaces, costos, pagos, envíos, publicidad, redes, videos con IA, legal, nichos de expansión, plan de 90 días).
- **Evidencia científica:** `docs/EVIDENCIA.md` (PubMed, Cochrane, ClinicalTrials.gov).

## 2. Archivos

| Archivo | Para qué |
|---|---|
| `index.html` | **La web completa en un solo archivo** (HTML + CSS + JS + imágenes en base64 al final). Sin dependencias, salvo Google Fonts. |
| `assets/img/*.webp` | Fotos originales optimizadas. `p-<id>` = producto, `h-<nombre>` = foto de sección. |
| `tools/inline_imgs.py` | Vuelve a meter las fotos de `assets/img/` dentro de `index.html`. Correr después de agregar o cambiar fotos. |
| `package.json` | `npm install` instala axe-core, y entonces `npm test` también audita la accesibilidad de los 4 temas. |
| `tools/test_site.js` | Pruebas automáticas con Playwright. `node tools/test_site.js` (opcional `--shots carpeta` para capturas). |
| `tools/set_domain.py` | `python3 tools/set_domain.py https://tu-dominio.com` llena canonical/og:image en `index.html` y crea `robots.txt` + `sitemap.xml`. |
| `_headers` | Cabeceras de seguridad y caché (Cloudflare Pages / Netlify las aplican solas). |
| `assets/og.jpg` | Imagen de 1200×630 que aparece al compartir el enlace (WhatsApp, Facebook). |
| `GUIA-NEGOCIO.md` | Estrategia y costos del negocio online. |
| `docs/GUIONES-VIDEOS.md` | 10 guiones de video (gancho, desarrollo, cierre, enlace con UTM) y calendario de 2 semanas. |
| `docs/EVIDENCIA.md` | Resumen científico con referencias verificadas y reglas de publicidad honesta. |
| `BITACORA.md` | Este archivo. |

**Material fuente que entregó el dueño** (no está en el repo):
- `CATA_LOGO_FINAL.pdf`: catálogo de 18 páginas del distribuidor "Visión Continental · Healthy Coffee". De ahí salen las fotos y los precios sugeridos. Estética: verde bosque oscuro, blanco, serif fina, fotos de estilo de vida.
- Volantes de Gano Excel: "Modelo de negocio", con el plan de compensación (ESP1 $900.000, ESP2 $2.250.000, ESP3 $4.500.000, GEN5 y binario), datos de la compañía y códigos INVIMA.
- `EVOLUCION_MUSICAL.pdf`: revista escolar que **solo sirve de referencia estética**. Titulares condensados enormes en azul petróleo superpuestos a una foto; bandas teal y crema; páginas amarillo pálido; cajas con marco negro y letras muy espaciadas ("SESIÓN 1: ESCUCHAR & OÍR"); sección gris con texto en contorno y un número gigante; marcos punteados; itálica serif roja.
- `index-13.html`: juego del dueño ("INDUSTRY ART") que adaptó esa estética. De ahí se tomó el **sistema de temas intercambiables** (oscuro/claro/sepia/neón/contraste), las tarjetas con una esquina recortada y los botones táctiles de 44 px.

## 3. Sistema de diseño

- **Temas** (`<html data-theme>`), con selector en la barra superior y en el pie. Se guarda en `localStorage` (`expreso.tema`).
  - `revista` (por defecto): crema `#fffdf5`, amarillo `#fbe8a8`, gris `#a6abb1`, azul petróleo `#134a72`, teal `#0f7470`, rojo `#c23a2a`.
  - `cafe` (por defecto si el sistema está en modo oscuro): marrón oscuro con dorado `#e6b866`.
  - `bosque`: el verde del catálogo `#0e2418` con crema y tostado.
  - `contraste`: negro, blanco y amarillo, para accesibilidad.
- **Tokens:** `--bg --paper --paper2 --card --ink --muted --brand --teal --accent --band --bandInk --line --onBrand --imgbg`. **Nunca pongas colores fijos**: usa siempre los tokens.
- **Fuentes** (Google Fonts): `Bebas Neue` para titulares de revista (`--fd`), `Montserrat` para el cuerpo y las etiquetas espaciadas (`--fs`), `Libre Baskerville` para las entradillas y la itálica roja (`--fserif`).
- **Piezas:** `.sh` (caja "SESIÓN N:" con marco), `.big` (titular gigante con contorno del color de fondo), `.obox` (caja con texto en contorno y número gigante), `.dash` (marco punteado), `.fact`/`.evc` (tarjetas con una esquina recortada), `.ticker` (cinta animada), `.btn`/`.btn-a`/`.chip`.
- **Accesibilidad:** objetivos táctiles de 44 px o más, `:focus-visible`, `prefers-reduced-motion`, `<dialog>` nativo (atrapa el foco y cierra con Esc), enlace "saltar al contenido", textos `alt`.

## 4. Cómo editar (todo está al inicio del `<script>` en `index.html`)

1. **`CONFIG`**: número de WhatsApp (**hoy está vacío: REEMPLAZAR**, ej. `573001234567`), costo de envío (`null` = "se confirma según ciudad"), envío gratis desde, tiempo de envío, métodos de pago y URL de redes.
2. **`PRODUCTOS`**: un objeto por producto (`id, cat, nombre, linea, precio, tag, desc, contiene[], uso, nota, invima`, y opcionalmente `proveedor`, `sku`, `estado`).
   - `proveedor`: `'gano'` (reventa Gano Excel, el valor por defecto) o `'drop'` (dropshipping). Están definidos en **`PROVEEDORES`**.
   - `sku`: si no lo pones, se arma solo (`GX-TINTO`, `DS-PRENSA`). **El SKU sale en el mensaje de WhatsApp** del pedido: así sabes a quién comprarle cada producto.
   - `estado:'proximamente'` + `precio:null`: el producto se muestra con el botón "Avísame" (abre WhatsApp con el SKU) y no entra al carrito. Sirve para **medir la demanda antes de conseguir proveedor**.
   Para un producto nuevo: copia un objeto, guarda la foto como `assets/img/p-<id>.webp` (unos 440 px, WebP) y corre `python3 tools/inline_imgs.py`.
3. **`CATS`**: categorías. Si agregas una, agrega también un chip; el banner de foto es opcional.
4. **`CIENCIA`, `MITOS`, `SEGURIDAD`**: entre los marcadores `/* <CIENCIA> */`. Su fuente es `docs/EVIDENCIA.md`. **Solo citas verificadas.**
5. **`VIDEOS`**: pega la URL de cada video de TikTok, Reels o YouTube en `url` y la tarjeta cambia de "Pronto" a "Ver".
6. **`FAQ`** y **`LEGAL`**: textos de preguntas frecuentes, política de datos y retracto.
7. **Después de editar**, corre `node tools/test_site.js`. Debe terminar en "Todas las pruebas pasaron".
9. **`KITS`**: combos (`id`, `nombre`, `items[]`, `desc`). El total es la suma de los productos y "Agregar combo" los suma al carrito. No tiene descuento porque el carrito es por producto. Si algún día quieres descuento, hay que guardar el combo como una línea propia del carrito.
10. **`SINONIMOS`**: palabras que la gente escribe y la del catálogo a la que equivalen (reishi→ganoderma, pelo→cabello, té→infusión…). El buscador exige que aparezcan todas las palabras.
8. **`RECO`**: el árbol del recomendador "¿Cuál es para ti?". Cada opción lleva a otro paso (texto) o a una lista de ids de productos.

### Enlaces útiles para marketing (v0.3)
- **Enlace directo a un producto:** `https://TU-DOMINIO/#p-<id>`, por ejemplo `#p-mocha`. Abre la ficha. Sirve para la bio, las descripciones de los videos y los anuncios. La ficha tiene el botón **Compartir**.
- **Medir de dónde vienen los pedidos (sin analítica):** agrega `?utm_source=instagram&utm_campaign=reel-mitos` al enlace que publiques. El pedido de WhatsApp llega con "Origen: instagram / reel-mitos". Se guarda en el navegador del cliente, así que también cuenta si compra días después.
- **Referidos:** `?ref=Nombre`. El pedido llega con "Recomendado por: Nombre". En la sección Club el cliente crea su propio enlace. Es la base para la fase 2: saber quién trae clientes y quién podría ser socio.
- **Panel del vendedor:** `https://TU-DOMINIO/#vendedor`. Es una calculadora de margen (precio, costo, envío, devolución, comisión, CPA y % de entrega) que da la utilidad por pedido, el máximo a pagar en anuncios y el ROAS de equilibrio. No está enlazada en la web pública y los datos se quedan en el navegador. **Nunca escribas costos reales en el código: la página es pública.**
- **Pedido mensual:** el cliente marca "Quiero recibirlo cada mes" y el pedido llega con "Frecuencia: quiero recibirlo cada mes". Haz el seguimiento con etiquetas de WhatsApp Business.
- **Envío gratis:** si pones un valor en `CONFIG.envioGratisDesde`, el carrito muestra una barra de "Te faltan $X para envío gratis".

## 5. Decisiones tomadas (y por qué)

- **Un solo HTML** (lo pidió el dueño). Las imágenes van en base64 en un bloque JSON al final, para que el código siga siendo legible.
- **El pedido se cierra por WhatsApp**, sin pasarela de pagos: no requiere servidor, cuesta $0 y permite conversar con el cliente, que es justo lo que el dueño quiere para convertir clientes en socios. Más adelante: links de pago de Wompi o Mercado Pago (ver la guía).
- **Promesas de salud reescritas.** El catálogo original promete curar cáncer, diabetes, lupus, Alzheimer, etc. Eso **está prohibido** para suplementos en Colombia (INVIMA) y Cochrane no lo respalda. La web solo describe composición, uso y sabor, y la sección "Ciencia" cuenta la evidencia real. El dueño lo aprobó. **No volver a meter promesas terapéuticas.**
- **La "Oportunidad" va sin cifras de ingresos.** Solo explica el proceso, cita la Ley 1700 y deja claro que los ingresos no están garantizados (como dice el propio plan de Gano Excel).
- **Aviso de independencia:** "Expreso es un distribuidor independiente; no es Gano Excel S.A." No usar el logo de Gano Excel como si fuera la marca propia.
- **Fotos tomadas del catálogo de "Visión Continental".** ⚠️ Falta confirmar el permiso de uso (a través del amigo del dueño). Si no hay permiso, reemplazarlas por fotos propias.
- **Códigos INVIMA** copiados del volante de Gano Excel. ⚠️ Verificarlos en https://consultaregistro.invima.gov.co (sobre todo Excellium `SD2014-0003368`, que en el volante sale cortado como "D2014-…"). Shoko Rico, Gano Soap, Transparent Soap y Reskine no tenían código en el material.
- **Precios** = "precio sugerido" del catálogo, en noviembre de 2026.
- **El dropshipping cabe en el mismo catálogo.** Los productos de Gano Excel son reventa; los accesorios (prensa francesa, termo, taza) son de prueba para dropshipping, con estado "Próximamente" y sin precio inventado hasta confirmar el proveedor (por ejemplo, Dropi). La estrategia completa está en `GUIA-NEGOCIO.md`, sección 2b.
- **Ciencia:** las 11 citas de la web están verificadas en PubMed (la de la EFSA va por DOI). Los textos se escribieron de nuevo de forma honesta. Resumen y fuentes: `docs/EVIDENCIA.md`.

## 6. Pendientes (por prioridad)

1. ⚠️ Poner el número real de WhatsApp en `CONFIG.whatsapp` (hoy está vacío: el cliente elige el chat y ve un aviso de vista previa).
2. ⚠️ Confirmar el permiso de las fotos y los códigos INVIMA.
3. Publicar (15 min): comprar un dominio → Cloudflare Pages → "Create project" → conectar este repo de GitHub (rama principal, sin comando de build, carpeta raíz `/`) → agregar el dominio personalizado → correr `python3 tools/set_domain.py https://tu-dominio.com`, hacer commit y push. **No usar GitHub Pages** (sus términos prohíben tiendas online).
4. Definir la tarifa de envío (`CONFIG.envio`) y los tiempos reales de la transportadora.
4b. Dropshipping: abrir una cuenta en la plataforma elegida, escoger 3 a 5 accesorios, poner `precio` y foto (`assets/img/p-<id>.webp`) y quitar `estado:'proximamente'`.
5. Crear las redes y pegar sus URL en `CONFIG.redes`. Publicar los primeros videos y pegar sus URL en `VIDEOS`.
6. Revisar la política de distribuidores de Gano Excel: ¿se puede vender en Mercado Libre o redes? ¿hay precio mínimo?
7. Analítica: Google Analytics 4 o Plausible, y el píxel de Meta (requiere aviso de cookies).
8. Captación de correos (Brevo o MailerLite) y ofrecer un formulario real además de WhatsApp.
9. Fase 2: páginas por producto (SEO), blog/revista y reseñas reales de clientes. Los referidos ya funcionan con `?ref=`.
10. Kits o combos con descuento (por ejemplo Desayuno: Tinto + C'Real) cuando el dueño confirme sus márgenes con la calculadora `#vendedor`.

## 7. Prompt de traspaso (cópialo a la próxima IA)

```
Eres el programador web del proyecto "Expreso" (repo juanfeliperico369-stack/expreso).
Lee primero BITACORA.md (contexto, decisiones, cómo editar, pendientes) y GUIA-NEGOCIO.md.
Reglas: español, respuestas cortas, un solo index.html, usa los tokens de color de los temas,
no agregues promesas terapéuticas (ver docs/EVIDENCIA.md), corre `node tools/test_site.js`
antes de cada commit y agrega una entrada al "Registro de sesiones" de BITACORA.md.
Tarea de hoy: <...>
```

---

## 8. Registro de sesiones

### Sesión 1 · 2026-11-05 · v0.1 (primera versión)
1. Se creó `index.html` con portada estilo revista y 4 temas (Revista, Café, Bosque, Contraste).
2. Secciones: Ganoderma, Catálogo (18 productos: filtros, búsqueda, orden, ficha), Ciencia (evidencia + quiz "¿Mito o realidad?" + seguridad), Ritual + Expreso TV, Oportunidad, Club + preguntas frecuentes, pie legal.
3. Carrito guardado en el navegador, con pedido armado automáticamente hacia WhatsApp (nombre, ciudad, dirección y pago) y botón flotante de WhatsApp.
4. Política de datos (Ley 1581), retracto (Ley 1480), aviso INVIMA y aviso de distribuidor independiente.
5. Las 25 fotos del catálogo se convirtieron a WebP (363 KB) y se incrustaron con `tools/inline_imgs.py`.
6. SEO: meta, Open Graph, JSON-LD (Store + ItemList de productos).
7. Investigación con subagentes: `docs/EVIDENCIA.md` (PubMed, Cochrane, ClinicalTrials.gov) y `GUIA-NEGOCIO.md`.
8. Probado con `tools/test_site.js`: carga sin errores, 18 productos con foto, filtros, búsqueda, orden, carrito y subtotal, persistencia, mensaje de WhatsApp, temas, quiz, formularios, política de datos, sin scroll horizontal a 375 px en los 4 temas, botones de 40 px o más.
9. Falta: número de WhatsApp real, dominio y hosting, permisos de fotos, verificar INVIMA, redes, videos, analítica.
10. Próximo paso sugerido: publicar en Cloudflare Pages con un dominio .com o .co y crear Instagram, TikTok y WhatsApp Business.

### Sesión 2 · 2026-11-05 · v0.2 (ciencia + dropshipping)
1. Se integró la evidencia verificada (10 tarjetas, quiz de 6 mitos y realidades, 4 avisos de seguridad) entre los marcadores `/* <CIENCIA> */`.
2. Se comprobaron las 11 citas de PubMed vía E-utilities: todas existen y coinciden en tema y año.
3. Modelo de producto listo para dropshipping: `PROVEEDORES` (`gano` = GX, `drop` = DS), `sku` automático y `estado:'proximamente'`.
4. El mensaje de pedido por WhatsApp incluye el SKU de cada línea, para saber a qué proveedor comprarle.
5. Nueva categoría "Accesorios" con 3 productos "Próximamente" (prensa francesa, termo, taza) y botón "Avísame".
6. Los chips solo muestran categorías con productos; el orden por precio deja al final los "Por confirmar"; el JSON-LD solo incluye productos vendibles.
7. Los productos sin foto muestran el ícono de taza.
8. Corrección: la ficha de producto se veía mal en escritorio (las columnas usan ahora `minmax(0,…)`).
9. Se agregó a `GUIA-NEGOCIO.md` la sección "2b. Dropshipping en Colombia".
10. Pruebas: `node tools/test_site.js` pasa completo (21 productos, filtro de accesorios, Avísame con SKU, evidencia, quiz y todo lo de v0.1).

### Sesión 3 · 2026-11-05 · v0.3 (conversión y medición)
1. Recomendador "¿Cuál es para ti?" en el catálogo: un árbol de 2 a 3 preguntas (`RECO`) que termina en productos con los botones Agregar y Ver.
2. Enlaces directos a productos (`#p-<id>`) y botón Compartir en la ficha. Usa Web Share o, si no está disponible, copia el enlace.
3. Medición sin analítica: `?utm_source`, `?utm_campaign` y `?ref` se guardan en el navegador y salen en el mensaje del pedido y del Club.
4. Programa de referidos: el cliente genera su enlace `?ref=Nombre` desde la sección Club.
5. Opción "Quiero recibirlo cada mes" en el carrito, para fomentar la recompra.
6. Barra fija "Ver pedido (n) · $total" en móvil cuando hay productos; el botón de WhatsApp pasa a ser solo ícono en pantallas de 900 px o menos.
7. Barra de envío gratis, que solo aparece si se configura `CONFIG.envioGratisDesde`.
8. Bloque "01 Elige · 02 Envía · 03 Recibe" bajo el catálogo, para generar confianza.
9. Panel interno `#vendedor`: calculadora de margen y ROAS de equilibrio, con la misma lógica de la guía §2b.
10. Pruebas: 49 verificaciones de `tools/test_site.js` pasan, con nuevas pruebas para cada función y sin errores de consola.

### Sesión 4 · 2026-11-05 · v0.4 (contenido + listo para publicar)
1. "Revista Expreso · Edición 01" en la sección Ritual: 3 artículos que se despliegan (`<details>`, texto en el HTML para que Google lo lea): hongo vs micelio, límites de cafeína (EFSA) y cómo leer el código INVIMA.
2. Las fuentes de Google ya no bloquean la carga (`media="print" onload`, con `<noscript>` de respaldo).
3. `tools/set_domain.py`: un comando deja listo el SEO del dominio (canonical, og:url, og:image, twitter:card, robots.txt, sitemap.xml). Valida el formato del dominio y se puede repetir.
4. `_headers`: nosniff, Referrer-Policy, Permissions-Policy, HSTS, CSP `frame-ancestors 'none'` y caché de assets por 7 días.
5. `assets/og.jpg` (1200×630, 83 KB) con la estética de la portada, para la vista previa en WhatsApp y redes.
6. Se probó `set_domain.py` en una copia: idempotente y rechaza dominios inválidos o sin https.
7. Nuevas pruebas: 3 artículos que se despliegan y sin scroll horizontal a 1000 px (menú de escritorio).
8. `node tools/test_site.js`: todas las pruebas pasan.
9. Falta: publicar con el dominio real y correr `set_domain.py`.
10. Siguiente: más artículos de la revista (uno por cada video publicado) y combos cuando estén los márgenes.

### Sesión 5 · 2026-11-05 · v0.5 (vista previa en línea + robustez)
1. Vista previa privada publicada en claude.ai: https://claude.ai/artifact/JYHQQ42px3Xf7MaPqSx55i. Es una copia de `index.html` sin la envoltura `<html>`, `<head>` ni `<body>` y con el título "Tienda Expreso". Para actualizarla, se vuelve a publicar desde la sesión de Claude.
2. `CONFIG.whatsapp` vacío por defecto: así ningún pedido llega a un número ajeno. Sin número, WhatsApp le deja al cliente elegir el chat y aparece el aviso "Vista previa".
3. Si el navegador bloquea la ventana nueva, aparece el botón "Abrir WhatsApp con tu mensaje" dentro del carrito o diálogo abierto.
4. Los temas aceptan también `data-theme="light"` y `"dark"`, que impone el visor de claude.ai, y `color-scheme` para los controles nativos. Sin JS, el modo oscuro del sistema aplica el tema Café.
5. Márgenes seguros (`safe-area`) en la barra fija, el botón de WhatsApp y la barra de pedido, para teléfonos con muesca.
6. El contenido se ve completo aunque la animación de entrada no corra (ya no arranca invisible). Mejora las miniaturas y el SEO.
7. Nueva prueba: la ventana bloqueada muestra el botón de respaldo. Todas las pruebas pasan.
8. Lo que **solo el dueño puede hacer**: crear la cuenta de Cloudflare, comprar el dominio, dar su número de WhatsApp y conseguir el permiso de las fotos.

### Sesión 6 · 2026-11-10 · v0.6 (calidad + combos + buscador)
1. Auditoría con axe-core en los 4 temas, escritorio y móvil, y con html-validate. Se corrigieron 3 contrastes insuficientes (insignia "Limitada", verde de WhatsApp y el rojo de acento sobre amarillo, que pasó de `#c23a2a` a `#b23424`) y el botón flotante quedó dentro de un landmark (`<aside>`).
2. HTML: `type` en todos los inputs, `autocomplete` válido en la dirección, botón de política de datos fuera del `<label>`, botón Calcular (sin recarga) en `#vendedor` y `DOCTYPE` en mayúsculas. html-validate ya no reporta errores.
3. **Fallo corregido:** el CSS anulaba el atributo `hidden`, así que el respaldo "Abrir WhatsApp" se veía siempre y el formulario del carrito vacío no se ocultaba. Se agregó la regla global `[hidden]{display:none!important}` y pruebas para ambos casos.
4. Combos (`KITS`): 4 tarjetas (Desayuno, Día y Noche, Antojo, Cabello) con el total y "Agregar combo".
5. Buscador por palabras con `SINONIMOS` y plurales: "reishi" devuelve 18, "pelo" 2, "te" el Rooibos, "cafe sin azucar" 3.
6. `package.json` (con axe-core como devDependency) y `.gitignore`. `npm test` ejecuta todo.
7. Pruebas: todas pasan, incluida la de accesibilidad.
8. Se volvió a publicar la vista previa en el mismo enlace.

### Sesión 7 · 2026-11-10 · v0.7 (recompra + contenido)
1. Calculadora de cafeína en la sección Ritual. Usa los valores de referencia de la EFSA (café filtrado 90 mg, espresso 80, té negro 50, cola 40, bebida energética 80, chocolate oscuro 25) y compara con el límite de 400 mg, o 200 mg en embarazo o lactancia. Arranca con un ejemplo de 2 cafés y sugiere el Rooibos si te pasas.
2. "Repetir mi último pedido": al enviar un pedido se guarda en `expreso.ultimo`. Con el carrito vacío aparece el botón, que solo carga productos que se pueden vender. Es para fomentar la recompra.
3. `docs/GUIONES-VIDEOS.md`: 10 guiones conectados a la web (enlaces `#p-<id>` y `#seccion`, UTM por video), reglas de promesas de salud y de divulgación de IA, calendario y métricas.
4. Pruebas nuevas: calculadora de cafeína (180 → 260 mg, límite de embarazo) y repetir pedido (ignora productos que no se venden o que no existen). Todas pasan.
5. Se volvió a publicar la vista previa.
