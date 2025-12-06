import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { moderateText } from '../services/moderationService';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Helper to get authenticated client
const getAuthClient = (req: Request) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!, {
            global: { headers: { Authorization: authHeader } }
        });
    }
    return supabase;
};

// Get comments for a post
router.get('/:postId', async (req: Request, res: Response) => {
    const { postId } = req.params;
    const userId = req.query.userId as string;

    try {
        let query = supabase
            .from('comments')
            .select('*, users(username, avatar_url)')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        // Exclude blocked users comments if userId is provided
        if (userId) {
            const { data: blocks } = await supabase
                .from('blocks')
                .select('*')
                .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);

            const blockedIds = blocks?.map(b => b.blocker_id === userId ? b.blocked_id : b.blocker_id) || [];

            if (blockedIds.length > 0) {
                query = query.not('user_id', 'in', `(${blockedIds.join(',')})`);
            }
        }

        const { data, error } = await query;

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add a comment (with Friend Check and AI Moderation)
router.post('/:postId', async (req: Request, res: Response) => {
    const { postId } = req.params;
    const { user_id, text } = req.body;

    if (!user_id || !text) {
        return res.status(400).json({ error: 'User ID and text are required' });
    }

    try {
        // MOCK FOR TESTING AI MODERATION WITHOUT DB
        if (postId === '11111111-1111-1111-1111-111111111111') {
            // ... existing mock logic ...
            // (Shortened for brevity but functionality preserved if needed, assuming user wants real logic mostly)
            // I'll keep the mock logic intact
            console.log('Processing mock post comment...');
            const moderationResult = await moderateText(text);
            console.log('Moderation result:', moderationResult);

            if (moderationResult.action === 'block') {
                return res.status(400).json({
                    error: 'Comment blocked due to safety guidelines',
                    details: moderationResult
                });
            }

            return res.json({
                comment: {
                    id: 'mock-comment-id',
                    post_id: postId,
                    user_id: user_id,
                    text: text,
                    ai_label: moderationResult.category,
                    ai_toxicity: moderationResult.toxicity_score,
                    is_blocked: false,
                    created_at: new Date().toISOString()
                },
                moderation: moderationResult
            });
        }

        // 1. Get Post Owner
        const { data: post, error: postError } = await supabase
            .from('posts')
            .select('user_id')
            .eq('id', postId)
            .single();

        if (postError || !post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // 2. Check Blocking (New)
        const { data: blocks } = await supabase
            .from('blocks')
            .select('*')
            .or(`and(blocker_id.eq.${user_id},blocked_id.eq.${post.user_id}),and(blocker_id.eq.${post.user_id},blocked_id.eq.${user_id})`);

        if (blocks && blocks.length > 0) {
            return res.status(403).json({ error: 'Cannot comment on this post.' });
        }

        // 3. AI Moderation
        const moderationResult = await moderateText(text);

        if (moderationResult.action === 'block') {
            return res.status(400).json({
                error: 'Comment blocked due to safety guidelines',
                details: moderationResult
            });
        }

        // 4. Insert Comment
        const { data, error } = await supabase
            .from('comments')
            .insert([{
                post_id: postId,
                user_id,
                text,
                ai_label: moderationResult.category,
                ai_toxicity: moderationResult.toxicity_score,
                is_blocked: false
            }])
            .select();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Create Notification
        try {
            if (post.user_id !== user_id) {
                await supabase.from('notifications').insert([{
                    user_id: post.user_id, // Notify post owner
                    sender_id: user_id, // Who performed the action
                    type: 'comment',
                    message: `commented: "${text.substring(0, 20)}${text.length > 20 ? '...' : ''}"`,
                    is_read: false
                }]);
            }
        } catch (notifyErr) {
            console.error('Failed to send notification for comment:', notifyErr);
        }

        res.json({ comment: data[0], moderation: moderationResult });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
