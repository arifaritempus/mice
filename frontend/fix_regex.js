const fs = require('fs');
const path = 'src/app/projects/[id]/page.tsx';

let content = fs.readFileSync(path, 'utf8');

const buggyRegex = /\/\\^\[0-9a-f\]\{8\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{12\}\$\/i/g;
const correctRegex = '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';

// Wait, string replacement is safer.
const buggyStr = "/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i";

let count = 0;
while (content.includes(buggyStr)) {
  content = content.replace(buggyStr, correctRegex);
  count++;
}

fs.writeFileSync(path, content, 'utf8');
console.log(`Replaced ${count} occurrences of the buggy regex.`);
