require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Must use Service Role to see ALL data

const supabase = createClient(supabaseUrl, supabaseKey);

async function traceData() {
    console.log('🕵️‍♂️ Tracing Project Lineage...');

    // 1. Get a "Real" Item
    const { data: items } = await supabase
        .from('project_purchase_items')
        .select('id, description, project_id')
        .ilike('description', '%GALA%')
        .limit(1);

    if (!items || items.length === 0) {
        console.log('❌ Could not find "GALA" item to trace.');
        return;
    }

    const item = items[0];
    console.log(`\nfound Item: ${item.description} (ID: ${item.id})`);
    console.log(`Linked Project ID: ${item.project_id}`);

    // 2. Look for the Parent Project
    const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', item.project_id)
        .single();

    if (error || !project) {
        console.log('❌ Parent Project NOT FOUND in `projects` table!');
        if (error) console.log('Error:', error.message);
    } else {
        console.log('✅ Parent Project FOUND:');
        console.table([{
            id: project.id,
            name: project.name,
            status: project.status,
            created_by: project.created_by || project.manager_id,
            company_id: project.company_id
        }]);
    }
}

traceData();
