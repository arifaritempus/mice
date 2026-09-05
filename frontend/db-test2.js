import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('frontend/.env.local', 'utf8');
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabase = createClient(
  urlMatch ? urlMatch[1].trim() : '',
  keyMatch ? keyMatch[1].trim() : ''
);

async function run() {
  const { data: sales, error } = await supabase.from('project_sales_items').select('currency');
  const tlSales = sales.filter(s => s.currency === 'TL');
  console.log("TL Sales items:", tlSales.length);

  const { data: projects } = await supabase.from('projects').select('currency');
  const tlProjects = projects.filter(p => p.currency === 'TL');
  console.log("TL Projects:", tlProjects.length);
}
run();
