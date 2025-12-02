import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// Follow a user
router.post('/add', async (req: Request, res: Response) => {
    const { follower_id, following_id } = req.body;

    if (!follower_id || !following_id) {
        return res.status(400).json({ error: 'Follower ID and Following ID are required' });
    }

    try {
        const { data, error } = await supabase
            .from('follows')
            .insert([{ follower_id, following_id }])
            .select();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Unfollow a user
router.delete('/remove', async (req: Request, res: Response) => {
    const { follower_id, following_id } = req.body;

    if (!follower_id || !following_id) {
        return res.status(400).json({ error: 'Follower ID and Following ID are required' });
    }

    try {
        const { error } = await supabase
            .from('follows')
            .delete()
            .match({ follower_id, following_id });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ message: 'Unfollowed successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Check if following
router.get('/check', async (req: Request, res: Response) => {
    const { follower_id, following_id } = req.query;

    if (!follower_id || !following_id) {
        return res.status(400).json({ error: 'Follower ID and Following ID are required' });
    }

    try {
        const { data, error } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', follower_id)
            .eq('following_id', following_id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
            return res.status(400).json({ error: error.message });
        }

        res.json({ isFollowing: !!data });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
