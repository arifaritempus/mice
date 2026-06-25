const fs = require('fs');

let code = fs.readFileSync('src/app/suppliers/page.tsx', 'utf8');

// Update Table Padding
code = code.replace(/px-4 py-3/g, 'px-2.5 py-2.5');

// Update Table Row Hover & Double Click
code = code.replace(
  '<tr key={supplier.id} className="hover:bg-white/5 transition-colors group">',
  '<tr key={supplier.id} className="hover:bg-blue-500/10 transition-colors group cursor-pointer border-b border-white/5 last:border-0" onDoubleClick={() => setEditingSupplier(supplier) || setShowEditModal(true)}>'
);

fs.writeFileSync('src/app/suppliers/page.tsx', code, 'utf8');
