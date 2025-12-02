import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

// Initialize Supabase client with Service Role Key to access Admin API
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function confirmUser() {
    const email = 'Astrionix0@gmail.com';
    console.log(`Attempting to confirm email for: ${email}`);

    // 1. List users to find the ID
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
        console.error('User not found in Auth system.');
        return;
    }

    console.log(`Found user: ${user.id}`);

    // 2. Update user to confirm email
    const { data, error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
    );

    if (updateError) {
        console.error('Error confirming email:', updateError);
    } else {
        console.log('Successfully confirmed email for user!');
    }
}

confirmUser();
