const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testInsert() {
  const testNotif = {
    user_id: '56f2f11a-7b8c-456c-aa4f-4b69b3fd37c3', // A valid user ID from previous output
    title: 'Test Notification',
    message: 'Test Message',
    type: 'info',
    related_type: 'test',
    related_id: 'test-id',
    action_url: '/test'
  };

  console.log('Attempting insert with all columns...');
  const { data, error } = await supabase
    .from('notifications')
    .insert([testNotif])
    .select();

  if (error) {
    console.error('Insert failed:', error);
  } else {
    console.log('Insert successful:', data);
  }
}

testInsert();
