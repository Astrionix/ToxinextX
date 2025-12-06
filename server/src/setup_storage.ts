import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials!");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKETS = [
    { name: 'posts', public: true },
    { name: 'stories', public: true },
    { name: 'avatars', public: true }
];

async function setupStorage() {
    console.log("Starting Storage Setup...");

    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
        console.error("Error listing buckets:", listError);
        return;
    }

    const existingNames = new Set(existingBuckets?.map(b => b.name) || []);

    for (const bucket of BUCKETS) {
        if (existingNames.has(bucket.name)) {
            console.log(`✅ Bucket '${bucket.name}' already exists.`);
        } else {
            console.log(`🛠 Creating bucket '${bucket.name}'...`);
            const { data, error } = await supabase.storage.createBucket(bucket.name, {
                public: bucket.public,
                fileSizeLimit: 10485760, // 10MB
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
            });

            if (error) {
                console.error(`❌ Failed to create bucket '${bucket.name}':`, error.message);
            } else {
                console.log(`✅ Successfully created bucket '${bucket.name}'.`);
            }
        }
    }

    console.log("Storage Setup Complete.");
}

setupStorage();
