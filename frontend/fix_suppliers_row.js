const fs = require('fs');
let code = fs.readFileSync('src/app/suppliers/page.tsx', 'utf8');

// Fix onDoubleClick
code = code.replace(
  'onDoubleClick={() => setEditingSupplier(supplier) || setShowEditModal(true)}',
  'onDoubleClick={() => handleEditSupplier(supplier)}'
);

// Fix Edit button style
code = code.replace(
  /className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900\/30 transition-colors duration-200"/g,
  'className="text-emerald-400 hover:text-emerald-300 p-1.5 rounded-lg hover:bg-emerald-500/20 transition-all duration-200 opacity-70 group-hover:opacity-100"'
);

// Fix Delete button style
code = code.replace(
  /className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900\/30 transition-colors duration-200"/g,
  'className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/20 transition-all duration-200 opacity-70 group-hover:opacity-100"'
);

fs.writeFileSync('src/app/suppliers/page.tsx', code, 'utf8');
