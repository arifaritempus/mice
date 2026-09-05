const fs = require('fs');
const file = 'src/lib/supabaseService.ts';
let code = fs.readFileSync(file, 'utf8');

const oldSejourIds = `      const sejourIds = new Set<string>();
      (sRooms.data || []).forEach((r: any) => r.sejour_id && sejourIds.add(r.sejour_id));
      (sFlights.data || []).forEach((f: any) => f.sejour_id && sejourIds.add(f.sejour_id));
      (sTransfers.data || []).forEach((t: any) => t.sejour_id && sejourIds.add(t.sejour_id));
      (sExtras.data || []).forEach((e: any) => e.sejour_id && sejourIds.add(e.sejour_id));`;

const newSejourIds = `      const sejourIds = new Set<string>();
      (sRooms.data || []).forEach((r: any) => r.sejour_id && sejourIds.add(r.sejour_id));
      (sFlights.data || []).forEach((f: any) => f.sejour_id && sejourIds.add(f.sejour_id));
      (sTransfers.data || []).forEach((t: any) => t.sejour_id && sejourIds.add(t.sejour_id));
      (sExtras.data || []).forEach((e: any) => e.sejour_id && sejourIds.add(e.sejour_id));

      // Fallback for manual invoices where item_id might be sejour_id directly
      itemIds.forEach((id: string) => {
        if (!projectIds.has(id) && !sourceMap[id]) {
          sejourIds.add(id);
        }
      });`;

if (code.includes(oldSejourIds)) {
    code = code.replace(oldSejourIds, newSejourIds);
    fs.writeFileSync(file, code);
    console.log("Patched getById sejourIds fallback.");
} else {
    console.log("Could not find the target string for getById sejourIds.");
}
