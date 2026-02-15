
-- Fix Security Definer Views → Security Invoker
ALTER VIEW public.v_fighters_current_gym SET (security_invoker = on);
ALTER VIEW public.v_fighter_gym_history SET (security_invoker = on);
ALTER VIEW public.v_gym_statistics SET (security_invoker = on);
