const fs = require('fs');
const file = 'src/app/accounting/invoices/income/completed/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `<table className="min-w-full divide-y divide-white/10 relative">
            <thead className="bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-10 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Fatura Tarihi
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Fatura No
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Cari
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Firma / Acente
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Otel
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Hizmet Tarihi
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Voucher / Ref
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Tutar
                </th>
                <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {displayInvoices.map((inv) => (
                <tr 
                  key={inv.id} 
                  className="hover:bg-slate-800/50 transition-colors border-b border-white/5 cursor-pointer"
                  onDoubleClick={(e) => handlePreview(inv, e as any)}
                  title="Görüntülemek için çift tıklayın"
                >
                  <td className="px-6 py-3 text-[13px] text-slate-300 whitespace-nowrap">
                    {new Date(inv.date).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-3">
                    <span className="px-2.5 py-1 text-[11px] font-black tracking-wider rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {inv.invoice_no}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="text-[13px] text-slate-200 font-medium">{inv.contact_name}</div>
                  </td>
                  <td className="px-6 py-3 max-w-[14rem]">
                    {inv.metadata?.company_name ? (
                      <div className="text-[12px] text-slate-300 font-medium truncate" title={inv.metadata.company_name}>
                        {inv.metadata.company_name}
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[12px]">-</span>
                    )}
                  </td>
                  <td className="px-6 py-3 max-w-[12rem]">
                    {inv.metadata?.hotel_name ? (
                      <div className="text-[11px] text-slate-400 truncate" title={inv.metadata.hotel_name}>
                        {inv.metadata.hotel_name}
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[12px]">-</span>
                    )}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    {inv.metadata?.date_start || inv.metadata?.date_end ? (
                      <span className="text-[11px] text-emerald-400 font-medium">
                        {formatDate(inv.metadata.date_start)} → {formatDate(inv.metadata.date_end)}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[12px]">-</span>
                    )}
                  </td>
                  <td className="px-6 py-3 max-w-[12rem]">
                    {voucherDisplay(inv) ? (
                      <span className="text-[12px] font-bold text-slate-300 truncate block" title={voucherDisplay(inv)}>
                        {voucherDisplay(inv)}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[12px]">-</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right text-[13px] font-black text-slate-100 whitespace-nowrap">
                    {formatCurrency(inv.total_amount, inv.currency)}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={(e) => handlePreview(inv, e)}
                        className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors bg-white/5 hover:bg-blue-500/10 rounded-md"
                        title="Görüntüle / Yazdır"
                        type="button"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleEdit(inv, e)}
                        className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors bg-white/5 hover:bg-amber-500/10 rounded-md"
                        title="Düzenle"
                        type="button"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(inv.id, inv.invoice_no, e)}
                        className="p-1.5 text-slate-400 hover:text-red-400 transition-colors bg-white/5 hover:bg-red-500/10 rounded-md"
                        title="Sil"
                        type="button"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center italic text-slate-500">
                    Kayıtlı fatura bulunamadı veya filtrelere uyan sonuç yok.
                  </td>
                </tr>
              )}
            </tbody>

          </table>`;

const replacement = `<table className="min-w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fatura Tarihi
                </th>
                <th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fatura No
                </th>
                <th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cari
                </th>
                <th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Firma / Acente
                </th>
                <th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Otel
                </th>
                <th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Hizmet Tarihi
                </th>
                <th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Voucher / Ref
                </th>
                <th className="px-2.5 py-2.5 text-right text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tutar
                </th>
                <th className="px-2.5 py-2.5 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {displayInvoices.map((inv) => (
                <tr 
                  key={inv.id} 
                  className="hover:bg-blue-500/10 transition-colors group border-b border-white/5 last:border-0 cursor-pointer"
                  onDoubleClick={(e) => handlePreview(inv, e as any)}
                  title="Görüntülemek için çift tıklayın"
                >
                  <td className="px-2.5 py-2.5 text-[11px] text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {new Date(inv.date).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-2.5 py-2.5">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      {inv.invoice_no}
                    </span>
                  </td>
                  <td className="px-2.5 py-2.5">
                    <div className="text-[11px] text-slate-700 dark:text-slate-200 font-medium">{inv.contact_name}</div>
                  </td>
                  <td className="px-2.5 py-2.5 max-w-[14rem]">
                    {inv.metadata?.company_name ? (
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate" title={inv.metadata.company_name}>
                        {inv.metadata.company_name}
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 text-[11px]">-</span>
                    )}
                  </td>
                  <td className="px-2.5 py-2.5 max-w-[12rem]">
                    {inv.metadata?.hotel_name ? (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate" title={inv.metadata.hotel_name}>
                        {inv.metadata.hotel_name}
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 text-[10px]">-</span>
                    )}
                  </td>
                  <td className="px-2.5 py-2.5 whitespace-nowrap">
                    {inv.metadata?.date_start || inv.metadata?.date_end ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        {formatDate(inv.metadata.date_start)} → {formatDate(inv.metadata.date_end)}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 text-[10px]">-</span>
                    )}
                  </td>
                  <td className="px-2.5 py-2.5 max-w-[12rem]">
                    {voucherDisplay(inv) ? (
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate block" title={voucherDisplay(inv)}>
                        {voucherDisplay(inv)}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 text-[10px]">-</span>
                    )}
                  </td>
                  <td className="px-2.5 py-2.5 text-right text-[11px] font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                    {formatCurrency(inv.total_amount, inv.currency)}
                  </td>
                  <td className="px-2.5 py-2.5 text-center">
                    <div className="flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handlePreview(inv, e)}
                        className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                        title="Görüntüle / Yazdır"
                        type="button"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleEdit(inv, e)}
                        className="p-1 text-slate-400 hover:text-amber-500 transition-colors"
                        title="Düzenle"
                        type="button"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(inv.id, inv.invoice_no, e)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        title="Sil"
                        type="button"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center italic text-slate-500">
                    Kayıtlı fatura bulunamadı veya filtrelere uyan sonuç yok.
                  </td>
                </tr>
              )}
            </tbody>

          </table>`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content, 'utf8');
