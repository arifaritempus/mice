import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://gzdfdnfkyedwnameflso.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6ZGZkbmZreWVkd25hbWVmbHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4OTI5MTIsImV4cCI6MjA3NjQ2ODkxMn0.mrQBekx7aotFM0smVAXSPk7ssgd_uW1q9HrFIBwyDNs';

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;

// Teklif Yönetimi
export async function loadTeklifler() {
  const { data, error } = await supabase
    .from('teklif_yonetimi')
    .select('*');
  if (error) console.error('Error fetching teklifler:', error);
  return data;
}

// Proje Yönetimi
export async function loadProjeler() {
  const { data, error } = await supabase
    .from('proje_yonetimi')
    .select('*');
  if (error) console.error('Error fetching projeler:', error);
  return data;
}

// Sejour Listesi
export async function loadSejourlar() {
  const { data, error } = await supabase
    .from('sejour_listesi')
    .select('*');
  if (error) console.error('Error fetching sejourlar:', error);
  return data;
}

// Bilet Yönetimi
export async function loadBiletler() {
  const { data, error } = await supabase
    .from('bilet_yonetimi')
    .select('*');
  if (error) console.error('Error fetching biletler:', error);
  return data;
}

// Tanımlamalar
export async function loadTanimlamalar() {
  const { data, error } = await supabase
    .from('tanimlamalar')
    .select('*');
  if (error) console.error('Error fetching tanimlamalar:', error);
  return data;
}