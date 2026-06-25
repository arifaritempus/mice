const fs = require('fs');
let file = 'src/components/accounting/InvoiceItemTable.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace headers
const oldHeaders = `<th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[15%]">Hizmet / Kategori</th>
              <th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[12%]">Tarih Aralığı</th>
              <th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[20%]">Firma / Tedarikçi</th>
              <th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[18%]">Proje / İşlem</th>
              <th className="px-2.5 py-2.5 text-right text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[10%]">Toplam</th>
              <th className="px-2.5 py-2.5 text-right text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[10%]">Faturalanan</th>
              <th className="px-2.5 py-2.5 text-right text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider w-[10%]">Bakiye</th>
              <th className="px-2.5 py-2.5 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[5%]">DVZ</th>`;

const newHeaders = `<th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[15%]">Hizmet / Kategori</th>
              <th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[10%]">Tarih Aralığı</th>
              <th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[12%]">Firma Adı</th>
              <th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[12%]">Tedarikçi Adı</th>
              <th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[12%]">Otel</th>
              <th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[10%]">Proje / İşlem</th>
              <th className="px-2.5 py-2.5 text-right text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[8%]">Toplam</th>
              <th className="px-2.5 py-2.5 text-right text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[8%]">Faturalanan</th>
              <th className="px-2.5 py-2.5 text-right text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider w-[8%]">Bakiye</th>
              <th className="px-2.5 py-2.5 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[5%]">DVZ</th>`;

content = content.replace(oldHeaders, newHeaders);
content = content.replace(/colSpan=\{9\}/g, 'colSpan={11}');

// Replace variable assignments
const oldVars = `              const companyDisplay = item.project?.company_name || '-';
              const hotelDisplay = item.project?.hotel_name || '';
              const codeDisplay = isSejour
                ? (item.project?.voucher_number || item.project?.title || '')
                : (item.project?.title || '');
              const subDisplay = item.project?.description || '';`;

const newVars = `              const companyDisplay = item.project?.company_name || item.company_name || '-';
              const supplierDisplay = item.project?.supplier_name || item.supplier_name || item.supplier?.name || '-';
              const hotelDisplay = item.project?.hotel_name || item.hotel_name || '-';
              const codeDisplay = isSejour
                ? (item.project?.voucher_number || item.project?.title || '')
                : (item.project?.title || '');`;

content = content.replace(oldVars, newVars);

// Replace cells
const oldCells = `<td className="px-2.5 py-2.5">
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

const newCells = `<td className="px-2.5 py-2.5">
                    <div className="font-medium text-gray-800 dark:text-gray-300 truncate text-[11px] pr-2" title={companyDisplay}>
                      {companyDisplay}
                    </div>
                  </td>
                  <td className="px-2.5 py-2.5">
                    <div className="font-medium text-gray-800 dark:text-gray-300 truncate text-[11px] pr-2" title={supplierDisplay}>
                      {supplierDisplay}
                    </div>
                  </td>
                  <td className="px-2.5 py-2.5">
                    <div className="font-medium text-gray-800 dark:text-gray-300 truncate text-[11px] pr-2" title={hotelDisplay}>
                      {hotelDisplay}
                    </div>
                  </td>
                  <td className="px-2.5 py-2.5">
                    <div className="font-medium text-blue-600 dark:text-blue-400 truncate text-[11px] pr-2" title={codeDisplay}>
                      {codeDisplay}
                    </div>
                  </td>`;

content = content.replace(oldCells, newCells);
fs.writeFileSync(file, content, 'utf8');
