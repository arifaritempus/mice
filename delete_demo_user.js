require('dotenv').config({ path: 'frontend/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function test() {
  const { data: users } = await supabase.from('users').select('id').eq('email', 'demo@demo.com');
  if (users && users.length > 0) {
    const userId = users[0].id;
    await supabase.from('notifications').delete().eq('user_id', userId);
    await supabase.from('audit_logs').delete().eq('user_id', userId);
    await supabase.from('quotes').update({ created_by: null }).eq('created_by', userId);
    const { data, error } = await supabase.from('users').delete().eq('id', userId);
    console.log("Delete user result:", data, error);
  }
}
test();
