import { supabase } from './config/supabase';

async function findDuplicateComments() {
    const { data: comments, error } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching comments:', error);
        return;
    }

    const seen = new Set();
    const duplicates = [];

    for (const comment of comments) {
        // Create a unique key based on content and user (and maybe post)
        // Adjust this key based on what "duplicate" means to the user.
        // Assuming duplicate means same user, same post, same text, created very close in time.
        // For now, let's just check same user, post, and text.
        const key = `${comment.user_id}-${comment.post_id}-${comment.text}`;

        if (seen.has(key)) {
            duplicates.push(comment);
        } else {
            seen.add(key);
        }
    }

    console.log(`Found ${duplicates.length} duplicate comments.`);
    console.log(duplicates);
}

findDuplicateComments();
