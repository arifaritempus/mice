require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('sejour_rooms').select('id, sejour_id, hotel_id, check_in_date, check_out_date, hotels(name)').limit(5);
  console.log("Sejour Rooms:", JSON.stringify(data, null, 2));
  if (error) console.error("Error:", error);
}
run();
