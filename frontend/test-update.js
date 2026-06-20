import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://gzdfdnfkyedwnameflso.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6ZGZkbmZreWVkd25hbWVmbHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg5MjkxMiwiZXhwIjoyMDc2NDY4OTEyfQ.QIV75ynKo_W0n7N80udD5o5t8ecL6_CwXL4XSlZkSYA'
)

async function test() {
  const { data: agencies } = await supabase.from('agencies').select('id, name').limit(1)
  if (!agencies || agencies.length === 0) {
    console.log('No agencies found.')
    return
  }
  const id = agencies[0].id
  console.log(`Updating agency ${id}...`)

  const { data, error } = await supabase.from('agencies').update({ name: agencies[0].name + ' test' }).eq('id', id)
  console.log('Update without entity_type:', error ? error.message : 'Success')

  const { data: data2, error: error2 } = await supabase.from('agencies').update({ name: agencies[0].name, entity_type: 'agency' }).eq('id', id)
  console.log('Update with entity_type:', error2 ? error2.message : 'Success')
}
test()
