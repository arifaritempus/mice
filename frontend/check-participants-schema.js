const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const { data, error } = await supabase.from('project_participants').insert({ project_id: '135b9972-d50e-4c2d-8007-4e3363f1c634', email: 'test@test.com' });
    console.log(error);
}
run();
