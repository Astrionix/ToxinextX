import { supabase } from './config/supabase';

async function seed() {
    console.log('Seeding database...');

    // 1. Create a User (if not exists)
    const email = `testuser_${Date.now()}@example.com`;
    const password = 'password123';

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    });

    let userId: string | undefined;

    if (authError) {
        console.error('Error creating auth user:', JSON.stringify(authError, null, 2));
        // If user already exists, try to sign in (though with random email this shouldn't happen often unless rate limited)
        // But let's handle the case where we might want to use a fixed email for testing

        // Fallback: try to sign in with a known user if this fails? 
        // For now, let's just return if we can't create a user.
        return;
    } else {
        userId = authData.user?.id;
    }

    console.log('Created User ID:', userId);

    if (!userId) {
        console.error('No user ID returned');
        return;
    }

    // 2. Create a Post
    const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert([
            {
                user_id: userId,
                image_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
                caption: 'Seeded Post for Testing AI Moderation',
                location: 'Test Lab',
                ai_label: 'safe',
                ai_toxicity: 0,
                is_blocked: false
            }
        ])
        .select()
        .single();

    if (postError) {
        console.error('Error creating post:', JSON.stringify(postError, null, 2));
        return;
    }

    console.log('Created Post ID:', postData.id);
    console.log('------------------------------------------------');
    console.log('Use these IDs in your frontend mock data:');
    console.log('currentUserId:', userId);
    console.log('postId:', postData.id);
    console.log('------------------------------------------------');
}

seed();
