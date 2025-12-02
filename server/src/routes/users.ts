import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// Search Users
router.get('/search', async (req: Request, res: Response) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, username, avatar_url, bio')
            .ilike('username', `%${query}%`)
            .limit(20);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ results: data });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get User Profile
router.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (userError) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get posts
        const { data: posts, error: postsError } = await supabase
            .from('posts')
            .select('*')
            .eq('user_id', id)
            .order('created_at', { ascending: false });

        if (postsError) {
            return res.status(400).json({ error: postsError.message });
        }

        // Get followers/following counts
        const { count: followersCount } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', id);

        const { count: followingCount } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', id);

        res.json({ ...user, posts, followersCount, followingCount });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get User Posts
router.get('/:id/posts', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('user_id', id)
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
