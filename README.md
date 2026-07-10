# CotizaFlow Demo Stable v1.0

**CotizaFlow Demo Stable v1.0** es la versión estable aprobada para **demo comercial** y **piloto asistido**.

Esta versión no debe tratarse todavía como un SaaS autoservicio abierto. Está preparada para demostraciones, pruebas comerciales controladas, implementación asistida y primeros pilotos con clientes reales.

---

## Estado de la versión

**Versión:** CotizaFlow Demo Stable v1.0  
**Estado:** Aprobada con observaciones para demo comercial y piloto asistido  
**Modo principal:** GitHub Pages + Supabase  
**Superusuario principal:**
**Backend activo:** Supabase Auth, Supabase PostgreSQL, RLS y Edge Functions  
**Edge Function administrativa:** `platform-admin-users` validada en diagnóstico  

---

## Objetivo del sistema

CotizaFlow es un CRM SaaS sencillo para pequeños negocios de servicios que necesitan controlar clientes, seguimiento, cotizaciones, facturas comerciales internas, pagos, cuentas por cobrar y reportes.

También incluye un módulo vertical premium para **Asociaciones Ganaderas**, orientado a controlar entregas diarias de leche, productores, comisiones y liquidaciones mensuales.

---

## Alcance funcional de Demo Stable v1.0

### Acceso y seguridad

- Login con Supabase Auth.
- Recuperación de acceso mediante Supabase.
- Sesión estable en navegador.
- Superusuario principal protegido.
- Administración global mediante diagnóstico y Edge Function segura.
- Roles operativos dentro del sistema.
- Control de permisos por usuario, rol, plan y módulo.

### CRM

- Gestión de clientes.
- Historial básico por cliente.
- Relación de clientes con cotizaciones, facturas y entregas ganaderas cuando aplica.
- Seguimiento comercial.

### Cotizaciones

- Crear cotizaciones.
- Editar cotizaciones.
- Agregar ítems manuales o desde catálogo.
- Estados de cotización.
- PDF de cotización.
- Mensaje listo para WhatsApp.
- Links públicos seguros para cotizaciones.

### Facturas comerciales internas

- Crear facturas comerciales.
- Convertir cotizaciones en facturas.
- Emitir factura comercial interna.
- Registrar pagos parciales o completos.
- Controlar saldo pendiente.
- PDF de factura comercial interna.
- Cuentas por cobrar.

> Nota: esta versión **no emite comprobantes fiscales oficiales NCF/e-CF**. El módulo de facturas es comercial/interno. La integración fiscal queda fuera de esta versión estable.

### Reportes

- Reportes comerciales.
- Cotizado.
- Facturado.
- Cobrado.
- Cuentas por cobrar.
- Facturas vencidas.
- Mayores saldos por cliente.
- Exportaciones según permisos del plan.

### Catálogo y plantillas

- Catálogo de productos y servicios.
- Plantillas comerciales.
- Plantilla especializada para Asociación Ganaderos.

### Módulo Asociación Ganaderos

Disponible cuando el tipo de negocio y el plan lo permiten.

Incluye:

- Control Diario.
- Registro de entregas de leche.
- Productores conectados al CRM.
- Precio por litro configurable.
- Comisión de asociación configurable.
- Cálculo de bruto, comisión y neto.
- Resumen mensual.
- PDF y CSV según permisos.
- Liquidaciones mensuales por productor.
- Descuento de facturas pendientes contra el neto a pagar.

### Planes y permisos

Planes visibles:

- Demo.
- CRM Básico.
- CRM Pro.
- Ganadero Pro.
- CRM Empresa.

Estados de suscripción:

- `trial`
- `active`
- `past_due`
- `suspended`
- `cancelled`

Roles incluidos:

- Superusuario.
- Administrador.
- Ventas.
- Operador diario.
- Contabilidad.
- Solo lectura.

### Diagnóstico

La pantalla de diagnóstico permite revisar:

- Modo de conexión.
- Sesión activa.
- Empresa activa.
- Plan efectivo.
- Estado de suscripción.
- Límites de uso.
- Acceso por módulo.
- Estado de helpers críticos.
- Estado de Edge Functions.
- Búsqueda global por correo.
- Permisos y módulos por usuario.

---

## Arquitectura

### Frontend

- HTML.
- CSS.
- JavaScript.
- GitHub Pages.
- Frontend estático.

### Backend

