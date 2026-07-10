# CotizaFlow - Fase 10D

Fase incremental para reforzar la interfaz SaaS por plan sin refactorizar todo el sistema ni romper compatibilidad con las tablas actuales.

## Incluye

- Dashboard con aviso comercial según plan actual, demo, suscripción bloqueada o funciones premium disponibles.
- Pantalla de Planes y pagos con matriz de acceso por módulos.
- Mensajes de upgrade más claros para funciones bloqueadas.
- Botones de contacto comercial por WhatsApp o email.
- Configuración opcional `salesWhatsapp` en `config.example.js`.
- Sin cambios destructivos de base de datos.

## Archivos principales

- `app.js`
- `styles.css`
- `config.example.js`
- `README.md`

## SQL

Esta fase no requiere SQL nuevo. Usa las tablas y funciones creadas en Fase 10A, 10B y 10C.

## Pruebas sugeridas

1. Entrar con una empresa Demo.
2. Ver el aviso de Demo limitado en Dashboard.
3. Abrir Configuración > Planes y pagos.
4. Confirmar que aparece la matriz de módulos incluidos/bloqueados.
5. Intentar abrir Control Diario en una Asociación Ganaderos sin Ganadero Pro.
6. Confirmar que aparece mensaje de upgrade.
7. Probar botón de contacto comercial.

## Compatibilidad

No elimina tablas, columnas ni rutas existentes. Mantiene el fallback local si Supabase aún no tiene todos los entitlements cargados.
