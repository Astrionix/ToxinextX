import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// Toggle Bookmark
router.post('/:postId', async (req: Request, res: Response) => {
    const { postId } = req.params;
    const { user_id } = req.body;

    if (!user_id) return res.status(400).json({ error: 'User ID required' });

    try {
        // Check if exists
        const { data: existing, error: checkError } = await supabase
            .from('bookmarks')
            .select('*')
            .eq('post_id', postId)
            .eq('user_id', user_id)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            return res.status(400).json({ error: checkError.message });
        }

        if (existing) {
            // Remove
            const { error: delError } = await supabase.from('bookmarks').delete().eq('id', existing.id);
            if (delError) return res.status(400).json({ error: delError.message });
            return res.json({ bookmarked: false });
        } else {
            // Add
            const { error: insError } = await supabase.from('bookmarks').insert([{ post_id: postId, user_id }]);
            if (insError) return res.status(400).json({ error: insError.message });
            return res.json({ bookmarked: true });
        }
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get User Bookmarks
router.get('/', async (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    try {
        const { data, error } = await supabase
            .from('bookmarks')
            .select('*, posts(*, users(username, avatar_url))')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) return res.status(400).json({ error: error.message });

        // Flatten structure for easier client consumption
        const posts = data.map((b: any) => b.posts);
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
