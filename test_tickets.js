require("dotenv").config({ path: "frontend/.env.local" });
const { createClient } = require("@supabase/supabase-js");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from("ticket_options").select("id, created_at, agent").order("created_at", { ascending: false }).limit(3);
  console.log("Tickets Error:", error);
  console.log("Tickets Data:", data);
}
check();
