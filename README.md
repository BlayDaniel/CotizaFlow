# CotizaFlow - Fase 5

Fase 5 agrega catálogo comercial, plantillas por tipo de negocio y ajuste del modelo de planes.

## Cambios principales

- Planes simplificados:
  - Starter: 50 cotizaciones/mes.
  - Enterprise: 500 cotizaciones/mes.
  - A cotizar: para empresas de mayor volumen o condiciones especiales.
- Catálogo de productos y servicios por empresa.
- Carga de catálogo base según tipo de negocio.
- Pantalla de plantillas para WhatsApp manual y email futuro.
- Configuración de tipo de negocio, notas por defecto, términos y mensaje WhatsApp por defecto.
- Botón "Agregar desde catálogo" al crear o editar cotizaciones.
- Compatibilidad con planes viejos de prueba:
  - `business` se interpreta como `enterprise`.
  - `pro` se interpreta como `starter`.

## Orden de instalación

1. Reemplazar archivos del proyecto publicado.
2. Conservar tu `config.js` real, o volver a completar `supabaseUrl` y `supabaseAnonKey`.
3. Ejecutar en Supabase SQL Editor:
   - `supabase/schema_phase5.sql`
4. Desplegar funciones actualizadas:

```cmd
supabase functions deploy create-checkout
supabase functions deploy billing-webhook
```

5. Configurar/actualizar secrets de Lemon Squeezy:

```cmd
supabase secrets set LEMONSQUEEZY_VARIANT_STARTER="ID_VARIANT_STARTER"
supabase secrets set LEMONSQUEEZY_VARIANT_ENTERPRISE="ID_VARIANT_ENTERPRISE"
```

Si ya tenías `LEMONSQUEEZY_VARIANT_BUSINESS`, la función `create-checkout` puede usarlo como fallback para Enterprise. Aun así, se recomienda crear/renombrar la variante como Enterprise y guardar `LEMONSQUEEZY_VARIANT_ENTERPRISE`.

## Validación rápida

Después de publicar:

1. Entra a CotizaFlow.
2. Ve a Planes y pagos.
3. Confirma que solo aparecen Starter, Enterprise y A cotizar.
4. En Empresa, selecciona el tipo de negocio.
5. Ve a Catálogo.
6. Presiona "Cargar plantilla".
7. Crea una cotización.
8. Usa "Agregar desde catálogo".
9. Guarda la cotización.
10. Genera link público y prueba WhatsApp manual como en Fase 4.

## Archivos importantes

- `app.js`
- `styles.css`
- `supabase/schema_phase5.sql`
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/billing-webhook/index.ts`

## Notas de seguridad

No colocar secretos de Supabase, Lemon Squeezy ni futuros proveedores de email en `config.js` ni en GitHub Pages. Solo usar la Publishable Key de Supabase en frontend.
