-- Add unique constraints to prevent duplicates
ALTER TABLE public.users ADD CONSTRAINT users_username_key UNIQUE (username);
ALTER TABLE public.users ADD CONSTRAINT users_email_key UNIQUE (email);
