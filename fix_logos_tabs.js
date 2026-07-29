const fs = require('fs');
const glob = require('glob'); // Not available? We can just array it.

const files = [
  'DigerTab.tsx',
  'OdemeTab.tsx',
  'TransferTurTab.tsx',
  'TransferTurTab.tsx.refactored',
  'TahsilatTab.tsx',
  'AccommodationTab.tsx',
  'AccommodationTabSimple.tsx'
];

files.forEach(file => {
  const path = `/Users/arifari/Desktop/TT_Sistem_AG kopyası/frontend/src/app/projects/[id]/${file}`;
  if (!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');

  // Replace left logo
  content = content.replace(/tl:\s*\{\s*col:\s*0\.1,\s*row:\s*0\.1\s*\},\s*ext:\s*\{\s*width:\s*inchToPx\(1\.25\),\s*height:\s*inchToPx\(0\.7\)\s*\}/g, 'tl: { col: 0.05, row: 0.1 },\n            ext: { width: 85, height: 85 }');

  // Replace right logo (which uses 7.4)
  content = content.replace(/tl:\s*\{\s*col:\s*7\.4,\s*row:\s*0\.15\s*\},\s*ext:\s*\{\s*width:\s*180,\s*height:\s*45\s*\}/g, 'tl: { nativeCol: 8, nativeColOff: 2300000, nativeRow: 0, nativeRowOff: 90000 },\n            ext: { width: 85, height: 85 }');

  fs.writeFileSync(path, content, 'utf8');
});
console.log('Fixed logos in all tabs');
