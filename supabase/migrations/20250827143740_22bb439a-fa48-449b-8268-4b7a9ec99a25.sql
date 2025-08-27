-- Crear tablas para el contenido del sitio web

-- Tabla para eventos deportivos
CREATE TABLE public.eventos_deportivos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  icono TEXT NOT NULL,
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para eventos digitales
CREATE TABLE public.eventos_digitales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  icono TEXT NOT NULL,
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para servicios
CREATE TABLE public.servicios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  icono TEXT NOT NULL,
  items TEXT[] NOT NULL DEFAULT '{}',
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para estadísticas del ranking
CREATE TABLE public.estadisticas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  icono TEXT NOT NULL,
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para eventos destacados
CREATE TABLE public.eventos_destacados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  participantes TEXT NOT NULL,
  audiencia TEXT NOT NULL,
  ranking TEXT NOT NULL,
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para testimonios
CREATE TABLE public.testimonios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  cargo TEXT NOT NULL,
  testimonio TEXT NOT NULL,
  avatar TEXT,
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para partners
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  logo TEXT,
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para configuración general del sitio
CREATE TABLE public.configuracion_sitio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clave TEXT NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  descripcion TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security en todas las tablas
ALTER TABLE public.eventos_deportivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_digitales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estadisticas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_destacados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_sitio ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS - Solo lectura pública para mostrar contenido
CREATE POLICY "Contenido público visible para todos" ON public.eventos_deportivos FOR SELECT USING (activo = true);
CREATE POLICY "Contenido público visible para todos" ON public.eventos_digitales FOR SELECT USING (activo = true);
CREATE POLICY "Contenido público visible para todos" ON public.servicios FOR SELECT USING (activo = true);
CREATE POLICY "Contenido público visible para todos" ON public.estadisticas FOR SELECT USING (activo = true);
CREATE POLICY "Contenido público visible para todos" ON public.eventos_destacados FOR SELECT USING (activo = true);
CREATE POLICY "Contenido público visible para todos" ON public.testimonios FOR SELECT USING (activo = true);
CREATE POLICY "Contenido público visible para todos" ON public.partners FOR SELECT USING (activo = true);
CREATE POLICY "Configuración pública visible para todos" ON public.configuracion_sitio FOR SELECT USING (true);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_eventos_deportivos_updated_at
  BEFORE UPDATE ON public.eventos_deportivos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_eventos_digitales_updated_at
  BEFORE UPDATE ON public.eventos_digitales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_servicios_updated_at
  BEFORE UPDATE ON public.servicios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_estadisticas_updated_at
  BEFORE UPDATE ON public.estadisticas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_eventos_destacados_updated_at
  BEFORE UPDATE ON public.eventos_destacados
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_testimonios_updated_at
  BEFORE UPDATE ON public.testimonios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_configuracion_sitio_updated_at
  BEFORE UPDATE ON public.configuracion_sitio
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar datos iniciales de eventos deportivos
INSERT INTO public.eventos_deportivos (titulo, descripcion, icono, orden) VALUES
('Competencias Freestyle', 'Organizamos batallas de rap freestyle con formato profesional y jurados especializados', '🎤', 1),
('Torneos Deportivos', 'Eventos deportivos urbanos: skate, BMX, parkour con transmisión en vivo', '🛹', 2),
('Festivales Urbanos', 'Eventos masivos combinando deportes extremos, música y cultura urbana', '🎪', 3),
('Campeonatos Nacionales', 'Competencias de alto nivel con ranking nacional y clasificatorias internacionales', '🏆', 4);

-- Insertar datos iniciales de eventos digitales
INSERT INTO public.eventos_digitales (titulo, descripcion, icono, orden) VALUES
('Streaming Profesional', 'Transmisiones en vivo multi-cámara con overlays personalizados y engagement interactivo', '📺', 1),
('Torneos Online', 'Competencias virtuales con sistemas de bracket automatizados y premios digitales', '🎮', 2),
('Experiencias VR', 'Eventos inmersivos en realidad virtual para audiencias globales y experiencias únicas', '🥽', 3),
('Shows Interactivos', 'Eventos híbridos que combinan lo físico y digital con participación en tiempo real', '💫', 4);

