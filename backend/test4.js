const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const isGuide = (...values) => {
  return values.some(value => {
    if (!value) return false;
    const text = String(value).toLowerCase().replace(/i̇/g, 'i').replace(/ı/g, 'i');
    return (text.includes('kokart') || text.includes('rehber') || text.includes('guide'));
  });
};

async function test() {
  try {
    const { data: projectHr, error: projectError } = await client
      .from('project_human_resources')
      .select(`
        id,
        project_id,
        sub_category_id,
        supplier_id,
        description,
        amount,
        currency,
        exchange_rate,
        created_at,
        suppliers(name)
      `, { count: 'exact' }).limit(10);
      
    if(projectError) {
       console.error("projectError:", projectError);
       return;
    }
    
    console.log("projectHr length:", projectHr.length);

    const categoryIds = Array.from(new Set((projectHr || []).map((row) => row.sub_category_id).filter(Boolean)));
    let categoryMap = {};
    if (categoryIds.length > 0) {
      const { data: categories } = await client.from('categories').select('id,name').in('id', categoryIds);
      categoryMap = (categories || []).reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {});
    }

    const merged = [
      ...(projectHr || [])
        .filter((row) => {
           console.log("filtering row", row.id);
           return isGuide(categoryMap[row.sub_category_id], row.description);
        })
        .map((row) => ({ id: row.id }))
    ];
    console.log("Success! Merged length:", merged.length);
  } catch(e) {
    console.error("Exception:", e);
  }
}
test();
