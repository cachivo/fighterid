
# Correccion: Formulario de Creacion de Perfiles se Traba

## Problema Raiz

El formulario `AdminFighterForm.tsx` tiene **campos no inicializados** en el estado `formData` (lineas 55-74). Campos como `gender`, `stance`, `bio`, `fighting_style`, `birthplace`, `gym_name`, `height_cm`, `weight_kg`, `reach_cm` no estan en el estado inicial.

Cuando un componente `<Select value={undefined}>` (no controlado) recibe un valor por primera vez via `onValueChange`, pasa de **no-controlado a controlado**. Esto es un antipatron de React que causa comportamiento erratico: el Select puede quedar en un loop de reconciliacion y trabar la pagina.

Los campos `<Input value={undefined}>` tambien generan warnings de React por la misma razon (uncontrolled to controlled).

## Solucion

### Archivo: `src/components/admin/AdminFighterForm.tsx`

**1. Inicializar TODOS los campos en el estado inicial** (lineas 55-74):

Agregar los campos faltantes con valores por defecto seguros:
```text
gender: '',
height_cm: 0,
weight_kg: 0,
reach_cm: 0,
bio: '',
fighting_style: '',
gym_name: '',
gym_id: undefined,
birthdate: '',
birthplace: '',
stance: '',
avatar_url: '',
```

**2. Proteger los Select contra valor vacio** (lineas 330, 501, 612, 628, 738):

Para los Select que pueden tener valor vacio (`gender`, `stance`, `discipline`), cambiar:
```text
ANTES:  <Select value={formData.gender}>
DESPUES: <Select value={formData.gender || undefined}>
```

Esto mantiene el Select en modo "no controlado con placeholder" hasta que el usuario elija un valor, evitando el conflicto controlado/no-controlado.

Aplicar a:
- gender (linea 330)
- stance (linea 501)
- discipline (linea 612)

Los demas Select (`country`, `weight_class`, `level`, `record_type`) ya tienen valores iniciales validos, asi que no necesitan cambio.

**3. Proteger Inputs de texto contra `undefined`** (lineas 391, 646, 691, 898):

Cambiar:
```text
ANTES:  value={formData.birthplace}
DESPUES: value={formData.birthplace || ''}
```

Aplicar a: `birthplace`, `fighting_style`, `gym_name`, `bio`.

---

## Detalle Tecnico

### Estado inicial corregido
```text
formData inicializa con:
  first_name: ''         (ya existe)
  last_name: ''          (ya existe)
  nickname: ''           (ya existe)
  country: 'Honduras'    (ya existe)
  weight_class: 'Peso Ligero' (ya existe)
  discipline: undefined  (ya existe - OK, se protege en Select)
  martial_arts: []       (ya existe)
  record_wins/losses/draws: 0 (ya existe)
  mma_record_*: 0        (ya existe)
  boxeo_record_*: 0      (ya existe)
  record_type: 'Amateur' (ya existe)
  level: 'Amateur'       (ya existe)
  --- CAMPOS FALTANTES (agregar) ---
  gender: ''
  height_cm: 0
  weight_kg: 0
  reach_cm: 0
  bio: ''
  fighting_style: ''
  gym_name: ''
  gym_id: undefined
  birthdate: ''
  birthplace: ''
  stance: ''
  avatar_url: ''
```

### Proteccion Select
```text
<Select value={formData.gender || undefined}>  // '' -> undefined = uncontrolled con placeholder
<Select value={formData.stance || undefined}>
<Select value={formData.discipline || undefined}>  // ya usa || '' pero debe ser || undefined
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/admin/AdminFighterForm.tsx` | Inicializar campos faltantes + proteger Select e Input contra undefined |

**1 archivo modificado. Sin migraciones SQL. Sin archivos nuevos.**
