CREATE TABLE public.blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can see their own blocks" ON public.blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Users can block others" ON public.blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can unblock others" ON public.blocks FOR DELETE USING (auth.uid() = blocker_id);
