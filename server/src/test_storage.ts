import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
// import fetch from 'node-fetch';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorage() {
    console.log("Testing Storage...");

    // 1. Upload Test File (Fake Image)
    const fileName = `test_file_${Date.now()}.jpg`;
    const fakeBuffer = Buffer.from('fake image content');

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, fakeBuffer, { contentType: 'image/jpeg' });

    if (uploadError) {
        console.error("Upload Failed:", uploadError);
    } else {
        console.log("Upload Success:", uploadData);

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('posts')
            .getPublicUrl(fileName);

        console.log("Public URL:", publicUrl);

        // 3. Fetch Public URL
        try {
            const res = await fetch(publicUrl);
            console.log(`Fetch Result: ${res.status} ${res.statusText}`);
            if (res.ok) {
                console.log("Storage is WORKING correctly for new uploads.");
            } else {
                console.error("Storage returned error on fetch.");
            }
        } catch (e) {
            console.error("Fetch failed:", e);
        }
    }

    // 4. Check one of the broken images
    const brokenUrl = "https://hncthbgujarcnprmguyh.supabase.co/storage/v1/object/public/posts/d0e98f52-077b-447b-afdf-849a8daac3cf/1765004817877_Ram.jpg";
    console.log(`\nChecking broken image: ${brokenUrl}`);
    try {
        const resBroken = await fetch(brokenUrl);
        console.log(`Broken Image Status: ${resBroken.status} ${resBroken.statusText}`);
        console.log(`Content-Type: ${resBroken.headers.get('content-type')}`);
        console.log(`Content-Length: ${resBroken.headers.get('content-length')}`);
    } catch (e) {
        console.error("Check broken failed", e);
    }
}

testStorage();
