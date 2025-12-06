
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase Env vars are missing. This is fine during build but will crash at runtime.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
