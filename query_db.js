require('dotenv').config({ path: 'frontend/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  console.log("Looking for quote TMI260731001...");
  const { data: quote, error: qErr } = await supabase.from('quotes').select('*').eq('reference', 'TMI260731001').single();
  if (qErr) { console.error("Quote Error:", qErr); return; }
  console.log("Quote found:", quote.id);

  console.log("Looking for project...");
  const { data: proj, error: pErr } = await supabase.from('projects').select('*').eq('quote_id', quote.id);
  if (pErr) { console.error("Project Error:", pErr); return; }
  console.log("Projects found:", proj.map(p => ({ id: p.id, reference: p.reference })));

  if (proj.length > 0) {
    const projectId = proj[0].id;
    console.log("Checking project_sales_items for project", projectId);
    const { data: sales } = await supabase.from('project_sales_items').select('id, category, description, unit_price').eq('project_id', projectId);
    console.log("Sales items count:", sales ? sales.length : 0);
    console.log("Sales items:", sales);

    console.log("Checking project_purchase_items for project", projectId);
    const { data: purchases } = await supabase.from('project_purchase_items').select('id, category, description, unit_price, status').eq('project_id', projectId);
    console.log("Purchase items count:", purchases ? purchases.length : 0);
    console.log("Purchase items:", purchases);
  }
}
run();
