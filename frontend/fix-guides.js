const fs = require('fs');
const filePath = '/Users/arifari/Desktop/TT_Sistem_AG kopyası/frontend/src/app/operations/guides/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

let matchIdx = content.indexOf(') {\n  const inputRef =');
if (matchIdx !== -1) {
    let braceCount = 0;
    let started = false;
    let endIdx = -1;
    for (let i = matchIdx; i < content.length; i++) {
        if (content[i] === '{') {
            braceCount++;
            started = true;
        } else if (content[i] === '}') {
            braceCount--;
            if (started && braceCount === 0) {
                endIdx = i;
                break;
            }
        }
    }
    if (endIdx !== -1) {
        content = content.slice(0, matchIdx) + content.slice(endIdx + 1);
        fs.writeFileSync(filePath, content);
        console.log("Fixed guides!");
    }
}
