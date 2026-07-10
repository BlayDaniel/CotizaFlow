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

## Fase 10L - Liquidación ganadera

Entrega incremental sobre Fase 10JK v4. No requiere SQL nuevo.

Objetivo:
- Separar la operación ganadera en tres conceptos: entregas de leche, facturas comerciales al productor y liquidación mensual.
- Evitar mezclar leche recibida con facturas comerciales.
- Dar a Ganadero Pro una función de mayor valor para cierre mensual.

Incluye:
- Nuevo módulo `Liquidaciones` visible para Asociación Ganaderos con Ganadero Pro o CRM Empresa.
- Cálculo mensual por productor:
  - Litros recibidos.
  - Bruto de leche.
  - Comisión de la asociación.
  - Neto de leche.
  - Facturas comerciales pendientes del productor.
  - Neto final a pagar.
- Estados de liquidación:
  - Pagar al productor.
  - Productor debe saldo.
  - Cerrado.
- PDF de liquidación mensual.
- CSV de liquidación mensual.
- Botón desde Control Diario hacia Liquidación mensual.

Regla operativa:
- Control Diario registra leche recibida y genera cuenta por pagar al productor.
- Facturas comerciales registran ventas de alimento, medicina, transporte, veterinaria u otros servicios al productor.
- Liquidación mensual descuenta las facturas pendientes contra el neto de leche.

Actualización:
- Conservar `config.js` real.
- Reemplazar `app.js`, `styles.css` y `README.md`.
- No ejecutar SQL nuevo.

Prueba recomendada:
1. Configurar empresa como Asociación Ganaderos.
2. Activar plan Ganadero Pro.
3. Crear un productor desde Clientes o Control Diario.
4. Registrar entregas de leche para ese productor.
5. Crear una factura comercial pendiente al mismo productor por alimento u otro insumo.
6. Abrir Liquidaciones.
7. Confirmar que el neto final descuenta la factura pendiente.
8. Generar PDF y CSV.

## Fase 10L v2 — Ajuste de descuentos en liquidación

Corrección aplicada: las liquidaciones ganaderas ahora consideran como descuento operativo las facturas comerciales del productor con saldo pendiente aunque estén en estado borrador, siempre que no estén anuladas. Esto permite ver reflejadas ventas de alimento, insumos o servicios registradas al productor antes de emitir formalmente la factura comercial.

Regla actual:
- Se descuentan facturas del mismo cliente/productor con saldo pendiente.
- Se incluyen borradores, emitidas, vencidas y pagadas parciales con saldo.
- Se excluyen facturas anuladas y facturas ya pagadas sin saldo.

No requiere SQL nuevo.

## Fase 10M — Referidos y afiliados operativos

Entrega incremental y compatible con las tablas actuales. Esta fase convierte el módulo de Referidos en una herramienta operativa del MVP sin automatizar todavía payouts ni pagos desde backend.

### Incluye

- Panel de referidos más claro dentro de Configuración > Referidos.
- Link de referido con código único.
- Resumen de referidos, comisiones pendientes, disponibles y pagadas.
- Reglas visibles del programa: 20% estándar, 30% partner aprobado, 12 meses, liberación a 30 días.
- Tabla de empresas referidas.
- Tabla de comisiones.
- Estado de payout manual y mínimo sugerido.
- SQL incremental para crear o completar `affiliates`, `referrals` y `commissions`.
- Funciones seguras:
  - `create_my_affiliate(requested_code, payout_email)`
  - `claim_referral(ref_code, target_company_id)`
  - `register_manual_commission(...)`
  - `release_available_commissions()`

### SQL nuevo

Ejecutar:

`supabase/schema_phase10m_referrals_affiliates.sql`

Orden recomendado:

1. `schema_phase10a_saas_plans.sql`
2. `schema_phase10b_superuser_roles.sql`
3. `schema_phase10c_internal_guards.sql`
4. `schema_phase10e_demo_limits.sql`
5. `schema_phase10f_commercial_fiscal_boundary.sql`
6. `schema_phase10g_ganadero_premium.sql`
7. `schema_phase10hi_billing_subscription_status.sql`
8. `schema_phase10m_referrals_affiliates.sql`

