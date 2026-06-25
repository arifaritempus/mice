const fs = require('fs');

// 1. Fix MultiTokenFilterInput.tsx
let multiTokenCode = fs.readFileSync('src/components/MultiTokenFilterInput.tsx', 'utf8');

if (!multiTokenCode.includes('placeholder?: string')) {
  multiTokenCode = multiTokenCode.replace(
    'label: string;',
    'label?: string;\n  placeholder?: string;'
  );
  
  multiTokenCode = multiTokenCode.replace(
    'label,',
    'label,\n  placeholder,'
  );

  multiTokenCode = multiTokenCode.replace(
    '<label className="block text-[10px] font-semibold tracking-wider text-slate-400 mb-1.5 uppercase ml-1">{label}</label>',
    '{label && <label className="block text-[10px] font-semibold tracking-wider text-slate-400 mb-1.5 uppercase ml-1">{label}</label>}'
  );

  multiTokenCode = multiTokenCode.replace(
    '<input',
    '<input\n          placeholder={placeholder}'
  );
  
  fs.writeFileSync('src/components/MultiTokenFilterInput.tsx', multiTokenCode, 'utf8');
}

// 2. Fix reports/page.tsx Layout & Props
let reportsCode = fs.readFileSync('src/app/reports/page.tsx', 'utf8');

// Fix Main Wrapper to enforce scrolling
const oldWrapper = `<div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">\n      <div className="flex-1 p-4 lg:p-8 space-y-6 max-w-[1920px] mx-auto w-full flex flex-col min-h-0">`;
const newWrapper = `<div className="h-[calc(100vh-2rem)] flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 lg:p-8 max-w-[1920px] mx-auto w-full overflow-hidden transition-colors duration-300">`;
if (reportsCode.includes(oldWrapper)) {
  reportsCode = reportsCode.replace(oldWrapper, newWrapper);
} else {
  // If the exact match fails, let's try a regex for the first wrapper
  const wrapperRegex = /<div className="flex flex-col min-h-screen[^>]*>\s*<div className="flex-1 p-4[^>]*>/;
  reportsCode = reportsCode.replace(wrapperRegex, newWrapper);
}

// Remove the extra closing </div> at the end because we merged two wrappers into one!
// We'll just remove the second to last </div>
const lastDivIndex = reportsCode.lastIndexOf('</div>');
if (lastDivIndex !== -1) {
  const secondLastDivIndex = reportsCode.lastIndexOf('</div>', lastDivIndex - 1);
  if (secondLastDivIndex !== -1 && reportsCode.includes(oldWrapper)) { // Only if we successfully matched and replaced the oldWrapper
     // Wait, if I replace the wrapper regex, I should remove one closing div.
     // Let's do it safer: I will replace `  return (\n    <div className="flex flex-col min-h-screen` ...
  }
}

// Actually, merging the wrappers might break the closing tags if I just delete one. 
// Instead, let's just make the top wrapper h-screen overflow-hidden:
const simpleOldWrapper = `<div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">`;
const simpleNewWrapper = `<div className="h-[calc(100vh-2rem)] overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">`;
reportsCode = reportsCode.replace(simpleOldWrapper, simpleNewWrapper);

// Fix MultiTokenFilterInput prop
reportsCode = reportsCode.replace('label="Arama"', 'label="" placeholder="Arama..."');

// Fix Yenile Button Icon (use funnel icon)
const oldYenileIcon = `<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>`;
const newYenileIcon = `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>`;
// The icon is already funnel. But wait, in the screenshot the button is very narrow!
// "className="h-full w-10 flex items-center justify-center..."
// Wait, the user said "en sağdaki yenile butonunu filtre temizle ikonu yapalım diğer sayfalarda kullandığımız gibi"
// The old code had `<RotateCcw size={14} />` or a funnel. Let's use RotateCcw.
const rotateCcwIcon = `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3v5h5"></path></svg>`;
reportsCode = reportsCode.replace(oldYenileIcon, rotateCcwIcon);

fs.writeFileSync('src/app/reports/page.tsx', reportsCode, 'utf8');
console.log('Fixed MultiTokenFilterInput and Reports Layout!');
