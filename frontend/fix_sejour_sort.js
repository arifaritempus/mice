const fs = require('fs');
let file = 'src/lib/supabaseService.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "supabase.from('categories').select('id, name')",
  "supabase.from('categories').select('id, name, sort_order')"
);

const resolveTarget = `        if (source?.isStatic) {
           categoryName = source.staticCat || '';
           subCategoryName = source.staticSub || '';
        } else {
           categoryName = source?.category ? (categoriesMap[source.category] || '') : '';
           subCategoryName = source?.sub_category ? (categoriesMap[source.sub_category] || '') : '';
        }

        // If even after static/db it's empty, try to use the description itself as sub_category so it's not empty "-"
        if (!subCategoryName && ii.description) {
           // As a last fallback to avoid dashes on proforma:
           subCategoryName = ii.description;
        }

        return {
          ...ii,
          category_name: categoryName,
          sub_category_name: subCategoryName
        };`;

const resolveReplace = `        let catSort = 9999;
        let subCatSort = 9999;

        if (source?.isStatic) {
           categoryName = source.staticCat || '';
           subCategoryName = source.staticSub || '';
           // Default sejour items to top
           catSort = 0;
           subCatSort = 0;
        } else {
           const cat = source?.category ? categoriesMap[source.category] : null;
           const subCat = source?.sub_category ? categoriesMap[source.sub_category] : null;
           
           categoryName = cat?.name || '';
           catSort = cat?.sort_order ?? 9999;

           subCategoryName = subCat?.name || '';
           subCatSort = subCat?.sort_order ?? 9999;
        }

        // If even after static/db it's empty, try to use the description itself as sub_category so it's not empty "-"
        if (!subCategoryName && ii.description) {
           // As a last fallback to avoid dashes on proforma:
           subCategoryName = ii.description;
        }

        return {
          ...ii,
          category_name: categoryName,
          category_sort_order: catSort,
          sub_category_name: subCategoryName,
          sub_category_sort_order: subCatSort
        };`;

content = content.replace(resolveTarget, resolveReplace);

// We also need to fix categoriesMap to store the whole object, not just string name!
// Currently: const categoriesMap: Record<string, string> = {};
// (categoriesRes.data || []).forEach((c: any) => { categoriesMap[c.id] = c.name; });

const catMapTarget = `      // Kategori map
      const categoriesMap: Record<string, string> = {};
      (categoriesRes.data || []).forEach((c: any) => { categoriesMap[c.id] = c.name; });`;

const catMapReplace = `      // Kategori map
      const categoriesMap: Record<string, any> = {};
      (categoriesRes.data || []).forEach((c: any) => { categoriesMap[c.id] = c; });`;

content = content.replace(catMapTarget, catMapReplace);

fs.writeFileSync(file, content, 'utf8');
