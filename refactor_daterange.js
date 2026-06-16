const fs = require('fs');
const glob = require('glob');

const files = glob.sync('frontend/src/app/**/*.tsx');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('DateRangeFieldProps') && !content.includes('function DateRangeField')) {
    continue;
  }
  
  // If it already has the import, maybe skip or just clean up
  if (content.includes("import DateRangeField from '@/components/DateRangeField'")) {
    console.log("Already imported in:", file);
    continue;
  }

  const lines = content.split('\n');
  let newLines = [];
  let inRemoveBlock = false;
  let braceCount = 0;
  let foundFunction = false;
  
  // We want to add the import at the top after other imports
  let importAdded = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (!importAdded && line.startsWith('import ') && lines[i+1] && !lines[i+1].startsWith('import ')) {
       newLines.push(line);
       newLines.push("import DateRangeField from '@/components/DateRangeField';");
       importAdded = true;
       continue;
    }

    if (!inRemoveBlock && (line.includes('interface DateRangeFieldProps') || line.includes('function DateRangeField'))) {
      inRemoveBlock = true;
      foundFunction = line.includes('function DateRangeField');
    }

    if (inRemoveBlock) {
      if (!foundFunction && line.includes('function DateRangeField')) {
        foundFunction = true;
      }
      
      if (foundFunction) {
        // count braces
        for (const char of line) {
          if (char === '{') braceCount++;
          else if (char === '}') braceCount--;
        }
        
        // If we found the function, and braceCount goes back to 0, it's the end!
        if (braceCount === 0 && line.includes('}')) {
          inRemoveBlock = false;
          foundFunction = false; // reset
        }
      }
      continue; // Skip adding this line
    }

    newLines.push(line);
  }
  
  // some helper functions like parseTypedDate, toDate, toIsoDate might be left hanging if they were before the interface.
  // Actually, they are usually between interface and function. The above logic handles it because `inRemoveBlock` stays true until the end of the function!
  
  const finalContent = newLines.join('\n');
  if (finalContent !== content) {
    fs.writeFileSync(file, finalContent);
    console.log("Refactored:", file);
  }
}
