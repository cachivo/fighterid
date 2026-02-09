

# Plan: Buscador y Mejoras en Gestion de Roles

## Problemas Actuales

1. **Sin buscador** - Si hay muchos usuarios, no hay forma de filtrar por nombre o email
2. **Carga todos los usuarios de golpe** - Sin paginacion, lo cual no escala bien
3. **Sin filtro por rol** - No se puede ver rapidamente solo los admins o moderadores
4. **Sin contador por rol** - No hay estadisticas rapidas de cuantos usuarios tienen cada rol

---

## Cambios a Implementar

### 1. Buscador de texto (nombre/email)

Agregar un campo de busqueda arriba de la lista que filtre usuarios en tiempo real (client-side, ya que los datos estan cargados):

- Filtrar por `first_name`, `last_name`, o `email`
- Busqueda instantanea sin necesidad de llamar a la API
- Icono de lupa y boton para limpiar busqueda

### 2. Filtro por rol

Agregar botones/tabs para filtrar por rol:
- **Todos** | **Admin** | **Moderador** | **Usuario** | **Sin rol**

### 3. Contadores rapidos (stats)

Mostrar arriba de la lista un resumen:
- Total de usuarios
- Cuantos son admin, moderador, usuario, sin rol

### 4. Contador de resultados filtrados

Actualizar el subtitulo de la card para mostrar "Mostrando X de Y usuarios" cuando hay filtro activo.

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/admin/UserRoles.tsx` | Agregar estado de busqueda, filtro por rol, logica de filtrado client-side, stats, y UI del buscador |

No se requieren cambios en el hook `useUserRoles.tsx` ya que el filtrado sera client-side sobre los datos ya cargados.

---

## Detalles Tecnicos

### Estado nuevo en UserRoles

```typescript
const [searchQuery, setSearchQuery] = useState('');
const [roleFilter, setRoleFilter] = useState<AppRole | 'all' | 'none'>('all');
```

### Logica de filtrado

```typescript
const filteredUsers = useMemo(() => {
  return users.filter(user => {
    // Filtro de texto
    const matchesSearch = !searchQuery || 
      user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filtro de rol
    const matchesRole = roleFilter === 'all' ||
      (roleFilter === 'none' ? user.roles.length === 0 : user.roles.includes(roleFilter));
    
    return matchesSearch && matchesRole;
  });
}, [users, searchQuery, roleFilter]);
```

### UI del buscador

Se agrega entre el header y la card:
- Input con icono de Search y boton X para limpiar
- Fila de badges/botones clickeables para filtrar por rol
- Stats con conteo por rol

### Resultado visual esperado

```text
+--------------------------------------------------+
| Gestion de Roles                                  |
| Administra los roles y permisos de usuarios       |
+--------------------------------------------------+
| [🔍 Buscar por nombre o email...            [X]] |
|                                                    |
| [Todos(25)] [Admin(2)] [Moderador(3)] [Usuario(18)] [Sin rol(2)] |
+--------------------------------------------------+
| Usuarios del Sistema                               |
| Mostrando 25 de 25 usuarios                        |
|                                                    |
| Usuario 1 ... [Editar Roles] [Eliminar]            |
| Usuario 2 ... [Editar Roles] [Eliminar]            |
+--------------------------------------------------+
```

