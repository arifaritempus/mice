require('dotenv').config({ path: 'frontend/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function test() {
  const query = `
CREATE OR REPLACE VIEW public.vw_rp_otel_detay_talep AS
SELECT 
    rh.id as id,
    r.created_at as olusturulma_tarihi,
    r.reference as talep_no,
    r.request_date as talep_tarihi,
    r.date_type as tarih_tipi,
    r.date_details->>'text' as esnek_tarih,
    (r.date_details->>'check_in')::date as cin_tarihi,
    (r.date_details->>'check_out')::date as cout_tarihi,
    r.company_name as firma_adi,
    a.name as acente,
    h.name as otel,
    rh.status as talep_durumu,
    rh.price as fiyat,
    rh.currency as para_birimi,
    rh.option_date as opsiyon_tarihi,
    rh.response_details as yanit_detayi,
    r.nights as gece_sayisi
FROM mice_requests r
LEFT JOIN agencies a ON r.agency_id = a.id
JOIN mice_request_hotels rh ON r.id = rh.request_id
JOIN hotels h ON rh.hotel_id = h.id;
  `;
  // The supabase JS client doesn't support raw SQL execution easily.
  // We can use a stored procedure if available, or just fetch via REST if we only need read.
  // To create a view we might need to use postgres connection or a previously created function 'exec_sql'.
  
  const { data, error } = await supabase.rpc('exec_sql', { sql: query });
  console.log("Create view result:", data, error);
}
test();
