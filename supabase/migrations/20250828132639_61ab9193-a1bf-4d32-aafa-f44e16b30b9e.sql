-- =============================================
-- FIX SECURITY WARNINGS FROM BETTING SYSTEM MIGRATION
-- =============================================

-- Fix function search path issues for betting functions
CREATE OR REPLACE FUNCTION calculate_parimutuel_payout(
  p_market_id UUID,
  p_outcome_id UUID,
  p_stake NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
  total_pool NUMERIC;
  winning_pool NUMERIC;
  rake_rate NUMERIC;
  net_pool NUMERIC;
  payout NUMERIC;
BEGIN
  -- Get market rake
  SELECT rake INTO rake_rate 
  FROM public.market 
  WHERE id = p_market_id;
  
  -- Get total pool across all outcomes
  SELECT COALESCE(SUM(pool), 0) INTO total_pool
  FROM public.outcome 
  WHERE market_id = p_market_id;
  
  -- Get winning outcome pool
  SELECT COALESCE(pool, 0) INTO winning_pool
  FROM public.outcome 
  WHERE id = p_outcome_id;
  
  -- Calculate net pool after rake
  net_pool := total_pool * (1 - rake_rate);
  
  -- Calculate payout ratio
  IF winning_pool > 0 THEN
    payout := p_stake * (net_pool / winning_pool);
  ELSE
    payout := p_stake; -- Return stake if no other bets
  END IF;
  
  RETURN GREATEST(payout, p_stake); -- Minimum return is stake
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Fix function search path for pool update function
CREATE OR REPLACE FUNCTION update_outcome_pool() RETURNS TRIGGER AS $$
BEGIN
  -- Add stake to outcome pool
  UPDATE public.outcome 
  SET pool = pool + NEW.stake
  WHERE id = NEW.outcome_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';