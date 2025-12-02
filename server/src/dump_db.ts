import { supabase } from './config/supabase';
import * as fs from 'fs';

async function dumpData() {
    const { data: comments } = await supabase.from('comments').select('*');
    const { data: users } = await supabase.from('users').select('*');
    const { data: posts } = await supabase.from('posts').select('*');

    const dump = {
        comments,
        users,
        posts
    };

    fs.writeFileSync('db_dump.json', JSON.stringify(dump, null, 2));
    console.log('Database dump saved to db_dump.json');
}

dumpData();
