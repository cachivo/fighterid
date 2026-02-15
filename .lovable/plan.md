

# Mejoras a la Pantalla de Inicio de Sesion

## Problema
1. La pagina de autenticacion no tiene el logo de Fighter ID, lo que le resta identidad de marca.
2. El enlace de "Olvidaste tu contrasena" existe pero no ofrece contexto ni instrucciones al usuario sobre que esperar del proceso de recuperacion.

## Cambios Propuestos

### 1. Agregar Logo de Fighter ID
- Copiar la imagen subida (`Fighter_ID_Logo-3.PNG`) a `src/assets/fighter-id-logo-auth.png`
- Mostrar el logo centrado encima del titulo "Acceso a Fighter ID" dentro del `CardHeader`
- Tamano aproximado: `w-32` (128px), centrado con `mx-auto`

### 2. Mejorar la seccion "Olvidaste tu contrasena"
En el paso de login (step === 'login'), reemplazar el enlace simple por una seccion mas informativa:

- Mantener el boton "Olvidaste tu contrasena?" pero agregar debajo un texto explicativo breve:
  - "Te enviaremos un correo con un enlace seguro para crear una nueva contrasena. El enlace es valido por 24 horas."
- Esto se mostrara como un pequeno bloque informativo (`text-xs text-muted-foreground`) justo debajo del boton de recuperacion, antes del boton "Usar otro email"

## Resultado Visual Esperado

```text
+------------------------------------------+
|          [FIGHTER ID LOGO]               |
|                                          |
|       Acceso a Fighter ID               |
|   Ingresa tu contrasena para acceder     |
|                                          |
|  Email:                                  |
|  usuario@email.com                       |
|                                          |
|  Contrasena: [________]                  |
|                                          |
|  [    Iniciar Sesion    ]                |
|  ─────────────────────────               |
|  ? Olvidaste tu contrasena?              |
|  Te enviaremos un correo con un enlace   |
|  seguro para crear una nueva contrasena. |
|                                          |
|  <- Usar otro email                      |
+------------------------------------------+
```

## Seccion Tecnica

### Archivos modificados

**`src/pages/Auth.tsx`**
1. Copiar imagen del usuario a `src/assets/fighter-id-logo-auth.png`
2. Importar la imagen: `import fighterIdLogo from '@/assets/fighter-id-logo-auth.png'`
3. En el `CardHeader` (linea ~226), agregar `<img>` del logo centrado antes del `CardTitle`
4. En la seccion de login (lineas 284-303), agregar un parrafo explicativo debajo del boton de "Olvidaste tu contrasena" con instrucciones claras sobre el proceso de recuperacion

### Sin otros archivos afectados
La pagina de `ForgotPassword.tsx` ya tiene buenas instrucciones y feedback, no requiere cambios.

