const fs = require('fs');
let pageContent = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

const regex = /\{\/\* ROW 5: OPERATIONAL FLOW \*\/\}[\s\S]*?\{\/\* HR \*\/\}[\s\S]*?\{\/\* Operational Flow \*\/\}\n\s*<div className="xl:col-span-8 flex flex-col">/m;

const newRow5 = `{/* ROW 5: OPERATIONAL FLOW */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 relative z-10">
          {/* Operational Flow */}
          <div className="xl:col-span-12 flex flex-col">`;

pageContent = pageContent.replace(regex, newRow5);

fs.writeFileSync('src/app/dashboard/page.tsx', pageContent);
console.log("Removed HR chart and expanded Operational Flow.");
