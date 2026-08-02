require("dotenv").config({ path: "frontend/.env.local" });
const { createClient } = require("@supabase/supabase-js");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from("quotes").select("id, project_code, created_at, created_by").order("created_at", { ascending: false }).limit(3);
  console.log("Quotes Error:", error);
  console.log("Quotes Data:", data);
}
check();
