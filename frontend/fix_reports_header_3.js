const fs = require('fs');
let code = fs.readFileSync('src/app/reports/page.tsx', 'utf8');

// 1. Fix the min-h-0 issue on line 592
// Old: <div className="w-full min-w-0 flex-1 flex flex-col">
// New: <div className="w-full min-w-0 min-h-0 flex-1 flex flex-col">
code = code.replace(
  '<div className="w-full min-w-0 flex-1 flex flex-col">',
  '<div className="w-full min-w-0 min-h-0 flex-1 flex flex-col">'
);

// 2. Extract the filters (from Presets up to Buttons)
// Let's use exact indexOf for safety.
const presetsStr = '{/* Presets */}';
const tableAreaStr = '{/* Table Area */}';

const presetsIdx = code.indexOf(presetsStr);
const tableAreaIdx = code.indexOf(tableAreaStr);

if (presetsIdx !== -1 && tableAreaIdx !== -1) {
  // Extract everything from Presets to the end of the controls bar
  // The controls bar ends right before tableAreaStr
  // We need to carefully find the end of the controls bar.
  // It ends with:
  //               </div>
  //             </div>
  //           </div>
  //
  //           {/* Table Area */}
  
  // Let's extract from Presets to Table Area
  const block = code.substring(presetsIdx, tableAreaIdx);
  
  // Actually, the block ends with the closing tags of the controls bar.
  // Let's just find the last </div> before tableAreaStr.
  const buttonsEndIdx = block.lastIndexOf('</div>\n            </div>\n          </div>');
  
  let filtersBlock = block.substring(0, buttonsEndIdx);
  
  // Let's remove the flex-[2] min-w-[300px] max-w-lg from search to make it fit header better
  filtersBlock = filtersBlock.replace(/flex-\[2\] min-w-\[300px\] max-w-lg/g, 'flex-1 min-w-[300px]');
  
  // We remove this filtersBlock from the controls bar
  code = code.substring(0, presetsIdx) + '\n            </div>\n          </div>\n\n          ' + code.substring(tableAreaIdx);
  
  // Now we need to insert the filtersBlock into the Header Section
  const headerStr = '{/* Header Section */}';
  const categoriesStr = '{/* Categories */}';
  
  const headerIdx = code.indexOf(headerStr);
  const categoriesIdx = code.indexOf(categoriesStr);
  
  if (headerIdx !== -1 && categoriesIdx !== -1) {
    const headerBlock = code.substring(headerIdx, categoriesIdx);
    
    // The old header block looks like:
    // {/* Header Section */}
    // <div className="flex items-center gap-4 mb-6">
    //   <div className="...">...</div>
    //   <div className="space-y-0.5">
    //     <h1 className="...">Rapor Merkezi</h1>
    //     <p className="...">Sistem verilerinizi analiz edin</p>
    //   </div>
    // </div>
    
    // We want to replace it with:
    const innerHeaderRegex = /<div className="flex items-center gap-4 mb-6">([\s\S]*?)<\/div>\n\n\s*$/m;
    
    const newHeaderBlock = `{/* Header Section */}
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 mb-6 shrink-0">
          <div className="flex items-center gap-4 mt-2 shrink-0">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-blue-400 shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-light tracking-wide text-white glow-text">Rapor Merkezi</h1>
              <p className="text-xs text-slate-400 mt-1">Sistem verilerinizi analiz edin</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-end gap-3 flex-1">
            ${filtersBlock}
          </div>
        </div>

        `;
        
    code = code.substring(0, headerIdx) + newHeaderBlock + code.substring(categoriesIdx);
  }
}

// Ensure the table area has min-h-0 as well to be completely safe with scroll
code = code.replace(
  '<div className="w-full relative rounded-b-2xl overflow-auto custom-scrollbar flex-1">',
  '<div className="w-full relative rounded-b-2xl overflow-auto custom-scrollbar flex-1 min-h-0">'
);

// We need to make sure the controls bar title area doesn't have border-r if it's the only thing left
code = code.replace(
  '<div className="flex items-center gap-2 shrink-0 border-r border-white/10 pr-4 h-10">',
  '<div className="flex items-center gap-2 shrink-0 h-10">'
);

fs.writeFileSync('src/app/reports/page.tsx', code, 'utf8');
console.log('Fixed reports header and scroll natively');
