const fs = require('fs');
let content = fs.readFileSync('src/app/sejour/page.tsx', 'utf8');

const startStr = '{/* Clear Filters Button */}';
const endStr = '</div>\n      </div>\n\n      {/* Unified Stats Strip */}';

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `{/* Clear Button */}
          {(dateStart || dateEnd || voucherTokens.length > 0 || customerTokens.length > 0 || agencyTokens.length > 0 || guestTokens.length > 0 || statusTokens.length > 0) && (
            <button
              onClick={clearSejourFilters}
              className="w-10 h-10 shrink-0 inline-flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all duration-300 hover:scale-105"
              title="Tüm Filtreleri Temizle"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0 border-l border-white/10 pl-3">
            <button
              onClick={exportToExcel}
              className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2 disabled:opacity-50"
              title="Excel'e Aktar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel
            </button>
            {canCreate(Module.SEJOUR) && (
              <Link
                href="/sejour/create"
                className="bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Yeni Sejour
              </Link>
            )}
          </div>
        `;
  
  content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
  fs.writeFileSync('src/app/sejour/page.tsx', content, 'utf8');
  console.log("Replaced buttons!");
} else {
  console.log("Could not find start/end bounds for buttons.");
}
