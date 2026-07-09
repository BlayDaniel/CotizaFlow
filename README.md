# CotizaFlow — Fase 8D

Fase 8D mantiene las mejoras de Fase 8C y agrega dos piezas nuevas: catálogo específico para Asociación Ganaderos y base de roles por usuario con Superusuario.

## Incluye

- CRM de clientes con estado comercial, etiquetas, notas internas e historial calculado.
- Control Diario ganadero conectado al CRM de clientes/productores.
- Dashboard especial para Asociación Ganaderos.
- Selector de idioma: Español / Inglés.
- Tema visual White / Black desde Configuración > Empresa.
- Navegación lateral más limpia: Dashboard, Seguimiento, Control Diario, Cotizaciones, CRM clientes, Catálogo, Plantillas y Configuración.
- Nueva cotización solo desde el módulo Cotizaciones.
- Uso mensual del plan dentro de Configuración > Planes y pagos.
- Precio por litro y % comisión asociación visibles solo cuando el tipo de negocio es Asociación Ganaderos.

## Cambios Fase 8D

### Catálogo Asociación Ganaderos

Al cargar plantilla para Asociación Ganaderos se insertan productos y servicios base como:

- Alimento concentrado para ganado.
- Melaza para ganado.
- Sal mineralizada.
- Vitaminas y reconstituyentes.
- Desparasitante bovino.
- Vacuna bovina.
- Servicio veterinario.
- Inseminación artificial.
- Transporte de leche.
- Análisis de calidad de leche.
- Tanques, cubetas y accesorios de ordeño.
- Detergentes y productos de higiene.
- Gestión administrativa de la asociación.

La carga evita duplicados por categoría + nombre.

### Usuarios y roles

Se agregó Configuración > Usuarios y roles.

Roles disponibles:

- Superusuario: acceso total.
- Administrador: operación completa, configuración funcional y usuarios.
- Ventas: clientes, cotizaciones, seguimiento y catálogo en modo operativo.
- Operador diario: Control Diario y productores/clientes.
- Contabilidad: reportes, pagos mensuales, Control Diario y planes.
- Solo lectura: consulta sin edición.

El propietario de la empresa queda como Superusuario. Para otros usuarios, se registra su correo y rol. El usuario debe crear cuenta con ese mismo correo para quedar vinculado a la empresa.

## Orden de instalación recomendado

1. Mantén tu `config.js` real. No lo reemplaces por uno vacío.
2. Reemplaza `index.html`, `app.js`, `styles.css`, `public.html` y `README.md`.
3. Si no has ejecutado las migraciones ganaderas, ejecuta en Supabase SQL Editor:
   - `supabase/schema_phase8b_dairy_crm_settings.sql`
4. Luego ejecuta:
   - `supabase/schema_phase8d_roles_catalog.sql`
5. Sube los archivos a GitHub Pages.
6. Entra con el usuario propietario y revisa Configuración > Usuarios y roles.

## Archivos principales actualizados

- `index.html`
- `app.js`
- `styles.css`
- `public.html`
- `supabase/schema_phase8_dairy.sql`
- `supabase/schema_phase8b_dairy_crm_settings.sql`
- `supabase/schema_phase8d_roles_catalog.sql`

## Persistencia del Control Diario

- Si existe la tabla `milk_deliveries`, el módulo guarda en Supabase.
- Si la tabla no existe, el módulo funciona con fallback local para no romper la app.
- La migración ganadera agrega `default_milk_price_per_liter` y `default_milk_commission_rate` a `companies`, y `client_id` a `milk_deliveries`.

## Nota de seguridad

El frontend sigue usando solo la Publishable key de Supabase. No debe subirse `service_role`, secret keys de Supabase, Lemon Squeezy, Paddle ni Resend a GitHub.
