const fs = require('fs');
let code = fs.readFileSync('src/app/suppliers/service-types/page.tsx', 'utf8');

// 1. Fix Search and Filter Logic (Replacing line 383)
code = code.replace(
  /const sortedServiceTypes = sortServiceTypes\(serviceTypes\);\s*const paginatedServiceTypes = paginateItems\(\s*sortedServiceTypes,\s*page,\s*pageSize,\s*\);/,
  `const filteredServiceTypes = searchAndFilterServiceTypes(serviceTypes);
  const sortedServiceTypes = sortServiceTypes(filteredServiceTypes);
  const paginatedServiceTypes = paginateItems(
    sortedServiceTypes,
    page,
    pageSize,
  );`
);

// 2. Add Excel Export function if it doesn't exist
const excelFunc = `
  const exportToExcel = () => {
    // Basic CSV export for now
    const headers = ['Tür Adı', 'Kod', 'Açıklama', 'Notlar', 'Gider Kodu', 'Gider KDV', 'Gider KDV Oranı', 'Gelir Kodu', 'Gelir KDV', 'Gelir KDV Oranı', 'Durum'];
    
    const sortedData = sortServiceTypes(searchAndFilterServiceTypes(serviceTypes));
    
    const rows = sortedData.map(st => [
      st.name,
      st.code,
      st.description || '',
      st.notes || '',
      st.expense_accounting_code || '',
      st.expense_vat_code || '',
      st.expense_vat_rate || 0,
      st.revenue_accounting_code || '',
      st.revenue_vat_code || '',
      st.revenue_vat_rate || 0,
      st.is_active ? 'Aktif' : 'Pasif'
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(e => e.map(cell => \`"\${String(cell).replace(/"/g, '""')}"\`).join(';'))
    ].join('\\n');

    const blob = new Blob(['\\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', \`hizmet_turleri_\${new Date().toISOString().split('T')[0]}.csv\`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
`;
if (!code.includes('exportToExcel')) {
  code = code.replace(
    'const loadServiceTypes = async () => {',
    excelFunc + '\n  const loadServiceTypes = async () => {'
  );
}

// 3. Add Excel Export button to UI
const actionDividerRegex = /\{\/\* Actions Divider \*\/\}\s*<div className="w-px h-6 bg-white\/10 shrink-0 mx-1 hidden sm:block"><\/div>/;
const excelButton = `
            {/* Actions Divider */}
            <div className="w-px h-6 bg-white/10 shrink-0 mx-1 hidden sm:block"></div>

            <button onClick={exportToExcel} className="h-10 bg-[#0f172a]/40 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/30 py-2 px-4 rounded-xl shadow-sm text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              EXCEL
            </button>`;
code = code.replace(actionDividerRegex, excelButton);

// 4. Fix "İptal" button in Modals
code = code.replace(
  /className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors duration-200"/g,
  'className="px-4 py-2 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 hover:text-white transition-colors duration-200"'
);

// Fallback for differently styled cancel buttons
code = code.replace(
  /className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"/g,
  'className="px-4 py-2 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 hover:text-white transition-colors duration-200"'
);

code = code.replace(
  /className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"/g,
  'className="px-4 py-2 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 hover:text-white transition-colors duration-200"'
);

fs.writeFileSync('src/app/suppliers/service-types/page.tsx', code, 'utf8');
