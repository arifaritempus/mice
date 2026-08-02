const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRealtime() {
  const { data, error } = await supabase.rpc('get_realtime_tables');
  if (error) {
    // Sometimes RPC is not defined, we can try to insert a test notification and listen to it
    console.log("Cannot easily check realtime via RPC. Let's just create a listener and wait 3 seconds, then insert a test notification.");
    
    let received = false;
    const channel = supabase.channel('test-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        console.log("✅ Realtime event received!", payload);
        received = true;
      })
      .subscribe();
      
    setTimeout(async () => {
       const {data: ins, error: err} = await supabase.from('notifications').insert({
         user_id: '00000000-0000-0000-0000-000000000000', // might fail due to foreign key, let's just use a valid user or ignore insert error
         title: 'Test',
         message: 'Test'
       }).select();
       console.log("Insert result:", err ? err.message : "Success");
       
       setTimeout(() => {
         if (!received) console.log("❌ No realtime event received after 2 seconds.");
         process.exit(0);
       }, 2000);
    }, 2000);
  } else {
    console.log("Realtime tables:", data);
  }
}

checkRealtime();
