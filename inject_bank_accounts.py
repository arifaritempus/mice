import re

with open('frontend/src/app/accounting/cash-flow/page.tsx', 'r') as f:
    content = f.read()

# 1. Add supabase import
content = content.replace(
    'ticketOptionsService,\n} from "@/lib/supabaseService";',
    'ticketOptionsService,\n  supabase,\n} from "@/lib/supabaseService";'
)

# 2. Add to CashFlowItem
content = content.replace(
    'exchange_rate?: number;\n}',
    'exchange_rate?: number;\n  hotel_id?: string;\n  supplier_id?: string;\n  agency_id?: string;\n}'
)

# 3. Add to Collection mapping
content = content.replace(
    'agency_name: project?.agencies?.name || "",',
    'agency_name: project?.agencies?.name || "",\n            agency_id: project?.agency_id || "",'
)

# 4. Add to Payment mapping
content = content.replace(
    'hotel: hotelValue, // plan.hotel veya project.hotels.name',
    'hotel: hotelValue,\n            hotel_id: plan.hotel_id || project?.hotel_id || "",\n            supplier_id: plan.supplier_id || "",'
)

# 5. Add state and useEffect
state_target = r'const \[selectedItem, setSelectedItem\] = useState<CashFlowItem \| null>\(null\);'
state_replacement = r'''const [selectedItem, setSelectedItem] = useState<CashFlowItem | null>(null);
  const [selectedBankAccounts, setSelectedBankAccounts] = useState<any[]>([]);
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(false);

  useEffect(() => {
    if (!selectedItem || !isModalOpen) {
      setSelectedBankAccounts([]);
      return;
    }

    const fetchBankAccounts = async () => {
      setLoadingBankAccounts(true);
      try {
        let table = "";
        let id = "";
        if (selectedItem.type === "payment") {
          if (selectedItem.hotel_id) { table = "hotels"; id = selectedItem.hotel_id; }
          else if (selectedItem.supplier_id) { table = "suppliers"; id = selectedItem.supplier_id; }
        } else if (selectedItem.type === "collection") {
          if (selectedItem.agency_id) { table = "agencies"; id = selectedItem.agency_id; }
        }

        if (table && id) {
          const { data, error } = await supabase.from(table).select('bank_accounts').eq('id', id).single();
          if (!error && data?.bank_accounts) {
            setSelectedBankAccounts(Array.isArray(data.bank_accounts) ? data.bank_accounts : (typeof data.bank_accounts === 'string' ? JSON.parse(data.bank_accounts) : []));
          } else {
            setSelectedBankAccounts([]);
          }
        } else {
          setSelectedBankAccounts([]);
        }
      } catch (e) {
        console.error("Bank accounts fetch error:", e);
      } finally {
        setLoadingBankAccounts(false);
      }
    };
    
    fetchBankAccounts();
  }, [selectedItem, isModalOpen]);'''
content = re.sub(state_target, state_replacement, content)

# 6. Add UI
ui_target = r'''(<div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-3xl border border-gray-100 dark:border-v3-border">
\s*<p className="text-\[10px\] font-black text-v3-muted uppercase tracking-widest mb-2">
\s*AÇIKLAMA VE NOTLAR
\s*</p>
\s*<p className="text-sm text-v3-text font-bold leading-relaxed">
\s*\{selectedItem\.description \|\|
\s*"Bu işlem için ek bir açıklama girilmemiş\."\}
\s*</p>
\s*</div>)'''

ui_replacement = r'''\1
                
                {/* BANKA HESAP BİLGİLERİ */}
                {(loadingBankAccounts || selectedBankAccounts.length > 0) && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-3xl border border-gray-100 dark:border-v3-border mt-4">
                    <p className="text-[10px] font-black text-v3-muted uppercase tracking-widest mb-3">
                      BANKA HESAP BİLGİLERİ
                    </p>
                    {loadingBankAccounts ? (
                      <div className="flex justify-center p-4">
                        <LoadingSpinner />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedBankAccounts.map((account: any, index: number) => (
                          <div key={index} className="p-3 bg-white dark:bg-v3-surface rounded-xl border border-gray-100 dark:border-v3-border shadow-sm">
                            <p className="text-xs font-black text-v3-text mb-1">{account.bankName || "Bilinmeyen Banka"}</p>
                            <p className="text-[10px] text-v3-muted font-mono">{account.iban || "-"}</p>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100 dark:border-v3-border">
                              <span className="text-[9px] font-bold text-v3-muted uppercase">{account.recipient || "-"}</span>
                              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded text-[9px] font-black">{account.currency || "TRY"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}'''

content = re.sub(ui_target, ui_replacement, content)

with open('frontend/src/app/accounting/cash-flow/page.tsx', 'w') as f:
    f.write(content)
