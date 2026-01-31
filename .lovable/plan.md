

# Plan: Sistema Completo de Tracking de Emails

## Diagnóstico Actual

| Componente | Estado | Problema |
|------------|--------|----------|
| Envío de emails | Funciona | Emails se envían correctamente via Resend |
| Registro de campaña | FALLA | Falta campo `html_content` en el INSERT |
| Tracking individual | NO EXISTE | No hay tabla para cada email enviado |
| Detección de bounces | NO EXISTE | No hay webhook de Resend configurado |

## Cambios Propuestos

### 1. Nueva Tabla: `email_sends`

Para registrar CADA email individual enviado por campaña:

```sql
CREATE TABLE email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaign_log(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',     -- sent, delivered, bounced, failed
  resend_id TEXT,                          -- ID de Resend para tracking
  error_message TEXT,                      -- Mensaje de error si falló
  bounce_type TEXT,                        -- hard, soft, complaint
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para consultas eficientes
CREATE INDEX idx_email_sends_campaign ON email_sends(campaign_id);
CREATE INDEX idx_email_sends_status ON email_sends(status);
CREATE INDEX idx_email_sends_email ON email_sends(recipient_email);
```

### 2. Corrección Edge Function: `send-mass-email`

**Archivo**: `supabase/functions/send-mass-email/index.ts`

Cambios:
- Agregar `html_content` al INSERT de `email_campaign_log`
- Registrar cada email en la nueva tabla `email_sends`
- Capturar el `resend_id` de cada envío

```typescript
// 1. Crear registro de campaña PRIMERO
const { data: campaignRecord, error: campaignError } = await supabase
  .from('email_campaign_log')
  .insert({
    sent_by: user.id,
    subject: requestData.subject,
    html_content: requestData.html_content,  // <-- FIX
    recipient_filter: requestData.recipient_filter || 'all',
    total_sent: 0,
    total_failed: 0,
    test_mode: requestData.test_mode || false
  })
  .select('id')
  .single();

// 2. En cada envío exitoso, registrar en email_sends
const result = await sendEmailWithRetry(resend, {...});
await supabase.from('email_sends').insert({
  campaign_id: campaignRecord.id,
  recipient_email: email,
  status: 'sent',
  resend_id: result.data?.id
});

// 3. En cada fallo, registrar con error
await supabase.from('email_sends').insert({
  campaign_id: campaignRecord.id,
  recipient_email: email,
  status: 'failed',
  error_message: error.message
});

// 4. Actualizar totales al final
await supabase.from('email_campaign_log')
  .update({ total_sent: results.success, total_failed: results.failed })
  .eq('id', campaignRecord.id);
```

### 3. Nueva Página: Detalle de Campaña

**Archivo**: `src/pages/admin/EmailCampaignDetail.tsx`

Vista que muestra:
- Información general de la campaña
- Lista completa de destinatarios con estado
- Filtros por estado (enviado, fallido, rebotado)
- Exportar a CSV

```text
┌─────────────────────────────────────────────────────┐
│ Campaña: "Invitación UCC 84"                        │
│ Enviado: 15 Ene 2025 • Por: Admin                   │
├─────────────────────────────────────────────────────┤
│ [✓ 108 Enviados] [✗ 2 Fallidos] [⚠ 0 Rebotados]    │
├─────────────────────────────────────────────────────┤
│ Destinatario          │ Estado  │ Detalle          │
│───────────────────────│─────────│──────────────────│
│ juan@gmail.com        │ ✓ Sent  │ re_xxxxx         │
│ maria@hotmail.com     │ ✓ Sent  │ re_yyyyy         │
│ invalid@fake.xyz      │ ✗ Failed│ Invalid domain   │
│ bounce@test.com       │ ⚠ Bounce│ Hard bounce      │
└─────────────────────────────────────────────────────┘
```

### 4. Actualizar Listado de Campañas

**Archivo**: `src/pages/admin/EmailCampaigns.tsx`

- Hacer cada campaña clickeable para ver detalle
- Agregar columna de bounces/rebotes
- Mostrar preview del contenido

### 5. (Futuro) Webhook de Resend para Bounces

Resend puede enviar webhooks cuando un email rebota. Esto requiere:
- Nueva edge function `resend-webhook`
- Configurar webhook en dashboard de Resend
- Actualizar `email_sends.status` cuando llega evento

Por ahora esto queda como mejora futura ya que requiere configuración externa.

## Flujo Completo Propuesto

```text
Admin crea campaña
       │
       ▼
┌──────────────────┐
│ INSERT campaign  │◄── Con html_content
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
│ INSERT send     │◄── Con resend_id o error
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
  Admin ve detalle
  con cada email
```

## Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| Nueva migración SQL | Crear tabla `email_sends` |
| `supabase/functions/send-mass-email/index.ts` | Corregir INSERT + tracking individual |
| `src/pages/admin/EmailCampaignDetail.tsx` | NUEVO - Vista de detalle |
| `src/pages/admin/EmailCampaigns.tsx` | Agregar links a detalle |
| `src/App.tsx` | Agregar ruta `/admin/email-campaigns/:id` |

## Resultado Final

El admin podrá:
1. Ver historial completo de campañas (actualmente vacío por el bug)
2. Click en una campaña para ver TODOS los emails enviados
3. Filtrar por estado: enviados, fallidos, rebotados
4. Identificar emails problemáticos para limpiar la base de datos
5. Exportar lista de emails fallidos para análisis

