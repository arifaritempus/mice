const fs = require('fs');

const files = [
  'page.tsx',
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
  let lines = content.split('\n');
  
  let lastMergeColStr = 'I';
  
  for (let i = 0; i < lines.length; i++) {
    const mergeMatch = lines[i].match(/mergeCells\(['"]A1:([A-Z])1['"]\)/);
    if (mergeMatch) {
      lastMergeColStr = mergeMatch[1];
    }
    
    if (lines[i].includes('nativeColOff: 2300000')) {
      const charCode = lastMergeColStr.charCodeAt(0);
      const lastColIndex = charCode - 65; // A=0, B=1, ...
      const anchorCol = lastColIndex - 1;
      
      lines[i] = lines[i].replace(/nativeCol:\s*\d+/, `nativeCol: ${anchorCol}`);
      lines[i] = lines[i].replace(/nativeColOff:\s*2300000/, `nativeColOff: 1800000`);
    }
  }
  
  fs.writeFileSync(path, lines.join('\n'), 'utf8');
});

console.log('Fixed dynamic logos in all files with robust tracking');
