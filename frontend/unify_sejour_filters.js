const fs = require('fs');

let content = fs.readFileSync('src/app/sejour/page.tsx', 'utf8');

// 1. Replace states
content = content.replace(
  /const \[voucherTokens[\s\S]*const \[statusInput, setStatusInput\] = useState\(''\);/,
  `const [globalTokens, setGlobalTokens] = useState<string[]>([]);\n  const [globalInput, setGlobalInput] = useState('');`
);

// 2. Replace suggestions
content = content.replace(
  /const voucherSuggestions = useMemo\([\s\S]*?\[sejours\]\n  \);/g,
  `const globalSuggestions = useMemo(
    () => Array.from(new Set([
      ...sejours.map(s => (s.voucherNumber || '').trim()).filter(Boolean),
      ...sejours.map(s => (s.customerName || '').trim()).filter(Boolean),
      ...sejours.map(s => (s.agencyName || '').trim()).filter(Boolean),
      ...sejours.flatMap((s) => (s.rooms || []).map((r) => (r.guestInfo || '').trim())).filter(Boolean),
      'Konfirme', 'Bekleyen', 'İptal',
      ...sejours.map(s => (s.status || '').trim()).filter(Boolean)
    ])),
    [sejours]
  );`
);

// 3. Replace clear filter logic
content = content.replace(
  /const clearSejourFilters = \(\) => \{[\s\S]*?\};/,
  `const clearAllFilters = () => {
    setDateStart('');
    setDateEnd('');
    setGlobalTokens([]);
    setGlobalInput('');
    setPage(1);
  };`
);

// 4. Replace filter execution
content = content.replace(
  /const filteredSejours = sejours\.filter\(\(sejour\) => \{[\s\S]*?return true;\n  \}\);/,
  `const filteredSejours = sejours.filter((sejour) => {
    const guests = (sejour.rooms || []).map((room) => room.guestInfo || '').join(' ');
    
    const searchString = \`
      \${sejour.voucherNumber || ''}
      \${sejour.customerName || ''}
      \${sejour.agencyName || ''}
      \${guests}
      \${sejour.status || ''}
    \`.toLowerCase();

    if (!includesByTokens(searchString, globalTokens)) return false;

    if (statusFilter !== 'all') {
      if (statusFilter === 'konfirme' && !(sejour.status || '').toLowerCase().includes('konfirme')) return false;
      if (statusFilter === 'bekleyen' && !(sejour.status || '').toLowerCase().includes('bekleyen') && !(sejour.status || '').toLowerCase().includes('bekle')) return false;
      if (statusFilter === 'iptal' && !(sejour.status || '').toLowerCase().includes('iptal')) return false;
    }

    return true;
  });`
);

// 5. Replace header layout inputs
const startStr = '{/* Search Filters */}';
const endStr = '{/* Clear Button */}';
const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `{/* Search */}
          <div className="flex-1 min-w-[300px]">
            <MultiTokenFilterInput
              label="Genel Arama (Voucher No, Müşteri, Acente, Misafir, Durum)"
              tokens={globalTokens}
              inputValue={globalInput}
              suggestions={globalSuggestions}
              onInputChange={setGlobalInput}
              onAddToken={(value) => addToken(value, setGlobalTokens, setGlobalInput)}
              onRemoveToken={(value) => removeToken(value, setGlobalTokens)}
            />
          </div>

          `;
  content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
}

// 6. Replace clear button logic
content = content.replace(
  /\{\(dateStart \|\| dateEnd \|\| voucherTokens\.length > 0 \|\| customerTokens\.length > 0 \|\| agencyTokens\.length > 0 \|\| guestTokens\.length > 0 \|\| statusTokens\.length > 0\) && \(/,
  '{(dateStart || dateEnd || globalTokens.length > 0) && ('
);
content = content.replace(/clearSejourFilters/g, 'clearAllFilters');

fs.writeFileSync('src/app/sejour/page.tsx', content, 'utf8');
console.log("Unified search filters successfully!");
