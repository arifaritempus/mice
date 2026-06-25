const fs = require('fs');

let file = 'src/components/accounting/InvoiceItemTable.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update table paddings in TH
content = content.replace(/px-4 py-3/g, 'px-2.5 py-2.5');

// Update hover states for TR
content = content.replace(
  /'hover:bg-gray-50 dark:hover:bg-gray-700\/40'/,
  "'hover:bg-blue-500/10 transition-colors group border-b border-white/5 last:border-0'"
);

// Add double click handling if the parent supports it. The parent pending page does not have a router for details, but it uses toggleRow for selection.
// We can just keep toggleRow on onClick.

fs.writeFileSync(file, content, 'utf8');
