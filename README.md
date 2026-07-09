# CotizaFlow — Fase 10C

Entrega incremental. No refactoriza todo el sistema ni elimina tablas existentes.

## Objetivo

Agregar una capa interna de validaciones por plan, estado de suscripción, límites y rol. La interfaz puede mostrar u ocultar opciones, pero las acciones críticas ahora pasan por una validación común antes de crear, editar, emitir, registrar pagos, exportar o cargar plantillas.

## Cambios principales

- Nueva capa frontend `evaluateActionGate()` / `guardAction()`.
- Validación común para clientes, cotizaciones, facturas comerciales, pagos, catálogo, plantillas, Control Diario y exportaciones ganaderas.
- Bloqueo de escritura cuando la cuenta está `suspended` o `cancelled`.
- Aviso visible cuando la cuenta está `past_due`, `suspended` o `cancelled`.
- Rutas directas como `#quote-new`, `#invoices`, `#milk`, `#catalog`, `#templates`, `#affiliates` e `#integrations` respetan plan y feature flags.
- La app intenta leer `company_saas_entitlements` desde Supabase para usar límites efectivos desde base de datos si la vista existe.
- Si la vista no existe, conserva el catálogo local de planes para mantener compatibilidad.
- Carga de plantilla de catálogo respeta el límite del plan.

## SQL agregado

Nuevo archivo:

`supabase/schema_phase10c_internal_guards.sql`

Crea:

- `company_usage_events`
- `company_subscription_state()`
- `company_can_write()`
- `company_resource_usage()`
- `company_can_create_resource()`
- `company_action_allowed()`

También agrega políticas RLS restrictivas sobre tablas existentes cuando están disponibles:

- `clients`
- `quotes`
- `quote_items`
- `invoices`
- `invoice_items`
- `invoice_payments`
- `products_services`
- `message_templates`
- `milk_deliveries`
- `company_members`

Estas políticas no reemplazan las anteriores; se agregan como restricciones adicionales.

## Orden recomendado de SQL

1. `supabase/schema_phase8b_dairy_crm_settings.sql`
2. `supabase/schema_phase8d_roles_catalog.sql`
3. `supabase/schema_phase9_invoices.sql`
4. `supabase/schema_phase10a_saas_plans.sql`
5. `supabase/schema_phase10b_superuser_roles.sql`
6. `supabase/schema_phase10c_internal_guards.sql`

## Archivos principales a reemplazar

Conserva tu `config.js` real.

Reemplaza:

- `app.js`
- `styles.css`
- `README.md`

Agrega:

- `supabase/schema_phase10c_internal_guards.sql`

## Pruebas recomendadas

### Demo

- Debe bloquear creación al llegar al límite de clientes, cotizaciones, facturas o catálogo.
- Debe mostrar actualización de plan.
- No debe permitir CSV ganadero.

### CRM Básico

- Debe permitir clientes, cotizaciones, catálogo, facturas comerciales simples.
- Debe bloquear pagos parciales y cuentas por cobrar avanzadas.
- Debe bloquear módulo ganadero.

### CRM Pro

- Debe permitir facturas comerciales, pagos parciales, cuentas por cobrar y exportaciones normales.
- Debe bloquear Control Diario ganadero si no es Ganadero Pro.

### Ganadero Pro

- Si la empresa es Asociación Ganaderos, debe permitir Control Diario, PDF y CSV ganadero.

### Suspended / Cancelled

- Debe permitir login y consulta.
- Debe bloquear creación o modificación de clientes, cotizaciones, facturas, pagos, catálogo y registros de leche.
- Debe permitir ver Configuración > Planes y pagos.

