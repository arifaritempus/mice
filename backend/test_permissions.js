const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://vzgchmyaiyjynezjffsq.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6Z2NobXlhaXlqeW5lempmZnNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTc4MTUxMiwiZXhwIjoyMDk1MzU3NTEyfQ.WpQfidatg6NGktaAZ5uhapumGiyEfQ9IuBi3GSD69lc';
const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function test() {
  const { data: userRow } = await adminClient.from('users').select('id,email,role').eq('email', 'arifari89@icloud.com').single();
  console.log('User:', userRow);
  
  const { data: roles } = await adminClient.from('roles').select('id,name');
  console.log('Roles:', roles);
  
  const { data: rolePermissions } = await adminClient.from('role_permissions').select('role_id,permission_id,permissions(id,module,action)');
  console.log('Role Permissions count:', rolePermissions?.length);
  if (rolePermissions?.length > 0) {
    console.log('Sample RP:', rolePermissions[0]);
  }
}
test();
