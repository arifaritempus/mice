const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/operations/guides/page.tsx', 'utf8');

// Replace C-IN / C-OUT header
content = content.replace(
  /<th \n                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"\n                    onClick=\{.*?\}\n                  >\n                    <div className="flex items-center">\n                      C-IN \/ C-OUT\n.*?<\/div>\n                  <\/th>/s,
  `<th 
    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 w-[6.25rem] min-w-[6.25rem] max-w-[6.25rem] align-top"
    onClick={() => handleSort('check_in_date')}
  >
    <div className="flex items-center gap-0.5">
      <div className="flex flex-col items-start leading-tight gap-0">
        <span className="text-xs tracking-wide">C-IN</span>
        <span className="text-xs tracking-wide">C-OUT</span>
      </div>
      {sortField === 'check_in_date' && (
        <svg className={\`shrink-0 self-center h-3 w-3 \${sortDirection === 'asc' ? 'rotate-180' : ''}\`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      )}
    </div>
  </th>`
);

// Replace Acente/Müşteri header
content = content.replace(
  /<th \n                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"\n                    onClick=\{.*?\}\n                  >\n                    <div className="flex items-center">\n                      Acente\/Müşteri\n.*?<\/div>\n                  <\/th>/s,
  `<th 
    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 w-[11rem] min-w-[11rem] max-w-[11rem] align-top"
    onClick={() => handleSort('customer_name')}
  >
    <div className="flex items-center gap-0.5">
      <div className="flex flex-col items-start leading-tight gap-0">
        <span className="text-xs tracking-wide">ACENTE</span>
        <span className="text-xs tracking-wide">MÜŞTERİ</span>
      </div>
      {sortField === 'customer_name' && (
        <svg className={\`shrink-0 self-center h-3 w-3 \${sortDirection === 'asc' ? 'rotate-180' : ''}\`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      )}
    </div>
  </th>`
);

fs.writeFileSync('frontend/src/app/operations/guides/page.tsx', content);
console.log('Guides table patched.');
