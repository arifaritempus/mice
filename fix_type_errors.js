const fs = require('fs');

const tsCode = `
export interface MultiTokenFilterInputProps {
  label: string;
  tokens: string[];
  inputValue: string;
  suggestions: { value: string; label?: string }[];
  onInputChange: (val: string) => void;
  onAddToken: (token: string) => void;
  onRemoveToken: (token: string) => void;
}

const agencyCustomerLine = (item: any) => item?.agencyName || item?.customerName || '-';
const agencyCustomerTooltip = (item: any) => [item?.agencyName, item?.customerName].filter(Boolean).join(' - ') || '-';
`;

const files = [
  'frontend/src/app/operations/tickets/page.tsx',
  'frontend/src/app/operations/transfers/page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Only add if not already there
  if (!content.includes('MultiTokenFilterInputProps')) {
    // Insert after imports
    const importEnd = content.lastIndexOf("import ");
    const newlineAfterImport = content.indexOf("\n", importEnd);
    
    content = content.substring(0, newlineAfterImport + 1) + tsCode + content.substring(newlineAfterImport + 1);
    fs.writeFileSync(file, content);
    console.log("Fixed", file);
  } else {
    // maybe it is there but the script didn't run? 
    // Actually the error says "Cannot find name". So it's NOT there.
  }
}
