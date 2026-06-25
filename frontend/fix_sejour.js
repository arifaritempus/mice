const fs = require('fs');
let file = 'src/lib/supabaseService.ts';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `      const [salesRes, purchaseRes, categoriesRes] = await Promise.all([
        supabase.from('project_sales_items').select('id, category, sub_category, description').in('id', itemIds),
        supabase.from('project_purchase_items').select('id, category, sub_category, description').in('id', itemIds),
        supabase.from('categories').select('id, name')
      ]);`;

const replaceStr = `      const [
        salesRes, purchaseRes, categoriesRes,
        sRooms, sFlights, sTransfers, sExtras
      ] = await Promise.all([
        supabase.from('project_sales_items').select('id, category, sub_category, description').in('id', itemIds),
        supabase.from('project_purchase_items').select('id, category, sub_category, description').in('id', itemIds),
        supabase.from('categories').select('id, name'),
        supabase.from('sejour_rooms').select('id').in('id', itemIds),
        supabase.from('sejour_flights').select('id').in('id', itemIds),
        supabase.from('sejour_transfers').select('id').in('id', itemIds),
        supabase.from('sejour_extra_services').select('id').in('id', itemIds)
      ]);`;

content = content.replace(targetStr, replaceStr);

const mapTarget = `      const sourceMap: Record<string, { category: string; sub_category: string; description: string }> = {};
      (salesRes.data || []).forEach((s: any) => { sourceMap[s.id] = { category: s.category, sub_category: s.sub_category, description: s.description }; });
      (purchaseRes.data || []).forEach((p: any) => { sourceMap[p.id] = { category: p.category, sub_category: p.sub_category, description: p.description }; });`;

const mapReplace = `      const sourceMap: Record<string, { category: string; sub_category: string; description: string, isStatic?: boolean, staticCat?: string, staticSub?: string }> = {};
      (salesRes.data || []).forEach((s: any) => { sourceMap[s.id] = { category: s.category, sub_category: s.sub_category, description: s.description }; });
      (purchaseRes.data || []).forEach((p: any) => { sourceMap[p.id] = { category: p.category, sub_category: p.sub_category, description: p.description }; });
      (sRooms.data || []).forEach((r: any) => { sourceMap[r.id] = { category: '', sub_category: '', description: '', isStatic: true, staticCat: 'SEJOUR', staticSub: 'KONAKLAMA' }; });
      (sFlights.data || []).forEach((f: any) => { sourceMap[f.id] = { category: '', sub_category: '', description: '', isStatic: true, staticCat: 'SEJOUR', staticSub: 'UÇAK BİLETİ' }; });
      (sTransfers.data || []).forEach((t: any) => { sourceMap[t.id] = { category: '', sub_category: '', description: '', isStatic: true, staticCat: 'SEJOUR', staticSub: 'TRANSFER' }; });
      (sExtras.data || []).forEach((e: any) => { sourceMap[e.id] = { category: '', sub_category: '', description: '', isStatic: true, staticCat: 'SEJOUR', staticSub: 'EKSTRA SERVİS' }; });`;

content = content.replace(mapTarget, mapReplace);

const resolveTarget = `      enrichedItems = invoiceItems.map((ii: any) => {
        const source = sourceMap[ii.item_id];
        const categoryName = source?.category ? (categoriesMap[source.category] || '') : '';
        const subCategoryName = source?.sub_category ? (categoriesMap[source.sub_category] || '') : '';
        return {
          ...ii,
          category_name: categoryName,
          sub_category_name: subCategoryName
        };
      });`;

const resolveReplace = `      enrichedItems = invoiceItems.map((ii: any) => {
        const source = sourceMap[ii.item_id];
        let categoryName = '';
        let subCategoryName = '';
        
        if (source?.isStatic) {
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
        };
      });`;

content = content.replace(resolveTarget, resolveReplace);

fs.writeFileSync(file, content, 'utf8');
