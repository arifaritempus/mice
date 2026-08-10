const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hezkngmwcdcleqfmfiwu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlemtuZ213Y2RjbGVxZm1maXd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjE1ODYzNiwiZXhwIjoyMDk3NzM0NjM2fQ.w6Ib227QnJfg9-tYxFRbHQKZzcgejeNwAsheDeRhPSU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: hotels } = await supabase.from('hotels').select('id').limit(1);
  if (!hotels || hotels.length === 0) return console.log('No hotels');
  
  const hotelId = hotels[0].id;
  
  const { data: items } = await supabase.from('project_purchase_items').select('id, supplier_id').limit(1);
  if (!items || items.length === 0) return console.log('No purchase items');
  
  const itemId = items[0].id;
  const originalSupplierId = items[0].supplier_id;
  
  console.log('Attempting to set supplier_id to hotel UUID:', hotelId);
  const { data, error } = await supabase.from('project_purchase_items').update({ supplier_id: hotelId }).eq('id', itemId);
  
  if (error) {
    console.error('Update failed:', error);
  } else {
    console.log('Update succeeded!');
    // revert
    await supabase.from('project_purchase_items').update({ supplier_id: originalSupplierId }).eq('id', itemId);
  }
}

test();
