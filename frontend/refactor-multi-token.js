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

  // Add import if not exists
  if (!content.includes("import MultiTokenFilterInput")) {
    // Add right after first import or 'use client'
    content = content.replace(/(['"]use client['"];?)/, "$1\nimport MultiTokenFilterInput from '@/components/MultiTokenFilterInput';");
  }

  // Regex to remove interface MultiTokenFilterInputProps { ... }
  const interfaceRegex = /interface\s+MultiTokenFilterInputProps\s*{[^}]*}/s;
  content = content.replace(interfaceRegex, '');

  // Regex to remove function MultiTokenFilterInput(...) { ... }
  // This is trickier because it contains nested braces. 
  // Let's use string manipulation based on "function MultiTokenFilterInput" and finding the matching closing brace.
  
  let funcStart = content.indexOf('function MultiTokenFilterInput');
  if (funcStart !== -1) {
    let braceCount = 0;
    let funcEnd = -1;
    let started = false;
    for (let i = funcStart; i < content.length; i++) {
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
      content = content.slice(0, funcStart) + content.slice(funcEnd + 1);
    }
  }

  fs.writeFileSync(filePath, content);
  console.log("Updated", relPath);
}
