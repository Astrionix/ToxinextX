import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!; // Should be service_role if creating buckets

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupBuckets() {
    console.log("Setting up buckets...");
    const buckets = ['posts', 'avatars', 'stories'];

    for (const bucket of buckets) {
        const { data, error } = await supabase.storage.getBucket(bucket);

        if (error && error.message.includes('not found')) {
            console.log(`Creating bucket: ${bucket}`);
            const { error: createError } = await supabase.storage.createBucket(bucket, {
                public: true
            });
            if (createError) console.error(`Error creating ${bucket}:`, createError);
            else console.log(`Created ${bucket}`);
        } else if (data) {
            console.log(`Bucket exists: ${bucket}, Public: ${data.public}`);
            if (!data.public) {
                console.log(`Updating ${bucket} to public...`);
                // Update to public (requires deleting and recreating or using SQL, but JS client updateBucket might work)
                const { error: updateError } = await supabase.storage.updateBucket(bucket, {
                    public: true
                });
                if (updateError) console.error(`Error updating ${bucket}:`, updateError);
            }
        } else {
            console.error(`Error checking ${bucket}:`, error);
        }
    }
}

setupBuckets();
