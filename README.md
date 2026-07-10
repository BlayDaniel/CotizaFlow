# CotizaFlow - Fase 10T

Corrección incremental enfocada en dos puntos detectados por QA:

1. Edge Function administrativa `platform-admin-users`.
2. Responsive móvil / overflow horizontal.

## Cambios principales

- `platform-admin-users` ahora busca usuarios globales por correo usando consultas directas con `service_role`, sin depender primero del RPC `platform_lookup_user_access`.
- Mantiene RPC solo como respaldo.
- Agrega acción `health` para probar la Edge Function desde Diagnóstico.
- Mejora errores de frontend al invocar la Edge Function.
- Diagnóstico ahora tiene botón **Probar** para `platform-admin-users`.
- Se refuerza CSS móvil para evitar desbordamiento global en 390px.
- Se mantiene el fallback de copiar diagnóstico.
- Se agrega SQL incremental `schema_phase10t_edge_mobile_hardening.sql`.

## Actualización

Conserva tu `config.js` real y reemplaza:

- `app.js`
- `styles.css`
- `README.md`

Agrega o actualiza:

- `supabase/schema_phase10t_edge_mobile_hardening.sql`
- `supabase/functions/platform-admin-users/index.ts`
- `supabase/functions/_shared/cors.ts`

Ejecuta en Supabase SQL Editor:

```sql
-- contenido completo de supabase/schema_phase10t_edge_mobile_hardening.sql
```

Luego despliega la Edge Function:

```bash
supabase functions deploy platform-admin-users
```

## Prueba corta

1. Abre la web y presiona `Ctrl + F5`.
2. Entra como `juan.dmzjob@gmail.com`.
3. Ve a **Configuración > Diagnóstico**.
4. En Backend seguro, presiona **Probar** en `platform-admin-users`.
5. Debe mostrar un toast de OK.
6. Busca un correo global.
7. Prueba móvil en 390 x 844 y confirma que no haya overflow global.

## Verificaciones hechas

- `node --check app.js`: correcto.
- Helpers críticos revisados: correcto.
- Edge Function reescrita para reducir dependencia de RPC y exponer errores JSON claros.
- SQL incremental, sin eliminación de datos operativos.
