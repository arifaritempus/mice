const fs = require('fs');

const file = 'src/components/accounting/CompletedInvoicePreview.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace contact mapping
content = content.replace(
  /const contactName = contactInfo\?\.name[\s\S]*?const companyWebsite = gs\.company_website;/m,
  `const contactName = contactInfo?.name || contactInfo?.company_name || invoice?.contact_name || invoice?.contact_id || '-';
  const contactAddress = contactInfo?.address || contactInfo?.city || '';
  const contactTaxNo = contactInfo?.tax_number || contactInfo?.vkn || '';
  const contactTaxOffice = contactInfo?.tax_office || '';

  // Company Settings
  const gs = settings.general_settings || {};
  const logoSettings = settings.logo_settings || {};
  const logoUrl = gs.dark_wordmark_logo || gs.dark_icon_logo || logoSettings.dark_wordmark_logo || logoSettings.dark_icon_logo || '/LOGO_NAVY.png';
  const companyName = gs.company_name;
  const companyAddress = gs.company_address;
  const companyTaxOffice = gs.company_tax_office || gs.tax_office;
  const companyTaxId = gs.company_tax_id || gs.tax_number || gs.vkn;
  const companyPhone = gs.company_phone;
  const companyEmail = gs.company_email;
  const companyWebsite = gs.company_website;

  const isExpense = invoice?.type === 'expense';

  const issuerName = isExpense ? contactName : companyName;
  const issuerAddress = isExpense ? contactAddress : companyAddress;
  const issuerTaxOffice = isExpense ? contactTaxOffice : companyTaxOffice;
  const issuerTaxId = isExpense ? contactTaxNo : companyTaxId;
  const issuerPhone = isExpense ? '' : companyPhone;
  const issuerEmail = isExpense ? '' : companyEmail;
  const issuerWebsite = isExpense ? '' : companyWebsite;

  const recipientName = isExpense ? companyName : contactName;
  const recipientAddress = isExpense ? companyAddress : contactAddress;
  const recipientTaxOffice = isExpense ? companyTaxOffice : contactTaxOffice;
  const recipientTaxId = isExpense ? companyTaxId : contactTaxNo;
  const recipientLabel = isExpense ? 'ALICI BİLGİLERİ' : 'MÜŞTERİ BİLGİLERİ';`
);

// Update DÜZENLEYEN
content = content.replace(
  /{companyName && <div style={{ fontSize: '15px', fontWeight: 900, color: '#000', letterSpacing: '0.05em', marginBottom: '4px' }}>{companyName}<\/div>}/m,
  `{issuerName && <div style={{ fontSize: '15px', fontWeight: 900, color: '#000', letterSpacing: '0.05em', marginBottom: '4px' }}>{issuerName}</div>}`
);
content = content.replace(
  /{companyAddress && <div style={{ fontSize: '10.5px', fontWeight: 700, lineHeight: 1.6, color: '#1e293b' }}>{companyAddress}<\/div>}/m,
  `{issuerAddress && <div style={{ fontSize: '10.5px', fontWeight: 700, lineHeight: 1.6, color: '#1e293b' }}>{issuerAddress}</div>}`
);
content = content.replace(
  /\{\(companyTaxOffice \|\| companyTaxId\).*?\{\(companyTaxOffice \|\| companyTaxId\).*?\}/s, // this won't work well due to multiline
  `{(issuerTaxOffice || issuerTaxId) && (
                  <div style={{ fontSize: '10.5px', fontWeight: 700, lineHeight: 1.6, color: '#1e293b' }}>
                    {issuerTaxOffice && <span>V.D: {issuerTaxOffice} </span>}
                    {issuerTaxId && <span>V.NO: {issuerTaxId}</span>}
                  </div>
                )}`
);

// We should use targeted string replacement for the Duzenleyen part instead of regex.
