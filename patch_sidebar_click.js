const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/Sidebar.tsx', 'utf8');

// The main menu Link
content = content.replace(
  /<Link\n            href=\{item\.href \|\| '#'\}/g,
  '<Link\n            onClick={() => setIsMobileOpen(false)}\n            href={item.href || \'#\'}'
);

// The logo Link
content = content.replace(
  /onClick=\{\(\) => \{\n              if \(pathname === '\/'\) window\.location\.reload\(\);\n            \}\}/g,
  'onClick={() => {\n              setIsMobileOpen(false);\n              if (pathname === \'/\') window.location.reload();\n            }}'
);

fs.writeFileSync('frontend/src/components/Sidebar.tsx', content);
console.log('Sidebar link click patched.');
