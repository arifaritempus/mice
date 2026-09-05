const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const cols = ['project_id', 'company_id', 'title', 'first_name', 'last_name', 'tc_passport_no', 'email', 'phone', 'registration_type', 'notes'];
    
    for (const c of cols) {
       const payload = {};
       payload[c] = null;
       const { error } = await supabase.from('project_participants').insert(payload);
       if (error && error.code !== '42501' && error.code !== '23502') { // ignore RLS and not-null
          console.log(c, error.message);
       }
    }
}
run();
