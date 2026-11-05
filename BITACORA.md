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
| `tools/test_site.js` | Pruebas automáticas con Playwright. `node tools/test_site.js` (opcional `--shots carpeta` para capturas). |
| `GUIA-NEGOCIO.md` | Estrategia y costos del negocio online. |
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

1. **`CONFIG`**: número de WhatsApp (**hoy es el placeholder `573000000000`: REEMPLAZAR**), costo de envío (`null` = "se confirma según ciudad"), envío gratis desde, tiempo de envío, métodos de pago y URL de redes.
2. **`PRODUCTOS`**: un objeto por producto (`id, cat, nombre, linea, precio, tag, desc, contiene[], uso, nota, invima`). Para un producto nuevo: copia un objeto, guarda la foto como `assets/img/p-<id>.webp` (unos 440 px, WebP) y corre `python3 tools/inline_imgs.py`.
3. **`CATS`**: categorías. Si agregas una, agrega también un chip; el banner de foto es opcional.
4. **`CIENCIA`, `MITOS`, `SEGURIDAD`**: entre los marcadores `/* <CIENCIA> */`. Su fuente es `docs/EVIDENCIA.md`. **Solo citas verificadas.**
5. **`VIDEOS`**: pega la URL de cada video de TikTok, Reels o YouTube en `url` y la tarjeta cambia de "Pronto" a "Ver".
6. **`FAQ`** y **`LEGAL`**: textos de preguntas frecuentes, política de datos y retracto.
7. **Después de editar**, corre `node tools/test_site.js`. Debe terminar en "Todas las pruebas pasaron".

## 5. Decisiones tomadas (y por qué)

- **Un solo HTML** (lo pidió el dueño). Las imágenes van en base64 en un bloque JSON al final, para que el código siga siendo legible.
- **El pedido se cierra por WhatsApp**, sin pasarela de pagos: no requiere servidor, cuesta $0 y permite conversar con el cliente, que es justo lo que el dueño quiere para convertir clientes en socios. Más adelante: links de pago de Wompi o Mercado Pago (ver la guía).
- **Promesas de salud reescritas.** El catálogo original promete curar cáncer, diabetes, lupus, Alzheimer, etc. Eso **está prohibido** para suplementos en Colombia (INVIMA) y Cochrane no lo respalda. La web solo describe composición, uso y sabor, y la sección "Ciencia" cuenta la evidencia real. El dueño lo aprobó. **No volver a meter promesas terapéuticas.**
- **La "Oportunidad" va sin cifras de ingresos.** Solo explica el proceso, cita la Ley 1700 y deja claro que los ingresos no están garantizados (como dice el propio plan de Gano Excel).
- **Aviso de independencia:** "Expreso es un distribuidor independiente; no es Gano Excel S.A." No usar el logo de Gano Excel como si fuera la marca propia.
- **Fotos tomadas del catálogo de "Visión Continental".** ⚠️ Falta confirmar el permiso de uso (a través del amigo del dueño). Si no hay permiso, reemplazarlas por fotos propias.
- **Códigos INVIMA** copiados del volante de Gano Excel. ⚠️ Verificarlos en https://consultaregistro.invima.gov.co (sobre todo Excellium `SD2014-0003368`, que en el volante sale cortado como "D2014-…"). Shoko Rico, Gano Soap, Transparent Soap y Reskine no tenían código en el material.
- **Precios** = "precio sugerido" del catálogo, en noviembre de 2026.

## 6. Pendientes (por prioridad)

1. ⚠️ Poner el número real de WhatsApp en `CONFIG.whatsapp`.
2. ⚠️ Confirmar el permiso de las fotos y los códigos INVIMA.
3. Comprar un dominio y publicar (GitHub Pages, Netlify o Cloudflare Pages son gratis). Luego activar `canonical` y `og:image` (están comentados en el `<head>`).
4. Definir la tarifa de envío (`CONFIG.envio`) y los tiempos reales de la transportadora.
5. Crear las redes y pegar sus URL en `CONFIG.redes`. Publicar los primeros videos y pegar sus URL en `VIDEOS`.
6. Revisar la política de distribuidores de Gano Excel: ¿se puede vender en Mercado Libre o redes? ¿hay precio mínimo?
7. Analítica: Google Analytics 4 o Plausible, y el píxel de Meta (requiere aviso de cookies).
8. Captación de correos (Brevo o MailerLite) y ofrecer un formulario real además de WhatsApp.
9. Fase 2: páginas por producto (SEO), blog/revista, reseñas reales de clientes y programa de referidos.

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
10. Próximo paso sugerido: publicar en GitHub Pages con un dominio .com o .co y crear Instagram, TikTok y WhatsApp Business.
