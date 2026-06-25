const fs = require('fs');
let file = 'src/lib/supabaseService.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "supabase.from('project_sales_items').select('id, category, description').in('id', itemIds),",
  "supabase.from('project_sales_items').select('id, category, sub_category, description').in('id', itemIds),"
);

content = content.replace(
  "supabase.from('project_purchase_items').select('id, category, description').in('id', itemIds),",
  "supabase.from('project_purchase_items').select('id, category, sub_category, description').in('id', itemIds),"
);

content = content.replace(
  "const sourceMap: Record<string, { category: string; description: string }> = {};",
  "const sourceMap: Record<string, { category: string; sub_category: string; description: string }> = {};"
);

content = content.replace(
  "(salesRes.data || []).forEach((s: any) => { sourceMap[s.id] = { category: s.category, description: s.description }; });",
  "(salesRes.data || []).forEach((s: any) => { sourceMap[s.id] = { category: s.category, sub_category: s.sub_category, description: s.description }; });"
);

content = content.replace(
  "(purchaseRes.data || []).forEach((p: any) => { sourceMap[p.id] = { category: p.category, description: p.description }; });",
  "(purchaseRes.data || []).forEach((p: any) => { sourceMap[p.id] = { category: p.category, sub_category: p.sub_category, description: p.description }; });"
);

content = content.replace(
  "const categoryName = source?.category ? (categoriesMap[source.category] || '') : '';",
  "const categoryName = source?.category ? (categoriesMap[source.category] || '') : '';\n        const subCategoryName = source?.sub_category ? (categoriesMap[source.sub_category] || '') : '';"
);

content = content.replace(
  "category_name: categoryName",
  "category_name: categoryName,\n          sub_category_name: subCategoryName"
);

fs.writeFileSync(file, content, 'utf8');
