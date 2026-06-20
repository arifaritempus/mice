require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function getTriggers() {
  const { data, error } = await supabase.schema('information_schema').from('triggers').select('*').eq('event_object_table', 'project_purchase_items');
  console.log("Triggers:", data, error);
  
  // also check routines/functions to see what the trigger calls
  if (data && data.length > 0) {
    const action = data[0].action_statement;
    const match = action.match(/EXECUTE FUNCTION (.*?)\(\)/);
    if (match) {
      const funcName = match[1];
      const { data: routines } = await supabase.schema('information_schema').from('routines').select('routine_definition').eq('routine_name', funcName);
      console.log("Function Definition:", routines);
    }
  }
}
getTriggers();
