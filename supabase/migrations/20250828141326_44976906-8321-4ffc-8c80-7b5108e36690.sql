-- =============================================
-- PHASE 4: WALLET SYSTEM & REAL-TIME ENGINE
-- =============================================

-- Create app_user profiles for wallet integration (if they don't exist)
INSERT INTO public.app_user (auth_user_id, handle, email, country)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', au.email, 'user_' || substring(au.id::text, 1, 8)) as handle,
  au.email,
  'HN'
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.app_user WHERE auth_user_id = au.id
)
ON CONFLICT (auth_user_id) DO NOTHING;

-- Create BDG wallets for all users
INSERT INTO public.wallet (user_id, currency, balance, hold)
SELECT 
  u.id,
  'BDG',
  1000.0, -- Starting balance for testing
  0.0
FROM public.app_user u
WHERE NOT EXISTS (
  SELECT 1 FROM public.wallet WHERE user_id = u.id AND currency = 'BDG'
)
ON CONFLICT (user_id, currency) DO NOTHING;

-- Update bet_ticket table to use app_user.id instead of auth_user_id
ALTER TABLE public.bet_ticket 
DROP CONSTRAINT IF EXISTS bet_ticket_user_id_fkey;

-- Add wallet debit/credit functions for betting
CREATE OR REPLACE FUNCTION public.process_bet_transaction(
  p_user_id UUID,
  p_market_id UUID,
  p_outcome_id UUID,
  p_stake NUMERIC
) RETURNS UUID AS $$
DECLARE
  v_wallet_id UUID;
  v_ticket_id UUID;
  v_user_balance NUMERIC;
BEGIN
  -- Get user wallet
  SELECT id, balance INTO v_wallet_id, v_user_balance
  FROM public.wallet 
  WHERE user_id = p_user_id AND currency = 'BDG';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found for user';
  END IF;
  
  -- Check sufficient balance
  IF v_user_balance < p_stake THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Create bet ticket
  INSERT INTO public.bet_ticket (
    user_id, market_id, outcome_id, stake, status, currency
  ) VALUES (
    p_user_id, p_market_id, p_outcome_id, p_stake, 'PENDING_DELAY', 'BDG'
  ) RETURNING id INTO v_ticket_id;
  
  -- Debit wallet and add to hold
  UPDATE public.wallet 
  SET 
    balance = balance - p_stake,
    hold = hold + p_stake
  WHERE id = v_wallet_id;
  
  -- Create transaction record
  INSERT INTO public.wallet_tx (
    wallet_id, kind, amount, reference_id, meta
  ) VALUES (
    v_wallet_id, 'BET_STAKE', -p_stake, v_ticket_id, 
    jsonb_build_object('market_id', p_market_id, 'outcome_id', p_outcome_id)
  );
  
  RETURN v_ticket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Function to confirm bet after delay (anti-sniping)
CREATE OR REPLACE FUNCTION public.confirm_bet_after_delay(p_ticket_id UUID) 
RETURNS VOID AS $$
DECLARE
  v_ticket RECORD;
  v_market_state TEXT;
BEGIN
  -- Get ticket info
  SELECT * INTO v_ticket FROM public.bet_ticket WHERE id = p_ticket_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;
  
  -- Check market state
  SELECT state INTO v_market_state FROM public.market WHERE id = v_ticket.market_id;
  
  IF v_market_state != 'open' THEN
    -- Market closed/suspended, refund bet
    PERFORM public.refund_bet(p_ticket_id, 'MARKET_SUSPENDED');
    RETURN;
  END IF;
  
  -- Confirm bet and add to pool
  UPDATE public.bet_ticket 
  SET status = 'ACCEPTED' 
  WHERE id = p_ticket_id;
  
  -- Add stake to outcome pool
  UPDATE public.outcome 
  SET pool = pool + v_ticket.stake
  WHERE id = v_ticket.outcome_id;
  
  -- Convert hold to final stake
  UPDATE public.wallet 
  SET hold = hold - v_ticket.stake
  WHERE user_id = v_ticket.user_id AND currency = 'BDG';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Function to refund bet
CREATE OR REPLACE FUNCTION public.refund_bet(p_ticket_id UUID, p_reason TEXT)
RETURNS VOID AS $$
DECLARE
  v_ticket RECORD;
  v_wallet_id UUID;
