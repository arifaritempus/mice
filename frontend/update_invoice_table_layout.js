const fs = require('fs');
let file = 'src/components/accounting/InvoiceItemTable.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove the top filter/selection div
const topBarRegex = /<div className="flex justify-between items-center gap-3">[\s\S]*?<div className="text-sm text-gray-500 whitespace-nowrap">\s*<span className="font-bold text-blue-600 dark:text-blue-400">\{selectedItems\.length\}<\/span> kalem seçili\s*<\/div>\s*<\/div>/;
content = content.replace(topBarRegex, '{enableInternalSearch && (\n        <div className="flex justify-start items-center gap-3 mb-2">\n          <input\n            type="text"\n            placeholder="Ara (Voucher, Firma, Otel, Tarih, Proje...)"\n            className="px-4 py-2 border rounded-lg w-full max-w-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"\n            value={searchTerm}\n            onChange={(e) => setSearchTerm(e.target.value)}\n          />\n        </div>\n      )}');

// Update table class
content = content.replace(/<table className="min-w-\[900px\] divide-y/g, '<table className="w-full table-fixed min-w-[1000px] divide-y');

// Replace the table headers
const oldHeaders = `<th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hizmet / Kategori</th>
              <th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tarih Aralığı</th>
              <th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Firma / Tedarikçi & Proje</th>
              <th className="px-2.5 py-2.5 text-right text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Toplam</th>
              <th className="px-2.5 py-2.5 text-right text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Faturalanan</th>
              <th className="px-2.5 py-2.5 text-right text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Bakiye</th>
              <th className="px-2.5 py-2.5 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">DVZ</th>`;

const newHeaders = `<th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[15%]">Hizmet / Kategori</th>
              <th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[12%]">Tarih Aralığı</th>
              <th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[20%]">Firma / Tedarikçi</th>
              <th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[18%]">Proje / İşlem</th>
              <th className="px-2.5 py-2.5 text-right text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[10%]">Toplam</th>
              <th className="px-2.5 py-2.5 text-right text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[10%]">Faturalanan</th>
              <th className="px-2.5 py-2.5 text-right text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider w-[10%]">Bakiye</th>
              <th className="px-2.5 py-2.5 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[5%]">DVZ</th>`;

content = content.replace(oldHeaders, newHeaders);

// Replace colspan from 8 to 9
content = content.replace(/colSpan=\{8\}/g, 'colSpan={9}');

// Replace the Firma / Tedarikçi & Proje cell
const oldCell = /<td className="px-2\.5 py-2\.5 min-w-\[220px\]">[\s\S]*?<\/td>/;
const newCell = `<td className="px-2.5 py-2.5">
                    <div className="font-medium text-blue-600 dark:text-blue-400 truncate text-[11px] pr-2">
                      {isSejour ? (hotelDisplay || companyDisplay) : companyDisplay}
                    </div>
                  </td>
                  <td className="px-2.5 py-2.5">
                    {codeDisplay && (
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate">
                          {codeDisplay}
                        </span>
                      </div>
                    )}
                    {subDisplay && (
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 line-clamp-1 pr-2">
                        {subDisplay}
                      </div>
                    )}
                  </td>`;

content = content.replace(oldCell, newCell);

fs.writeFileSync(file, content, 'utf8');
