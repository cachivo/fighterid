
# Correccion: Ranking Amateur por Defecto + Gimnasio sin Peleadores

## Problemas Detectados

### 1. El ranking debe iniciar en Amateur
En `Ranking.tsx` (lineas 56-68), la logica prioriza Profesional > Semi > Amateur. Debe invertirse para que Amateur sea siempre la primera opcion.

### 2. El ranking no carga sin seleccion
Cuando `selectedLevel` es `''` (vacio), la query del ranking se ejecuta sin filtro de nivel, pero el componente muestra skeleton esperando que `selectedLevel` se llene. Si `levelCounts` no retorna datos, el nivel nunca se selecciona automaticamente. Solucion: usar `Amateur` como fallback inmediato antes de esperar datos.

### 3. Pagina de gimnasio no muestra peleadores
`GimnasioDetalle.tsx` solo muestra info del gym y entrenadores, pero no consulta ni muestra los peleadores vinculados. Se debe agregar una seccion de peleadores del gimnasio.

---

## Cambios

### Archivo: `src/components/sections/Ranking.tsx`
**Invertir prioridad de nivel por defecto** (lineas 56-68):
- Cambiar orden a: Amateur > Semi-profesional > Profesional
- Ademas, si `availableLevels` tiene valores pero aun no hay `levelCounts`, usar `Amateur` directamente como fallback inmediato (sin esperar la query)

### Archivo: `src/components/sections/LeagueSelector.tsx`
**Seleccionar organizacion amateur por defecto**:
- Al cambiar disciplina, si existe una organizacion amateur (como `HHF_AMATEUR` en Boxeo), seleccionarla primero
- Para MMA, `UCC_MMA` ya incluye Amateur asi que no cambia

### Archivo: `src/pages/Index.tsx`
**Cambiar org inicial a `UCC_MMA`** (ya es asi, no requiere cambio)

### Archivo: `src/pages/GimnasioDetalle.tsx`
**Agregar seccion de peleadores del gimnasio**:
- Consultar `fighter_profiles` donde `gym_id = gym.id` y `active = true`
- Mostrar lista de peleadores con avatar, nombre, nickname, disciplina y record
- Cada card es clickeable y navega a `/fighter/{id}`
- Si no hay peleadores, mostrar mensaje "Este gimnasio aun no tiene peleadores registrados"

---

## Detalle Tecnico

### Logica de nivel por defecto (Ranking.tsx)
```text
Prioridad actual:  Profesional > Semi > Amateur
Prioridad nueva:   Amateur > Semi > Amateur (fallback inmediato)

Si availableLevels incluye 'Amateur' -> seleccionar Amateur
Si no, primer nivel disponible
No esperar levelCounts para la seleccion inicial
```

### Query de peleadores del gimnasio (GimnasioDetalle.tsx)
```text
SELECT id, first_name, last_name, nickname, avatar_url, 
       discipline, weight_class, level,
       mma_record_wins, mma_record_losses, mma_record_draws,
       boxeo_record_wins, boxeo_record_losses, boxeo_record_draws
FROM fighter_profiles
WHERE gym_id = {gymId} AND active = true
ORDER BY first_name
```

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/sections/Ranking.tsx` | Invertir prioridad: Amateur primero. Fallback inmediato sin esperar levelCounts |
| `src/components/sections/LeagueSelector.tsx` | Priorizar org amateur al cambiar disciplina |
| `src/pages/GimnasioDetalle.tsx` | Agregar seccion de peleadores con query a fighter_profiles por gym_id |

**3 archivos modificados, 0 migraciones SQL necesarias.**
