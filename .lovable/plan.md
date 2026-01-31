
# Plan: Sistema Completo de Tracking de Emails

## ✅ IMPLEMENTADO

### 1. Nueva Tabla: `email_sends` ✅
- Tabla creada con campos: campaign_id, recipient_email, status, resend_id, error_message, bounce_type
- RLS habilitado con política admin-only
- Índices para consultas eficientes

### 2. Corrección Edge Function: `send-mass-email` ✅
- Agregado campo `html_content` al INSERT (bug crítico corregido)
- Tracking individual de cada email en `email_sends`
- Captura de `resend_id` de Resend
- Actualización de totales al final

### 3. Nueva Página: `EmailCampaignDetail.tsx` ✅
- Vista de detalle de campaña
- Tabla de emails enviados con filtros
- Estadísticas de envíos/fallidos/rebotados
- Exportar a CSV
- Preview del contenido HTML

### 4. Actualizado: `EmailCampaigns.tsx` ✅
- Campañas clickeables para ver detalle
- Badge "Ver detalle →"

### 5. Ruta agregada en `App.tsx` ✅
- `/admin/email-campaigns/:id` → EmailCampaignDetail

## Flujo Completo

```text
Admin crea campaña
       │
       ▼
┌──────────────────┐
│ INSERT campaign  │◄── Con html_content ✅
│ (email_campaign) │
└────────┬─────────┘
         │
         ▼
    Por cada email
         │
    ┌────┴────┐
    │ Enviar  │
    └────┬────┘
    ┌────┴────┐
    ▼         ▼
 Éxito     Fallo
    │         │
    ▼         ▼
┌─────────────────┐
│ INSERT send     │◄── Con resend_id o error ✅
│ (email_sends)   │
└────────┬────────┘
         │
         ▼
┌──────────────────┐
│ UPDATE totales   │
│ en campaign_log  │
└──────────────────┘
         │
         ▼
  Admin ve detalle ✅
  con cada email
```

## (Futuro) Webhook de Resend para Bounces

Para detectar rebotes automáticamente:
- Nueva edge function `resend-webhook`
- Configurar webhook en dashboard de Resend
- Actualizar `email_sends.status` cuando llega evento

Esto queda como mejora futura ya que requiere configuración externa en Resend.
