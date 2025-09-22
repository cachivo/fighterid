-- Create fighter_updates table for social media-like updates
CREATE TABLE public.fighter_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fighter_id UUID NOT NULL REFERENCES public.fighter_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fighter_updates ENABLE ROW LEVEL SECURITY;

-- Policy for fighters to manage their own updates
CREATE POLICY "Fighters can manage their own updates" 
ON public.fighter_updates 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.fighter_profiles fp
    JOIN public.app_user au ON au.id = fp.user_id
    WHERE fp.id = fighter_updates.fighter_id 
    AND au.auth_user_id = auth.uid()
  )
);

-- Policy for public to read active updates
CREATE POLICY "Public can view active updates" 
ON public.fighter_updates 
FOR SELECT 
USING (active = true);

-- Policy for admins to manage all updates
CREATE POLICY "Admins can manage all updates" 
ON public.fighter_updates 
FOR ALL 
USING (is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_fighter_updates_updated_at
BEFORE UPDATE ON public.fighter_updates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_fighter_updates_fighter_id ON public.fighter_updates(fighter_id);
CREATE INDEX idx_fighter_updates_created_at ON public.fighter_updates(created_at DESC);