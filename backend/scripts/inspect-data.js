require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
// Use Service Role for full access
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('🔍 Connecting to:', supabaseUrl);

    // Check Projects
    console.log('\n--- PROJECTS TABLE ---');
    const { data: projects } = await supabase.from('projects').select('id, name, created_at, status').limit(5);
    console.table(projects);

    // Check Purchase Items - Select * to avoid column errors
    console.log('\n--- PURCHASE ITEMS TABLE (First 5 rows) ---');
    const { data: items, error } = await supabase
        .from('project_purchase_items')
        .select('*')
        .limit(5);

    if (error) {
        console.error('❌ Error fetching items:', error.message);
    } else {
        // Log simplified data
        const simple = items.map(i => ({
            id: i.id?.substring(0, 8),
            description: i.description?.substring(0, 30),
            category: i.category,
            price: i.unit_price || i.amount || 'N/A'
        }));
        console.table(simple);
    }
}

checkData();
