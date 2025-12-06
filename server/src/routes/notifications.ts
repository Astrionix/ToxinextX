import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// Get Notifications for a user
router.get('/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        // Fetch notifications with sender details using a join
        // We assume 'sender_id' column has been added to notifications table
        const { data, error } = await supabase
            .from('notifications')
            .select(`
                *,
                sender:sender_id (
                    username,
                    avatar_url
                )
            `)
            .eq('user_id', userId)
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
