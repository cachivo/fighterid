

# Arquitectura Completa del Ecosistema Fighter ID - Plan de Implementacion

## Diagnostico: Que YA existe vs Que FALTA

### Estado actual de la base de datos (97 tablas)

| Componente | Estado | Datos |
|---|---|---|
| fighter_profiles (57 cols) | COMPLETO | 42+ peleadores |
| fighter_licenses (23 cols) | COMPLETO | 41 licencias |
| gyms (21 cols) | COMPLETO | 27 gimnasios |
| gym_staff (8 cols) | COMPLETO | 3 staff |
| fighter_gym_memberships (9 cols) | COMPLETO | 65 membresías |
| judges (17 cols) | PARCIAL | 4 jueces |
| fights (21 cols) | PARCIAL | 4 peleas |
| events (12 cols) | PARCIAL - esquema limitado | 0 eventos |
| organizations (5 cols) | MINIMO - solo ranking | 0 registros |
| fight_officials (10 cols) | EXISTE | 0 registros |
| medical_certifications (12 cols) | EXISTE | 0 registros |
| audit_log (11 cols) | EXISTE | 1,044 registros |
| user_roles | EXISTE | admin(6), super_admin(1), moderator(4), user(143) |

### Lo que FALTA construir

**Base de datos (tablas nuevas o extensiones):**
- `officials` - Tabla unificada para jueces/arbitros/medicos/cronometristas/inspectores (actualmente solo `judges`)
- `official_certifications` - Certificaciones de officials (separada de `medical_certifications` que es para peleadores)
- `sanctions` - Sistema de sanciones
- `sanction_appeals` - Apelaciones
- `fighter_eligibility` - Estado de elegibilidad calculado
- `fighter_insurance` - Validacion de seguros
- Ampliar `events` - Necesita status workflow, venue, organization_id funcional
- Ampliar `organizations` - Necesita contacto, permisos, verificacion
- Ampliar `fights` - Necesita `requested_by`, workflow de aprobacion
- Nuevos roles en `user_roles` - license_officer, technical_coordinator, auditor, promoter, official_*

**Frontend (paginas nuevas):**
- Portal Officials completo (dashboard, asignaciones, scorecards, certificaciones)
- Panel Admin: Sanctions, Officials Management, Eligibility
- Flujos de solicitud de pelea desde Gym
- Sistema de notificaciones para asignaciones

---

## Plan de Implementacion por Fases

Dado el tamano del ecosistema, se divide en 6 fases incrementales. Cada fase es funcional por si sola.

---

### FASE 1: Expandir Roles y Officials (Fundacion)
**Duracion estimada: 3-4 sesiones**

**Objetivo**: Crear la infraestructura de roles expandida y la tabla `officials` unificada que reemplaza/extiende `judges`.

**Cambios en base de datos:**

1. **Expandir `user_roles`** - Agregar nuevos roles al enum:
   - `license_officer`, `technical_coordinator`, `auditor`, `promoter`
   - `official_judge`, `official_referee`, `official_doctor`, `official_timekeeper`, `official_inspector`

2. **Crear tabla `officials`** - Perfil unificado de oficial:
   - Tipo (judge/referee/doctor/timekeeper/inspector)
   - Nivel de certificacion (regional/national/international)
   - Info personal, contacto
   - Stats (eventos trabajados, peleas, rating promedio)
   - Status (activo, disponible, suspendido)
   - Vinculado a `user_id` de `app_user`

3. **Crear tabla `official_certifications`** - Certificaciones por disciplina:
   - Disciplina, tipo, entidad emisora
   - Fechas de emision/vencimiento
   - Documento adjunto
   - Verificacion por admin

4. **Migrar datos de `judges`** a `officials` (los 4 jueces existentes)

**Cambios en frontend:**

5. **Actualizar `/admin/user-roles`** - Mostrar y asignar los nuevos roles
6. **Crear pagina `/admin/officials`** - CRUD de officials con filtros por tipo
7. **Crear pagina `/admin/officials/:id`** - Detalle de official con certificaciones

**Archivos a modificar/crear:**
- Nueva migracion SQL (officials, official_certifications, roles expandidos)
- `src/pages/admin/OfficialsManagement.tsx` (nuevo)
- `src/pages/admin/OfficialDetail.tsx` (nuevo)
- `src/hooks/useOfficials.tsx` (nuevo)
- `src/components/admin/OfficialCard.tsx` (nuevo)
- `src/components/admin/OfficialForm.tsx` (nuevo)
- `src/App.tsx` (nuevas rutas)
- `src/components/AdminSidebar.tsx` (nuevos enlaces)

