import { supabase } from './config/supabase';

async function findDuplicateUserEmails() {
    // We can't easily query auth.users, but we can query public.users
    // Assuming public.users has an email column (it might not, let's check schema)

    // First let's see what columns public.users has
    const { data: sample, error: sampleError } = await supabase
        .from('users')
        .select('*')
        .limit(1);

    if (sample && sample.length > 0) {
        console.log('User columns:', Object.keys(sample[0]));
    }

    // If we can't check email, we can check username
    const { data: users, error } = await supabase
        .from('users')
        .select('*');

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    const seenUsernames = new Set();
    const duplicateUsernames = [];

    for (const user of users) {
        if (seenUsernames.has(user.username)) {
            duplicateUsernames.push(user);
        } else {
            seenUsernames.add(user.username);
        }
    }

    console.log(`Found ${duplicateUsernames.length} duplicate usernames.`);
    console.log(duplicateUsernames);
}

findDuplicateUserEmails();
