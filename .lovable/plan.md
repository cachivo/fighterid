
# Plan: Eliminar Header Duplicado en Dashboard

## Problema Identificado

```text
ESTRUCTURA ACTUAL (INCORRECTA):
┌─────────────────────────────────────────────────────────────┐
│ App.tsx                                                      │
│  └─ AdminProtectedRoute                                      │
│      └─ AdminLayout ← PRIMER header                          │
│          └─ Routes                                           │
│              └─ Dashboard                                    │
│                  └─ AdminLayoutWithAI                        │
│                      └─ AdminLayout ← SEGUNDO header (duplicado)│
│                          └─ contenido                        │
└─────────────────────────────────────────────────────────────┘
```

## Causa Raíz

| Archivo | Línea | Código | Problema |
|---------|-------|--------|----------|
| `App.tsx` | 249 | `<AdminLayout>` | Envuelve TODAS las rutas admin |
| `AdminLayoutWithAI.tsx` | 18 | `<AdminLayout>` | Vuelve a envolver el contenido |

## Solución

Modificar `AdminLayoutWithAI` para que **solo agregue el ChatWidget** sin duplicar el layout, ya que `App.tsx` ya proporciona el `AdminLayout`.

### Cambio en AdminLayoutWithAI.tsx

```typescript
// ANTES (duplica el layout)
const AdminLayoutWithAI: React.FC<AdminLayoutWithAIProps> = ({ children }) => {
  return (
    <>
      <AdminLayout>        ← Esto causa la duplicación
        {children}
      </AdminLayout>
      <ChatWidget />
    </>
  );
};

// DESPUÉS (solo agrega el ChatWidget)
const AdminLayoutWithAI: React.FC<AdminLayoutWithAIProps> = ({ children }) => {
  return (
    <>
      {children}           ← Contenido directo, sin envolver
      <ChatWidget />       ← Solo agrega el chat
    </>
  );
};
```

## Resultado Esperado

```text
ESTRUCTURA CORREGIDA:
┌─────────────────────────────────────────────────────────────┐
│ App.tsx                                                      │
│  └─ AdminProtectedRoute                                      │
│      └─ AdminLayout ← ÚNICO header                           │
│          └─ Routes                                           │
│              └─ Dashboard                                    │
│                  └─ AdminLayoutWithAI                        │
│                      └─ contenido (sin layout extra)         │
│                      └─ ChatWidget                           │
└─────────────────────────────────────────────────────────────┘
```

## Archivo a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/admin/AIAssistant/AdminLayoutWithAI.tsx` | Remover `<AdminLayout>` wrapper |

## Impacto Visual

```text
ANTES:
┌────────────────────────────┐
│ FID Panel de Administración│ ← Header 1
├────────────────────────────┤
│ FID Panel de Administración│ ← Header 2 (DUPLICADO)
├────────────────────────────┤
│ Dashboard Administrativo   │
│ [contenido...]             │
└────────────────────────────┘

DESPUÉS:
┌────────────────────────────┐
│ FID Panel de Administración│ ← Único header
├────────────────────────────┤
│ Dashboard Administrativo   │
│ [contenido...]             │
└────────────────────────────┘
```

## Beneficios

- Elimina ~56px de espacio vertical desperdiciado
- Evita confusión visual con headers duplicados
- Mantiene funcionalidad del ChatWidget intacta
- Corrección de 1 línea de código
