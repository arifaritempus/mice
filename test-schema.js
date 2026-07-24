const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://hezkngmwcdcleqfmfiwu.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data, error } = await supabase.from('quotes').select('*').limit(1);
  if (error) console.error(error);
  else console.log(Object.keys(data[0]));
}
test();
