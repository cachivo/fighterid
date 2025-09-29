-- Create sports_news table for real-time sports news
CREATE TABLE public.sports_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  image_url TEXT,
  source TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sports_news ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Sports news visible to everyone" 
ON public.sports_news 
FOR SELECT 
USING (true);

-- Admins can manage news
CREATE POLICY "Admins can manage sports news" 
ON public.sports_news 
FOR ALL
USING (is_admin());

-- Create indexes for better performance
CREATE INDEX idx_sports_news_published_at ON public.sports_news(published_at DESC);
CREATE INDEX idx_sports_news_category ON public.sports_news(category);
CREATE INDEX idx_sports_news_featured ON public.sports_news(is_featured, published_at DESC);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_sports_news_updated_at
BEFORE UPDATE ON public.sports_news
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();