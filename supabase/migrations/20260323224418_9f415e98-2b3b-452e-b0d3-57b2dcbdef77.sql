-- fights_full: canonical view for all fight reads with fighter + event data
CREATE OR REPLACE VIEW public.fights_full AS
SELECT
  f.*,
  COALESCE(NULLIF(fp1.name,''), CONCAT_WS(' ', fp1.first_name, fp1.last_name)) AS fighter_a_name,
  fp1.nickname AS fighter_a_nickname,
  fp1.avatar_url AS fighter_a_avatar,
  fp1.record_wins AS fighter_a_wins,
  fp1.record_losses AS fighter_a_losses,
  fp1.record_draws AS fighter_a_draws,
  fp1.weight_class AS fighter_a_weight_class,
  fp1.country AS fighter_a_country,
  COALESCE(NULLIF(fp2.name,''), CONCAT_WS(' ', fp2.first_name, fp2.last_name)) AS fighter_b_name,
  fp2.nickname AS fighter_b_nickname,
  fp2.avatar_url AS fighter_b_avatar,
  fp2.record_wins AS fighter_b_wins,
  fp2.record_losses AS fighter_b_losses,
  fp2.record_draws AS fighter_b_draws,
  fp2.weight_class AS fighter_b_weight_class,
  fp2.country AS fighter_b_country,
  COALESCE(NULLIF(fpw.name,''), CONCAT_WS(' ', fpw.first_name, fpw.last_name)) AS winner_name,
  e.name AS event_name,
  e.start_time AS event_date,
  e.state AS event_state
FROM fights f
LEFT JOIN fighter_profiles fp1 ON f.fighter_a_id = fp1.id
LEFT JOIN fighter_profiles fp2 ON f.fighter_b_id = fp2.id
LEFT JOIN fighter_profiles fpw ON f.winner_id = fpw.id
LEFT JOIN bdg_event e ON f.event_id = e.id;

-- fights_hud: lightweight view for HUD/telemetry, reuses vision_fight_context
CREATE OR REPLACE VIEW public.fights_hud AS
SELECT
  fight_id,
  event_id,
  fight_number,
  status,
  weight_class,
  fighter_a_id,
  fighter_a_name,
  fighter_a_nickname,
  fighter_b_id,
  fighter_b_name,
  fighter_b_nickname,
  event_name
FROM vision_fight_context;