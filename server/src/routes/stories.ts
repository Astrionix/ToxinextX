import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get Active Stories (grouped by user)
router.get('/', async (req: Request, res: Response) => {
    try {
        const now = new Date().toISOString();

        // Fetch active stories
        const { data: stories, error } = await supabase
            .from('stories')
            .select('*, users(username, avatar_url)')
            .gt('expires_at', now)
            .order('created_at', { ascending: true });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Group by user
        const groupedStories = stories.reduce((acc: any[], story: any) => {
            const user = story.users;
            const existingUser = acc.find(u => u.username === user.username);

            if (existingUser) {
                existingUser.stories.push(story);
            } else {
                acc.push({
                    id: story.user_id, // Use user_id as ID for the story circle
                    username: user.username,
                    image: user.avatar_url,
                    stories: [story]
                });
            }
            return acc;
        }, []);

        res.json(groupedStories);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Upload a Story
router.post('/', upload.single('image'), async (req: Request, res: Response) => {
    const { user_id } = req.body;
    const file = req.file;

    if (!user_id || !file) {
        return res.status(400).json({ error: 'User ID and image file are required' });
    }

    try {
        const fileName = `${user_id}/stories/${Date.now()}_${file.originalname}`;

        // Upload to 'stories' bucket
        const { error: uploadError } = await supabase.storage
            .from('stories')
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (uploadError) {
            return res.status(500).json({ error: 'Failed to upload story: ' + uploadError.message });
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('stories')
            .getPublicUrl(fileName);

        // Insert into DB
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

        const { data, error } = await supabase
            .from('stories')
            .insert([{
                user_id,
                image_url: publicUrl,
                expires_at: expiresAt.toISOString()
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

export default router;
