const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/page.tsx', 'utf8');

const target1 = `                  handleAccommodationCopy={handleAccommodationCopy}
                  formatDateAccommodation={formatDateAccommodation}`;
const replacement1 = `                  handleAccommodationCopy={handleAccommodationCopy}
                  handleAccommodationReorder={handleAccommodationReorder}
                  formatDateAccommodation={formatDateAccommodation}`;

if (code.includes(target1)) {
    code = code.replace(target1, replacement1);
    fs.writeFileSync('src/app/projects/[id]/page.tsx', code);
    console.log("Passed handleAccommodationReorder prop");
} else {
    console.log("Could not find target1");
}
