const fs = require('fs');

const file = 'frontend/src/app/tickets/options/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// The original gridTemplateColumns was: '2fr 2fr 1.2fr 1.8fr 1.8fr 1.2fr 1.2fr auto'
// I need to find the added grid class and apply this tailwind class
content = content.replace(
  /className="grid w-full items-end gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-\[.*?\]"/,
  'className="grid w-full items-end gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[2fr_2fr_1.2fr_1.8fr_1.8fr_1.2fr_1.2fr_auto]"'
);

fs.writeFileSync(file, content);
console.log("Fixed tickets options grid");
