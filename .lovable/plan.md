
# Plan: Sistema de Cola de Emails (100/día) + Actualizar Footer

## Resumen

Implementar un sistema de cola inteligente que respeta el límite de 100 emails diarios de Resend, programando automáticamente el excedente para días siguientes. Además, actualizar el texto del footer para reflejar la misión de Fighter ID.

---

## Parte 1: Base de Datos - Nueva Tabla `email_queue`

### Estructura de la Tabla

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | ID único |
| `recipient_email` | text | Email del destinatario |
| `subject` | text | Asunto del correo |
| `html_content` | text | Contenido HTML |
| `campaign_id` | uuid | Referencia a email_campaign_log (opcional) |
| `scheduled_for` | date | Fecha programada para envío |
| `status` | text | 'pending', 'sent', 'failed' |
| `priority` | integer | Prioridad (1=alta, 10=baja) |
| `created_at` | timestamptz | Fecha de creación |
| `sent_at` | timestamptz | Fecha de envío real |
| `error_message` | text | Error si falló |

### Tabla de Tracking Diario `email_daily_usage`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `date` | date | Fecha (PK) |
| `emails_sent` | integer | Emails enviados ese día |
| `emails_remaining` | integer | Cuota restante (100 - sent) |

---

## Parte 2: Lógica de Cola

### Flujo de Trabajo

```text
┌─────────────────────────────────────────────────────────────────┐
│                    ENVÍO DE EMAIL MASIVO                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Admin solicita enviar a 250 usuarios                          │
│                              ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Verificar cuota del día actual                          │   │
│  │ Hoy: 20 enviados → 80 disponibles                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Distribuir emails:                                      │   │
│  │ • Hoy (80): se envían inmediatamente                    │   │
│  │ • Mañana (100): scheduled_for = hoy + 1                 │   │
│  │ • Pasado (70): scheduled_for = hoy + 2                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  Admin ve: "80 enviados hoy, 170 programados para próximos    │
│             días"                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Procesamiento Automático (Cron Job)

```text
┌─────────────────────────────────────────────────────────────────┐
│              CRON: process-email-queue (cada hora)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Verificar cuota restante del día                           │
│  2. Obtener emails pendientes WHERE scheduled_for <= hoy       │
│  3. Enviar hasta completar cuota (máx 100/día)                 │
│  4. Actualizar status = 'sent' o 'failed'                      │
│  5. Actualizar email_daily_usage                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Parte 3: Edge Function `process-email-queue`

Nueva función que se ejecuta automáticamente cada hora para procesar la cola:

```typescript
// Pseudocódigo
async function processQueue() {
  const today = new Date().toISOString().split('T')[0];
  
  // 1. Obtener uso del día
  const { emails_sent } = await getDailyUsage(today);
  const remaining = 100 - emails_sent;
  
  if (remaining <= 0) {
    console.log("Cuota diaria agotada");
    return;
  }
  
  // 2. Obtener emails pendientes
  const pendingEmails = await supabase
    .from('email_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', today)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(remaining);
  
  // 3. Enviar con rate limiting
  for (const email of pendingEmails) {
    await sendAndUpdateStatus(email);
    await delay(600);
  }
  
  // 4. Actualizar contador diario
  await updateDailyUsage(today, emails_sent + sent);
}
```

---

## Parte 4: Modificar `send-mass-email`

Cambiar la función actual para que:
1. En lugar de enviar directamente, agregue a la cola
2. Calcule automáticamente la distribución por días
3. Envíe los primeros emails del día si hay cuota disponible

### Respuesta al Admin

```json
{
  "success": true,
  "summary": {
    "total_recipients": 250,
    "sent_today": 80,
    "queued_for_tomorrow": 100,
    "queued_for_day_after": 70
  },
  "message": "80 emails enviados. 170 programados para los próximos 2 días."
}
```

---

## Parte 5: UI de Monitoreo (Opcional)

Agregar sección en el panel de admin para ver:
- Cuota restante del día
- Emails en cola
- Distribución por fecha

---

## Parte 6: Actualizar Footer

### Texto Actual (Eliminar)
```
La plataforma líder para eventos urbanos en vivo. 
Conectando la cultura callejera con tecnología de vanguardia.
```

### Nuevo Texto
```
Plataforma profesional de certificación y gestión de peleadores.
Tu identidad deportiva verificada y protegida.
```

Este texto es consistente con el Hero que ya dice "Plataforma profesional de gestión de peleadores".

---

## Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| **Migración SQL** | Crear tablas `email_queue` y `email_daily_usage` |
| `supabase/functions/process-email-queue/index.ts` | **CREAR** - Cron job para procesar cola |
| `supabase/functions/send-mass-email/index.ts` | **MODIFICAR** - Usar cola en lugar de envío directo |
| `supabase/config.toml` | Agregar configuración de la nueva función |
| `src/components/Footer.tsx` | **MODIFICAR** - Actualizar texto |

---

## Configuración del Cron Job

```sql
-- Ejecutar cada hora
SELECT cron.schedule(
  'process-email-queue-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url:='https://eeshomcqztvjkvycdfwi.supabase.co/functions/v1/process-email-queue',
    headers:='{"Authorization": "Bearer ANON_KEY"}'::jsonb
  );
  $$
);
```

---

## Resultado Final

```text
┌─────────────────────────────────────────────────────────────────┐
│  Panel Admin - Campañas de Email                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 Estado del Día: 45/100 emails enviados                     │
│                                                                 │
│  📬 Cola de Emails:                                            │
│  • Hoy (pendientes): 12                                        │
│  • Mañana: 100                                                  │
│  • Pasado mañana: 38                                           │
│                                                                 │
│  [Enviar Nueva Campaña]                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Beneficios

1. **Nunca exceder cuota**: Sistema automático de distribución
2. **Transparencia**: Admin ve exactamente cuándo se enviarán los emails
3. **Prioridad**: Emails urgentes pueden tener prioridad alta
4. **Recuperación**: Si un email falla, se puede reintentar
5. **Escalable**: Fácil aumentar límite si se upgrade el plan de Resend
