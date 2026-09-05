const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const labelsRe = /if \(m\.type === "otel"\) \{ options = projectHotels; label = "Otel Adı"; \}/m;

const newLabels = `if (m.type === "otel") { options = projectHotels; label = "Otel Adı"; }
                  if (m.type === "havayolu") { label = "Havayolu"; }
                  if (m.type === "arac") { label = "Araç Tipi"; }
                  if (m.type === "tedarikci") { label = "Tedarikçi"; }`;

code = code.replace(labelsRe, newLabels);

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Success added labels to wizard!");
