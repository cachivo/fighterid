
-- Eliminar perfil de fighter para blackboxdjhn@gmail.com
-- Fighter profile ID: d58d56d6-3fe0-4d65-ac4b-52d242ee6590

-- Eliminar actualizaciones de estado del fighter
DELETE FROM fighter_status_updates WHERE fighter_id = 'd58d56d6-3fe0-4d65-ac4b-52d242ee6590'::uuid;

-- Eliminar actualizaciones del fighter
DELETE FROM fighter_updates WHERE fighter_id = 'd58d56d6-3fe0-4d65-ac4b-52d242ee6590'::uuid;

-- Eliminar invitaciones asociadas
DELETE FROM fighter_invitations WHERE fighter_profile_id = 'd58d56d6-3fe0-4d65-ac4b-52d242ee6590'::uuid;

-- Eliminar el perfil de fighter
DELETE FROM fighter_profiles WHERE id = 'd58d56d6-3fe0-4d65-ac4b-52d242ee6590'::uuid;
