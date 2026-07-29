import re

with open("frontend/src/app/sejour/[id]/edit/page.tsx", "r") as f:
    text = f.read()

# Add getCollectionForCurrency near getProfitForCurrency
collection_func = """  // Calculate profit/loss for specific currency
  const getProfitForCurrency = (currency: string) => {
    const total = getTotalForCurrency(currency);
    const cost = getCostForCurrency(currency);
    return total - cost;
  };

  const getCollectionForCurrency = (currency: string) => {
    return collections
      .filter((c) => c.currency === currency && c.status === "completed")
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  };"""

if "const getCollectionForCurrency =" not in text:
    text = text.replace(
        "  // Calculate profit/loss for specific currency\n  const getProfitForCurrency = (currency: string) => {\n    const total = getTotalForCurrency(currency);\n    const cost = getCostForCurrency(currency);\n    return total - cost;\n  };",
        collection_func
    )

# Now rewrite the footer
footer_pattern = r'\{\/\* TOTALS FOOTER \*\/\}.*?(<div className="flex items-center gap-3">)'

new_footer = """{/* TOTALS FOOTER */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] p-3 z-40 transition-all duration-300">
            <div className="max-w-[1800px] mx-auto flex items-center justify-between">
              <div className="flex items-center gap-6 overflow-x-auto pb-1">
                {["TRY", "USD", "EUR", "GBP"].filter(c => getTotalForCurrency(c) !== 0 || getCostForCurrency(c) !== 0 || getCollectionForCurrency(c) !== 0).length === 0 ? (
                  <div className="text-sm font-semibold text-gray-400">Veri yok</div>
                ) : (
                  ["TRY", "USD", "EUR", "GBP"].filter(c => getTotalForCurrency(c) !== 0 || getCostForCurrency(c) !== 0 || getCollectionForCurrency(c) !== 0).map(c => {
                    const total = getTotalForCurrency(c);
                    const cost = getCostForCurrency(c);
                    const col = getCollectionForCurrency(c);
                    const profit = total - cost;
                    const balance = total - col;
                    
                    return (
                      <div key={c} className="flex items-center gap-4 min-w-max border-r border-gray-200 pr-6 last:border-0 last:pr-0">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{c} DÖVİZİ</span>
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <span className="text-[9px] text-gray-400 uppercase">Satış</span>
                              <span className="text-xs font-bold text-gray-900">{total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] text-gray-400 uppercase">Maliyet</span>
                              <span className="text-xs font-bold text-red-600">{cost.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] text-gray-400 uppercase">Kâr/Zarar</span>
                              <span className={`text-xs font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{profit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="w-px h-6 bg-gray-200 mx-1"></div>
                            <div className="flex flex-col">
                              <span className="text-[9px] text-gray-400 uppercase">Tahsilat</span>
                              <span className="text-xs font-bold text-blue-600">{col.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] text-gray-400 uppercase">Bakiye</span>
                              <span className={`text-xs font-bold ${balance > 0 ? 'text-orange-500' : 'text-gray-900'}`}>{balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              \1"""

text = re.sub(footer_pattern, new_footer, text, flags=re.DOTALL)

with open("frontend/src/app/sejour/[id]/edit/page.tsx", "w") as f:
    f.write(text)

print("Updated edit page.")
