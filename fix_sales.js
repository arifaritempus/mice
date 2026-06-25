const fs = require('fs');
let file = 'frontend/src/app/projects/[id]/SalesTab.tsx';
let content = fs.readFileSync(file, 'utf8');

// Header replacement
content = content.replace(
  '      {/* Başlık satırı */}\n      <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 hidden md:flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200">',
  '      {/* Tablo Yatay Kaydırma Sarmalayıcısı */}\n      <div className="overflow-x-auto custom-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0">\n        <div className="min-w-max md:min-w-full">\n          {/* Başlık satırı */}\n          <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200">'
);

// End wrapper replacement
content = content.replace(
  '      </div>\n    </div>\n  );\n}',
  '        </div>\n      </div>\n      </div>\n    </div>\n  );\n}'
);

// Replace flex-wrap
content = content.replace(/flex flex-wrap md:flex-nowrap/g, 'flex flex-nowrap');

fs.writeFileSync(file, content);
console.log('Fixed SalesTab');
