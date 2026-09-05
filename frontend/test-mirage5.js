import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('frontend/.env.local', 'utf8');
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

const supabase = createClient(
  urlMatch ? urlMatch[1].trim() : '',
  keyMatch ? keyMatch[1].trim() : ''
);

async function run() {
  const { data: agencies } = await supabase.from('agencies').select('id, name');
  agencies.forEach(a => console.log(a.name));
  
  const { data: projects } = await supabase.from('projects').select('id, company_name');
  projects.forEach(p => console.log("P:", p.company_name));
}
run();
