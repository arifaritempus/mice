const fs = require('fs');
const path = '/Users/arifari/Desktop/TT_Sistem_AG kopyası/frontend/src/app/projects/[id]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// The replacements we need to make for each line where the wordmark is added
// We know the line numbers for mergeCells, and the wordmark is added shortly after.
// Let's use a regex to find `mergeCells("A1:([A-Z])1")` and the subsequent `wordmarkId` addition.

let newContent = content;
const regex = /sheet\.mergeCells\("A1:([A-Z])1"\);[\s\S]*?wordmarkId,\s*\{\s*tl:\s*\{\s*nativeCol:\s*\d+,\s*nativeColOff:\s*\d+,\s*nativeRow:\s*0,\s*nativeRowOff:\s*\d+\s*\}/g;

newContent = newContent.replace(regex, (match, lastColStr) => {
    // Calculate nativeCol and nativeColOff based on lastColStr
    const charCode = lastColStr.charCodeAt(0);
    const lastColIndex = charCode - 65; // A=0, B=1, ... H=7, I=8, J=9, T=19
    
    // We want to anchor to the column BEFORE the last column, to have enough room for the offset.
    const anchorCol = lastColIndex - 1;
    
    // A safe offset would be 1,750,000 EMUs (~184 pixels) if the anchor column is wide.
    // Actually, to be safe, why don't we just anchor to lastColIndex, but with a NEGATIVE offset?
    // Wait, ExcelJS nativeColOff must be positive.
    // If we anchor to lastColIndex, and lastCol is very narrow, it spills out.
    // Let's just use anchorCol = lastColIndex - 1, and nativeColOff = 1800000.
    
    let nativeColOff = 1800000;
    
    return match.replace(/tl:\s*\{\s*nativeCol:\s*\d+,\s*nativeColOff:\s*\d+/, `tl: { nativeCol: ${anchorCol}, nativeColOff: ${nativeColOff}`);
});

fs.writeFileSync(path, newContent, 'utf8');
console.log('Fixed dynamic logos in page.tsx');
