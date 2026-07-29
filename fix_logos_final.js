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
  let newContent = content;

  // Replace left logo (iconId)
  // It looks like:
  // sheet.addImage(iconId, { ... });
  // or worksheet.addImage(iconId, { ... });
  
  newContent = newContent.replace(/(worksheet|sheet)\.addImage\(iconId,\s*\{[\s\S]*?\}\s*\);/g, `$1.addImage(iconId, {
          tl: { col: 0.05, row: 0.1 },
          ext: { width: 85, height: 85 },
        });`);

  // For right logo (wordmarkId), we need to know the last mergeCells A1:[A-Z]1 before it.
  // We can do this by splitting the file by `wordmarkId, {` and looking at the chunk before it.
  
  const chunks = newContent.split(/(worksheet|sheet)\.addImage\(wordmarkId,\s*\{/);
  
  if (chunks.length > 1) {
    let result = chunks[0];
    
    // chunks[1] is the group (worksheet|sheet), chunks[2] is the rest, chunks[3] is the group, etc.
    // because split with a regex with capture group includes the capture group in the results.
    
    for (let i = 1; i < chunks.length; i += 2) {
      const sheetVar = chunks[i];
      const rest = chunks[i+1];
      
      // Look back in `result` for the last `mergeCells("A1:X1")`
      const mergeMatches = [...result.matchAll(/mergeCells\(['"]A1:([A-Z])1['"]\)/g)];
      let lastColStr = 'H'; // fallback
      if (mergeMatches.length > 0) {
        lastColStr = mergeMatches[mergeMatches.length - 1][1];
      }
      
      const charCode = lastColStr.charCodeAt(0);
      const lastColIndex = charCode - 65;
      const anchorCol = lastColIndex - 1;
      
      // Now find the end of the config object `});`
      const endIdx = rest.indexOf('});');
      const afterRest = rest.substring(endIdx + 3);
      
      const newConfig = `
          tl: { nativeCol: ${anchorCol}, nativeColOff: 1800000, nativeRow: 0, nativeRowOff: 90000 },
          ext: { width: 85, height: 85 },
        });`;
        
      result += sheetVar + '.addImage(wordmarkId, {' + newConfig + afterRest;
    }
    
    newContent = result;
  }

  fs.writeFileSync(path, newContent, 'utf8');
});

console.log('Fixed dynamic logos in all files perfectly');
