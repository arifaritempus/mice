import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: './frontend/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data: s } = await supabase.from('sejours').select('*, agencies(*), hotels(*)').limit(2);
  const { data: p } = await supabase.from('projects').select('*, manager:users(*)').limit(2);
  const { data: v } = await supabase.from('vw_rp_proje_satis_maliyet').select('*').limit(2);
  const { data: u } = await supabase.from('users').select('*').limit(2);
  
  console.log("SEJOURS:", JSON.stringify(s, null, 2));
  console.log("PROJECTS:", JSON.stringify(p, null, 2));
  console.log("VIEW:", JSON.stringify(v, null, 2));
  console.log("USERS:", JSON.stringify(u, null, 2));
}

run();
