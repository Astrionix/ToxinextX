-- RPC Function to create user profile (bypassing RLS)
CREATE OR REPLACE FUNCTION public.create_user_profile(
  _id UUID,
  _email TEXT,
  _username TEXT,
  _avatar_url TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.users (id, email, username, avatar_url)
  VALUES (_id, _email, _username, _avatar_url)
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
