const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env' });

const oldUrl = 'https://pnwpypiwuyyofpzlzmli.supabase.co';
const oldKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBud3B5cGl3dXl5b2Zwemx6bWxpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzA2NDA0MCwiZXhwIjoyMDYyNjQwMDQwfQ.vyS-x-OkKkFWZIX5dVOZOLvYse-tbMSNRLXyc6nnHrY';
const oldSupabase = createClient(oldUrl, oldKey);

const newUrl = process.env.SUPABASE_URL;
const newKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const newSupabase = createClient(newUrl, newKey);

async function migrate() {
  console.log("Fetching notifications from old DB...");
  const { data: oldData, error: oldErr } = await oldSupabase.from('notifications').select('*');
  
  if (oldErr) {
    console.error("Error fetching from old DB:", oldErr);
    return;
  }
  
  console.log(`Found ${oldData.length} notifications in old DB.`);
  
  if (oldData.length > 0) {
    console.log("Checking if they already exist in new DB...");
    const { data: newData, error: newErr } = await newSupabase.from('notifications').select('id');
    
    if (newErr) {
      console.error("Error fetching from new DB:", newErr);
      return;
    }
    
    const existingIds = new Set(newData.map(n => n.id));
    const toInsert = oldData.filter(n => !existingIds.has(n.id));
    
    console.log(`${existingIds.size} notifications already exist in new DB.`);
    console.log(`${toInsert.length} notifications to insert.`);
    
    if (toInsert.length > 0) {
      // Split into chunks of 100
      for (let i = 0; i < toInsert.length; i += 100) {
        const chunk = toInsert.slice(i, i + 100);
        const { error: insErr } = await newSupabase.from('notifications').insert(chunk);
        if (insErr) {
          console.error("Error inserting chunk:", insErr);
        } else {
          console.log(`Inserted ${chunk.length} notifications.`);
        }
      }
      console.log("Migration complete!");
    } else {
      console.log("Nothing to migrate.");
    }
  }
}

migrate();
