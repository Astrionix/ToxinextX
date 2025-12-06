import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get Feed Reels
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = req.query.userId as string;

        // Fetch basic reels data
        const { data: reels, error } = await supabase
            .from('reels')
            .select('*, users(username, avatar_url)')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Check if I liked them
        if (userId) {
            const { data: likes } = await supabase
                .from('reel_likes')
                .select('reel_id')
                .eq('user_id', userId);

            const likedReelIds = new Set(likes?.map((l: any) => l.reel_id));

            const enriched = reels.map((r: any) => ({
                ...r,
                is_liked: likedReelIds.has(r.id)
            }));

            return res.json(enriched);
        }

        res.json(reels);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Upload a Reel
router.post('/', upload.single('video'), async (req: Request, res: Response) => {
    const { user_id, description } = req.body;
    const file = req.file;

    if (!user_id || !file) {
        return res.status(400).json({ error: 'User ID and video file are required' });
    }

    try {
        const fileName = `${user_id}/reels/${Date.now()}_${file.originalname}`;

        const { error: uploadError } = await supabase.storage
            .from('posts')
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (uploadError) {
            return res.status(500).json({ error: 'Failed to upload video: ' + uploadError.message });
        }

        const { data: { publicUrl } } = supabase.storage
            .from('posts')
            .getPublicUrl(fileName);

        const { data, error } = await supabase
            .from('reels')
            .insert([{
                user_id,
                video_url: publicUrl,
                description,
                likes_count: 0,
                comments_count: 0
            }])
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Like/Unlike Reel
router.post('/:id/like', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) return res.status(400).json({ error: 'User ID required' });

    try {
        const { data: existing } = await supabase
            .from('reel_likes')
            .select('*')
            .eq('reel_id', id)
            .eq('user_id', user_id)
            .single();

        let isLiked = false;
        if (existing) {
            // Unlike
            await supabase.from('reel_likes').delete().eq('id', existing.id);
            // Decrement count
            await supabase.rpc('decrement_reel_likes', { row_id: id }); // Assuming RPC or manual update
            // Manual update since RPC might not exist
            const { data: r } = await supabase.from('reels').select('likes_count').eq('id', id).single();
            await supabase.from('reels').update({ likes_count: Math.max(0, (r?.likes_count || 1) - 1) }).eq('id', id);
        } else {
            // Like
            await supabase.from('reel_likes').insert([{ reel_id: id, user_id }]);
            // Increment count
            const { data: r } = await supabase.from('reels').select('likes_count').eq('id', id).single();
            await supabase.from('reels').update({ likes_count: (r?.likes_count || 0) + 1 }).eq('id', id);
            isLiked = true;
        }

        res.json({ is_liked: isLiked });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Post Comment on Reel
router.post('/:id/comments', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { user_id, text } = req.body;

    try {
        const { data, error } = await supabase
            .from('reel_comments')
            .insert([{ reel_id: id, user_id, text }])
            .select('*, users(username, avatar_url)')
            .single();

        if (error) return res.status(400).json({ error: error.message });

        // Increment comments count
        const { data: r } = await supabase.from('reels').select('comments_count').eq('id', id).single();
        await supabase.from('reels').update({ comments_count: (r?.comments_count || 0) + 1 }).eq('id', id);

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Comments for Reel
router.get('/:id/comments', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('reel_comments')
            .select('*, users(username, avatar_url)')
            .eq('reel_id', id)
            .order('created_at', { ascending: true });

        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
