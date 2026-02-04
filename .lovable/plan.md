
# Auditoría: Sistema de Creación de Perfiles y Confirmación de Email

## Hallazgos Críticos

### 1. Función de Email NO Está Siendo Llamada

| Indicador | Estado |
|-----------|--------|
| Logs de `send-signup-confirmation` | **CERO LOGS** |
| Auth Hook configurado | **NO** |
| Emails enviados por | Servicio por defecto de Supabase |

**Problema**: La función edge `send-signup-confirmation` existe pero **nunca se ejecuta** porque el Auth Hook de Supabase no está configurado para llamarla. Los emails se envían a través del servicio genérico de Supabase, que tiene:
- Templates básicos sin branding
- Mayor probabilidad de caer en spam
- Sin tracking de entrega

### 2. Usuarios Intentando Registrarse Múltiples Veces

Los logs de auth muestran:
```
"action": "user_repeated_signup"
"email": "angelamador2222@gmail.com"
```

Esto indica que los usuarios:
- No reciben el email de confirmación
- O no pueden completar el flujo
- Intentan registrarse de nuevo

### 3. Múltiples Puntos de Entrada Confusos

| Ruta | Redirect después de confirmar |
|------|------------------------------|
| `/auth` | `/auth` |
| `/license/auth` | `/license/onboarding` |

Esto puede confundir a los usuarios que no saben a dónde ir.

### 4. Estados de Carga Problemáticos

En `useLicenseAuth.tsx`:
```typescript
// Timeout de respaldo de 15 segundos
const backupTimeout = setTimeout(() => {
  setLoading(false);
}, 15000);
```

El session replay mostró "ProfileIncompleteNotification" apareciendo, indicando que usuarios ven contenido incompleto.

---

## Plan de Mejoras

### Fase 1: Configurar Auth Hook (Requiere acción manual)

**Acción requerida en Supabase Dashboard:**

1. Ir a: `Authentication → Hooks`
2. Crear nuevo hook para `Send Email`
3. Apuntar a: `send-signup-confirmation`
4. Agregar `SEND_EMAIL_HOOK_SECRET` como secret

```text
Dashboard URL:
https://supabase.com/dashboard/project/eeshomcqztvjkvycdfwi/auth/hooks
```

### Fase 2: Mejorar Manejo de Errores en Registro

**Archivo**: `src/pages/license/LicenseAuth.tsx`

Cambios propuestos:
```typescript
// Agregar estados para mejor feedback
const [emailSent, setEmailSent] = useState(false);
const [sendError, setSendError] = useState<string | null>(null);

// Mostrar instrucciones claras post-registro
{emailSuccess && (
  <Alert>
    <CheckCircle className="h-4 w-4" />
    <AlertTitle>¡Revisa tu correo!</AlertTitle>
    <AlertDescription>
      <ol className="list-decimal ml-4 space-y-2">
        <li>Busca un email de <strong>Fighter ID</strong></li>
        <li>Revisa carpetas de <strong>spam/promociones</strong></li>
        <li>Haz clic en "Confirmar mi cuenta"</li>
      </ol>
      <p className="mt-4 text-sm text-muted-foreground">
        ¿No llegó? Espera 2-3 minutos y revisa spam.
      </p>
    </AlertDescription>
  </Alert>
)}
```

### Fase 3: Reducir Complejidad del Onboarding

**Archivo**: `src/pages/license/LicenseOnboarding.tsx`

Optimizaciones:
1. Combinar pasos 1 y 2 en un solo formulario con secciones colapsables
2. Hacer documento de identidad **opcional inicialmente** (subir después)
3. Agregar indicador de progreso visual
4. Guardar automáticamente cada campo (no solo al cambiar de paso)

### Fase 4: Mejorar Estados de Carga

**Archivo**: `src/hooks/useLicenseAuth.tsx`

```typescript
// Reducir timeout de 15s a 8s
const backupTimeout = setTimeout(() => {
  console.warn('License check timeout - allowing access');
  setLoading(false);
}, 8000);

// Agregar mensaje de estado durante la carga
const [loadingMessage, setLoadingMessage] = useState('Verificando sesión...');

// Actualizar mensajes durante el proceso
setLoadingMessage('Buscando perfil de peleador...');
setLoadingMessage('Verificando licencia...');
```

### Fase 5: Verificar Configuración de Email

**Checklist para Resend:**

- [ ] Dominio `fighter-id.org` verificado en Resend
- [ ] Registros DNS configurados:
  - SPF: `v=spf1 include:resend.com ~all`
  - DKIM: Registro proporcionado por Resend
  - DMARC: `v=DMARC1; p=none;`
- [ ] API Key con permisos correctos
- [ ] Email `notificaciones@fighter-id.org` activo

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/license/LicenseAuth.tsx` | Mejorar feedback post-registro |
| `src/hooks/useLicenseAuth.tsx` | Reducir timeouts, agregar mensajes |
| `src/pages/license/LicenseOnboarding.tsx` | Simplificar flujo, progreso visual |
| `supabase/functions/send-signup-confirmation/index.ts` | Agregar más logging |

---

## Acciones Inmediatas Requeridas

### Alta Prioridad (Manual)

1. **Configurar Auth Hook en Supabase**
   - Sin esto, los emails personalizados nunca se envían
   - URL: https://supabase.com/dashboard/project/eeshomcqztvjkvycdfwi/auth/hooks

2. **Verificar dominio en Resend**
   - URL: https://resend.com/domains
   - Agregar registros DNS si faltan

### Media Prioridad (Código)

3. Mejorar mensajes de error y feedback visual
4. Agregar retry automático para reenvío de email
5. Simplificar el flujo de onboarding

### Baja Prioridad

6. Agregar analytics de funnel de registro
7. A/B testing de templates de email

---

## Métricas de Éxito

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Logs de email function | 0 | >0 por registro |
| Registros repetidos | Alto | <5% |
| Tiempo de carga onboarding | ~15s timeout | <3s |
| Emails en spam | Desconocido | <10% |

---

## Sección Técnica: Configuración del Auth Hook

Para que el sistema funcione correctamente, debes configurar el Auth Hook en Supabase:

```text
1. Dashboard → Authentication → Hooks
2. Click "Create a new hook"
3. Hook type: "Send Email"
4. HTTP endpoint: https://eeshomcqztvjkvycdfwi.supabase.co/functions/v1/send-signup-confirmation
5. Add secret: SEND_EMAIL_HOOK_SECRET (generar uno nuevo)
6. Save and enable
```

Después de configurar, actualizar la edge function para validar el secret:

```typescript
// En send-signup-confirmation/index.ts
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET');
const wh = new Webhook(hookSecret);
// Validar payload con webhook signature
```
