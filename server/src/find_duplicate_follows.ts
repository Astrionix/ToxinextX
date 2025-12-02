import { supabase } from './config/supabase';

async function findDuplicateFollows() {
    const { data: follows, error } = await supabase
        .from('follows')
        .select('*');

    if (error) {
        console.error('Error fetching follows:', error);
        return;
    }

    const seen = new Set();
    const duplicates = [];

    for (const follow of follows) {
        const key = `${follow.follower_id}-${follow.following_id}`;

        if (seen.has(key)) {
            duplicates.push(follow);
        } else {
            seen.add(key);
        }
    }

    console.log(`Found ${duplicates.length} duplicate follows.`);
    console.log(duplicates);
}

findDuplicateFollows();
