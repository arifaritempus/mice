require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log('Checking Users table...');
    const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });

    if (error) {
        console.error('❌ Error checking users table:', error);
    } else {
        console.log('✅ Users table exists. Count:', count);
    }

    console.log('Checking Companies table...');
    const { count: cCount, error: cError } = await supabase.from('companies').select('*', { count: 'exact', head: true });

    if (cError) {
        console.error('❌ Error checking companies table:', cError);
    } else {
        console.log('✅ Companies table exists. Count:', cCount);

        // Try Insert
        console.log('Attempting to insert test company...');
        const { data, error: insertError } = await supabase.from('companies').insert([{
            name: 'Test Inc',
            is_active: true,
            created_at: new Date().toISOString()
        }]).select();

        if (insertError) console.error('❌ Insert failed:', insertError);
        else console.log('✅ Insert successful:', data);
    }
}

check();
