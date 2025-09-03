-- Enable realtime for fighter_licenses table
ALTER TABLE public.fighter_licenses REPLICA IDENTITY FULL;

-- Add the table to realtime publication if not already added
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'fighter_licenses'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.fighter_licenses;
    END IF;
END $$;