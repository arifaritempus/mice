const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  "src/app/operations/guides/page.tsx",
  "src/app/operations/part-time/page.tsx",
  "src/app/operations/tickets/page.tsx",
  "src/app/operations/transfers/page.tsx",
  "src/app/projects/page.tsx",
  "src/app/quotes/page.tsx",
  "src/app/sejour/page.tsx",
  "src/app/sejour/services/page.tsx",
  "src/app/tickets/options/page.tsx"
];

for (const relPath of filesToUpdate) {
  const filePath = path.join("/Users/arifari/Desktop/TT_Sistem_AG kopyası/frontend", relPath);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // Look for the broken function signature start
  let funcStart = content.indexOf(': MultiTokenFilterInputProps');
  if (funcStart !== -1) {
    // Find the opening brace of the function body
    let braceStart = content.indexOf('{', funcStart);
    if (braceStart !== -1) {
      let braceCount = 0;
      let funcEnd = -1;
      let started = false;
      for (let i = braceStart; i < content.length; i++) {
        if (content[i] === '{') {
          braceCount++;
          started = true;
        } else if (content[i] === '}') {
          braceCount--;
          if (started && braceCount === 0) {
            funcEnd = i;
            break;
          }
        }
      }
      
      if (funcEnd !== -1) {
        // Find beginning of the line where : MultiTokenFilterInputProps is
        let lineStart = funcStart;
        while (lineStart > 0 && content[lineStart - 1] !== '\n') {
          lineStart--;
        }
        content = content.slice(0, lineStart) + content.slice(funcEnd + 1);
        fs.writeFileSync(filePath, content);
        console.log("Fixed", relPath);
      }
    }
  }
}
