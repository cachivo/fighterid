
# Plan: Segmentación de Campañas de Email por Disciplina y Nivel

## Resumen

Agregar filtros avanzados al editor de campañas de email para poder enviar correos segmentados por:
- **Disciplina**: MMA o Boxeo (o ambas)
- **Nivel**: Profesional, Semi-profesional, Amateur (uno o varios)

Además, clasificar automáticamente las campañas para facilitar su organización y análisis.

---

## Población Actual de Peleadores

| Disciplina | Profesional | Semi-profesional | Amateur | Total |
|------------|-------------|------------------|---------|-------|
| MMA        | 9           | 7                | 39      | 55    |
| Boxeo      | 2           | 1                | 6       | 9     |
| **Total**  | 11          | 8                | 45      | 64    |

---

## Cambios en la Interfaz

### Editor de Campañas (`EmailCampaignEditor.tsx`)

Agregar nueva opción en el selector de destinatarios:

```text
Para: [Dropdown]
├── Todos los usuarios
├── Solo peleadores
├── Solo administradores  
├── Selección Manual
└── Peleadores por Segmento  ← NUEVO
```

Al seleccionar "Peleadores por Segmento", aparecerán filtros adicionales:

```text
┌─────────────────────────────────────────────────────┐
│ SEGMENTACIÓN                                        │
├─────────────────────────────────────────────────────┤
│ Disciplina:                                         │
│   ☑ MMA (55 peleadores)                            │
│   ☐ Boxeo (9 peleadores)                           │
│                                                     │
│ Nivel:                                              │
│   ☐ Profesional (11)                               │
│   ☐ Semi-profesional (8)                           │
│   ☑ Amateur (45)                                   │
│                                                     │
│ ─────────────────────────────────────────────────  │
│ Vista previa: 39 destinatarios (MMA Amateur)       │
└─────────────────────────────────────────────────────┘
```

---

## Lógica de Segmentación

### Reglas de Combinación

1. **Disciplina**: Si se selecciona MMA + Boxeo = incluir ambas
2. **Nivel**: Si se seleccionan múltiples niveles = OR (unión)
3. **Combinación**: Disciplina AND Nivel

Ejemplos:
- MMA + Amateur = 39 peleadores
- Boxeo + (Profesional OR Amateur) = 2 + 6 = 8 peleadores
- (MMA + Boxeo) + Profesional = 9 + 2 = 11 peleadores

---

## Cambios Técnicos

### 1. Frontend (`EmailCampaignEditor.tsx`)

**Nuevos estados:**
```tsx
const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
const [segmentCount, setSegmentCount] = useState<number>(0);
```

**Nuevo filtro en selector:**
```tsx
<SelectItem value="fighters_segment">Peleadores por Segmento</SelectItem>
```

**Componente de segmentación:**
```tsx
{recipientFilter === "fighters_segment" && (
  <FighterSegmentSelector
    selectedDisciplines={selectedDisciplines}
    onDisciplinesChange={setSelectedDisciplines}
    selectedLevels={selectedLevels}
    onLevelsChange={setSelectedLevels}
    onCountUpdate={setSegmentCount}
  />
)}
```

### 2. Nuevo Componente (`FighterSegmentSelector.tsx`)

```tsx
// Checkboxes para disciplinas y niveles
// Query en tiempo real para mostrar conteo:
const { data: counts } = useQuery({
  queryKey: ['fighter-segment-counts', disciplines, levels],
  queryFn: async () => {
    let query = supabase
      .from('fighter_profiles')
      .select('id, discipline, level', { count: 'exact' })
      .eq('active', true);
    
    if (disciplines.length > 0) {
      query = query.in('discipline', disciplines);
    }
    if (levels.length > 0) {
      query = query.in('level', levels);
    }
    
    return query;
  }
});
```

### 3. Edge Function (`send-mass-email/index.ts`)

