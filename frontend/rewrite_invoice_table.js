const fs = require('fs');

let file = 'src/components/accounting/InvoiceItemTable.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the 3 headers
content = content.replace(
  /<th className="px-2\.5 py-2\.5 text-right text-\[10px\] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Toplam<\/th>\s*<th className="px-2\.5 py-2\.5 text-right text-\[10px\] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Faturalanan<\/th>\s*<th className="px-2\.5 py-2\.5 text-right text-\[10px\] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Bakiye<\/th>/,
  '<th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[240px]">Faturalanma Durumu</th>'
);

// Replace the 3 cells
const cellRegex = /<td className="px-2\.5 py-2\.5 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap text-\[11px\]">\s*\{formatCurrency\(item\.total_price \|\| 0, item\.currency\)\}\s*<\/td>\s*<td className="px-2\.5 py-2\.5 text-right text-green-600 dark:text-green-400 whitespace-nowrap text-\[11px\]">\s*\{formatCurrency\(item\.invoiced_amount \|\| 0, item\.currency\)\}\s*<\/td>\s*<td className="px-2\.5 py-2\.5 text-right font-bold text-gray-900 dark:text-white whitespace-nowrap text-\[11px\]">\s*\{formatCurrency\(item\.balance \|\| 0, item\.currency\)\}\s*<\/td>/;

const newCells = `<td className="px-2.5 py-2.5 min-w-[200px]">
                    <div className="flex flex-col gap-1.5 pr-4">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-gray-500 dark:text-gray-400">TPL: <span className="text-gray-900 dark:text-white">{formatCurrency(item.total_price || 0, item.currency)}</span></span>
                        <span className={item.balance <= 0 ? "text-emerald-500" : "text-rose-500 glow-text-sm"}>
                          BKY: {formatCurrency(item.balance || 0, item.currency)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700/50 rounded-full overflow-hidden flex shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-1000 ease-out" 
                          style={{ width: \`\${Math.min(100, Math.max(0, ((item.invoiced_amount || 0) / (item.total_price || 1)) * 100))}%\` }}
                        />
                      </div>
                      <div className="text-[9px] font-black text-blue-600 dark:text-blue-400 text-right uppercase tracking-wider">
                        Faturalanan: {formatCurrency(item.invoiced_amount || 0, item.currency)}
                      </div>
                    </div>
                  </td>`;

content = content.replace(cellRegex, newCells);

// colSpan={8} to colSpan={6}
content = content.replace(/colSpan=\{8\}/g, 'colSpan={6}');

fs.writeFileSync(file, content, 'utf8');
