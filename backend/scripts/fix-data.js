require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase Service Role Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function repairData() {
    console.log('🔧 Starting Data Repair...');

    // 1. Delete Test Projects
    const { error: deleteError, count } = await supabase
        .from('projects')
        .delete({ count: 'exact' })
        .eq('name', 'Integration Test Project');

    if (deleteError) console.error('❌ Error deleting test projects:', deleteError.message);
    else console.log(`🗑️ Deleted ${count} 'Integration Test Project' records.`);

    // 2. Restore Orphaned Project
    const ORPHAN_PROJECT_ID = '0ec35f04-a0e8-47bc-b561-462de37d4acf'; // From trace-project.js

    // Check if it already exists (just in case)
    const { data: existing } = await supabase
        .from('projects')
        .select('id')
        .eq('id', ORPHAN_PROJECT_ID)
        .single();

    if (existing) {
        console.log('ℹ️ Orphan project already exists (maybe restored?). Skipping.');
    } else {
        console.log('✨ Restoring Orphaned Project...');
        const { error: insertError } = await supabase
            .from('projects')
            .insert([{
                id: ORPHAN_PROJECT_ID,
                name: 'KURTARILAN PROJE (Gala Gecesi)', // Distinct name
                status: 'active',
                description: 'Otomatik olarak kurtarılan proje kaydı.',
                created_at: new Date().toISOString()
            }]);

        if (insertError) console.error('❌ Error restoring project:', insertError.message);
        else console.log('✅ Successfully restored orphaned project!');
    }
}

repairData();
