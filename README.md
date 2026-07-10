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


## Fase 10U — Edge Function administrativa y layout estable

Correcciones incluidas:

- La Edge Function `platform-admin-users` ya no devuelve HTTP 400 para errores manejados. Devuelve JSON controlado para que el diagnóstico muestre el detalle exacto.
- La función busca usuarios Auth con `service_role` y usa RPC solo como respaldo para membresías.
- Se agregó soporte de secrets alternativos: `SUPABASE_SERVICE_ROLE_KEY`, `SERVICE_ROLE_KEY` o `SUPABASE_SERVICE_KEY`. El recomendado sigue siendo `SUPABASE_SERVICE_ROLE_KEY`.
- Se redujo el CSS agresivo que podía romper el layout de escritorio. El comportamiento móvil queda limitado a breakpoints móviles.
- Se mantiene scroll interno en tablas para evitar overflow global.

Archivos a reemplazar:

- `app.js`
- `styles.css`
- `README.md`
- `supabase/functions/platform-admin-users/index.ts`
- `supabase/functions/_shared/cors.ts`

SQL a ejecutar:

- `supabase/schema_phase10u_edge_mobile_layout.sql`

Después despliega de nuevo:

```bash
supabase functions deploy platform-admin-users
```

Verifica en Supabase Edge Functions > Secrets que exista `SUPABASE_SERVICE_ROLE_KEY`.

## Fase 10V - Corrección Edge Function y layout estable

Esta versión corrige dos problemas detectados después de 10T/10U:

1. El diseño de escritorio no debe romper la columna derecha. Se removieron reglas CSS agresivas de ancho/overflow y se limitaron los ajustes fuertes a mobile.
2. `platform-admin-users` debe responder con JSON controlado. Se agregó `supabase/config.toml` con `verify_jwt = false` para que la función haga su propia validación interna del usuario autenticado y no sea bloqueada antes de ejecutar el código.

Pasos:

1. Reemplazar `app.js`, `styles.css` y `README.md`.
2. Subir/actualizar:
   - `supabase/functions/platform-admin-users/index.ts`
   - `supabase/functions/_shared/cors.ts`
   - `supabase/config.toml`
3. Ejecutar en SQL Editor:
   - `supabase/schema_phase10u_edge_mobile_layout.sql`
4. Desplegar:

```bash
supabase functions deploy platform-admin-users
```

Luego probar en Configuración > Diagnóstico > Backend seguro > Probar.
