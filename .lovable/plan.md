

# Auditoria Completa: Flujo de Autenticacion y Sincronizacion

## Problemas Encontrados

### Problema 1: "Olvide mi contrasena" no funciona (CRITICO)
**Causa raiz**: Tanto el enlace en el paso de email (linea 258) como el boton en el paso de login (linea 297) usan navegacion nativa del navegador (`<a href>` y `window.location.href`) en lugar de React Router. Esto causa una recarga completa de la pagina, lo que destruye el estado de la aplicacion React (contexto de autenticacion, sesion, etc.) y puede resultar en una pantalla en blanco o comportamiento inesperado.

**Solucion**: Reemplazar ambos con el componente `<Link>` de React Router o `useNavigate()` para navegacion del lado del cliente.

### Problema 2: Registro falla con "Database error saving new user" (CRITICO)
**Causa raiz**: Hay una desincronizacion entre `auth.users` y `app_user`:
- El email `miocorreo88@gmail.com` existe en la tabla `app_user` (con `auth_user_id: 029e9cd6-...`)
- Pero NO existe en `auth.users` (el usuario fue eliminado de Auth pero no de `app_user`)
- La funcion `check_email_exists_fn` solo verifica `auth.users`, asi que retorna `false` (usuario no existe)
- El sistema muestra el formulario de registro
- Al intentar registrar, un trigger en la base de datos detecta que el email ya existe en `app_user` y lanza un error 500

**Solucion en dos partes**:
1. Actualizar `check_email_exists_fn` para verificar AMBAS tablas (`auth.users` Y `app_user`)
2. Mejorar el manejo de errores en Auth.tsx para capturar el error 500 de signup y mostrar un mensaje amigable

### Problema 3: Manejo de error 500 en signup inexistente
Cuando el signup retorna un error 500 ("Database error saving new user"), el codigo actual no maneja este caso especifico. El usuario ve un mensaje generico o el toast no es claro.

**Solucion**: Agregar manejo especifico para errores de duplicado en el flujo de registro.

---

## Plan de Implementacion

### Paso 1: Corregir navegacion de "Olvide mi contrasena"
**Archivo**: `src/pages/Auth.tsx`
- Linea 257-262: Cambiar `<a href="/auth/forgot-password">` por `<Link to="/auth/forgot-password">`
- Linea 297: Cambiar `window.location.href = '/auth/forgot-password'` por navegacion con React Router (`useNavigate`)

### Paso 2: Actualizar funcion de verificacion de email
**Migracion SQL**: Modificar `check_email_exists_fn` para verificar tanto `auth.users` como `app_user`:
```sql
CREATE OR REPLACE FUNCTION public.check_email_exists_fn(p_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = lower(trim(p_email))
  ) OR EXISTS (
    SELECT 1 FROM public.app_user WHERE email = lower(trim(p_email))
  );
$$;
```

### Paso 3: Mejorar manejo de errores en registro
**Archivo**: `src/pages/Auth.tsx`
- En la funcion `handleSignUp`, capturar errores 500 y mensajes que contengan "already exists" o "Database error"
- Mostrar un mensaje claro: "Este correo ya esta registrado en el sistema. Intenta iniciar sesion o recupera tu contrasena."
- Cambiar automaticamente al paso de login cuando esto ocurra

### Paso 4: Limpiar dato huerfano (recomendacion)
El registro huerfano en `app_user` para `miocorreo88@gmail.com` (sin usuario correspondiente en `auth.users`) deberia limpiarse. Esto se puede hacer con una consulta SQL manual o automatizando la limpieza.

