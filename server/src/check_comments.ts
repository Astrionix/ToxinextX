import { supabase } from './config/supabase';

async function checkComments() {
    const { data, error } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching comments:', error);
    } else {
        console.log('Latest comments:', data);
    }
}

checkComments();
