const fs = require('fs');

let content = fs.readFileSync('src/app/marketing/page.tsx', 'utf8');

// 1. Add Import
if (!content.includes('import MultiTokenFilterInput')) {
  content = content.replace(
    "import ResponsiveDateRangeField from '@/components/ResponsiveDateRangeField';",
    "import ResponsiveDateRangeField from '@/components/ResponsiveDateRangeField';\nimport MultiTokenFilterInput from '@/components/MultiTokenFilterInput';"
  );
}

// 2. Add searchTokens state
if (!content.includes('searchTokens')) {
  content = content.replace(
    "const [globalSearchTerm, setGlobalSearchTerm] = useState('');",
    "const [globalSearchTerm, setGlobalSearchTerm] = useState('');\n  const [searchTokens, setSearchTokens] = useState<string[]>([]);"
  );
}

// 3. Update filteredClients
content = content.replace(
  `      const matchesSearch = !globalSearchTerm || 
        client.name?.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
        client.industry?.toLowerCase().includes(globalSearchTerm.toLowerCase());`,
  `      const searchStr = [client.name, client.industry, client.type, client.contact_person].filter(Boolean).join(' ').toLowerCase();
      const matchesSearch = (!globalSearchTerm || searchStr.includes(globalSearchTerm.toLowerCase())) &&
        (searchTokens.length === 0 || searchTokens.every(token => searchStr.includes(token.toLowerCase())));`
);

// 4. Update filteredInteractions
content = content.replace(
  `      const matchesSearch = !globalSearchTerm || 
        interaction.marketing_clients?.name?.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
        interaction.description?.toLowerCase().includes(globalSearchTerm.toLowerCase());`,
  `      const searchStr = [interaction.marketing_clients?.name, interaction.description, interaction.type].filter(Boolean).join(' ').toLowerCase();
      const matchesSearch = (!globalSearchTerm || searchStr.includes(globalSearchTerm.toLowerCase())) &&
        (searchTokens.length === 0 || searchTokens.every(token => searchStr.includes(token.toLowerCase())));`
);

// 5. Replace search bar UI
const searchStart = '<div className="flex-[2] min-w-[240px] relative max-w-sm shrink-0">';
const searchEnd = '          </div>\n\n          <div className="shrink-0 flex items-center gap-2">';
const startIndex = content.indexOf(searchStart);
const endIndex = content.indexOf(searchEnd) + searchEnd.length;

if (startIndex !== -1) {
  const replacement = `<div className="flex-[2] min-w-[300px]">
            <MultiTokenFilterInput
              label="Genel Arama (Firma, Sektör vb.)"
              tokens={searchTokens}
              inputValue={globalSearchTerm}
              suggestions={[]}
              onInputChange={setGlobalSearchTerm}
              onAddToken={(val) => {
                const trimmed = val.trim();
                if (trimmed && !searchTokens.includes(trimmed)) {
                  setSearchTokens(prev => [...prev, trimmed]);
                  setGlobalSearchTerm('');
                }
              }}
              onRemoveToken={(val) => setSearchTokens(prev => prev.filter(t => t !== val))}
            />
          </div>

          <div className="shrink-0 flex items-center gap-2">`;
  content = content.slice(0, startIndex) + replacement + content.slice(endIndex);
}

fs.writeFileSync('src/app/marketing/page.tsx', content, 'utf8');
console.log("Updated to V3 search bar");