**Nuevo tipo de request:**
```typescript
interface MassEmailRequest {
  // ... campos existentes
  recipient_filter?: 'all' | 'fighters_only' | 'admins_only' | 'custom' | 'fighters_segment';
  segment_disciplines?: string[];  // ['MMA', 'Boxeo']
  segment_levels?: string[];       // ['Profesional', 'Amateur']
}
```

**Nueva lógica de query:**
```typescript
case 'fighters_segment':
  query = supabase
    .from('fighter_profiles')
    .select('user_id')
    .eq('active', true);
  
  if (requestData.segment_disciplines?.length > 0) {
    query = query.in('discipline', requestData.segment_disciplines);
  }
  if (requestData.segment_levels?.length > 0) {
    query = query.in('level', requestData.segment_levels);
  }
  
  // Luego obtener emails de app_user
  break;
```

### 4. Clasificación Automática de Campañas

**Actualizar metadata en `email_campaign_log`:**
```typescript
metadata: {
  // ... campos existentes
  segment: {
    disciplines: requestData.segment_disciplines,
    levels: requestData.segment_levels,
    description: "MMA - Amateur" // Auto-generado
  }
}
```

### 5. Mostrar Segmento en Lista de Campañas (`EmailCampaigns.tsx`)

```tsx
// En la lista de campañas
const getFilterLabel = (campaign) => {
  if (campaign.recipient_filter === 'fighters_segment') {
    const segment = campaign.metadata?.segment;
    return `${segment?.disciplines?.join(', ')} - ${segment?.levels?.join(', ')}`;
  }
  // ... lógica existente
};
```

---

## Flujo de Usuario

1. Admin abre Editor de Campañas
2. Selecciona "Peleadores por Segmento"
3. Marca las disciplinas deseadas (MMA, Boxeo o ambas)
4. Marca los niveles deseados (Profesional, Semi, Amateur)
5. Ve en tiempo real cuántos destinatarios coinciden
6. Compone el mensaje y envía
7. La campaña se guarda con los metadatos del segmento
8. En la lista de campañas, aparece etiquetada automáticamente

---

## Archivos a Modificar/Crear

| Archivo | Acción | Cambios |
|---------|--------|---------|
| `src/pages/admin/EmailCampaignEditor.tsx` | Modificar | Agregar opción de segmento, estados, envío de parámetros |
| `src/components/admin/FighterSegmentSelector.tsx` | Crear | Componente con checkboxes y conteo en tiempo real |
| `supabase/functions/send-mass-email/index.ts` | Modificar | Nueva lógica para filtrar por disciplina/nivel |
| `src/pages/admin/EmailCampaigns.tsx` | Modificar | Mostrar etiqueta de segmento en campañas |

---

## Validaciones

1. **Al menos una disciplina** si se elige segmento
2. **Al menos un nivel** si se elige segmento  
3. **Conteo > 0** antes de permitir envío
4. **Confirmar** con resumen claro: "¿Enviar a 39 peleadores de MMA Amateur?"

---

## Vista Final del Editor

```text
┌─────────────────────────────────────────────────────────────┐
│ Para: [Peleadores por Segmento ▼]                          │
├─────────────────────────────────────────────────────────────┤
│   Disciplina                    Nivel                       │
│   ☑ MMA (55)                   ☐ Profesional (11)          │
│   ☐ Boxeo (9)                  ☐ Semi-profesional (8)      │
│                                ☑ Amateur (45)               │
│   ─────────────────────────────────────────────────────────│
│   📊 39 peleadores serán contactados                       │
├─────────────────────────────────────────────────────────────┤
│ Asunto: [ Torneo Amateur MMA - Inscripciones Abiertas    ] │
├─────────────────────────────────────────────────────────────┤
│ [B] [I] [U] [Lista] [Imagen] [Adjuntar]                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Escribe tu mensaje aquí...                                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ ☑ Modo Prueba [correo@test.com     ]    [ Enviar Prueba ] │
└─────────────────────────────────────────────────────────────┘
```
