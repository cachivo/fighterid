# Plan: Auditoría de Base de Datos y Corrección del Flujo de Creación de Perfiles

## ✅ Estado: COMPLETADO

---

## Resumen de Cambios Implementados

### ✅ Parte 1: Corrección de Selects en LicenseOnboarding.tsx
- **Género**: Aplicado patrón `__none__` - ya no crashea
- **Nivel**: Aplicado patrón `__none__`
- **Categoría de Peso**: Aplicado patrón `__none__`
- **Stance**: Aplicado patrón `__none__`

### ✅ Parte 2: Migración de Base de Datos
- 45 registros actualizados de inglés a español
- Categorías actualizadas:
  - Strawweight → Peso Paja
  - Flyweight → Peso Mosca
  - Bantamweight → Peso Gallo
  - Featherweight → Peso Pluma
  - Lightweight → Peso Ligero
  - Welterweight → Peso Welter
  - Middleweight → Peso Medio
  - Light Heavyweight → Peso Semipesado
  - Heavyweight → Peso Pesado

### ✅ Parte 3: Función import_fighter_data
- Actualizada para generar categorías en español automáticamente

---

## Flujo de Creación de Perfil - Estado Actual

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    FLUJO DE CREACIÓN DE PERFIL                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   [1] Usuario en /license/auth                                      │
│        ↓                                                            │
│   [2] Login/Registro exitoso                                        │
│        ↓                                                            │
│   [3] Redirección a /license/onboarding                             │
│        ↓                                                            │
│   [4] PASO 1: Datos Personales ✅ TODOS CORREGIDOS                  │
│       • Nombre/Apellido ✅                                          │
│       • Género ✅ CORREGIDO                                         │
│       • Disciplinas ✅ CORREGIDO                                    │
│       • Nivel ✅ CORREGIDO                                          │
│       • Categoría Peso ✅ CORREGIDO                                 │
│       • Stance ✅ CORREGIDO                                         │
│        ↓                                                            │
│   [5] PASO 2: Documentos                                            │
│       • Foto de identidad                                           │
│       • Foto de peleador                                            │
│        ↓                                                            │
│   [6] Envío → createProfile()                                       │
│        ↓                                                            │
│   [7] Redirección a /license/pending                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Notas de Seguridad

Los warnings del linter de seguridad detectados son **pre-existentes** y no fueron introducidos por esta migración:
- RLS Policies con `USING (true)` - configuraciones existentes
- Funciones sin search_path - funciones anteriores
- Extensión en schema public - configuración existente

Estos pueden revisarse en una tarea de seguridad separada.
