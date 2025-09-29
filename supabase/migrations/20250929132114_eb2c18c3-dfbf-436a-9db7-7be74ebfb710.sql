-- Add unique constraint to email column in app_user table to prevent duplicate emails
ALTER TABLE public.app_user ADD CONSTRAINT app_user_email_unique UNIQUE (email);