### Prueba rápida

1. Entra con una cuenta que tenga acceso a Referidos.
2. Ve a Configuración > Referidos.
3. Crea un código de afiliado.
4. Copia el link.
5. Abre el link en otra ventana o navegador.
6. Crea o entra con otra empresa.
7. Verifica que el referido se registre en la cuenta afiliada.

Las comisiones reales todavía deben registrarse manualmente o luego por webhook de pagos.


## Fase 10M v2 - Corrección SQL

Se agregó compatibilidad para bases donde `create_my_affiliate(text,text)` ya existía con otro tipo de retorno. El SQL ahora elimina y recrea solo las funciones RPC necesarias antes de definirlas nuevamente. No elimina datos de afiliados, referidos ni comisiones.

## Fase 10M v3 - Fix interfaz afiliados

Corrección aplicada:
- Se agregó `renderCommissionsTable()` que faltaba en el módulo Referidos/Afiliados.
- Se agregaron helpers `commissionStatusLabel()` y `commissionStatusClass()`.
- Se validó `app.js` con `node --check`.
- Se ejecutó una revisión estática de referencias a funciones faltantes para evitar errores tipo `... is not defined` en interfaz.

No requiere SQL nuevo si ya ejecutaste la versión v2 del SQL de Fase 10M.

## Fase 10N — Backend seguro para links públicos

Esta fase agrega la base segura para compartir cotizaciones mediante links públicos sin exponer tablas directamente desde el frontend.

### Incluye

- Tabla `quote_public_links` para tokens públicos de cotización.
- Tabla `quote_events` para vistas, aceptación, rechazo, descargas e historial de seguimiento.
- Tabla `message_logs` para registrar mensajes enviados o copiados.
- Función RPC `create_quote_public_link()` para crear o reutilizar links activos.
- Función RPC `get_public_quote_payload()` para leer una cotización pública por token.
- Función RPC `register_public_quote_action()` para aceptar, rechazar o registrar eventos desde `public.html`.
- Edge Function `create-public-quote-link`.
- Edge Function `get-public-quote`.
- Edge Function `quote-public-action`.

### Orden recomendado de SQL

Ejecuta primero las fases previas y luego:

```sql
supabase/schema_phase10n_secure_public_links.sql
```

### Despliegue de Edge Functions

Desde la carpeta del proyecto, con Supabase CLI configurado:

```bash
supabase functions deploy create-public-quote-link
supabase functions deploy get-public-quote
supabase functions deploy quote-public-action
```

Estas funciones usan `SUPABASE_URL` y `SUPABASE_ANON_KEY`, variables disponibles normalmente en Supabase Edge Functions. No requieren poner `service_role` en frontend ni en GitHub.

### Validación

1. Ejecuta el SQL de Fase 10N.
2. Despliega las tres Edge Functions.
3. Entra a una cotización.
4. Presiona Crear link público.
5. Abre `public.html?t=TOKEN`.
6. Acepta o rechaza la cotización desde la vista pública.
7. Regresa a la app y confirma que el estado y los eventos quedan registrados.


## Fase 10O — QA, hardening y diagnóstico interno

Esta fase agrega una pantalla de diagnóstico visible solo para Superusuario desde Configuración > Diagnóstico.

Incluye verificación de sesión, empresa, rol, plan efectivo, estado de suscripción, escritura permitida, módulos por feature flag, uso contra límites, helpers críticos de interfaz y checklist de SQL aplicado.

No requiere SQL nuevo. Es una fase de hardening de interfaz y QA para reducir errores como funciones no definidas antes de seguir agregando módulos.

Prueba recomendada:

1. Entrar como Superusuario.
2. Ir a Configuración > Diagnóstico.
3. Confirmar que los helpers críticos aparecen en OK.
4. Confirmar plan, rol, estado y límites.
5. Copiar diagnóstico si se detecta un error para facilitar soporte.
