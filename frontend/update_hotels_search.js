const fs = require('fs');

let code = fs.readFileSync('src/app/hotels/page.tsx', 'utf8');

// 1. Add Import
if (!code.includes('MultiTokenFilterInput')) {
  code = code.replace(
    'import PaginationControls from "@/components/PaginationControls";',
    'import PaginationControls from "@/components/PaginationControls";\nimport MultiTokenFilterInput from "@/components/MultiTokenFilterInput";'
  );
}

// 2. Add State
if (!code.includes('const [searchTokens, setSearchTokens] = useState<string[]>([]);')) {
  code = code.replace(
    'const [searchTerm, setSearchTerm] = useState("");',
    'const [searchTerm, setSearchTerm] = useState("");\n  const [searchTokens, setSearchTokens] = useState<string[]>([]);'
  );
}

// 3. Update searchHotels function
const oldSearchFuncRegex = /const searchHotels = \([^\{]+\{[\s\S]*?\n  \};\n/;
const newSearchFunc = `const searchHotels = (hotels: Hotel[], term: string, tokens: string[]) => {
    if (!term && (!tokens || tokens.length === 0)) return hotels;
    
    return hotels.filter(hotel => {
      const matches = (s: string) => {
        if (!s) return true;
        const lowerS = s.toLowerCase();
        return hotel.name.toLowerCase().includes(lowerS) ||
               (hotel.company_name && hotel.company_name.toLowerCase().includes(lowerS)) ||
               (hotel.contact_person && hotel.contact_person.toLowerCase().includes(lowerS)) ||
               (hotel.phone && hotel.phone.toLowerCase().includes(lowerS)) ||
               (hotel.email && hotel.email.toLowerCase().includes(lowerS)) ||
               (hotel.address && hotel.address.toLowerCase().includes(lowerS)) ||
               (hotel.tax_number && hotel.tax_number.toLowerCase().includes(lowerS)) ||
               (hotel.tax_office && hotel.tax_office.toLowerCase().includes(lowerS));
      };

      if (term && !matches(term)) return false;

      if (tokens && tokens.length > 0) {
        for (const t of tokens) {
          if (!matches(t)) return false;
        }
      }

      return true;
    });
  };
`;
code = code.replace(oldSearchFuncRegex, newSearchFunc);

// 4. Update filteredHotels call
code = code.replace(
  'searchTerm\n    ),',
  'searchTerm,\n      searchTokens\n    ),'
);

// 5. Update useEffect dependencies
code = code.replace(
  '[searchTerm, filter, sortField, sortDirection]',
  '[searchTerm, searchTokens, filter, sortField, sortDirection]'
);

// 6. Replace Search Bar JSX
const oldSearchBarRegex = /\{\/\* Search Bar \*\/\}\s*<div className="flex flex-col gap-1\.5 flex-\[2\] min-w-\[250px\] max-w-lg">\s*<label[\s\S]*?<\/div>\s*<\/div>/;

const newSearchBar = `{/* Search Bar */}
            <div className="flex flex-col gap-1.5 flex-[2] min-w-[250px] max-w-lg shrink-0">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">GENEL ARAMA (OTEL, FİRMA, KONUM...)</label>
              <div className="h-10">
                <MultiTokenFilterInput
                  label=""
                  placeholder="Yaz, Enter ile ekle"
                  inputValue={searchTerm}
                  onInputChange={setSearchTerm}
                  tokens={searchTokens}
                  suggestions={[]}
                  onAddToken={(t) => {
                    if (!searchTokens.includes(t)) {
                      setSearchTokens([...searchTokens, t]);
                      setSearchTerm('');
                    }
                  }}
                  onRemoveToken={(t) => {
                    setSearchTokens(searchTokens.filter(st => st !== t));
                  }}
                />
              </div>
            </div>`;
            
code = code.replace(oldSearchBarRegex, newSearchBar);

fs.writeFileSync('src/app/hotels/page.tsx', code, 'utf8');
