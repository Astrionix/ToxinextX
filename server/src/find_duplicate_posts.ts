import { supabase } from './config/supabase';

async function findDuplicatePosts() {
    const { data: posts, error } = await supabase
        .from('posts')
        .select('*');

    if (error) {
        console.error('Error fetching posts:', error);
        return;
    }

    const seen = new Set();
    const duplicates = [];

    for (const post of posts) {
        // Check for duplicate image_url or caption for the same user
        const key = `${post.user_id}-${post.image_url}-${post.caption}`;

        if (seen.has(key)) {
            duplicates.push(post);
        } else {
            seen.add(key);
        }
    }

    console.log(`Found ${duplicates.length} duplicate posts.`);
    console.log(duplicates);
}

findDuplicatePosts();
