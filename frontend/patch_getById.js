const fs = require('fs');
const file = 'src/lib/supabaseService.ts';
let code = fs.readFileSync(file, 'utf8');

const oldProjectObj = `        const projectObj = source?.project_id ? projectsMap[source.project_id] : (source?.sejour_id ? sejoursMap[source.sejour_id] : null);`;

const newProjectObj = `        const projectObj = source?.project_id ? projectsMap[source.project_id] : (source?.sejour_id ? sejoursMap[source.sejour_id] : (sejoursMap[ii.item_id] || projectsMap[ii.item_id] || null));`;

if (code.includes(oldProjectObj)) {
    code = code.replace(oldProjectObj, newProjectObj);
    fs.writeFileSync(file, code);
    console.log("Patched getById projectObj fallback.");
} else {
    console.log("Could not find the target string for getById.");
}
