import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { moderateText } from '../services/moderationService';

const router = Router();

// Get all chats for a user
router.get('/', async (req: Request, res: Response) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        // Find chats where user is a participant
        const { data: chatParticipants, error: cpError } = await supabase
            .from('chat_participants')
            .select('chat_id')
            .eq('user_id', userId);

        if (cpError) {
            return res.status(400).json({ error: cpError.message });
        }

        const chatIds = chatParticipants.map(cp => cp.chat_id);

        if (chatIds.length === 0) {
            return res.json([]);
        }

        // Get chat details and other participants
        const { data: chats, error: chatsError } = await supabase
            .from('chats')
            .select(`
        id,
        created_at,
        chat_participants (
          user_id,
          users (username, avatar_url)
        )
      `)
            .in('id', chatIds);

        if (chatsError) {
            return res.status(400).json({ error: chatsError.message });
        }

        // Format response to show "other user" info easily
        const formattedChats = chats.map((chat: any) => {
            const otherParticipant = chat.chat_participants.find((p: any) => p.user_id !== userId);
            return {
                id: chat.id,
                created_at: chat.created_at,
                otherUser: otherParticipant ? otherParticipant.users : null
            };
        });

        res.json(formattedChats);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get messages for a chat
router.get('/:chatId/messages', async (req: Request, res: Response) => {
    const { chatId } = req.params;

    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Send a message
router.post('/:chatId/messages', async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const { sender_id, text } = req.body;

    if (!sender_id || !text) {
        return res.status(400).json({ error: 'Sender ID and text are required' });
    }

    try {
        // AI Moderation
        const moderationResult = await moderateText(text);

        if (moderationResult.action === 'block') {
            return res.status(400).json({
                error: 'Message blocked due to safety guidelines',
                details: moderationResult
            });
        }

        // Insert Message
        const { data, error } = await supabase
            .from('messages')
            .insert([{
                chat_id: chatId,
                sender_id,
                text,
                ai_label: moderationResult.category,
                ai_toxicity: moderationResult.toxicity_score,
                is_blocked: false
            }])
            .select();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ message: data[0], moderation: moderationResult });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create or Get Chat (One-to-One)
router.post('/create', async (req: Request, res: Response) => {
    const { user1_id, user2_id } = req.body;

    if (!user1_id || !user2_id) {
        return res.status(400).json({ error: 'User IDs are required' });
    }

    try {
        // Check if chat already exists between these two
        // This is a bit complex in SQL, so we can do it in two steps or a stored procedure.
        // For simplicity:
        // 1. Get chats for user1
        const { data: user1Chats } = await supabase
            .from('chat_participants')
            .select('chat_id')
            .eq('user_id', user1_id);

        // 2. Get chats for user2
        const { data: user2Chats } = await supabase
            .from('chat_participants')
            .select('chat_id')
            .eq('user_id', user2_id);

        // 3. Find intersection
        const user1ChatIds = user1Chats?.map(c => c.chat_id) || [];
        const user2ChatIds = user2Chats?.map(c => c.chat_id) || [];
        const commonChatId = user1ChatIds.find(id => user2ChatIds.includes(id));

        if (commonChatId) {
            return res.json({ chat_id: commonChatId, isNew: false });
        }

        // 4. Create new chat
        const { data: newChat, error: chatError } = await supabase
            .from('chats')
            .insert([{}])
            .select()
            .single();

        if (chatError) {
            return res.status(400).json({ error: chatError.message });
        }

        // 5. Add participants
        const { error: participantsError } = await supabase
            .from('chat_participants')
            .insert([
                { chat_id: newChat.id, user_id: user1_id },
                { chat_id: newChat.id, user_id: user2_id }
            ]);

        if (participantsError) {
            return res.status(400).json({ error: participantsError.message });
        }

        res.json({ chat_id: newChat.id, isNew: true });

    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