---

### FASE 2: Expandir Events y Organizations
**Duracion estimada: 2-3 sesiones**

**Objetivo**: Convertir la tabla `events` limitada en un sistema completo de gestion de eventos con workflow de aprobacion.

**Cambios en base de datos:**

1. **Expandir tabla `events`** - Agregar columnas:
   - `organization_id` (FK a organizations)
   - `venue_name`, `venue_address`, `city`, `country`
   - `status` (draft/pending/approved/live/completed/cancelled)
   - `poster_url`, `rules_document_url`
   - `approved_by`, `approved_at`
   - `total_fights`, `total_attendees`

2. **Expandir tabla `organizations`** - Agregar columnas:
   - `slug`, `logo_url`
   - `contact_name`, `contact_email`, `contact_phone`
   - `can_create_events`, `can_sanction_fights`
   - `active`, `verified`

3. **Crear tabla `event_officials`** - Officials asignados a eventos

**Cambios en frontend:**

4. **Refactorizar `/admin/eventos-pelea`** - Agregar workflow de status, asignacion de officials
5. **Crear componente de asignacion de officials a evento**
6. **Dashboard de evento con officials asignados**

**Archivos a modificar/crear:**
- Nueva migracion SQL
- `src/pages/admin/EventosPelea.tsx` (refactorizar)
- `src/components/admin/EventForm.tsx` (nuevo/expandido)
- `src/hooks/useEvents.tsx` (expandir)

---

### FASE 3: Workflow de Peleas con Aprobacion
**Duracion estimada: 3-4 sesiones**

**Objetivo**: Implementar el flujo completo solicitud-validacion-aprobacion-asignacion de peleas.

**Cambios en base de datos:**

1. **Expandir tabla `fights`** - Agregar:
   - `requested_by` (quien solicita la pelea)
   - `discipline` (si no existe)
   - `referee_id`, `doctor_id`, `timekeeper_id`, `inspector_id` (FKs a officials)
   - `approved_by`, `approved_at`
   - `result_type` (ko/tko/submission/decision/draw/no_contest/dq)

2. **Crear tabla `fight_requests`** (opcional, o usar status en fights):
   - Solicitud de gym owner/coach
   - Validacion automatica de elegibilidad

3. **Crear funcion RPC `validate_fight_eligibility`**:
   - Verificar licencias vigentes de ambos peleadores
   - Verificar no suspendidos
   - Verificar peso compatible
   - Retornar lista de checks passed/failed

**Cambios en frontend:**

4. **Crear pagina de solicitud de pelea desde Gym Dashboard**
5. **Panel admin de aprobacion de peleas con checks automaticos**
6. **Asignacion de officials a peleas individuales**

**Archivos a modificar/crear:**
- Nueva migracion SQL
- `src/pages/gym/RequestFight.tsx` (nuevo)
- `src/components/admin/FightApprovalPanel.tsx` (nuevo)
- `src/components/admin/FightOfficialAssignment.tsx` (nuevo)
- `src/hooks/useFightRequests.tsx` (nuevo)

---

### FASE 4: Sistema de Sanciones
**Duracion estimada: 2-3 sesiones**

**Objetivo**: Sistema completo de sanciones con casos, evidencia y apelaciones.

**Cambios en base de datos:**

1. **Crear tabla `sanctions`**:
   - target_type (fighter/coach/official/gym/organization)
   - target_id
   - sanction_type (suspension/fine/warning/license_revocation/ban)
   - severity (1-5)
   - Fechas de inicio/fin
   - Multa (monto, pagado)
   - Status (open/under_review/decided/appealed/closed)
   - Evidencia (URLs)
   - Relacion con fight/event

2. **Crear tabla `sanction_appeals`**:
   - Razon, evidencia
   - Decision, decidido por

3. **Crear trigger** que actualice elegibilidad cuando se aplique sancion

**Cambios en frontend:**

4. **Crear `/admin/sanctions`** - Lista de sanciones con filtros
5. **Crear `/admin/sanctions/new`** - Formulario de nueva sancion
6. **Crear `/admin/sanctions/:id`** - Detalle con timeline de caso
7. **Mostrar sanciones activas en perfiles de peleadores**

