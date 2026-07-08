# CotizaFlow - Fase 6

Fase 6 agrega dashboard comercial y seguimiento sobre la base validada de Fase 5.

## Incluye

- Dashboard comercial mejorado.
- Métricas de cotizaciones pendientes, aceptadas, rechazadas y vencidas.
- Tasa de cierre.
- Monto pendiente, aceptado, rechazado y vencido.
- Alertas de cotizaciones que necesitan seguimiento.
- Cotizaciones vistas sin respuesta.
- Cotizaciones enviadas sin ver.
- Cotizaciones por vencer.
- Reporte de seguimiento con filtros por periodo, estado y atención.
- Top clientes por monto cotizado.
- Top servicios cotizados.
- Embudo comercial básico.
- Acciones rápidas desde seguimiento: ver, WhatsApp y registrar seguimiento.

## Archivos principales modificados

- `index.html`
- `app.js`
- `styles.css`
- `README.md`
- `supabase/schema_phase6.sql`

## Instalación

1. Reemplaza los archivos del proyecto por los de este ZIP.
2. Conserva tu `config.js` real.
3. Sube los archivos a GitHub Pages.
4. Ejecuta `supabase/schema_phase6.sql` en Supabase SQL Editor.
5. Abre CotizaFlow y valida:
   - Dashboard comercial.
   - Menú Seguimiento.
   - Filtros de reporte.
   - Alertas de seguimiento.
   - Top clientes y top servicios.

## Nota técnica

Fase 6 no requiere nuevas Edge Functions ni servicios externos. Los reportes se calculan desde los datos existentes en Supabase:

- `quotes`
- `quote_items`
- `clients`
- `quote_events`
- `message_logs`
- `products_services`
