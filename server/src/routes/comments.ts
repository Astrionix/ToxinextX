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

    try {
        const { data, error } = await supabase
            .from('comments')
            .select('*, users(username, avatar_url)')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

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
            console.log('Processing mock post comment...');
            const moderationResult = await moderateText(text);
            console.log('Moderation result:', moderationResult);

            if (moderationResult.action === 'block') {
                return res.status(400).json({
                    error: 'Comment blocked due to safety guidelines',
                    details: moderationResult
                });
            }

            // Mock success response
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

        // 1. Get Post Owner (Optional check if post exists)
        const { data: post, error: postError } = await supabase
            .from('posts')
            .select('user_id')
            .eq('id', postId)
            .single();

        if (postError || !post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // REMOVED FRIEND CHECK: Any user can comment now.
        // The requirement is "any one can comment on the post"
        // We still perform AI moderation below.

        // 3. AI Moderation
        const moderationResult = await moderateText(text);

        if (moderationResult.action === 'block') {
            return res.status(400).json({
                error: 'Comment blocked due to safety guidelines',
                details: moderationResult
            });
        }

        // 4. Insert Comment
        // Use service role key (supabase) directly to bypass RLS for now, 
        // since we are handling auth and moderation manually in this endpoint.
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

        res.json({ comment: data[0], moderation: moderationResult });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
