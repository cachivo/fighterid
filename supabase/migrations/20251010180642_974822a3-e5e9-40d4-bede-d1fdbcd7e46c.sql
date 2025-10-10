-- FASE 3: ELIMINAR TABLAS LEGACY INNECESARIAS
-- Estas tablas NO almacenan eventos reales, solo configuración estática que no se usa

-- 1. Eliminar tabla de eventos deportivos (configuración legacy)
DROP TABLE IF EXISTS public.eventos_deportivos CASCADE;

-- 2. Eliminar tabla de eventos digitales (configuración legacy)
DROP TABLE IF EXISTS public.eventos_digitales CASCADE;

-- 3. Eliminar tabla de eventos destacados (nunca se usó realmente)
DROP TABLE IF EXISTS public.eventos_destacados CASCADE;

-- 4. Eliminar tabla de estadísticas (duplicado sin funcionalidad real)
DROP TABLE IF EXISTS public.estadisticas CASCADE;

-- NOTA: La tabla REAL de eventos es bdg_event, que se mantiene intacta.
-- bdg_event es la única fuente de verdad para eventos de pelea reales.