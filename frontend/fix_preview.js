const fs = require('fs');
let file = 'src/components/accounting/CompletedInvoicePreview.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix Customer Info Box background and text colors to be explicitly light
content = content.replace(
  'className="bg-slate-50 p-4 rounded-md border border-slate-200 mb-8 text-[11px] text-slate-900"',
  'className="p-4 rounded-md border border-slate-200 mb-8 text-[11px]" style={{ backgroundColor: "#f8fafc", color: "#0f172a" }}'
);

// Fix category grouping to hide item.description and show sub_category_name
content = content.replace(
  /\{item\.description \|\| '-'\}/g,
  "{item.sub_category_name || '-'}"
);

content = content.replace(
  /\{item\.sub_category_name && \([\s\S]*?\)\}/g,
  ""
);

// Add "DÜZENLEYEN" at the bottom right, next to or below the Proforma Note
content = content.replace(
  '<div className="mt-12 text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-200 pt-4 pb-2">',
  `<div className="mt-8 flex justify-between items-end">
              <div className="flex flex-col text-[10px] uppercase">
                <span className="font-bold text-slate-500 mb-1">DÜZENLEYEN</span>
                <span className="font-black text-slate-900">{companyName}</span>
                {companyPhone && <span className="font-medium text-slate-700">{companyPhone}</span>}
              </div>
            </div>
            <div className="mt-8 text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-200 pt-4 pb-2">`
);

fs.writeFileSync(file, content, 'utf8');
