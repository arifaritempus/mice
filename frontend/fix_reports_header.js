const fs = require('fs');

let code = fs.readFileSync('src/app/reports/page.tsx', 'utf8');

// 1. Change the header text
code = code.replace(
  '<p className="text-xs text-slate-400 mt-1">Sistem verilerini analiz edin ve stratejik kararlar alın.</p>',
  '<p className="text-xs text-slate-400 mt-1">Sistem verilerinizi analiz edin</p>'
);

// 2. Extract filters from Unified Controls Bar
// We need everything from `{/* Presets */}` up to `</div>\n\n              {/* Table */}`
const startToken = '{/* Presets */}';
const endToken = '{/* Table */}';

let startIdx = code.indexOf(startToken);
let endIdx = code.indexOf(endToken);

if (startIdx !== -1 && endIdx !== -1) {
  // Wait, there is a `</div>\n            </div>\n          </div>` before `{/* Table */}`?
  // Let's check the exact structure.
  
  // The structure is:
  // <div className="flex flex-row items-center gap-4 flex-wrap lg:flex-nowrap">
  //   {/* Title Area */}
  //   ...
  //   {/* Presets */}
  //   ...
  //   {/* Buttons */}
  //   ...
  // </div>
  // </div>
  // <div className="overflow-auto ...">
  
  // Actually, I can use regex to match the Title Area and everything after it.
  const controlsBarRegex = /<div className="sticky top-\[-24px\] sm:top-\[-32px\] z-30 px-6 py-4 border-b border-white\/10 bg-\[#0f172a\]\/95 backdrop-blur-xl rounded-t-2xl shadow-lg">([\s\S]*?)<\/div>\n\s*<\/div>\n\s*(<div className="overflow-auto flex-1 min-h-0)/;
  
  const match = code.match(controlsBarRegex);
  if (match) {
    const fullBar = match[0];
    const innerContent = match[1];
    
    // Split into Title Area and Filters
    const presetsIdx = innerContent.indexOf('{/* Presets */}');
    const titleArea = innerContent.substring(0, presetsIdx);
    const filtersArea = innerContent.substring(presetsIdx);
    
    // Create new controls bar with only title area
    const newControlsBar = `<div className="sticky top-[-24px] sm:top-[-32px] z-30 px-6 py-4 border-b border-white/10 bg-[#0f172a]/95 backdrop-blur-xl rounded-t-2xl shadow-lg">
            <div className="flex flex-row items-center gap-4">
${titleArea.replace(' border-r border-white/10 pr-4', '')}            </div>
          </div>
          ${match[2]}`;
          
    // Replace old controls bar with new one
    code = code.replace(fullBar, newControlsBar);
    
    // Now insert the filtersArea into the Header Section
    const headerRegex = /\{\/\* Header Section \*\/\}[\s\S]*?<div className="flex items-center gap-4 mb-6">([\s\S]*?)<\/div>\n\s*<\/div>\n\s*\{\/\* Categories \*\/\}/;
    const headerMatch = code.match(headerRegex);
    
    if (headerMatch) {
      const oldHeader = headerMatch[0];
      const headerInner = headerMatch[1];
      
      const newHeader = `{/* Header Section */}
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 mb-6 shrink-0">
          <div className="flex items-center gap-4 mt-2">
${headerInner}          </div>
          
          <div className="flex flex-wrap items-center justify-end gap-3 flex-1">
            ${filtersArea.trim().replace(/flex-\[2\] min-w-\[300px\] max-w-lg/g, 'flex-1 min-w-[300px]')}
          </div>
        </div>

        {/* Categories */}`;
        
      code = code.replace(oldHeader, newHeader);
    } else {
      console.log('Header not found!');
    }
  } else {
    console.log('Controls bar not found!');
  }
}

fs.writeFileSync('src/app/reports/page.tsx', code, 'utf8');
console.log('Moved filters to header');
