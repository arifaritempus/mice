const fs = require('fs');

const files = [
  "frontend/src/app/projects/[id]/AccommodationTabOptimized.tsx",
  "frontend/src/app/projects/[id]/DigerTab.tsx",
  "frontend/src/app/projects/[id]/OdemeTab.tsx",
  "frontend/src/app/projects/[id]/TahsilatTab.tsx",
  "frontend/src/app/projects/[id]/TransferTurTab.tsx",
  "frontend/src/app/projects/[id]/UcakBiletiTab.tsx"
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  if (lines[0].includes('import { usePermissions') && lines[1].includes('"use client";')) {
    const temp = lines[0];
    lines[0] = lines[1];
    lines[1] = temp;
    fs.writeFileSync(file, lines.join('\n'));
    console.log('Fixed', file);
  } else {
    console.log('Skipped', file);
  }
}
