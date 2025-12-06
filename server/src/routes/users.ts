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

// Block User
router.post('/block', async (req: Request, res: Response) => {
    const { blocker_id, blocked_id } = req.body;

    if (!blocker_id || !blocked_id) return res.status(400).json({ error: 'Ids required' });

    try {
        const { error } = await supabase
            .from('blocks')
            .insert([{ blocker_id, blocked_id }]);

        if (error) return res.status(400).json({ error: error.message });

        // Also remove follow relationship
        await supabase.from('follows').delete().match({ follower_id: blocker_id, following_id: blocked_id });
        await supabase.from('follows').delete().match({ follower_id: blocked_id, following_id: blocker_id });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Unblock User
router.post('/unblock', async (req: Request, res: Response) => {
    const { blocker_id, blocked_id } = req.body;

    try {
        const { error } = await supabase
            .from('blocks')
            .delete()
            .match({ blocker_id, blocked_id });

        if (error) return res.status(400).json({ error: error.message });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Check Block Status
router.get('/block/check', async (req: Request, res: Response) => {
    const { user1_id, user2_id } = req.query;
    // Check if user1 blocked user2 OR user2 blocked user1

    try {
        const { data } = await supabase
            .from('blocks')
            .select('*')
            .or(`and(blocker_id.eq.${user1_id},blocked_id.eq.${user2_id}),and(blocker_id.eq.${user2_id},blocked_id.eq.${user1_id})`);

        const isBlockedByMe = data?.some(b => b.blocker_id === user1_id && b.blocked_id === user2_id);
        const isBlockedByThem = data?.some(b => b.blocker_id === user2_id && b.blocked_id === user1_id);

        res.json({ isBlockedByMe, isBlockedByThem });
    } catch (err) {
        res.status(500).json({ error: 'Error checking blocks' });
    }
});

// Get User Profile
router.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { requesterId } = req.query;

    try {
        // Check blocks first
        let isBlocked = false;
        if (requesterId) {
            const { data: blocks } = await supabase
                .from('blocks')
                .select('*')
                .or(`and(blocker_id.eq.${id},blocked_id.eq.${requesterId}),and(blocker_id.eq.${requesterId},blocked_id.eq.${id})`);

            const blockedByThem = blocks?.find(b => b.blocker_id === id && b.blocked_id === requesterId);
            if (blockedByThem) {
                // Return minimal info or 404
                return res.status(404).json({ error: 'User not found' });
            }

            const blockedByMe = blocks?.find(b => b.blocker_id === requesterId && b.blocked_id === id);
            isBlocked = !!blockedByMe;
        }

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

        res.json({ ...user, posts, followersCount, followingCount, isBlocked });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update User Profile
router.put('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { username, bio, avatar_url, full_name, is_private } = req.body;

    try {
        const { data, error } = await supabase
            .from('users')
            .update({ username, bio, avatar_url, full_name, is_private })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(data);
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
