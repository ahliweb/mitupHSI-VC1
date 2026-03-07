import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: SUPABASE_URL/VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY/VITE_SUPABASE_SECRET_KEY must be set in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verify() {
    const { data: pages, error } = await supabase
        .from('pages')
        .select('slug, title, editor_type, status')
        .in('slug', ['about', 'services', 'pricing', 'contact']);

    if (error) {
        console.error('Error fetching pages:', error);
        return;
    }

    console.table(pages);
}

verify();
