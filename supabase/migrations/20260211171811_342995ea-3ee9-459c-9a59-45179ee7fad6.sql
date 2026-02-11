-- Ensure only one active OWNER per gym
CREATE UNIQUE INDEX unique_active_gym_owner 
ON gym_staff (gym_id) 
WHERE role = 'OWNER' AND active = true;