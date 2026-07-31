const { createClient } = require('@supabase/supabase-js');
const url = 'https://pnwpypiwuyyofpzlzmli.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBud3B5cGl3dXl5b2Zwemx6bWxpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzA2NDA0MCwiZXhwIjoyMDYyNjQwMDQwfQ.vyS-x-OkKkFWZIX5dVOZOLvYse-tbMSNRLXyc6nnHrY';
const supabase = createClient(url, key);

async function run() {
  const actions = ['view', 'create', 'edit', 'delete'];
  for (const action of actions) {
    const { data, error } = await supabase.from('permissions').insert({
      module: 'requests',
      action: action,
      description: `Talepleri ${action} yetkisi`
    }).select().single();
    
    if (error) {
      console.error('Error inserting', action, error.message);
    } else {
      console.log('Inserted', action, data.id);
      
      // Assign to super_admin role
      const { data: role } = await supabase.from('roles').select('id').eq('name', 'super_admin').single();
      if (role) {
        await supabase.from('role_permissions').insert({
          role_id: role.id,
          permission_id: data.id
        });
      }
    }
  }
}
run();
