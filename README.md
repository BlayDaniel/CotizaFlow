# CotizaFlow — Fase 7

Fase 7 agrega CRM ligero de clientes y mejoras comerciales/UX sobre la Fase 6.

## Incluye

- CRM de clientes con estado comercial, etiquetas, notas internas e historial calculado.
- Total cotizado y total aceptado por cliente.
- Última cotización, último seguimiento, pendientes y vencidas por cliente.
- Nueva landing profesional con casos de uso, ejemplos, planes, comentarios, términos, privacidad, soporte y contacto.
- Login en popup centrado, no debajo de la pantalla.
- Corrección defensiva para evitar pantalla en blanco al volver a la pestaña del navegador.
- Configuración unificada: Empresa, Planes y pagos, Referidos e Integraciones.
- Corrección al agregar desde catálogo: si hay un item vacío, se llena ese item; los nuevos se agregan debajo.
- Logo de empresa en Configuración > Empresa.
- Posición del logo: superior izquierda, centro o derecha.
- Logo aplicado a vista de cotización, vista pública y PDF.

## Orden de instalación recomendado

1. Ejecutar `supabase/schema_phase7.sql` en Supabase SQL Editor.
2. Desplegar función actualizada `get-public-quote`.
3. Subir archivos web a GitHub Pages.
4. Mantener tu `config.js` real. No reemplazarlo por uno vacío.

## Función a desplegar

```cmd
supabase functions deploy get-public-quote
```

## Archivos principales actualizados

- `index.html`
- `app.js`
- `styles.css`
- `public.html`
- `supabase/schema_phase7.sql`
- `supabase/functions/get-public-quote/index.ts`
