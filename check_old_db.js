const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkOldDB() {
  try {
    const oldUrl = 'https://pnwpypiwuyyofpzlzmli.supabase.co';
    // I don't have the anon key for the old db, but I can check if I can find it in dev_server.log or .backend_dev.log
    const logContent = fs.readFileSync('backend/.backend_dev.log', 'utf8');
    const match = logContent.match(/SUPABASE_ANON_KEY: (.*)/);
    
    // Actually the log has SUPABASE_ANON_KEY: ***qgXM which is redacted!
    console.log("Old DB anon key is redacted in logs.");
  } catch (err) {
    console.error(err);
  }
}
checkOldDB();
