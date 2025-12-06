import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listBuckets() {
    console.log("Listing all storage buckets...");
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error("Error:", error);
    } else {
        console.table(data?.map(b => ({
            id: b.id,
            name: b.name,
            public: b.public,
            created_at: b.created_at
        })));
    }
}

listBuckets();
