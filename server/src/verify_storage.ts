import { supabase } from './config/supabase';

async function createStoragePolicy() {
    // We can't easily create policies via JS client unless we use raw SQL via RPC or similar.
    // But we can try to set the bucket to public again, which should handle it.
    // Or we can assume the previous updateBucket call worked.

    // Let's try to get a public URL for a file to verify access.
    // We saw a folder '9c787872-45be-4fb4-a323-ff5e4199aced' in the list_files output.
    // We need to list files inside that folder.

    const { data: files } = await supabase.storage.from('posts').list('9c787872-45be-4fb4-a323-ff5e4199aced');
    console.log('Files in user folder:', files);

    if (files && files.length > 0) {
        const file = files[0];
        const { data } = supabase.storage.from('posts').getPublicUrl(`9c787872-45be-4fb4-a323-ff5e4199aced/${file.name}`);
        console.log('Public URL:', data.publicUrl);

        // Try to fetch it
        const res = await fetch(data.publicUrl);
        console.log('Fetch status:', res.status);
    }
}

createStoragePolicy();
