const fs = require('fs');
const file = 'src/lib/supabaseService.ts';
let code = fs.readFileSync(file, 'utf8');

const oldSejourIds = `      (sFlights.data || []).forEach((r: any) => r.sejour_id && sejourIds.add(r.sejour_id));
      (sTransfers.data || []).forEach((r: any) => r.sejour_id && sejourIds.add(r.sejour_id));
      (sExtras.data || []).forEach((r: any) => r.sejour_id && sejourIds.add(r.sejour_id));

      const [projectsRes, sejoursRes] = await Promise.all([`;

const newSejourIds = `      (sFlights.data || []).forEach((r: any) => r.sejour_id && sejourIds.add(r.sejour_id));
      (sTransfers.data || []).forEach((r: any) => r.sejour_id && sejourIds.add(r.sejour_id));
      (sExtras.data || []).forEach((r: any) => r.sejour_id && sejourIds.add(r.sejour_id));

      itemIds.forEach((id: string) => {
        if (!projectIds.has(id) && !sourceMap[id]) {
          sejourIds.add(id);
        }
      });

      const [projectsRes, sejoursRes] = await Promise.all([`;

if (code.includes(oldSejourIds)) {
    code = code.replace(oldSejourIds, newSejourIds);
    fs.writeFileSync(file, code);
    console.log("Patched getById sejourIds fallback.");
} else {
    console.log("Could not find the target string for getById sejourIds.");
}
