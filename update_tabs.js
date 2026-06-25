const fs = require('fs');

function processTab(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Wrap header
  // Note: we replace `<div className="bg-gray-100 ... hidden md:flex ..."`
  content = content.replace(
    /(<div className="bg-gray-100[^"]+hidden md:flex[^"]+">)/,
    "      {/* Tablo Yatay Kaydırma Sarmalayıcısı */}\n      <div className=\"overflow-x-auto custom-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0\">\n        <div className=\"min-w-max md:min-w-full\">\n          $1"
  );
  // remove hidden md:flex from that header
  content = content.replace(
    /({?\/\* Tablo Yatay Kaydırma Sarmalayıcısı \*\/}?\s*<div[^>]+>\s*<div[^>]+>\s*<div[^>]+)hidden md:flex/g,
    "$1flex"
  );

  // Close the wrapper at the very end before the last closing tags
  // Usually ends with:
  //       </div>
  //     </div>
  //   );
  // }
  
  // Actually, we can just replace the last closing tags
  content = content.replace(
    /(\s*)<\/div>\n(\s*)<\/div>\n(\s*)\);\n\}\s*$/,
    "$1</div>\n$1</div>\n$1</div>\n$2</div>\n$3);\n}"
  );

  // Change flex-wrap to flex-nowrap in items and subtotals
  // Be careful not to replace it everywhere, but since it's a grid, it's fine.
  content = content.replace(/flex flex-wrap md:flex-nowrap/g, "flex flex-nowrap");
  
  fs.writeFileSync(filePath, content);
  console.log('Updated ' + filePath);
}

processTab('frontend/src/app/projects/[id]/PurchaseTab.tsx');
processTab('frontend/src/app/projects/[id]/KarZararTab.tsx');
