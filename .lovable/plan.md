
# Plan: Mejorar Editor de Campañas de Email

## Problema Actual

El editor de campañas solo permite enviar a:
- Todos los usuarios
- Solo peleadores (todos)
- Solo administradores

**No hay forma de seleccionar peleadores específicos** para envíos individuales o grupos personalizados.

---

## Solución Propuesta

Agregar un **selector de destinatarios individuales** al editor de campañas con:

1. **Nueva opción de filtro**: "Selección Manual"
2. **Buscador de peleadores** con autocompletado
3. **Lista de destinatarios seleccionados** con opción de remover
4. **Input para emails externos** (no registrados en la plataforma)

---

## Arquitectura de la Solución

```text
┌─────────────────────────────────────────────────────────────────────┐
│                 EDITOR DE CAMPAÑA MEJORADO                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Para: [Seleccionar tipo de destinatarios ▼]                        │
│        ├─ Todos los usuarios                                        │
│        ├─ Solo peleadores                                           │
│        ├─ Solo administradores                                      │
│        └─ Selección Manual  ← NUEVO                                 │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ SI "Selección Manual" está activo:                           │   │
│  │                                                              │   │
│  │ [🔍 Buscar peleador...                               ]       │   │
│  │                                                              │   │
│  │ Destinatarios (3):                                           │   │
│  │ ┌──────────────────────────────────────────────────────┐    │   │
│  │ │ 👤 Randy Tercero (randy@email.com)           [X]     │    │   │
│  │ │ 👤 Juan Pérez (juan@email.com)               [X]     │    │   │
│  │ │ 📧 externo@cliente.com                       [X]     │    │   │
│  │ └──────────────────────────────────────────────────────┘    │   │
│  │                                                              │   │
│  │ [+ Agregar email manualmente]                                │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Cambios a Implementar

### 1. Crear Componente de Selector de Destinatarios

**Nuevo archivo: `src/components/admin/EmailRecipientSelector.tsx`**

```typescript
// Componente que permite:
// - Buscar peleadores por nombre
// - Ver resultados con avatar, nombre y email
// - Seleccionar múltiples destinatarios
// - Agregar emails externos manualmente
// - Ver lista de seleccionados con opción de remover
```

### 2. Actualizar EmailCampaignEditor

**Archivo: `src/pages/admin/EmailCampaignEditor.tsx`**

Cambios:
- Agregar opción "custom" al Select de destinatarios
- Mostrar el nuevo selector cuando se elige "custom"
- Pasar la lista de emails al edge function como `custom_emails`
- Actualizar mensaje de confirmación para mostrar cantidad

### 3. Actualizar Edge Function (sin cambios)

El backend ya soporta `custom_emails`, solo necesitamos enviar los datos correctamente desde el frontend.

---

## Flujo de Usuario

```text
1. Admin abre editor de campaña
2. Selecciona "Selección Manual" en destinatarios
3. Busca peleadores por nombre
4. Click en peleador → se agrega a la lista
5. Opcionalmente agrega emails externos
6. Escribe el asunto y contenido
7. Click "Enviar Campaña"
8. Sistema envía a todos los emails seleccionados
```

---

## Componente EmailRecipientSelector

### Props
```typescript
interface EmailRecipientSelectorProps {
  selectedEmails: string[];
  onEmailsChange: (emails: string[]) => void;
}
```

### Funcionalidades
- **Búsqueda en tiempo real**: Filtra peleadores mientras escribe
- **Debounce**: Evita consultas excesivas (300ms)
- **Resultados agrupados**: Peleadores registrados vs emails externos
- **Validación de email**: Para entradas manuales
- **Prevención de duplicados**: No permite agregar el mismo email dos veces

---

## Archivos a Modificar/Crear

| Archivo | Acción |
|---------|--------|
| `src/components/admin/EmailRecipientSelector.tsx` | **CREAR** - Selector de destinatarios |
| `src/pages/admin/EmailCampaignEditor.tsx` | Integrar selector, agregar opción "custom" |

---

## Detalles Técnicos

### Query para buscar peleadores con email

```typescript
const { data } = await supabase
  .from('fighter_profiles')
  .select(`
    id,
    first_name,
    last_name,
    nickname,
    avatar_url,
    user_id,
    app_user!inner(email)
  `)
  .eq('active', true)
  .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,nickname.ilike.%${search}%`)
  .limit(10);
```

### Estructura de datos enviada al backend

```typescript
// Cuando se selecciona "custom"
await supabase.functions.invoke("send-mass-email", {
  body: {
    subject: "Asunto del correo",
    html_content: "<html>...</html>",
    recipient_filter: "custom",
    custom_emails: ["randy@email.com", "juan@email.com", "externo@cliente.com"],
    test_mode: false,
  },
});
```

---

## UI del Selector

### Estado vacío
```
🔍 Buscar peleador por nombre...

[No hay destinatarios seleccionados]

+ Agregar email manualmente
```

### Con búsqueda activa
```
🔍 Randy

Resultados:
┌────────────────────────────────────────┐
│ 👤 Randy Tercero - randy@fighter.com   │
│ 👤 Randy Couture - rc@ufc.com          │
└────────────────────────────────────────┘
```

### Con seleccionados
```
🔍 Buscar peleador...

Destinatarios (2):
┌────────────────────────────────────────┐
│ 👤 Randy Tercero          [✕ Quitar]  │
│    randy@fighter.com                   │
├────────────────────────────────────────┤
│ 📧 patrocinador@empresa.com [✕ Quitar]│
│    (Email externo)                     │
└────────────────────────────────────────┘

+ Agregar email manualmente
```

---

## Beneficios

- **Comunicación directa**: Enviar a peleadores específicos
- **Flexibilidad**: Combinar peleadores registrados con emails externos
- **UX intuitiva**: Búsqueda rápida con resultados visuales
- **Sin cambios backend**: Aprovecha funcionalidad existente
- **Auditoría**: El log ya registra campañas con filtro "custom"

---

## Impacto

- **Archivos nuevos**: 1
- **Archivos modificados**: 1
- **Cambios en backend**: Ninguno
- **Tiempo estimado**: ~20 minutos
