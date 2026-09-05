const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

// 1. Fix suppliersLower array to use dbSuppliers
code = code.replace(/const suppliersLower = SUPPLIERS\.map\(s => s\.toLowerCase\(\)\);/g, `const suppliersLower = [...dbSuppliers, ...projectHotels].map(s => (s.name || s.title || "").toLowerCase());`);

// 2. Fix project_categories query -> categories
code = code.replace(/supabase\.from\('project_categories'\)/g, `supabase.from('categories')`);

// 3. Remove supplier_name from Uçuş (project_sales_items)
code = code.replace(/supplier_name: row\.ucus_tedarikci \|\| null/g, ``);
code = code.replace(/supplier_name: row\.donus_ucus_tedarikci \|\| null/g, ``);

// To fix dangling commas after removing supplier_name:
// payer_company_id: selectedCompanyId || null,
// supplier_id: dbSuppliers.find... || null,
// supplier_name: row.ucus_tedarikci || null

// Let's do a robust replace for the flight supplier_id and supplier_name:
code = code.replace(/supplier_id:\s*dbSuppliers\.find.*?,\s*supplier_name:\s*row\..*?\|\|\s*null/g, (match) => {
    // Just remove the supplier_name part
    return match.replace(/,\s*supplier_name:\s*row\..*?\|\|\s*null/g, "");
});

// Since the previous regex might have failed to match exact whitespace, let's also just replace the specific string:
code = code.replace(/,\n\s*supplier_name: row\.ucus_tedarikci \|\| null/g, "");
code = code.replace(/,\n\s*supplier_name: row\.donus_ucus_tedarikci \|\| null/g, "");

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Fixed suppliersLower, project_categories, and removed supplier_name from sales items.");
