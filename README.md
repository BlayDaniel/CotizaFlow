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
