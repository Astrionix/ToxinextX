import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// Register
router.post('/register', async (req: Request, res: Response) => {
    const { email, password, username, avatar_url } = req.body;

    if (!email || !password || !username) {
        return res.status(400).json({ error: 'Email, password, and username are required' });
    }

    try {
        // Use Admin API to create user with auto-confirmation
        const { data: { user }, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                username,
                avatar_url: avatar_url || '',
            }
        });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        if (user) {
            // Use RPC to bypass RLS and create public profile
            const { error: rpcError } = await supabase.rpc('create_user_profile', {
                _id: user.id,
                _email: email,
                _username: username,
                _avatar_url: avatar_url || ''
            });

            if (rpcError) {
                console.error("Error creating user profile via RPC:", rpcError);
            }

            // For immediate login after registration, we might need to sign them in manually
            // or return a session. admin.createUser does NOT return a session.
            // So we need to sign in to get the session.
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (signInError) {
                return res.status(400).json({ error: "Registration successful but auto-login failed: " + signInError.message });
            }

            return res.json({ user: signInData.user, session: signInData.session });
        }

        // Fallback if user is null for some reason
        res.status(500).json({ error: 'Failed to create user' });

    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Self-healing: Check if user exists in public.users, if not, create them
        if (data.user) {
            const { data: publicUser } = await supabase
                .from('users')
                .select('id')
                .eq('id', data.user.id)
                .single();

            if (!publicUser) {
                console.log("User missing in public.users, creating now via RPC...");
                await supabase.rpc('create_user_profile', {
                    _id: data.user.id,
                    _email: data.user.email,
                    _username: data.user.user_metadata.username || data.user.email?.split('@')[0],
                    _avatar_url: data.user.user_metadata.avatar_url || ''
                });
            }
        }

        res.json({ user: data.user, session: data.session });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
