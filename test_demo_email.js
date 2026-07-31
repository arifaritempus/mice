require('dotenv').config({ path: 'frontend/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function test() {
  const { data: users } = await supabase.from('users').select('id, email, full_name').eq('email', 'demo@demo.com');
  console.log("Users with demo@demo.com:", users);

  const { data: settings } = await supabase.from('settings').select('value').eq('key', 'general_settings').single();
  let mailNotificationEmail = "none";
  if (settings && settings.value) {
    let parsed = settings.value;
    if (typeof parsed === "string") {
      try { parsed = JSON.parse(parsed); } catch(e) {}
    }
    mailNotificationEmail = parsed.mailNotificationEmail;
  }
  console.log("Settings mailNotificationEmail:", mailNotificationEmail);
}
test();
