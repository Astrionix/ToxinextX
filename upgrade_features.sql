-- ENABLE UUID EXTENSION
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- REELS
CREATE TABLE IF NOT EXISTS public.reels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- REEL LIKES
CREATE TABLE IF NOT EXISTS public.reel_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reel_id UUID REFERENCES public.reels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(reel_id, user_id)
);

-- REEL COMMENTS
CREATE TABLE IF NOT EXISTS public.reel_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reel_id UUID REFERENCES public.reels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BOOKMARKS (Saved Posts)
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- ENABLE RLS
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reel_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reel_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Reels
CREATE POLICY "Public reels" ON public.reels FOR SELECT USING (true);
CREATE POLICY "Insert reels" ON public.reels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own reels" ON public.reels FOR DELETE USING (auth.uid() = user_id);

-- Reel Likes
CREATE POLICY "Public reel likes" ON public.reel_likes FOR SELECT USING (true);
CREATE POLICY "Insert reel likes" ON public.reel_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own reel likes" ON public.reel_likes FOR DELETE USING (auth.uid() = user_id);

-- Reel Comments
CREATE POLICY "Public reel comments" ON public.reel_comments FOR SELECT USING (true);
CREATE POLICY "Insert reel comments" ON public.reel_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own reel comments" ON public.reel_comments FOR DELETE USING (auth.uid() = user_id);

-- Bookmarks (Private to user)
CREATE POLICY "Users can view own bookmarks" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert bookmarks" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete bookmarks" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);
