# CotizaFlow - Fase 2

MVP web preparado para GitHub Pages + Supabase.

Esta fase conserva el modo local para pruebas rápidas y agrega estructura real para:

- Supabase Auth con correo y contraseña.
- PostgreSQL con tablas de empresa, clientes, cotizaciones e items.
- Row Level Security para separar datos por usuario/empresa.
- Estructura inicial de pagos y referidos para fase 3.
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
```

## Probar en modo local

1. Abre la carpeta en Visual Studio Code.
2. Usa la extensión Live Server.
3. Abre `index.html`.
4. Presiona `Probar demo local`.

En modo local los datos se guardan en `localStorage`.

## Activar Supabase

1. Crea un proyecto en Supabase.
2. Entra a SQL Editor.
3. Copia y ejecuta todo el contenido de:

```txt
supabase/schema.sql
```

4. En Supabase, entra a Project Settings > API.
5. Copia:
   - Project URL
   - anon/public key

6. Abre `config.js` y reemplaza:

```js
window.COTIZAFLOW_CONFIG = {
  supabaseUrl: 'https://TU-PROYECTO.supabase.co',
  supabaseAnonKey: 'TU_SUPABASE_ANON_OR_PUBLISHABLE_KEY',
  appName: 'CotizaFlow'
};
```

7. Vuelve a abrir la web.
8. Usa `Crear cuenta`.

## Configuración recomendada en Supabase Auth

Para pruebas rápidas puedes desactivar confirmación de correo en:

```txt
Authentication > Providers > Email > Confirm email = OFF
```

Para producción debes activar confirmación de correo.

## Subir a GitHub Pages

1. Sube estos archivos a la raíz del repo:

```txt
index.html
styles.css
app.js
config.js
config.example.js
README.md
supabase/schema.sql
```

2. En GitHub:

```txt
Settings > Pages > Deploy from branch > main > /root
```

3. Guarda.

## Seguridad

La key pública de Supabase puede estar en el frontend, pero solo si RLS está activo y las políticas están bien configuradas.

El archivo `schema.sql` ya activa RLS para las tablas principales.

No expongas la `service_role key` en GitHub Pages ni en ningún JavaScript del navegador.

## Qué queda fuera de fase 2

Todavía no se incluye:

- Cobros reales.
- Webhooks de Lemon Squeezy/Paddle.
- Pagos automáticos de referidos.
- Enlaces públicos seguros para que el cliente acepte desde fuera.
- Emails automáticos con Resend.

Eso entra en fase 3.
