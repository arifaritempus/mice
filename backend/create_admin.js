const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vzgchmyaiyjynezjffsq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6Z2NobXlhaXlqeW5lempmZnNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTc4MTUxMiwiZXhwIjoyMDk1MzU3NTEyfQ.WpQfidatg6NGktaAZ5uhapumGiyEfQ9IuBi3GSD69lc'
);

async function createAdmin() {
  // 1. Create User in Auth
  console.log('Creating auth user...');
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'arifari89@icloud.com',
    password: '123456',
    email_confirm: true
  });
  
  if (authError && authError.message !== 'User already registered') {
    console.error('Auth error:', authError);
    return;
  }
  
  const userId = authData?.user?.id || (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === 'arifari89@icloud.com')?.id;
  
  if (!userId) {
    console.error('Could not find or create user ID');
    return;
  }

  console.log('User ID:', userId);

  // 2. Create Super Admin Role if not exists
  let { data: roleData } = await supabase.from('roles').select('id').eq('name', 'Super Admin').single();
  
  if (!roleData) {
    console.log('Creating Super Admin role...');
    const { data: newRole, error: roleError } = await supabase.from('roles').insert({
      name: 'Super Admin',
      description: 'Tüm yetkilere sahip kullanıcı'
    }).select().single();
    
    if (roleError) {
      console.error('Role error:', roleError);
      return;
    }
    roleData = newRole;
  }

  // 3. Create User Profile
  console.log('Creating public.users profile...');
  const { error: profileError } = await supabase.from('users').upsert({
    id: userId,
    email: 'arifari89@icloud.com',
    first_name: 'Super',
    last_name: 'Admin',
    is_active: true
  });

  if (profileError) {
    console.error('Profile error:', profileError);
  }

  // 4. Assign Role
  console.log('Assigning role to user...');
  const { error: assignError } = await supabase.from('user_roles').upsert({
    user_id: userId,
    role_id: roleData.id
  });

  if (assignError) {
    console.error('Role assign error:', assignError);
  }

  console.log('Admin creation complete! You can login with arifari89@icloud.com / 123456');
}

createAdmin();
