# Expreso

Tienda web de café y productos con Ganoderma lucidum (Gano Excel) para Colombia. Todo está en **un solo archivo HTML**.

- **Web:** `index.html`. Ábrelo en el navegador o publícalo en Cloudflare Pages o Netlify (GitHub Pages no permite tiendas).
- **Contexto, decisiones y pendientes:** [`BITACORA.md`](BITACORA.md). **Léelo primero.**
- **Estrategia del negocio:** [`GUIA-NEGOCIO.md`](GUIA-NEGOCIO.md)
- **Evidencia científica:** [`docs/EVIDENCIA.md`](docs/EVIDENCIA.md)

```bash
python3 tools/inline_imgs.py   # vuelve a incrustar las fotos de assets/img
python3 tools/set_domain.py https://tu-dominio.com   # al publicar: SEO + robots + sitemap
node tools/test_site.js        # pruebas automáticas (Playwright)
```
