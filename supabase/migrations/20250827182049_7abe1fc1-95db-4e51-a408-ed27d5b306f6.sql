-- Arreglar políticas RLS para eventos_deportivos
-- Primero eliminamos las políticas existentes
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar eventos deportivos" ON public.eventos_deportivos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear eventos deportivos" ON public.eventos_deportivos;  
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar eventos deportivos" ON public.eventos_deportivos;

-- Crear políticas RLS correctas que verifiquen autenticación
CREATE POLICY "Usuarios autenticados pueden actualizar eventos deportivos" 
ON public.eventos_deportivos 
FOR UPDATE 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden crear eventos deportivos" 
ON public.eventos_deportivos 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden eliminar eventos deportivos" 
ON public.eventos_deportivos 
FOR DELETE 
USING (auth.uid() IS NOT NULL);