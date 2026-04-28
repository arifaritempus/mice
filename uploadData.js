require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadData(data) {
  const { data: response, error } = await supabase
    .from('your_table_name')
    .insert(data);

  if (error) {
    console.error('Error uploading data:', error.message, error.details);
  } else {
    console.log('Data uploaded successfully:', response);
  }
}

const tables = [
  { name: 'agencies', data: [{ column1: 'value1', column2: 'value2' }] },
  // Diğer tablolar
];

async function uploadAllData() {
  for (const table of tables) {
    const { data: response, error } = await supabase
      .from(table.name)
      .insert(table.data);

    if (error) {
      console.error(`Error uploading data to ${table.name}:`, error.message, error.details, error.hint);
    } else {
      console.log(`Data uploaded successfully to ${table.name}:`, response);
    }
  }
}

uploadAllData();