-- Insertar datos iniciales de servicios
INSERT INTO public.servicios (titulo, descripcion, icono, items, orden) VALUES
('Producción de Eventos', 'Creamos experiencias inolvidables desde la conceptualización hasta la ejecución', '🎬', 
 ARRAY['Conceptualización creativa', 'Planificación logística', 'Coordinación técnica', 'Gestión de talento', 'Post-producción'], 1),
('Marketing Digital', 'Estrategias integrales para maximizar el impacto y alcance de tus eventos', '📱', 
 ARRAY['Campañas en redes sociales', 'Influencer marketing', 'Content marketing', 'Publicidad digital', 'Analytics y reporting'], 2),
('Tecnología Streaming', 'Plataforma propia de streaming con calidad 4K y herramientas interactivas', '🔴', 
 ARRAY['Streaming multi-cámara', 'Overlays personalizados', 'Chat interactivo', 'Sistema de votación', 'Grabación HD'], 3);

-- Insertar datos iniciales de estadísticas
INSERT INTO public.estadisticas (numero, descripcion, icono, orden) VALUES
('500K+', 'Espectadores totales acumulados', '👥', 1),
('150+', 'Eventos producidos exitosamente', '🎯', 2),
('95%', 'Satisfacción de clientes', '⭐', 3),
('50+', 'Ciudades con eventos realizados', '🌍', 4);

-- Insertar datos iniciales de eventos destacados
INSERT INTO public.eventos_destacados (nombre, participantes, audiencia, ranking, orden) VALUES
('Batalla Nacional Freestyle 2024', '128', '45K', '#1', 1),
('Urban Sports Championship', '89', '32K', '#2', 2),
('Digital Fest Experience', '156', '67K', '#3', 3),
('Street Culture Festival', '203', '89K', '#4', 4),
('Extreme Gaming Tournament', '76', '28K', '#5', 5);

-- Insertar datos iniciales de testimonios
INSERT INTO public.testimonios (nombre, cargo, testimonio, orden) VALUES
('Carlos Mendoza', 'Organizador de Eventos', 'La producción fue impecable. Lograron capturar la esencia de nuestro evento y llevarlo al siguiente nivel', 1),
('María González', 'Directora de Marketing', 'El alcance que conseguimos superó todas nuestras expectativas. Su equipo es simplemente profesional', 2),
('José Rivera', 'Atleta Profesional', 'Como competidor, me sentí respaldado en todo momento. La organización fue de primer nivel', 3);

-- Insertar datos iniciales de partners
INSERT INTO public.partners (nombre, tipo, descripcion, orden) VALUES
('Red Bull', 'Sponsor Principal', 'Patrocinador oficial de nuestros eventos de deportes extremos', 1),
('Adidas', 'Partner Deportivo', 'Proveedor oficial de equipamiento para competidores', 2),
('Sony Music', 'Partner Musical', 'Colaborador en la producción musical de nuestros eventos', 3),
('Twitch', 'Partner Digital', 'Plataforma oficial de streaming para nuestras transmisiones', 4);

-- Insertar configuración inicial del sitio
INSERT INTO public.configuracion_sitio (clave, valor, descripcion) VALUES
('titulo_principal', 'PRODUCIMOS EVENTOS QUE TRASCIENDEN', 'Título principal del hero'),
('subtitulo_principal', 'Creamos experiencias únicas que conectan audiencias y generan impacto real en la cultura urbana', 'Subtítulo del hero'),
('email_contacto', 'info@batallaproductions.com', 'Email principal de contacto'),
('telefono_contacto', '+57 300 123 4567', 'Teléfono principal de contacto'),
('direccion_oficina', 'Bogotá, Colombia', 'Dirección de la oficina principal'),
('tiempo_respuesta', '24 horas', 'Tiempo promedio de respuesta');