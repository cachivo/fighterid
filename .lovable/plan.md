
# Optimizacion de Botones de Edicion de Perfil para Movil

## Problemas Identificados

### 1. LicenseDashboard.tsx (Dashboard del Peleador Licenciado)
**Ubicacion:** Lineas 214-225

El boton "Actualizar" SOLO aparece cuando hay campos faltantes:
```tsx
{missingFields.length > 0 && (
  <Button onClick={handleUpdateInfo} ...>
    <Edit /> Actualizar
  </Button>
)}
```

**Problema:** Si el perfil esta completo al 100%, NO existe forma de editar la informacion. El `ProfileProgressWidget` tiene un boton pero dice "Perfil 100% Completo" y no indica claramente que se puede editar.

---

### 2. social/UserProfile.tsx (Perfil Social de Otros)
**Ubicacion:** Lineas 222-243

Solo muestra boton de accion para OTROS usuarios (agregar amigo):
```tsx
{!isOwnProfile && (
  <Button onClick={handleFriendAction}>
    Agregar Amigo
  </Button>
)}
```

**Problema:** Cuando un usuario visita su propio perfil social (`isOwnProfile = true`), NO hay boton de edicion visible.

---

### 3. FighterProfile.tsx (Perfil Publico del Peleador)
**Ubicacion:** Pagina completa

**Problema:** Es un perfil 100% publico sin ninguna logica para detectar si el visitante es el dueno del perfil. No hay boton de edicion ni para el propio peleador cuando visita su perfil publico.

---

### 4. SocialProfile.tsx (Perfil Social Propio)
**Ubicacion:** Lineas 129-158

Los botones de camara usan `group-hover:opacity-100`:
```tsx
<Button className="opacity-0 group-hover:opacity-100 transition-opacity">
  <Camera /> Cambiar portada
</Button>
```

**Problema:** En dispositivos tactiles NO existe `hover`, por lo que estos botones son INVISIBLES en movil.

---

## Plan de Correccion

### Fase 1: LicenseDashboard.tsx - Boton de Edicion Siempre Visible

Modificar el header para mostrar SIEMPRE un boton de edicion, independientemente del estado de completitud:

```tsx
// ANTES: Solo si hay campos faltantes
{missingFields.length > 0 && (
  <Button onClick={handleUpdateInfo}>...</Button>
)}

// DESPUES: Siempre visible con texto dinamico
<Button onClick={handleUpdateInfo}>
  <Edit />
  {missingFields.length > 0 ? 'Completar Perfil' : 'Editar Perfil'}
</Button>
```

Adicionalmente, optimizar el boton para movil:
- Altura minima de 44px
- `touch-manipulation` para evitar delays
- Icono siempre visible, texto responsive

---

### Fase 2: social/UserProfile.tsx - Boton de Edicion para Perfil Propio

Agregar boton de edicion cuando el usuario visita su propio perfil:

```tsx
{isOwnProfile ? (
  <Button asChild variant="default" size="lg">
    <Link to="/social/profile">
      <Edit /> Editar Perfil
    </Link>
  </Button>
) : (
  <Button onClick={handleFriendAction} disabled={isPending}>
    {isFriend ? 'Amigos' : 'Agregar Amigo'}
  </Button>
)}
```

---

### Fase 3: FighterProfile.tsx - Detectar Propietario y Mostrar Edicion

1. Agregar logica para detectar si el visitante es el dueno:
```tsx
const [isOwner, setIsOwner] = useState(false);

useEffect(() => {
  const checkOwnership = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && fighter?.user_id) {
      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();
      setIsOwner(appUser?.id === fighter.user_id);
    }
  };
  checkOwnership();
}, [fighter]);
```

2. Mostrar boton de edicion condicional:
```tsx
{isOwner && (
  <Button asChild className="min-h-[44px] touch-manipulation">
    <Link to="/license/dashboard">
      <Edit /> Editar Mi Perfil
    </Link>
  </Button>
)}
```

---

### Fase 4: SocialProfile.tsx - Botones de Camara Visibles en Movil

Reemplazar `group-hover:opacity-100` con visibilidad permanente en movil:

```tsx
// ANTES: Invisible en movil
<Button className="opacity-0 group-hover:opacity-100">

// DESPUES: Visible en movil, hover en desktop
<Button className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
```

Alternativa: Usar un boton de edicion flotante (FAB) siempre visible en movil.

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/license/LicenseDashboard.tsx` | Boton de edicion siempre visible en header |
| `src/pages/social/UserProfile.tsx` | Agregar boton de edicion cuando `isOwnProfile` |
| `src/pages/FighterProfile.tsx` | Detectar propietario + boton de edicion |
| `src/pages/social/SocialProfile.tsx` | Botones de camara visibles en movil |

---

## Especificaciones de UX Movil

Siguiendo los estandares del proyecto:

1. **Altura minima de botones:** 44px (`min-h-[44px]`)
2. **Touch optimization:** `touch-manipulation`
3. **Responsive text:** Texto corto en movil, completo en desktop
4. **Iconos:** Siempre visibles, texto opcional
5. **Sticky footer:** Para botones de guardar en formularios largos

---

## Flujo de Usuario Post-Implementacion

### Peleador Licenciado
1. Entra a `/license/dashboard`
2. Ve boton "Editar Perfil" siempre visible en header
3. Click abre formulario de edicion

### Usuario en Perfil Social
1. Entra a `/social/profile/:id` (su propio ID)
2. Ve boton "Editar Perfil" en lugar de "Agregar Amigo"
3. Click lo lleva a `/social/profile` para editar

### Peleador en Perfil Publico
1. Entra a `/fighter/:id` (su propio perfil)
2. Ve boton "Editar Mi Perfil" cerca del nombre
3. Click lo lleva a `/license/dashboard` para editar

---

## Resumen Tecnico

| Vista | Problema Actual | Solucion |
|-------|-----------------|----------|
| LicenseDashboard | Boton solo si perfil incompleto | Boton siempre visible |
| social/UserProfile | Sin boton para perfil propio | Agregar boton condicional |
| FighterProfile | Sin deteccion de propietario | Hook de ownership + boton |
| SocialProfile | Hover invisible en touch | Clases responsive |

Todas las correcciones siguen los estandares de optimizacion movil del proyecto: botones tactiles de 44px, `touch-manipulation`, layouts responsivos flex-col en movil y flex-row en desktop.
