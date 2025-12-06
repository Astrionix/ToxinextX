import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { moderateText } from '../services/moderationService';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

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

// Create a new post (supports file upload)
router.post('/', upload.single('image'), async (req: Request, res: Response) => {
    const { user_id, caption, location, image_url: provided_url } = req.body;
    const file = req.file;

    // Use authenticated client if token is present
    const authSupabase = getAuthClient(req);

    if (!user_id || (!file && !provided_url)) {
        return res.status(400).json({ error: 'User ID and image (file or URL) are required' });
    }

    try {
        let finalImageUrl = provided_url;

        // Handle File Upload
        if (file) {
            const fileName = `${user_id}/${Date.now()}_${file.originalname}`;
            // Use admin supabase client to bypass RLS for storage (since we handle auth in backend)
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('posts')
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false
                });

            if (uploadError) {
                console.error("Upload error:", uploadError);
                return res.status(500).json({ error: 'Failed to upload image: ' + uploadError.message });
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('posts')
                .getPublicUrl(fileName);

            finalImageUrl = publicUrl;
        }

        // AI Moderation on Caption
        let moderationResult = null;
        if (caption) {
            moderationResult = await moderateText(caption);
            if (moderationResult.action === 'block') {
                return res.status(400).json({
                    error: 'Caption blocked due to safety guidelines',
                    details: moderationResult
                });
            }
        }

        // Check if user exists in public.users, if not create them
        const { data: userExists } = await supabase
            .from('users')
            .select('id')
            .eq('id', user_id)
            .single();

        if (!userExists) {
            console.log(`User ${user_id} missing in public.users. Fetching from Auth...`);

            // 1. Fetch user from Auth system to get correct details
            const { data: { user: authUser }, error: authError } = await supabase.auth.admin.getUserById(user_id);

            if (authError || !authUser) {
                console.error("Auth user lookup failed:", authError);
                return res.status(401).json({ error: 'Invalid user session. Please log out and log in again.' });
            }

            // 2. Insert into public.users using Service Role (bypasses RLS)
            const { error: createError } = await supabase
                .from('users')
                .insert({
                    id: user_id,
                    email: authUser.email,
                    username: authUser.user_metadata?.username || authUser.email?.split('@')[0] || `user_${user_id.slice(0, 8)}`,
                    avatar_url: authUser.user_metadata?.avatar_url || ''
                });

            if (createError) {
                console.error("Failed to auto-create user in public table:", createError);
                return res.status(400).json({ error: 'Failed to sync user profile: ' + createError.message });
            }
            console.log(`User ${user_id} synced to public.users successfully.`);
        }

        // Use authSupabase for insert to respect RLS
        const { data, error } = await authSupabase
            .from('posts')
            .insert([{
                user_id,
                image_url: finalImageUrl,
                caption,
                location,
                ai_label: moderationResult?.category || 'safe',
                ai_toxicity: moderationResult?.toxicity_score || 0,
                is_blocked: false
            }])
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ post: data, moderation: moderationResult });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Toggle Like on a Post
router.post('/:id/like', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        // Check if like exists
        const { data: existingLike, error: checkError } = await supabase
            .from('likes')
            .select('*')
            .eq('post_id', id)
            .eq('user_id', user_id)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            return res.status(400).json({ error: checkError.message });
        }

        if (existingLike) {
            // Unlike
            const { error: deleteError } = await supabase
                .from('likes')
                .delete()
                .eq('id', existingLike.id);

            if (deleteError) return res.status(400).json({ error: deleteError.message });
            return res.json({ liked: false });
        } else {
            // Like
            const { error: insertError } = await supabase
                .from('likes')
                .insert([{ post_id: id, user_id }]);

            if (insertError) return res.status(400).json({ error: insertError.message });

            // Create Notification
            try {
                const { data: post } = await supabase.from('posts').select('user_id').eq('id', id).single();
                if (post && post.user_id !== user_id) {
                    await supabase.from('notifications').insert([{
                        user_id: post.user_id, // Notify post owner
                        sender_id: user_id, // Who performed the action
                        type: 'like',
                        message: 'liked your post.',
                        is_read: false
                    }]);
                }
            } catch (notifyErr) {
                console.error('Failed to send notification for like:', notifyErr);
            }

            return res.json({ liked: true });
        }
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Feed Posts
router.get('/', async (req: Request, res: Response) => {
    const userId = (req.query.user_id || req.query.userId) as string;
    const type = req.query.type as string;

    console.log(`GET /api/posts - userId: ${userId}, type: ${type}`);

    if (type === 'feed' && !userId) {
        return res.status(400).json({ error: 'User ID is required for feed' });
    }

    try {
        let query = supabase
            .from('posts')
            // REMOVED is_private from column list to fix 400 error. Re-added likes(user_id) for proper client state.
            // Using standard left join syntax.
            .select('*, users(username, avatar_url), likes(user_id)')
            .order('created_at', { ascending: false });

        if (type === 'feed') { // UserId is guaranteed by check above
            // 1. Get List of Following IDs
            const { data: followingData } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', userId);

            const followingIds = followingData?.map(f => f.following_id) || [];
            // Add self to feed
            followingIds.push(userId);

            query = query.in('user_id', followingIds);
        } else if (type === 'explore') {
            // Fetch recent posts for explore, limit to 50
            query = query.limit(50);
        }

        // Exclude blocked users if userId is present
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
            console.error("Fetch Posts Error:", error); // Log full error
            return res.status(400).json({ error: error.message, details: error });
        }

        // Since we removed is_private from DB fetch, filtering by it is impossible unless we fetch it separately.
        // Assuming public posts for now. If privacy is needed, we must add is_private to users table in DB.

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
