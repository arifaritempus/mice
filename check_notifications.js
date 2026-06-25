require('dotenv').config({ path: './frontend/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey);

async function check() {
  const { data, error } = await admin.from('notifications').select('*').limit(5);
  if (error) {
    console.error('Error fetching notifications:', error);
  } else {
    console.log('Notifications (first 5):', JSON.stringify(data, null, 2));
  }
}

check();
