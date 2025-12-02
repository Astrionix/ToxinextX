import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { moderateText } from '../services/moderationService';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

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
            // Use authSupabase for upload to respect RLS
            const { data: uploadData, error: uploadError } = await authSupabase.storage
                .from('posts')
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false
                });

            if (uploadError) {
                // If bucket doesn't exist, try to create it (though usually manual)
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
                // If error is duplicate key, it means it was created in parallel? 
                // But we checked !userExists. 
                // We'll try to proceed or return error.
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

// Get Feed Posts (for now, just all posts)
router.get('/', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select('*, users(username, avatar_url)')
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
