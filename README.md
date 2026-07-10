# CotizaFlow — Fase 10G

## Ganadero Pro como módulo premium

Entrega incremental. No refactoriza el sistema completo y mantiene compatibilidad con las tablas actuales.

### Cambios principales

- El Dashboard ganadero ya no se muestra solo por tener tipo de negocio `Asociación Ganaderos`.
- Ahora requiere tres condiciones:
  - Tipo de negocio: Asociación Ganaderos.
  - Plan con feature `ganadero_module`: Ganadero Pro o CRM Empresa.
  - Rol con permisos de lectura del módulo ganadero.
- Si la empresa es ganadera pero el plan no permite el módulo, se muestra una pantalla comercial de upgrade a Ganadero Pro.
- Control Diario queda bloqueado si no hay permiso real de Ganadero Pro.
- Botones de PDF/CSV ganadero respetan permisos por plan y rol.
- El botón Control Diario dentro de Clientes solo aparece cuando el módulo está realmente habilitado.
- Se refuerza la separación entre:
  - Facturas comerciales internas.
  - Operación ganadera de leche y liquidaciones internas futuras.

### SQL nuevo

Ejecutar en Supabase SQL Editor:

`supabase/schema_phase10g_ganadero_premium.sql`

Orden recomendado:

1. `schema_phase9_invoices.sql`
2. `schema_phase10a_saas_plans.sql`
3. `schema_phase10b_superuser_roles.sql`
4. `schema_phase10c_internal_guards.sql`
5. `schema_phase10e_demo_limits.sql`
6. `schema_phase10f_commercial_fiscal_boundary.sql`
7. `schema_phase10g_ganadero_premium.sql`

### Prueba recomendada

1. Configura una empresa como Asociación Ganaderos.
2. Déjala en Demo, CRM Básico o CRM Pro.
3. Verifica que Dashboard muestre upgrade a Ganadero Pro.
4. Intenta abrir Control Diario: debe mostrar bloqueo comercial, no pantalla vacía.
5. Cambia el entitlement a Ganadero Pro.
6. Verifica que Dashboard ganadero y Control Diario abran normalmente.
7. Prueba que un rol sin permiso `milk_read` no vea el módulo.

### Archivos principales

Reemplazar:

- `app.js`
- `styles.css`
- `README.md`

Agregar y ejecutar:

- `supabase/schema_phase10g_ganadero_premium.sql`

Conservar tu `config.js` real.

## Fase 10H/I v2 — Planes, pagos y estado de suscripción

Entrega incremental segura. No refactoriza todo el sistema y conserva compatibilidad con las tablas actuales.

### Incluye

- Pantalla de Planes y pagos más operativa.
- Resumen del plan efectivo, estado, fechas de ciclo, próximo pago y proveedor.
- Control manual de suscripción para Superusuario.
- Estados comerciales: trial, active, past_due, suspended y cancelled.
- Modo solo lectura para suspended/cancelled ya conectado con las validaciones internas.
- Campos preparados para Lemon Squeezy o Paddle: payment_provider, provider_customer_id, provider_subscription_id, current_period_start, current_period_end, last_payment_status y next_billing_date.
- Reglas visibles para entender qué ocurre con cada estado.
- SQL incremental: `supabase/schema_phase10hi_billing_subscription_status.sql`.

### Orden recomendado de SQL

1. `schema_phase10a_saas_plans.sql`
2. `schema_phase10b_superuser_roles.sql`
3. `schema_phase10c_internal_guards.sql`
4. `schema_phase10e_demo_limits.sql`
5. `schema_phase10f_commercial_fiscal_boundary.sql`
6. `schema_phase10g_ganadero_premium.sql`
7. `schema_phase10hi_billing_subscription_status.sql`

### Prueba mínima

1. Entrar como Superusuario.
2. Ir a Configuración > Planes y pagos.
3. Cambiar plan y estado desde Control manual de suscripción.
4. Probar `active`, `past_due`, `suspended` y `cancelled`.
5. Confirmar que suspended/cancelled permiten ver datos, pero bloquean creación o modificación de clientes, cotizaciones, facturas y Control Diario.
6. Confirmar que un rol no Superusuario no puede modificar el estado de plan.


## Corrección v2 SQL

Se corrigió `schema_phase10hi_billing_subscription_status.sql` para usar `saas_plans.id` en lugar de `saas_plans.plan_id`, manteniendo compatibilidad con alias legacy como starter, pro, business y enterprise.

## Fase 10JK v2 - Corrección Ganadero Pro

Corrección aplicada después de detectar que al seleccionar Ganadero Pro algunas pantallas podían quedar bloqueadas o no renderizar correctamente.

Ajustes:
- El plan efectivo ahora toma prioridad desde `billing_subscriptions` y `companies` antes que la vista `company_saas_entitlements`, para evitar bloqueos por datos desfasados.
- Se reforzó `canOperateGanadero()` para permitir Ganadero Pro y CRM Empresa cuando el tipo de negocio es Asociación Ganaderos y el rol tiene permisos.
- Se agregó renderizado seguro de rutas para que Dashboard o Seguimiento no dejen la pantalla vacía si ocurre un error visual.
- Al guardar el control manual de suscripción, la app intenta sincronizar entitlements si la base lo permite; si no, continúa usando `billing_subscriptions` y `companies` como fuente operativa.

Prueba recomendada:
1. En Configuración > Empresa, seleccionar Asociación Ganaderos.
2. En Configuración > Planes y pagos, seleccionar Ganadero Pro y estado Activo.
3. Guardar.
4. Abrir Dashboard.
5. Abrir Seguimiento.
6. Abrir Control Diario.

Resultado esperado: Dashboard ganadero, Seguimiento comercial y Control Diario deben abrir sin pantalla vacía ni bloqueo incorrecto.


## Fase 10JK v4 - Corrección de Reportes comerciales

Corrección incremental sobre Fase 10JK v3.

- Se agregó `normalizeQuote()` y `normalizeQuoteItem()` como capa común de compatibilidad.
- Se corrigió el error `normalizeQuote is not defined` en Reportes comerciales.
- Se validó `app.js` con `node --check`.
- No requiere SQL nuevo.

Actualización recomendada: conservar `config.js` real y reemplazar `app.js` y `README.md`.
