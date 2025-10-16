-- Agregar campo para clasificar peleas como estelar/co-estelar
ALTER TABLE public.fights 
ADD COLUMN card_position text CHECK (card_position IN ('main_event', 'co_main_event', 'regular')) DEFAULT 'regular';

-- Crear índice para buscar peleas principales rápidamente
CREATE INDEX idx_fights_card_position ON public.fights(card_position) WHERE card_position IN ('main_event', 'co_main_event');

COMMENT ON COLUMN public.fights.card_position IS 'Posición en la cartelera: main_event (estelar), co_main_event (co-estelar), regular (normal)';