BEGIN
  SELECT * INTO v_ticket FROM public.bet_ticket WHERE id = p_ticket_id;
  
  -- Get wallet
  SELECT id INTO v_wallet_id 
  FROM public.wallet 
  WHERE user_id = v_ticket.user_id AND currency = 'BDG';
  
  -- Refund to balance
  UPDATE public.wallet 
  SET 
    balance = balance + v_ticket.stake,
    hold = hold - v_ticket.stake
  WHERE id = v_wallet_id;
  
  -- Update ticket status
  UPDATE public.bet_ticket 
  SET status = 'CANCELLED' 
  WHERE id = p_ticket_id;
  
  -- Create refund transaction
  INSERT INTO public.wallet_tx (
    wallet_id, kind, amount, reference_id, meta
  ) VALUES (
    v_wallet_id, 'BET_REFUND', v_ticket.stake, p_ticket_id,
    jsonb_build_object('reason', p_reason)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Function for settlement payouts
CREATE OR REPLACE FUNCTION public.settle_market_payouts(
  p_market_id UUID,
  p_winning_outcome_id UUID
) RETURNS VOID AS $$
DECLARE
  v_market RECORD;
  v_total_pool NUMERIC;
  v_winning_pool NUMERIC;
  v_net_pool NUMERIC;
  v_ticket RECORD;
  v_payout NUMERIC;
  v_wallet_id UUID;
BEGIN
  -- Get market info
  SELECT * INTO v_market FROM public.market WHERE id = p_market_id;
  
  -- Calculate pools
  SELECT COALESCE(SUM(pool), 0) INTO v_total_pool
  FROM public.outcome WHERE market_id = p_market_id;
  
  SELECT COALESCE(pool, 0) INTO v_winning_pool
  FROM public.outcome WHERE id = p_winning_outcome_id;
  
  v_net_pool := v_total_pool * (1 - v_market.rake);
  
  -- Process winning tickets
  FOR v_ticket IN 
    SELECT * FROM public.bet_ticket 
    WHERE market_id = p_market_id 
    AND outcome_id = p_winning_outcome_id 
    AND status = 'ACCEPTED'
  LOOP
    -- Calculate payout
    IF v_winning_pool > 0 THEN
      v_payout := v_ticket.stake * (v_net_pool / v_winning_pool);
    ELSE
      v_payout := v_ticket.stake; -- Return stake if no pool
    END IF;
    
    -- Minimum payout is stake
    v_payout := GREATEST(v_payout, v_ticket.stake);
    
    -- Get user wallet
    SELECT id INTO v_wallet_id 
    FROM public.wallet 
    WHERE user_id = v_ticket.user_id AND currency = 'BDG';
    
    -- Credit payout
    UPDATE public.wallet 
    SET balance = balance + v_payout
    WHERE id = v_wallet_id;
    
    -- Update ticket
    UPDATE public.bet_ticket 
    SET 
      status = 'WON',
      payout_amount = v_payout,
      settled_at = now()
    WHERE id = v_ticket.id;
    
    -- Create payout transaction
    INSERT INTO public.wallet_tx (
      wallet_id, kind, amount, reference_id, meta
    ) VALUES (
      v_wallet_id, 'BET_PAYOUT', v_payout, v_ticket.id,
      jsonb_build_object('market_id', p_market_id, 'payout_ratio', v_payout / v_ticket.stake)
    );
  END LOOP;
  
  -- Mark losing tickets
  UPDATE public.bet_ticket 
  SET status = 'LOST', settled_at = now()
  WHERE market_id = p_market_id 
  AND outcome_id != p_winning_outcome_id 
  AND status = 'ACCEPTED';
  
  -- Update market state
  UPDATE public.market 
  SET state = 'settled'
  WHERE id = p_market_id;
  
  -- Create settlement record
  INSERT INTO public.settlement (
    market_id, winning_outcome_id, total_pool, total_rake, total_payout,
    settled_by, result_type
  ) VALUES (
    p_market_id, p_winning_outcome_id, v_total_pool, v_total_pool * v_market.rake,
    v_net_pool, auth.uid(), 'WIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Add delay queue table for anti-sniping
CREATE TABLE IF NOT EXISTS public.bet_delay_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.bet_ticket(id),
  process_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '5 seconds'),
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on delay queue
ALTER TABLE public.bet_delay_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies for delay queue (admin only)
CREATE POLICY "bet_delay_queue_admin_manage" ON public.bet_delay_queue
FOR ALL USING (auth.uid() IS NOT NULL);

-- Index for processing queue
CREATE INDEX IF NOT EXISTS idx_bet_delay_queue_process_at 
ON public.bet_delay_queue(process_at) 
WHERE status = 'PENDING';

-- Trigger to add bets to delay queue
CREATE OR REPLACE FUNCTION public.add_bet_to_delay_queue()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'PENDING_DELAY' THEN
    INSERT INTO public.bet_delay_queue (ticket_id, process_at)
    VALUES (NEW.id, now() + interval '5 seconds');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

DROP TRIGGER IF EXISTS bet_delay_queue_trigger ON public.bet_ticket;
CREATE TRIGGER bet_delay_queue_trigger
  AFTER INSERT ON public.bet_ticket
  FOR EACH ROW
  EXECUTE FUNCTION public.add_bet_to_delay_queue();

-- Real-time notification trigger for pool updates
CREATE OR REPLACE FUNCTION public.notify_pool_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('pool_update', json_build_object(
    'market_id', NEW.market_id,
    'outcome_id', NEW.id,
    'pool', NEW.pool,
    'timestamp', extract(epoch from now())
  )::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

DROP TRIGGER IF EXISTS pool_update_notify ON public.outcome;
CREATE TRIGGER pool_update_notify
  AFTER UPDATE OF pool ON public.outcome
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_pool_update();

-- Market state change notifications
CREATE OR REPLACE FUNCTION public.notify_market_state_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('market_state', json_build_object(
    'market_id', NEW.id,
    'state', NEW.state,
    'previous_state', OLD.state,
    'timestamp', extract(epoch from now())
  )::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

DROP TRIGGER IF EXISTS market_state_notify ON public.market;
CREATE TRIGGER market_state_notify
  AFTER UPDATE OF state ON public.market
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_market_state_change();