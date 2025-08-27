-- Agregar políticas RLS para permitir operaciones CRUD en eventos_deportivos para usuarios autenticados

-- Política para permitir INSERT a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden crear eventos deportivos" 
ON public.eventos_deportivos 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Política para permitir UPDATE a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden actualizar eventos deportivos" 
ON public.eventos_deportivos 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para permitir DELETE a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden eliminar eventos deportivos" 
ON public.eventos_deportivos 
FOR DELETE 
TO authenticated
USING (true);