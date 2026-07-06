# CotizaFlow - Fase 1

MVP estático para GitHub Pages.

Incluye:

- Landing page.
- Acceso demo local.
- Configuración de empresa.
- Clientes.
- Cotizaciones.
- Estados básicos.
- PDF descargable usando jsPDF.
- Datos guardados en LocalStorage del navegador.

## Cómo probar en VS Code

1. Abre esta carpeta en VS Code.
2. Instala la extensión **Live Server**.
3. Clic derecho en `index.html` > **Open with Live Server**.
4. Presiona **Probar demo**.

También puedes abrir `index.html` directamente en el navegador, pero Live Server es más cómodo.

## Cómo subir a GitHub Pages

1. Crea un repositorio en GitHub, por ejemplo `cotizaflow`.
2. Sube estos archivos a la raíz del repositorio:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `README.md`
3. En GitHub entra a **Settings > Pages**.
4. En **Build and deployment**, selecciona:
   - Source: Deploy from a branch
   - Branch: main
   - Folder: /root
5. Guarda.
6. GitHub generará una URL pública.

## Limitaciones de esta fase

Esta fase no tiene autenticación real, base de datos en nube, emails reales ni pagos. Todo vive en el navegador del usuario.

La fase 2 debe conectar:

- Supabase Auth.
- Supabase PostgreSQL.
- Cloudflare Workers API.
- Resend para emails.
- Lemon Squeezy o Paddle para suscripciones.
- Sistema de referidos.
