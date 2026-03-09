-- Allow anyone to see events that are actively streaming
CREATE POLICY "Streaming events visible to all"
ON public.bdg_event
FOR SELECT
USING (
  (meta->'live_stream'->>'is_streaming')::boolean = true
);