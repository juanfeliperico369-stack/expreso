# Expreso

Tienda web de café y productos con Ganoderma lucidum (Gano Excel) para Colombia. Todo está en **un solo archivo HTML**.

- **Web:** `index.html`. Ábrelo en el navegador o publícalo en Cloudflare Pages o Netlify (GitHub Pages no permite tiendas).
- **Plan de uso y del negocio (empieza aquí):** [`PLAN-DE-ACCION.md`](PLAN-DE-ACCION.md)
- **Contexto, decisiones y pendientes:** [`BITACORA.md`](BITACORA.md). **Léelo primero.**
- **Estrategia del negocio:** [`GUIA-NEGOCIO.md`](GUIA-NEGOCIO.md)
- **Evidencia científica:** [`docs/EVIDENCIA.md`](docs/EVIDENCIA.md)

```bash
python3 tools/admin.py listar   # cambios del día a día: whatsapp, precio, agotado, promo, envío, ga4, pixel…
python3 tools/inline_imgs.py   # vuelve a incrustar las fotos de assets/img
python3 tools/set_domain.py https://tu-dominio.com   # al publicar: SEO + robots + sitemap
node tools/test_site.js        # pruebas automáticas (Playwright)
```
