import { supabase } from './config/supabase';

async function checkUser(email: string) {
    console.log(`Checking for user with email: ${email}`);

    // 1. Check if user exists in auth (we can't directly query auth.users with client, but we can try to sign in)
    // Actually, let's just check public.users
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email);

    if (error) {
        console.error('Error querying public.users:', error);
        return;
    }

    console.log('Users found in public.users:', users);
}

checkUser('testuser1@example.com');
