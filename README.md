# CotizaFlow — Fase 9

Fase 9 agrega un módulo de **Facturas comerciales y cuentas por cobrar** conectado con Cotizaciones, Clientes, roles y Dashboard. El objetivo es mantener el CRM sencillo, pero más útil: cliente → cotización → factura → pago → historial.

## Incluye

- Módulo **Facturas** en el menú principal.
- Conversión de cotización a factura.
- Factura en estado borrador antes de emitir.
- Emisión de factura comercial interna.
- Registro de pagos y abonos.
- Saldo pendiente automático.
- Estados: borrador, emitida, pagada parcial, pagada, vencida y anulada.
- PDF de factura.
- Mensaje listo para WhatsApp.
- Historial de facturas por cliente.
- Métricas de facturas en Dashboard.
- Configuración de prefijo, próximo número, vencimiento y notas de factura.
- Base de datos preparada para NCF/e-CF futuro, sin exponer llaves secretas.

## Inteligencia por tipo de negocio

El sistema adapta el texto, las alertas y el contexto de facturación según el tipo de negocio.

Para **Asociación Ganaderos**, las facturas se manejan como ventas de insumos y servicios: alimento, medicamentos, transporte, servicios veterinarios, gestión administrativa, etc. La llegada de leche no se registra como factura; se mantiene en **Control Diario** y se liquidará aparte en una fase posterior.

Esto evita mezclar cuentas por cobrar de ventas con cuentas por pagar a productores.

## Flujo recomendado

1. Crear cliente.
2. Crear cotización.
3. Cuando el cliente acepta, abrir la cotización.
4. Presionar **Convertir en factura**.
5. Revisar la factura en borrador.
6. Presionar **Emitir**.
7. Registrar pagos o abonos.
8. Revisar saldo pendiente y vencimientos.

## Reglas de buenas prácticas incluidas

- Una factura nace como borrador.
- Una factura emitida no debe tratarse como una cotización editable.
- Si hay error, se anula en lugar de borrarla.
- La factura conserva copia propia de items, precios, impuestos y totales.
- El PDF indica que es documento comercial interno.
- La fiscalidad NCF/e-CF queda preparada para una fase posterior con backend seguro.

## Roles

- Superusuario: acceso total.
- Administrador: facturas, pagos, configuración, clientes y operación.
- Ventas: puede crear facturas desde cotizaciones.
- Contabilidad: puede emitir, anular y registrar pagos.
- Operador diario: mantiene Control Diario, sin permisos completos de facturación.
- Solo lectura: consulta facturas sin editar.

## Orden de instalación recomendado

1. Mantén tu `config.js` real. No lo reemplaces por uno vacío.
2. Reemplaza `index.html`, `app.js`, `styles.css`, `public.html` y `README.md`.
3. Si no has ejecutado las migraciones ganaderas, ejecuta:
   - `supabase/schema_phase8b_dairy_crm_settings.sql`
4. Si no has ejecutado roles/catálogo, ejecuta:
   - `supabase/schema_phase8d_roles_catalog.sql`
5. Ejecuta la nueva migración:
   - `supabase/schema_phase9_invoices.sql`
6. Sube los archivos a GitHub Pages.
7. Haz `Ctrl + F5` en el navegador.
8. Prueba convertir una cotización en factura.

## Archivos principales actualizados

- `index.html`
- `app.js`
- `styles.css`
- `public.html`
- `README.md`
- `supabase/schema_phase9_invoices.sql`

## Nota fiscal

Fase 9 maneja factura comercial interna y cuentas por cobrar. No declara todavía cumplimiento fiscal oficial DGII/e-CF. Para eso se requiere una fase fiscal con NCF/e-NCF, secuencias, validaciones y backend seguro mediante Supabase Edge Functions o Cloudflare Workers. No debe colocarse `service_role` ni llaves secretas en frontend o GitHub.

## Seguridad

El frontend sigue usando solo la Publishable key de Supabase. Las operaciones sensibles futuras, como emitir comprobantes fiscales oficiales, webhooks de pagos o creación administrativa de usuarios Auth, deben ir por backend seguro.
