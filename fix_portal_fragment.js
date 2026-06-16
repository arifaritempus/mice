const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // I need to find the createPortal call
  content = content.replace(
    /createPortal\(\s*<div className="fixed inset-0 z-\[9998\]/g,
    'createPortal(\n          <>\n            <div className="fixed inset-0 z-[9998]'
  );

  content = content.replace(
    /className="w-full mt-4 py-3 bg-blue-600 text-white font-bold rounded-xl sm:hidden">Tamam<\/button>\n          <\/div>,/g,
    'className="w-full mt-4 py-3 bg-blue-600 text-white font-bold rounded-xl sm:hidden">Tamam</button>\n          </div>\n          </>,'
  );

  fs.writeFileSync(filePath, content);
  console.log('Fixed fragment in', filePath);
}

fixFile('frontend/src/app/operations/tickets/page.tsx');
fixFile('frontend/src/app/operations/transfers/page.tsx');
fixFile('frontend/src/app/operations/guides/page.tsx');
fixFile('frontend/src/app/operations/part-time/page.tsx');
