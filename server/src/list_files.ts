import { supabase } from './config/supabase';

async function listFiles() {
    const { data, error } = await supabase.storage.from('posts').list();
    if (error) {
        console.error('Error listing files:', error);
    } else {
        console.log('Files in posts bucket:', data);
    }
}

listFiles();
