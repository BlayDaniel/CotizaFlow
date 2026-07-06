# CotizaFlow - Fase 3

MVP web preparado para GitHub Pages + Supabase, con base de pagos, planes y referidos.

Esta versión conserva el modo local para pruebas rápidas y agrega:

- Supabase Auth con correo y contraseña.
- PostgreSQL con RLS por usuario/empresa.
- Límites por plan: Free 5, Starter 30, Pro 150, Business 500 cotizaciones/mes.
- Bloqueo visual en frontend y bloqueo real en PostgreSQL con trigger.
- Pantalla de Planes y pagos.
- Pantalla de Referidos.
- RPC segura para crear afiliados normales al 20%.
- RPC segura para registrar referidos por `?ref=CODIGO`.
- Edge Function `create-checkout` para crear checkout de Lemon Squeezy sin exponer secrets.
- Edge Function `billing-webhook` para validar firma, actualizar suscripción y crear comisiones.
- PDF con jsPDF.
- Mensaje para WhatsApp.

## Archivos principales

```txt
index.html
styles.css
app.js
config.js
config.example.js
supabase/schema.sql
supabase/schema_phase3.sql
supabase/config.toml
supabase/functions/create-checkout/index.ts
supabase/functions/billing-webhook/index.ts
supabase/functions/README.md
```

## Probar en modo local

1. Abre la carpeta en Visual Studio Code.
2. Usa la extensión Live Server.
3. Abre `index.html`.
4. Presiona `Probar demo local`.

En modo local los datos se guardan en `localStorage`. Los cobros reales no corren en modo local.

## Activar Supabase

1. Crea un proyecto en Supabase.
2. Entra a SQL Editor.
3. Ejecuta primero:

```txt
supabase/schema.sql
```

4. Luego ejecuta:

```txt
supabase/schema_phase3.sql
```

5. En Supabase, entra a Project Settings > API.
6. Copia:
   - Project URL
   - Publishable key

7. Abre `config.js` y reemplaza:

```js
window.COTIZAFLOW_CONFIG = {
  supabaseUrl: 'https://TU-PROYECTO.supabase.co',
  supabaseAnonKey: 'TU_SUPABASE_PUBLISHABLE_KEY',
  appName: 'CotizaFlow',
  billingProvider: 'lemon_squeezy'
};
```

La variable se llama `supabaseAnonKey` por compatibilidad con el código anterior, pero puedes usar la Publishable key nueva.

## Subir a GitHub Pages

Sube estos archivos a la raíz del repo:

```txt
index.html
styles.css
app.js
config.js
config.example.js
README.md
supabase/schema.sql
supabase/schema_phase3.sql
supabase/config.toml
supabase/functions/**
```

En GitHub:

```txt
Settings > Pages > Deploy from branch > main > /root
```

## Configurar Supabase Auth

En Supabase:

```txt
Authentication > URL Configuration
```

Configura:

```txt
Site URL:
https://TU-USUARIO.github.io/cotizaflow/

Redirect URLs:
http://127.0.0.1:5500/*
http://localhost:5500/*
https://TU-USUARIO.github.io/cotizaflow/*
```

Para desarrollo puedes mantener `Confirm email = OFF`. Para producción debes configurarlo y probar redirección antes de activarlo.

## Deploy de Edge Functions

Requiere Supabase CLI autenticado.

```bash
supabase functions deploy create-checkout
supabase functions deploy billing-webhook
```

Configura secrets:

```bash
supabase secrets set LEMONSQUEEZY_API_KEY="..."
supabase secrets set LEMONSQUEEZY_WEBHOOK_SECRET="..."
supabase secrets set LEMONSQUEEZY_STORE_ID="..."
supabase secrets set LEMONSQUEEZY_VARIANT_STARTER="..."
supabase secrets set LEMONSQUEEZY_VARIANT_PRO="..."
supabase secrets set LEMONSQUEEZY_VARIANT_BUSINESS="..."
supabase secrets set PUBLIC_APP_URL="https://TU-USUARIO.github.io/cotizaflow/"
```

En Lemon Squeezy, configura webhook hacia:

```txt
https://TU-PROYECTO.supabase.co/functions/v1/billing-webhook
```

Eventos mínimos:

```txt
subscription_created
subscription_updated
subscription_cancelled
subscription_expired
subscription_payment_success
subscription_payment_failed
order_refunded
```

## Seguridad

No pongas `service_role`, `sb_secret`, API key de Lemon Squeezy, webhook secret, Paddle secret ni Resend key en `config.js` ni en GitHub Pages.

El frontend solo usa la Publishable key de Supabase. La protección de datos depende de RLS, policies, triggers y funciones RPC.

El plan de una empresa no debe ser editable desde el navegador. Fase 3 revoca permisos de update sobre `companies.plan`, `companies.subscription_status` y fechas de periodo.

## Flujo de referidos

1. Un usuario crea su código en `Referidos`.
2. Comparte un link como:

```txt
https://TU-USUARIO.github.io/cotizaflow/?ref=CODIGO
```

3. El referido crea cuenta.
4. Al crearse su empresa, el frontend llama `claim_referral`.
5. La comisión se genera solo cuando Lemon Squeezy confirma `subscription_payment_success`.
6. La comisión queda `pending` y se marca disponible 30 días después.
7. Los payouts siguen manuales en el MVP.

## Lo que queda pendiente después de esta fase

- Customer portal para que el usuario gestione método de pago/cancelación.
- Payouts automáticos de afiliados.
- Partner approval UI para subir del 20% al 30%.
- Recordatorios automáticos por email con Resend.
- Links públicos seguros de cotización mediante Edge Function o Worker.
- Multiusuario real para Business con invitaciones.
