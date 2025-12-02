import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucket() {
    console.log("Checking for 'posts' bucket...");

    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
        console.error("Error listing buckets:", listError);
        return;
    }

    const postsBucket = buckets.find(b => b.name === 'posts');

    if (postsBucket) {
        console.log("'posts' bucket already exists.");
    } else {
        console.log("Creating 'posts' bucket...");
        const { data, error } = await supabase.storage.createBucket('posts', {
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
        });

        if (error) {
            console.error("Error creating bucket:", error);
        } else {
            console.log("Successfully created 'posts' bucket!");
        }
    }

    // Update policy to allow public access (if needed, though 'public: true' usually handles read)
    // We might need to set RLS policies for upload, but for now we rely on the service key in backend.
}

createBucket();
