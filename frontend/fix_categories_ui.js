const fs = require('fs');

let code = fs.readFileSync('src/app/categories/page.tsx', 'utf8');

// 1. Add moveMainCategoryUp and moveMainCategoryDown
const newFunctions = `
  const moveMainCategoryUp = async (categoryId: string) => {
    const mainCategories = categories
      .filter((cat) => !cat.parent_id)
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
    const currentIndex = mainCategories.findIndex(c => c.id === categoryId);
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const reordered = Array.from(mainCategories);
      const [moved] = reordered.splice(currentIndex, 1);
      reordered.splice(newIndex, 0, moved);
      
      try {
        setLoading(true);
        for (let i = 0; i < reordered.length; i++) {
          await categoriesService.update(reordered[i].id, { sort_order: i + 1 } as any);
        }
        setSuccess('Ana kategori sırası güncellendi');
      } catch (err) {
        setError('Sıralama güncellenirken hata oluştu');
      } finally {
        await loadCategories();
      }
    }
  };

  const moveMainCategoryDown = async (categoryId: string) => {
    const mainCategories = categories
      .filter((cat) => !cat.parent_id)
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
    const currentIndex = mainCategories.findIndex(c => c.id === categoryId);
    if (currentIndex < mainCategories.length - 1) {
      const newIndex = currentIndex + 1;
      const reordered = Array.from(mainCategories);
      const [moved] = reordered.splice(currentIndex, 1);
      reordered.splice(newIndex, 0, moved);
      
      try {
        setLoading(true);
        for (let i = 0; i < reordered.length; i++) {
          await categoriesService.update(reordered[i].id, { sort_order: i + 1 } as any);
        }
        setSuccess('Ana kategori sırası güncellendi');
      } catch (err) {
        setError('Sıralama güncellenirken hata oluştu');
      } finally {
        await loadCategories();
      }
    }
  };
`;

if (!code.includes('moveMainCategoryUp')) {
  code = code.replace(
    '  // Excel Export Fonksiyonu',
    newFunctions + '\n  // Excel Export Fonksiyonu'
  );
}

// 2. Fix Subcategory Double Click
// Find the exact className and replace it
code = code.replace(
  /className="flex items-center justify-between p-3 bg-\[#0f172a\]\/40 border border-white\/5 rounded-xl hover:bg-white\/10 transition-all duration-200 group"/g,
  'className="flex items-center justify-between p-3 bg-[#0f172a]/40 border border-white/5 rounded-xl hover:bg-blue-500/10 cursor-pointer transition-all duration-200 group" onDoubleClick={() => { setSelectedCategory(subCategory); setShowEditModal(true); }}'
);

// 3. Subcategory Toggle Active
const subCatStatusRegex = /<span\s+className={`inline-flex px-2 py-0\.5 text-\[10px\] font-semibold rounded-full border \${\s+subCategory\.is_active\s+\?\s+"bg-emerald-500\/10 text-emerald-400 border-emerald-500\/20"\s+:\s+"bg-red-500\/10 text-red-400 border-red-500\/20"\s+}\s*`}\s*>\s*\{subCategory\.is_active \? "Aktif" : "Pasif"\}\s*<\/span>/;
const subCatStatusNew = `<button
                              onClick={(e) => { e.stopPropagation(); handleToggleActive(subCategory.id, subCategory.is_active || false); }}
                              className={\`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full border cursor-pointer hover:opacity-80 transition-opacity \${
                                subCategory.is_active
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-red-500/10 text-red-400 border-red-500/20"
                              }\`}
                              title="Durumu Değiştir"
                            >
                              {subCategory.is_active ? "Aktif" : "Pasif"}
                            </button>`;
code = code.replace(subCatStatusRegex, subCatStatusNew);

// 4. Main Category Toggle Active
const mainCatStatusRegex = /<span\s+className={`inline-flex px-2 py-1 text-\[10px\] font-semibold rounded-full border \${\s+mainCategory\.is_active\s+\?\s+"bg-emerald-500\/10 text-emerald-400 border-emerald-500\/20"\s+:\s+"bg-red-500\/10 text-red-400 border-red-500\/20"\s+}\s*`}\s*>\s*\{mainCategory\.is_active \? "Aktif" : "Pasif"\}\s*<\/span>/;
const mainCatStatusNew = `<button
                        onClick={(e) => { e.stopPropagation(); handleToggleActive(mainCategory.id, mainCategory.is_active || false); }}
                        className={\`inline-flex px-2 py-1 text-[10px] font-semibold rounded-full border cursor-pointer hover:opacity-80 transition-opacity \${
                          mainCategory.is_active
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }\`}
                        title="Durumu Değiştir"
                      >
                        {mainCategory.is_active ? "Aktif" : "Pasif"}
                      </button>`;
code = code.replace(mainCatStatusRegex, mainCatStatusNew);

// 5. Replace Subcategory Drag Handle with Up/Down Arrows
const subCatDragRegex = /<div className="text-slate-500 cursor-grab active:cursor-grabbing hover:text-white transition-colors">\s*<svg\s+className="w-4 h-4"\s+fill="none"\s+stroke="currentColor"\s+viewBox="0 0 24 24"\s*>\s*<path\s+strokeLinecap="round"\s+strokeLinejoin="round"\s+strokeWidth=\{2\}\s+d="M4 8h16M4 16h16"\s*\/>\s*<\/svg>\s*<\/div>/;
const subCatArrows = `<div className="flex flex-col gap-0.5 mr-1">
                              <button onClick={(e) => { e.stopPropagation(); moveSubCategoryUp(subCategory.id, subCategory.parent_id!); }} className="p-0.5 hover:bg-white/10 rounded text-slate-500 hover:text-white transition-colors" title="Yukarı Taşı">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); moveSubCategoryDown(subCategory.id, subCategory.parent_id!); }} className="p-0.5 hover:bg-white/10 rounded text-slate-500 hover:text-white transition-colors" title="Aşağı Taşı">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                              </button>
                            </div>`;
code = code.replace(subCatDragRegex, subCatArrows);

// 6. Main Category Up/Down Arrows
// We'll place them next to the blue folder icon.
const mainCatIconRegex = /<div className="w-8 h-8 bg-blue-500\/20 border border-blue-500\/30 rounded-lg flex items-center justify-center shadow-\[0_0_10px_rgba\(59,130,246,0\.1\)\]">\s*<span className="text-blue-400 text-sm font-bold">\s*📂\s*<\/span>\s*<\/div>/;
const mainCatArrows = `<div className="flex flex-col gap-0.5 mr-1">
                        <button onClick={(e) => { e.stopPropagation(); moveMainCategoryUp(mainCategory.id); }} className="p-0.5 hover:bg-white/10 rounded text-slate-500 hover:text-white transition-colors" title="Yukarı Taşı">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); moveMainCategoryDown(mainCategory.id); }} className="p-0.5 hover:bg-white/10 rounded text-slate-500 hover:text-white transition-colors" title="Aşağı Taşı">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                      <div className="w-8 h-8 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                        <span className="text-blue-400 text-sm font-bold">📂</span>
                      </div>`;
code = code.replace(mainCatIconRegex, mainCatArrows);

fs.writeFileSync('src/app/categories/page.tsx', code, 'utf8');
