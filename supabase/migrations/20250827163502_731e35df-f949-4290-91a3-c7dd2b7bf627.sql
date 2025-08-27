-- Crear políticas RLS para eventos_digitales
CREATE POLICY "Usuarios autenticados pueden crear eventos digitales" 
ON public.eventos_digitales 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar eventos digitales" 
ON public.eventos_digitales 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden eliminar eventos digitales" 
ON public.eventos_digitales 
FOR DELETE 
TO authenticated
USING (true);

-- Crear políticas RLS para servicios
CREATE POLICY "Usuarios autenticados pueden crear servicios" 
ON public.servicios 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar servicios" 
ON public.servicios 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden eliminar servicios" 
ON public.servicios 
FOR DELETE 
TO authenticated
USING (true);

-- Crear políticas RLS para estadisticas
CREATE POLICY "Usuarios autenticados pueden crear estadisticas" 
ON public.estadisticas 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar estadisticas" 
ON public.estadisticas 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden eliminar estadisticas" 
ON public.estadisticas 
FOR DELETE 
TO authenticated
USING (true);

-- Crear políticas RLS para testimonios
CREATE POLICY "Usuarios autenticados pueden crear testimonios" 
ON public.testimonios 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar testimonios" 
ON public.testimonios 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden eliminar testimonios" 
ON public.testimonios 
FOR DELETE 
TO authenticated
USING (true);

-- Crear políticas RLS para partners
CREATE POLICY "Usuarios autenticados pueden crear partners" 
ON public.partners 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar partners" 
ON public.partners 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden eliminar partners" 
ON public.partners 
FOR DELETE 
TO authenticated
USING (true);

-- Crear políticas RLS para configuracion_sitio
CREATE POLICY "Usuarios autenticados pueden crear configuracion" 
ON public.configuracion_sitio 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar configuracion" 
ON public.configuracion_sitio 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden eliminar configuracion" 
ON public.configuracion_sitio 
FOR DELETE 
TO authenticated
USING (true);