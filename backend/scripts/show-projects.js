require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function showProjects() {
    console.log('🔍 Connecting to Supabase at:', supabaseUrl);
    console.log('📋 Fetching rows from "projects" table...');

    const { data, error } = await supabase
        .from('projects')
        .select('id, name, created_at, status, description');

    if (error) {
        console.error('❌ Error fetching projects:', error.message);
        return;
    }

    if (data.length === 0) {
        console.log('⚠️  No projects found in the "projects" table.');
    } else {
        console.log(`✅ Found ${data.length} projects in Supabase:`);
        console.table(data);
    }
}

showProjects();