- Supabase Auth.
- Supabase PostgreSQL.
- Row Level Security.
- Supabase JS Client.
- Supabase Edge Functions.

### Edge Functions activas

- `platform-admin-users`
- Funciones públicas de cotización, si están desplegadas en el entorno.

### Seguridad

- No usar `service_role` en frontend.
- No guardar llaves secretas en `app.js`, `config.js` ni GitHub Pages.
- La llave pública/publishable puede estar en frontend si RLS está configurado correctamente.
- Las operaciones administrativas globales deben pasar por Edge Functions.

---

## Archivos principales

```text
index.html
app.js
styles.css
public.html
config.js
config.example.js
README.md
supabase/
  functions/
    platform-admin-users/
      index.ts
    _shared/
      cors.ts
  config.toml
```

---

## Configuración requerida

### `config.js`

El archivo `config.js` debe existir en producción y contener la configuración pública de Supabase:

```js
window.COTIZAFLOW_CONFIG = {
  supabaseUrl: 'https://TU-PROYECTO.supabase.co',
  supabaseAnonKey: 'TU_PUBLISHABLE_KEY',
  appName: 'CotizaFlow'
};
```

No colocar llaves secretas en este archivo.

---

## Supabase Edge Function administrativa

La función administrativa validada para esta versión es:

```text
platform-admin-users
```

Comando recomendado para despliegue:

```bash
supabase functions deploy platform-admin-users --no-verify-jwt --project-ref TU_PROJECT_REF
```

La función debe responder correctamente desde:

```text
Configuración > Diagnóstico > Backend seguro > Probar
```

Resultado esperado:

```text
platform-admin-users OK: fase10z-no-audit-2026-07-10
```

En esta versión, la auditoría interna de esta función queda desactivada temporalmente para mantener estabilidad durante demo y QA. Puede reactivarse en una versión posterior.

---

## Estado QA de Demo Stable v1.0

Resultado QA actualizado:

- Sesión administrativa recuperada correctamente.
- Dashboard y módulos principales cargan sin pantallas blancas.
- `platform-admin-users` responde OK.
- Búsqueda global muestra empresa, rol, estado, plan y permisos.
- Estado normalizado como `trial`; no aparece `trialing`.
- Copiar diagnóstico funciona.
- Sin errores activos de CotizaFlow en consola durante el recorrido actual.
- Móvil 390 × 844 sin overflow global en módulos principales probados.
- Facturas identificadas como comerciales internas y no fiscales.
- Superusuario confirmado:.
- Modo Supabase conectado.
- Cálculos comerciales y ganaderos coherentes.

---

## Observaciones conocidas

- Control Diario puede aparecer varias veces como texto dentro de Clientes, lo que puede causar ambigüedad para pruebas automatizadas basadas solo en texto visible.
- Las pruebas destructivas no deben ejecutarse sobre usuarios reales.
- Las pruebas completas por rol requieren cuentas QA independientes.
- La venta autoservicio completa requiere una fase posterior de pagos, webhooks, onboarding y automatización.

---

## Uso recomendado de esta versión

Esta versión puede usarse para:

- Demo comercial.
- Piloto asistido.
- Presentación a clientes potenciales.
- Validación con negocios reales.
- Implementación manual controlada.

No se recomienda todavía para:

- Autoservicio público masivo.
- Venta sin acompañamiento.
- Facturación fiscal oficial.
- Pagos automáticos sin validación adicional.

---

## Próximas fases sugeridas

1. Crear tenant QA aislado.
2. Crear usuarios QA por rol.
3. Ejecutar QA plan × rol × estado.
4. Preparar guion de demo comercial.
5. Preparar onboarding asistido.
6. Integrar Lemon Squeezy en una fase posterior.
7. Implementar webhooks de pagos.
8. Reactivar auditoría administrativa de Edge Functions.
9. Mejorar automatización de pruebas con identificadores únicos en botones.

---

## Versionado recomendado

Esta versión debe etiquetarse como:

```text
cotizaflow-demo-stable-v1.0
```

Reglas sugeridas:

- `v1.0.1`: correcciones pequeñas sin nuevas funciones.
- `v1.1`: mejoras funcionales controladas.
- `v2.0`: pagos automáticos, licenciamiento formal o autoservicio completo.

---

## Nota final

CotizaFlow Demo Stable v1.0 queda congelada como base estable para demostración y piloto asistido. Cualquier cambio posterior debe aplicarse en una rama o versión nueva para no romper esta versión estable.
