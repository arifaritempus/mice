const { createClient } = require("@supabase/supabase-js");
const url = "https://lnyhtuudivwsbedxbauw.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxueWh0dXVkaXZ3c2JlZHhiYXV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDc5MzI4MiwiZXhwIjoyMTAwMzY5MjgyfQ.GsYUWvBlCu0MRQHG7R9ed5U-BsjHrl5-XvmPhykTuus";
const supabase = createClient(url, key);

async function check() {
  const { data: users, error: err } = await supabase.auth.admin.listUsers();
  if (err) {
    console.error("Auth error:", err);
    return;
  }
  
  users.users.forEach(u => {
    console.log(`User: ${u.email} -> ${u.id}`);
  });
}
check();
