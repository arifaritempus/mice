import React, { useState, useEffect } from "react";
import { X, CheckCircle, Trash2, Camera, FileText, Search, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

interface Props {
  invoice: any;
  categories: any[];
  onClose: () => void;
  onSuccess: () => void;
  lockEntitySelection?: boolean;
}

export default function EditAIInvoiceModal({ invoice, categories, onClose, onSuccess, lockEntitySelection = false }: Props) {
  const [extractedData, setExtractedData] = useState<any>(invoice.extracted_data || { items: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [entityType, setEntityType] = useState<"MICE" | "SEJOUR" | "GENERAL">(invoice.entity_type || "MICE");
  const [entityId, setEntityId] = useState<string>(invoice.entity_id || "");
  const [dbEntities, setDbEntities] = useState<{ id: string, name: string }[]>([]);
  const [isLoadingEntities, setIsLoadingEntities] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (entityType === "GENERAL") return;
    const fetchEntities = async () => {
      setIsLoadingEntities(true);
      try {
        if (entityType === "MICE") {
          const { data, error } = await supabase
            .from("projects")
            .select(`id, project_code, title, company_name, start_date, end_date, agencies(name), hotels(name)`)
            .order("created_at", { ascending: false });
            
          if (!error && data) {
            setDbEntities(data.map((p: any) => ({ 
              id: p.id, 
              name: `[${p.project_code || p.title || 'KOD YOK'}] ${p.start_date ? new Date(p.start_date).toLocaleDateString("tr-TR") : "-"} - ${p.end_date ? new Date(p.end_date).toLocaleDateString("tr-TR") : "-"} | ${p.company_name || 'Firma Yok'} | Acente: ${p.agencies?.name || "-"} | Otel: ${p.hotels?.name || "-"}` 
            })));
          }
        } else if (entityType === "SEJOUR") {
          const { data, error } = await supabase
            .from("sejours")
            .select(`id, voucher_number, customer_name, check_in_date, check_out_date, agencies(name), hotels(name)`)
            .order("created_at", { ascending: false });
            
          if (!error && data) {
            setDbEntities(data.map((s: any) => ({ 
              id: s.id, 
              name: `[${s.voucher_number || 'VOUCHER YOK'}] ${s.customer_name || 'İsimsiz'} | ${s.check_in_date ? new Date(s.check_in_date).toLocaleDateString("tr-TR") : "-"} - ${s.check_out_date ? new Date(s.check_out_date).toLocaleDateString("tr-TR") : "-"} | Acente: ${s.agencies?.name || "-"} | Otel: ${s.hotels?.name || "-"}` 
            })));
          }
        }
      } catch (err) {
        console.error("Entity fetch error:", err);
      } finally {
        setIsLoadingEntities(false);
      }
    };
    fetchEntities();
  }, [entityType]);

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/invoices/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          invoiceId: invoice.id, 
          category: extractedData.category,
          extracted_data: extractedData,
          entity_type: entityType,
          entity_id: entityType === "GENERAL" ? null : entityId
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      toast.error("Fatura güncellenirken hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-v3-bg dark:bg-v3-bg-dark rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-v3-border dark:border-v3-border-dark">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-v3-border dark:border-v3-border-dark flex justify-between items-center bg-white/50 dark:bg-gray-900/50">
          <div>
            <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Faturayı Düzenle
            </h2>
            <p className="text-sm font-medium text-v3-text-muted mt-1">
              Sisteme kaydedilmiş faturanın detaylarını güncelleyin.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 sm:p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors group"
          >
            <X className="w-6 h-6 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
          
          {/* Tür & Proje/Sejour Seçimi */}
          {!lockEntitySelection && (
          <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">Bağlı Olduğu Kayıt (Proje / Sejour)</h4>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-1/3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Fatura Türü</label>
                <div className="flex gap-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-1">
                  <button 
                    onClick={() => { setEntityType("MICE"); setEntityId(""); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${entityType === "MICE" ? "bg-blue-100 text-blue-700 shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}
                  >
                    MICE
                  </button>
                  <button 
                    onClick={() => { setEntityType("SEJOUR"); setEntityId(""); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${entityType === "SEJOUR" ? "bg-purple-100 text-purple-700 shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}
                  >
                    SEJOUR
                  </button>
                  <button 
                    onClick={() => { setEntityType("GENERAL"); setEntityId(""); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${entityType === "GENERAL" ? "bg-slate-100 text-slate-700 shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}
                  >
                    GENEL
                  </button>
                </div>
              </div>

              {entityType !== "GENERAL" && (
                <div className="w-full sm:w-2/3 relative min-w-0">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    {entityType === "MICE" ? "Bağlı Proje Seçimi" : "Bağlı Rezervasyon (Sejour) Seçimi"}
                  </label>
                  <div className="relative">
                    <button 
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none hover:border-blue-500 transition-all shadow-sm flex items-center justify-between"
                    >
                      <span className="block truncate pr-4 text-left">
                        {entityId 
                          ? dbEntities.find(e => e.id === entityId)?.name || "Yükleniyor..." 
                          : (entityType === "MICE" ? "Proje Seçiniz..." : "Sejour Voucher Seçiniz...")}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </button>

                    {dropdownOpen && (
                      <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-[300px] flex flex-col overflow-hidden">
                        <div className="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                          <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                              type="text" 
                              placeholder="Ara..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 outline-none"
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto flex-1 p-1">
                          {isLoadingEntities ? (
                            <div className="p-4 text-center text-sm text-gray-500">Yükleniyor...</div>
                          ) : (
                            dbEntities.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())).map(entity => (
                              <button
                                key={entity.id}
                                onClick={() => {
                                  setEntityId(entity.id);
                                  setDropdownOpen(false);
                                  setSearchTerm("");
                                }}
                                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${entityId === entity.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'}`}
                              >
                                {entity.name}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          )}

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-v3-text-muted uppercase tracking-wider">Fatura Numarası</label>
              <input 
                type="text" 
                value={extractedData.invoiceNo || ""}
                onChange={(e) => setExtractedData({ ...extractedData, invoiceNo: e.target.value })}
                className="w-full bg-v3-bg dark:bg-v3-bg-dark border border-v3-border dark:border-v3-border-dark rounded-xl px-4 py-3 text-sm font-bold text-v3-text outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-v3-text-muted uppercase tracking-wider">Tarih</label>
              <input 
                type="date" 
                value={extractedData.date || ""}
                onChange={(e) => setExtractedData({ ...extractedData, date: e.target.value })}
                className="w-full bg-v3-bg dark:bg-v3-bg-dark border border-v3-border dark:border-v3-border-dark rounded-xl px-4 py-3 text-sm font-bold text-v3-text outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-v3-text-muted uppercase tracking-wider">Tedarikçi / Cari Unvanı</label>
            <input 
              type="text" 
              value={extractedData.supplier || ""}
              onChange={(e) => setExtractedData({ ...extractedData, supplier: e.target.value })}
              className="w-full bg-v3-bg dark:bg-v3-bg-dark border border-v3-border dark:border-v3-border-dark rounded-xl px-4 py-3 text-sm font-bold text-v3-text outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-v3-text-muted uppercase tracking-wider">Kategori</label>
            <select
              value={extractedData.category || ""}
              onChange={(e) => setExtractedData({ ...extractedData, category: e.target.value })}
              className="w-full bg-v3-bg dark:bg-v3-bg-dark border border-v3-border dark:border-v3-border-dark rounded-xl px-4 py-3 text-sm font-bold text-v3-text outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
            >
              <option value="">Kategori Seçin</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Fatura Kalemleri (Items) */}
          <div className="p-6 bg-v3-bg/50 dark:bg-v3-bg-dark/50 border border-v3-border dark:border-v3-border-dark rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-v3-text">Fatura Kalemleri</h4>
              <button 
                onClick={() => {
                  const newItem = { id: Math.random().toString(36).substring(7), description: "", subtotal: 0, taxRate: 0, total: 0 };
                  setExtractedData({
                    ...extractedData,
                    items: [...(extractedData.items || []), newItem]
                  });
                }}
                className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
              >
                + Yeni Kalem
              </button>
            </div>

            <div className="space-y-3">
              {(extractedData.items || []).map((item: any, index: number) => (
                <div key={item.id || index} className="grid grid-cols-12 gap-3 items-end bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="col-span-12 lg:col-span-5 space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase truncate block">Açıklama</label>
                    <input 
                      type="text" 
                      value={item.description}
                      onChange={(e) => {
                        const newItems = [...extractedData.items];
                        newItems[index].description = e.target.value;
                        setExtractedData({ ...extractedData, items: newItems });
                      }}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-blue-500"
                      placeholder="Kalem açıklaması"
                    />
                  </div>
                  <div className="col-span-4 lg:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase truncate block">Matrah</label>
                    <input 
                      type="number" 
                      value={item.subtotal || ""}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const newItems = [...extractedData.items];
                        newItems[index].subtotal = val;
                        newItems[index].total = val * (1 + (newItems[index].taxRate || 0) / 100);
                        
                        const globalSubtotal = newItems.reduce((acc, curr) => acc + (curr.subtotal || 0), 0);
                        const globalTotal = newItems.reduce((acc, curr) => acc + (curr.total || 0), 0);
                        const globalTax = globalSubtotal > 0 ? ((globalTotal - globalSubtotal) / globalSubtotal) * 100 : 0;
                        
                        setExtractedData({ ...extractedData, items: newItems, subtotal: globalSubtotal, total: globalTotal, tax: Math.round(globalTax) });
                      }}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-blue-500 text-right"
                    />
                  </div>
                  <div className="col-span-4 lg:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase truncate block">KDV(%)</label>
                    <input 
                      type="number" 
                      value={item.taxRate === 0 ? "0" : (item.taxRate || "")}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const newItems = [...extractedData.items];
                        newItems[index].taxRate = val;
                        newItems[index].subtotal = (newItems[index].total || 0) / (1 + val / 100);
                        
                        const globalSubtotal = newItems.reduce((acc, curr) => acc + (curr.subtotal || 0), 0);
                        const globalTotal = newItems.reduce((acc, curr) => acc + (curr.total || 0), 0);
                        const globalTax = globalSubtotal > 0 ? ((globalTotal - globalSubtotal) / globalSubtotal) * 100 : 0;

                        setExtractedData({ ...extractedData, items: newItems, subtotal: globalSubtotal, total: globalTotal, tax: Math.round(globalTax) });
                      }}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-blue-500 text-center"
                    />
                  </div>
                  <div className="col-span-3 lg:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-blue-500 uppercase truncate block" title="Toplam (KDV Dahil)">Toplam (Dahil)</label>
                    <input 
                      type="number" 
                      value={item.total === 0 ? "" : (item.total || "")}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const newItems = [...extractedData.items];
                        newItems[index].total = val;
                        newItems[index].subtotal = val / (1 + (newItems[index].taxRate || 0) / 100);
                        
                        const globalSubtotal = newItems.reduce((acc, curr) => acc + (curr.subtotal || 0), 0);
                        const globalTotal = newItems.reduce((acc, curr) => acc + (curr.total || 0), 0);
                        const globalTax = globalSubtotal > 0 ? ((globalTotal - globalSubtotal) / globalSubtotal) * 100 : 0;

                        setExtractedData({ ...extractedData, items: newItems, subtotal: globalSubtotal, total: globalTotal, tax: Math.round(globalTax) });
                      }}
                      className="w-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-xs font-bold text-blue-700 dark:text-blue-300 outline-none focus:border-blue-500 text-right shadow-sm"
                    />
                  </div>
                  <div className="col-span-1 lg:col-span-1 flex items-center justify-center">
                    <button 
                      onClick={() => {
                        const newItems = extractedData.items.filter((_: any, i: number) => i !== index);
                        const globalSubtotal = newItems.reduce((acc: number, curr: any) => acc + (curr.subtotal || 0), 0);
                        const globalTotal = newItems.reduce((acc: number, curr: any) => acc + (curr.total || 0), 0);
                        const globalTax = globalSubtotal > 0 ? ((globalTotal - globalSubtotal) / globalSubtotal) * 100 : 0;

                        setExtractedData({ ...extractedData, items: newItems, subtotal: globalSubtotal, total: globalTotal, tax: Math.round(globalTax) });
                      }}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mb-0.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {(!extractedData.items || extractedData.items.length === 0) && (
                <div className="text-center py-6 text-sm text-gray-400 font-medium border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                  Henüz fatura kalemi eklenmedi.
                </div>
              )}
            </div>

            <div className="pt-5 border-t border-v3-border dark:border-v3-border-dark flex items-end justify-between">
              <div className="w-1/3">
                <label className="text-[10px] font-bold text-v3-text-muted uppercase tracking-wider mb-1 block">Para Birimi</label>
                <select 
                  value={extractedData.currency || "TRY"}
                  onChange={(e) => setExtractedData({ ...extractedData, currency: e.target.value })}
                  className="w-full bg-white dark:bg-gray-800 border border-v3-border dark:border-v3-border-dark rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-blue-500 shadow-sm"
                >
                  <option value="TRY">TRY</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              
              <div className="text-right">
                <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">Genel Toplam</label>
                <div className="text-3xl font-black text-blue-700 dark:text-blue-300 tracking-tight">
                  {Number(extractedData.total || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-lg font-bold text-blue-600/60 ml-2">{extractedData.currency || "TRY"}</span>
                </div>
                <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase">
                  Toplam Matrah: {Number(extractedData.subtotal || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-v3-border dark:border-v3-border-dark bg-gray-50/50 dark:bg-gray-900/50">
          <button 
            onClick={handleSave}
            disabled={isSubmitting}
            className={`w-full py-4 rounded-xl text-base font-bold shadow-xl transition-all flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 hover:-translate-y-1 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <CheckCircle className="w-6 h-6" /> 
            {isSubmitting ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
