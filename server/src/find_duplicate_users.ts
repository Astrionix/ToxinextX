import { supabase } from './config/supabase';

async function findDuplicateUsers() {
    const { data: users, error } = await supabase
        .from('users')
        .select('*');

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    const seen = new Set();
    const duplicates = [];

    for (const user of users) {
        const key = user.id; // ID should be unique, but let's check username or email if available in public table
        // public.users usually has id, username, full_name, avatar_url
        // Let's check for duplicate usernames
        const usernameKey = user.username;

        if (seen.has(usernameKey)) {
            duplicates.push(user);
        } else {
            seen.add(usernameKey);
        }
    }

    console.log(`Found ${duplicates.length} duplicate users by username.`);
    console.log(duplicates);
}

findDuplicateUsers();
