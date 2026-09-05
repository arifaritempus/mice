const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const { data, error } = await supabase.from('project_hotels').select('*').limit(1);
    console.log("project_hotels:", error);
    
    const { data: d2, error: e2 } = await supabase.from('hotels').select('*').limit(1);
    console.log("hotels:", e2);
}
run();
