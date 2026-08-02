const { createClient } = require("@supabase/supabase-js");
const url = "https://lnyhtuudivwsbedxbauw.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxueWh0dXVkaXZ3c2JlZHhiYXV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDc5MzI4MiwiZXhwIjoyMTAwMzY5MjgyfQ.GsYUWvBlCu0MRQHG7R9ed5U-BsjHrl5-XvmPhykTuus";
const supabase = createClient(url, key);

async function clean() {
  const { data, error } = await supabase
    .from("notifications")
    .delete()
    .like('title', '%Test Bildirimi%');
  
  console.log("Delete Error:", error);
  console.log("Delete Data:", data);
}
clean();
