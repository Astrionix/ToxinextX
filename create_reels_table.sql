-- REELS TABLE
CREATE TABLE public.reels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  description TEXT,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public reels are viewable by everyone" ON public.reels FOR SELECT USING (true);
CREATE POLICY "Users can insert reels" ON public.reels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reels" ON public.reels FOR DELETE USING (auth.uid() = user_id);
