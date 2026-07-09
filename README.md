# CotizaFlow — Fase 8C

Fase 8C mantiene las mejoras comerciales de Fase 7 y agrega idiomas, temas y Control Diario ganadero conectado al CRM.

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
- `supabase/schema_phase8_dairy.sql`
- `supabase/schema_phase8b_dairy_crm_settings.sql`

## Fase 8C - Ajustes UX, dashboard ganadero y configuración más limpia

Cambios incluidos:
- Selector de idioma en la parte superior: Español / Inglés.
- Tema visual en Configuración > Empresa: White / Black.
- Navegación interna en Configuración para Empresa, Planes y pagos, Referidos e Integraciones.
- Nuevo tipo de negocio: Asociación Ganaderos.
- Nuevo módulo Control Diario debajo de Dashboard para registrar litros diarios por productor, comisión, neto a pagar, resumen mensual, PDF mensual y CSV.
- Productores conectados al CRM de clientes: puedes seleccionar un cliente existente o crear uno nuevo automáticamente desde Control Diario.
- El historial de leche aparece también dentro del CRM de clientes.
- Precio por litro y % comisión se configuran en Configuración > Empresa y se aplican automáticamente en cada registro.

Persistencia del control de leche:
- Si existe la tabla `milk_deliveries`, el módulo guarda en Supabase.
- Si la tabla no existe, el módulo funciona en localStorage para no romper la app.
- Para activar persistencia real, ejecuta `supabase/schema_phase8_dairy.sql` o `supabase/schema_phase8b_dairy_crm_settings.sql` en Supabase SQL Editor.
- La migración agrega `default_milk_price_per_liter` y `default_milk_commission_rate` a `companies`, y `client_id` a `milk_deliveries`.


## Fase 8C - Cambios adicionales

- Corrección visual de selects e inputs dentro de formularios en grillas: ya no se estiran cuando otro campo de la misma fila tiene texto de ayuda.
- En el menú lateral se eliminó la entrada directa de Nueva cotización. La creación queda concentrada en el módulo Cotizaciones.
- Seguimiento se movió debajo de Dashboard para organizar mejor la navegación.
- Precio por litro de leche y % comisión asociación solo se muestran en Configuración > Empresa cuando el tipo de negocio es Asociación Ganaderos.
- El Dashboard cambia a una vista ganadera cuando la empresa es Asociación Ganaderos, con litros de hoy, litros del mes, neto a pagar, comisión, productores activos, promedio diario, alertas y últimos registros.
- Uso mensual del plan quedó concentrado en Configuración > Planes y pagos.
