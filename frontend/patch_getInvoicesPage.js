const fs = require('fs');
const file = 'src/lib/supabaseService.ts';
let code = fs.readFileSync(file, 'utf8');

// The replacement logic for getInvoicesPage mapping
const oldMapping = `    // Collect project and sejour IDs
    const projectIds = new Set<string>();
    const sejourIds = new Set<string>();
    
    (salesItemsRes.data || []).forEach((si: any) => si.project_id && projectIds.add(si.project_id));
    (purchaseItemsRes.data || []).forEach((pi: any) => pi.project_id && projectIds.add(pi.project_id));
    (sRooms.data || []).forEach((r: any) => r.sejour_id && sejourIds.add(r.sejour_id));
    (sFlights.data || []).forEach((f: any) => f.sejour_id && sejourIds.add(f.sejour_id));
    (sTransfers.data || []).forEach((t: any) => t.sejour_id && sejourIds.add(t.sejour_id));
    (sExtras.data || []).forEach((e: any) => e.sejour_id && sejourIds.add(e.sejour_id));

    // For sejours, item_id might be the sejour_id itself
    itemIds.forEach((id: string) => {
      if (!projectIds.has(id)) sejourIds.add(id);
    });`;

const newMapping = `    // Collect project and sejour IDs
    const projectIds = new Set<string>();
    const sejourIds = new Set<string>();
    
    // We must track which item_id maps to which project_id / sejour_id
    // because invoiceMetadata is built per invoice item
    const itemToSejourMap: Record<string, string> = {};
    
    (salesItemsRes.data || []).forEach((si: any) => si.project_id && projectIds.add(si.project_id));
    (purchaseItemsRes.data || []).forEach((pi: any) => pi.project_id && projectIds.add(pi.project_id));
    
    (sRooms.data || []).forEach((r: any) => { if(r.sejour_id) { sejourIds.add(r.sejour_id); itemToSejourMap[r.id] = r.sejour_id; } });
    (sFlights.data || []).forEach((f: any) => { if(f.sejour_id) { sejourIds.add(f.sejour_id); itemToSejourMap[f.id] = f.sejour_id; } });
    (sTransfers.data || []).forEach((t: any) => { if(t.sejour_id) { sejourIds.add(t.sejour_id); itemToSejourMap[t.id] = t.sejour_id; } });
    (sExtras.data || []).forEach((e: any) => { if(e.sejour_id) { sejourIds.add(e.sejour_id); itemToSejourMap[e.id] = e.sejour_id; } });

    // For manual sejours, item_id might be the sejour_id itself
    itemIds.forEach((id: string) => {
      if (!projectIds.has(id) && !itemToSejourMap[id]) sejourIds.add(id);
    });`;

code = code.replace(oldMapping, newMapping);

const oldMetadataBuild = `      const projectId = itemToProjectMap[ii.item_id];
      const project = projectsMap[projectId];
      const sejour = sejoursMap[ii.item_id] || sejoursMap[projectId];`;

const newMetadataBuild = `      const projectId = itemToProjectMap[ii.item_id];
      const project = projectsMap[projectId];
      const resolvedSejourId = itemToSejourMap[ii.item_id] || ii.item_id;
      const sejour = sejoursMap[resolvedSejourId] || sejoursMap[projectId];`;

code = code.replace(oldMetadataBuild, newMetadataBuild);

fs.writeFileSync(file, code);
console.log("Patched getInvoicesPage.");
