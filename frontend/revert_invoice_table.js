const fs = require('fs');

let file = 'src/components/accounting/InvoiceItemTable.tsx';
let content = fs.readFileSync(file, 'utf8');

// Revert headers
const headerRegex = /<th className="px-2\.5 py-2\.5 text-left text-\[10px\] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-\[240px\]">Faturalanma Durumu<\/th>/;
content = content.replace(headerRegex, `<th className="px-2.5 py-2.5 text-right text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Toplam</th>
              <th className="px-2.5 py-2.5 text-right text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Faturalanan</th>
              <th className="px-2.5 py-2.5 text-right text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Bakiye</th>`);

// Revert cell
const cellRegex = /<td className="px-2\.5 py-2\.5 min-w-\[200px\]">[\s\S]*?<\/td>/;
content = content.replace(cellRegex, `<td className="px-2.5 py-2.5 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap text-[11px]">
                    {formatCurrency(item.total_price || 0, item.currency)}
                  </td>
                  <td className="px-2.5 py-2.5 text-right text-green-600 dark:text-green-400 whitespace-nowrap text-[11px]">
                    {formatCurrency(item.invoiced_amount || 0, item.currency)}
                  </td>
                  <td className="px-2.5 py-2.5 text-right font-bold text-gray-900 dark:text-white whitespace-nowrap text-[11px]">
                    {formatCurrency(item.balance || 0, item.currency)}
                  </td>`);

// Revert colSpan
content = content.replace(/colSpan=\{6\}/g, 'colSpan={8}');

fs.writeFileSync(file, content, 'utf8');
