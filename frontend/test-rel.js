import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { error } = await supabase.from('project_transfer_tour').select('*, projects(title)').limit(1);
  console.log('projects:', error?.message || 'Success');
  
  const { error: err2 } = await supabase.from('project_transfer_tour').select('*, project:projects(title)').limit(1);
  console.log('project:projects:', err2?.message || 'Success');

  const { error: err3 } = await supabase.from('project_transfer_tour').select('*, project:project_id(title)').limit(1);
  console.log('project_id:', err3?.message || 'Success');
}
run();
