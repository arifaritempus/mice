const { supabaseAdmin } = require('./src/config/database');

async function listAllCols() {
  const tables = ['quotes', 'project_collection_plans', 'project_payment_plans', 'project_transfer_tour', 'operations', 'project_human_resources', 'flight_tickets', 'users'];
  
  for (const table of tables) {
    console.log(`--- ${table} ---`);
    const { data, error } = await supabaseAdmin.from(table).select('*').limit(1);
    if (error) {
      console.log(`Error: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(Object.keys(data[0]));
    } else {
      console.log('No data found to determine columns.');
    }
  }
}

listAllCols();
