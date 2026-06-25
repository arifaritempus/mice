const fs = require('fs');
let file = 'src/components/accounting/CompletedInvoicePreview.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix Settings variables
content = content.replace(
  "const logoUrl = settings.dark_wordmark_logo || settings.dark_icon_logo || settings.light_wordmark_logo || settings.icon_logo || '/LOGO_NAVY.png';",
  `const gs = settings.general_settings || {};
  const logoSettings = settings.logo_settings || {};
  const logoUrl = gs.dark_wordmark_logo || gs.dark_icon_logo || logoSettings.dark_wordmark_logo || logoSettings.dark_icon_logo || '/LOGO_NAVY.png';`
);

content = content.replace(
  "const companyName = settings.invoice_company_name || settings.company_name;",
  "const companyName = gs.company_name;"
);

content = content.replace(
  "const companyAddress = settings.invoice_company_address || settings.company_address;",
  "const companyAddress = gs.company_address;"
);

content = content.replace(
  "const companyTaxOffice = settings.invoice_company_tax_office || settings.company_tax_office;",
  "const companyTaxOffice = gs.company_tax_office || gs.tax_office;"
);

content = content.replace(
  "const companyTaxId = settings.invoice_company_tax_id || settings.company_tax_id;",
  "const companyTaxId = gs.company_tax_id || gs.tax_number || gs.vkn;"
);

content = content.replace(
  "const companyPhone = settings.invoice_company_phone || settings.company_phone;",
  "const companyPhone = gs.company_phone;"
);

content = content.replace(
  "const companyEmail = settings.invoice_company_email || settings.company_email;",
  "const companyEmail = gs.company_email;"
);

content = content.replace(
  "const companyWebsite = settings.invoice_company_website || settings.company_website;",
  "const companyWebsite = gs.company_website;"
);

// We need to fix the sort order. We can just sort using category_sort_order which we will pass from backend.
const sortTarget = `const sortedItems = [...(items || [])].sort((a, b) => {
    const catA = a.category_name || 'Diğer';
    const catB = b.category_name || 'Diğer';
    if (catA !== catB) return catA.localeCompare(catB);
    const subA = a.sub_category_name || '';
    const subB = b.sub_category_name || '';
    return subA.localeCompare(subB);
  });`;

const sortReplace = `const sortedItems = [...(items || [])].sort((a, b) => {
    const catOrderA = a.category_sort_order ?? 9999;
    const catOrderB = b.category_sort_order ?? 9999;
    
    if (catOrderA !== catOrderB) return catOrderA - catOrderB;
    
    const catA = a.category_name || 'Diğer';
    const catB = b.category_name || 'Diğer';
    if (catA !== catB) return catA.localeCompare(catB);
    
    const subOrderA = a.sub_category_sort_order ?? 9999;
    const subOrderB = b.sub_category_sort_order ?? 9999;
    if (subOrderA !== subOrderB) return subOrderA - subOrderB;

    const subA = a.sub_category_name || '';
    const subB = b.sub_category_name || '';
    return subA.localeCompare(subB);
  });`;

content = content.replace(sortTarget, sortReplace);

fs.writeFileSync(file, content, 'utf8');