**Archivos a modificar/crear:**
- Nueva migracion SQL
- `src/pages/admin/Sanctions.tsx` (nuevo)
- `src/pages/admin/SanctionDetail.tsx` (nuevo)
- `src/components/admin/SanctionForm.tsx` (nuevo)
- `src/hooks/useSanctions.tsx` (nuevo)

---

### FASE 5: Elegibilidad y Validacion Medica
**Duracion estimada: 2 sesiones**

**Objetivo**: Sistema automatizado que determina si un peleador puede pelear.

**Cambios en base de datos:**

1. **Crear tabla `fighter_eligibility`**:
   - fighter_id (unique)
   - is_eligible, license_valid, insurance_valid, medical_cleared, not_suspended, weight_verified
   - ineligibility_reasons (array)
   - next_eligible_date

2. **Crear tabla `fighter_insurance`**:
   - fighter_id, company, policy_number, valid_from, valid_until, document_url, verified

3. **Crear funcion RPC `recalculate_eligibility`** que:
   - Verifica licencia activa y no vencida
   - Verifica seguro vigente
   - Verifica certificacion medica vigente
   - Verifica no suspendido
   - Actualiza `fighter_eligibility`

4. **Crear trigger** que recalcule elegibilidad cuando cambien licencias, sanciones, o certificaciones medicas

**Cambios en frontend:**

5. **Badge de elegibilidad en perfil del peleador**
6. **Panel admin de elegibilidad masiva**
7. **Alertas de licencias/seguros por vencer**

---

### FASE 6: Portal de Officials (Mobile + Web)
**Duracion estimada: 3-4 sesiones**

**Objetivo**: Interfaz dedicada para jueces, arbitros, medicos y otros officials.

**Cambios en frontend:**

1. **Crear layout `/officials`** con navegacion propia
2. **Dashboard de official** - Proximos eventos, stats personales
3. **Lista de asignaciones** - Eventos asignados con status
4. **Scorecard digital** - Para jueces (integrar con sistema de scoring existente)
5. **Notas medicas** - Para doctores (pre/post pelea)
6. **Historial** - Eventos trabajados, evaluaciones recibidas
7. **Certificaciones** - Ver y subir certificaciones

**Archivos a crear:**
- `src/pages/officials/OfficialDashboard.tsx`
- `src/pages/officials/OfficialAssignments.tsx`
- `src/pages/officials/OfficialScorecard.tsx`
- `src/pages/officials/OfficialHistory.tsx`
- `src/pages/officials/OfficialCertifications.tsx`
- `src/components/officials/` (varios componentes)
- Protected route para officials

---

## Resumen de Impacto

| Metrica | Actual | Despues |
|---|---|---|
| Tablas | ~97 | ~107 |
| Roles | 4 | 14 |
| Paginas admin | 28 | ~36 |
| Portales de usuario | 3 (Fighter, Gym, Admin) | 4 (+Officials) |
| Flujos de negocio automatizados | 2 | 6 |

## Recomendacion de Inicio

Comenzar con **Fase 1** (Officials + Roles expandidos) ya que es la fundacion sobre la que se construyen las demas fases. Sin la tabla `officials` y los roles expandidos, no se pueden implementar asignaciones a peleas, sanciones ni el portal de officials.

## Seccion Tecnica

### Dependencias entre fases

```text
Fase 1 (Officials + Roles) ──┬──→ Fase 2 (Events expandido)
                              │
                              ├──→ Fase 3 (Fight workflow) ──→ Fase 4 (Sanciones)
                              │
                              ├──→ Fase 5 (Elegibilidad)
                              │
                              └──→ Fase 6 (Portal Officials)
```

Fase 1 es prerequisito de todas las demas. Fases 2-6 pueden ejecutarse en paralelo despues de Fase 1, aunque el orden propuesto es el mas logico.

### Patron de codigo a seguir
- Hooks: `src/hooks/useOfficials.tsx` siguiendo el patron de `src/hooks/useJudges.tsx`
- Paginas admin: Siguiendo patron de `src/pages/admin/JudgesManagement.tsx`
- Componentes: Siguiendo patron de `src/components/admin/AdminCoachCard.tsx`
- Rutas protegidas: Usando `AdminProtectedRoute` existente
- Migraciones: Con RLS policies, indices, y triggers

### Tablas existentes que se reutilizan (NO duplicar)
- `audit_log` - Ya funcional con 1,044 registros
- `fight_officials` - Ya existe, se adapta
- `medical_certifications` - Ya existe, se reutiliza
- `fight_judges` - Ya existe, se vincula a `officials`
- `gym_staff` - Ya funcional

