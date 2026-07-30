"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MultiTokenFilterInput from "@/components/MultiTokenFilterInput";
import ResponsiveDateRangeField from "@/components/ResponsiveDateRangeField";
import PaginationControls from "@/components/PaginationControls";
import { usePermissions, Module } from "@/lib/permissions";
import { DEFAULT_PAGE_SIZE } from "@/types/pagination";
import LoadingSpinner from "@/components/LoadingSpinner";
import ConfirmModal from "@/components/ConfirmModal";
import { Edit, Copy, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/supabase";

export default function RequestsPage() {
  const router = useRouter();
  
  const { canView, canCreate, canEdit, canDelete, loading: permissionsLoading } = usePermissions();
  
  const [loading, setLoading] = useState(false);
  const [globalTokens, setGlobalTokens] = useState<string[]>([]);
  const [globalInput, setGlobalInput] = useState("");
  
  const [reqDateStart, setReqDateStart] = useState<string>(new Date().toISOString().split("T")[0]);
  const [reqDateEnd, setReqDateEnd] = useState<string>("");

  const [eventDateStart, setEventDateStart] = useState<string>("");
  const [eventDateEnd, setEventDateEnd] = useState<string>("");

  const addToken = (value: string, setTokens: any, setInput: any) => {
    if (value && !globalTokens.includes(value)) {
      setTokens([...globalTokens, value]);
    }
    setInput("");
  };

  const removeToken = (tokenToRemove: string, setTokens: any) => {
    setTokens(globalTokens.filter((token) => token !== tokenToRemove));
  };

  // Scaffolding pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);

  const [requests, setRequests] = useState<any[]>([]);

  
  // Deletion State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: "", title: "" });

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    try {
      const { error } = await supabase.from("mice_requests").delete().eq("id", deleteModal.id);
      if (error) throw error;
      toast.success("Talep başarıyla silindi!");
      fetchRequests();
    } catch (err: any) {
      console.error(err);
      toast.error("Silme işlemi başarısız: " + err.message);
    } finally {
      setDeleteModal({ isOpen: false, id: "", title: "" });
    }
  };

  const handleCopy = async (req: any) => {
    try {
      setLoading(true);
      // Fetch full request
      const { data: fullReq, error: fetchErr } = await supabase.from("mice_requests").select("*, mice_request_hotels(hotel_id)").eq("id", req.id).single();
      if (fetchErr) throw fetchErr;
      
      const { id, created_at, updated_at, reference, status, mice_request_hotels, ...rest } = fullReq;
      
      const newRef = (reference || "REQ") + "-KOPYA";
      
      const { data: newReq, error: insertErr } = await supabase.from("mice_requests").insert({
        ...rest,
        reference: newRef,
        status: "BEKLEMEDE"
      }).select().single();
      
      if (insertErr) throw insertErr;
      
      if (mice_request_hotels && mice_request_hotels.length > 0) {
        const hotelInserts = mice_request_hotels.map((h: any) => ({
          request_id: newReq.id,
          hotel_id: h.hotel_id,
          status: "BEKLEMEDE"
        }));
        await supabase.from("mice_request_hotels").insert(hotelInserts);
      }
      
      toast.success("Talep başarıyla kopyalandı!");
      fetchRequests();
    } catch (err: any) {
      console.error(err);
      toast.error("Kopyalama başarısız!");
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("mice_requests")
        .select(`
          *,
          agencies (name),
          mice_request_hotels (
            hotels (name)
          )
        `, { count: "exact" });
      
      if (reqDateStart) query = query.gte("request_date", reqDateStart);
      if (reqDateEnd) query = query.lte("request_date", reqDateEnd);
      if (eventDateStart) query = query.gte("date_details->>check_in", eventDateStart);
      if (eventDateEnd) query = query.lte("date_details->>check_out", eventDateEnd);
      if (globalInput) {
        query = query.or(`reference.ilike.%${globalInput}%,company_name.ilike.%${globalInput}%`);
      }

      const { data, error, count } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error(err);
      toast.error("Talepler yüklenemedi!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page, pageSize, reqDateStart, reqDateEnd, eventDateStart, eventDateEnd, globalInput]);


  if (permissionsLoading) {
    return <LoadingSpinner message="Yetkiler kontrol ediliyor..." />;
  }

  if (!canView(Module.QUOTES)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-xl shadow-sm border border-v3-border p-8 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Erişim Reddedildi</h3>
        <p className="text-gray-500 max-w-md">Talepler sayfasına erişim için yetkiniz bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-v3-bg">
      <div className="flex-1 overflow-auto p-4 md:p-6 pb-24">
        <div className="flex flex-col xl:flex-row gap-4 mb-4 items-start xl:items-center">
          {/* Left: Title */}
          <div className="shrink-0">
            <h1 className="text-xl font-light text-v3-text">Talepler</h1>
            <p className="text-xs text-v3-muted mt-1">
              MICE operasyonları için otel taleplerini yönetin
            </p>
          </div>

          {/* Right: All Filters and Actions */}
          <div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">
            {/* Dates */}
            <div className="w-[240px] shrink-0">
              <ResponsiveDateRangeField
                label="Talep Tarihi"
                startValue={reqDateStart}
                endValue={reqDateEnd}
                onStartChange={setReqDateStart}
                onEndChange={setReqDateEnd}
                onApply={() => {}}
              />
            </div>
            <div className="w-[240px] shrink-0">
              <ResponsiveDateRangeField
                label="Tarih Aralığı"
                startValue={eventDateStart}
                endValue={eventDateEnd}
                onStartChange={setEventDateStart}
                onEndChange={setEventDateEnd}
                onApply={() => {}}
              />
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <MultiTokenFilterInput
                label="Genel Arama (Firma, Acente, Referans...)"
                tokens={globalTokens}
                inputValue={globalInput}
                suggestions={[]}
                onInputChange={setGlobalInput}
                onAddToken={(value) =>
                  addToken(value, setGlobalTokens, setGlobalInput)
                }
                onRemoveToken={(value) => removeToken(value, setGlobalTokens)}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 border-l border-v3-border pl-3">
              <button
                type="button"
                className="bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30 hover:bg-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)] px-4 h-10 rounded-xl transition-all duration-300 text-xs font-medium flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Excel
              </button>
              {canCreate(Module.QUOTES) && (
                <button
                  onClick={() => router.push("/requests/create")}
                  className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] px-4 h-10 rounded-xl transition-all duration-300 text-xs font-medium flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  Yeni Talep
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Unified Stats Strip */}
        <div className="flex flex-wrap items-center gap-2 mb-2 bg-v3-surface backdrop-blur-md border border-v3-border rounded-xl p-2 shadow-sm shrink-0">
          <div className="flex flex-wrap items-center gap-1.5 pr-3">
            <span className="text-[10px] uppercase font-semibold text-v3-muted mr-1">
              DURUM:
            </span>
            <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 bg-blue-500/20 border-blue-500/50 text-blue-600 dark:text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.15)]">
              <span className="text-[10px] font-medium uppercase tracking-wider">Tümü</span>
              <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">0</span>
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 bg-transparent border-transparent hover:bg-v3-border text-v3-text">
              <span className="text-[10px] font-medium uppercase tracking-wider">Beklemede</span>
              <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">0</span>
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 bg-transparent border-transparent hover:bg-v3-border text-v3-text">
              <span className="text-[10px] font-medium uppercase tracking-wider">Kabul Edilen</span>
              <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">0</span>
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 bg-transparent border-transparent hover:bg-v3-border text-v3-text">
              <span className="text-[10px] font-medium uppercase tracking-wider">Reddedilen</span>
              <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">0</span>
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-v3-surface border border-v3-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-v3-border bg-v3-bg/50">
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-text uppercase tracking-wider whitespace-nowrap">Talep Tarihi</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-text uppercase tracking-wider whitespace-nowrap">Referans</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-text uppercase tracking-wider whitespace-nowrap">Tarih Aralığı</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-text uppercase tracking-wider whitespace-nowrap">Geceleme</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-text uppercase tracking-wider whitespace-nowrap">Oda / Pax</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-text uppercase tracking-wider whitespace-nowrap">Firma / Sektör</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-text uppercase tracking-wider whitespace-nowrap">Acente</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-text uppercase tracking-wider whitespace-nowrap">Çalışılan Oteller</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-text uppercase tracking-wider whitespace-nowrap text-center">W. COCKTAIL</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-text uppercase tracking-wider whitespace-nowrap text-center">BAR GECESİ</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-text uppercase tracking-wider whitespace-nowrap text-center">TOPLANTI</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-text uppercase tracking-wider whitespace-nowrap text-center">GALA</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-text uppercase tracking-wider whitespace-nowrap text-center">Mail Durumu</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-text uppercase tracking-wider whitespace-nowrap text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-20 text-center">
                    <p className="text-v3-muted text-sm font-medium">Filtrelere uygun kayıt bulunamadı.</p>
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr 
                    key={req.id} 
                    className="hover:bg-v3-surface transition-colors cursor-pointer group"
                    onDoubleClick={() => router.push(`/requests/edit/${req.id}`)}
                  >
                    <td className="px-4 py-3 text-xs text-v3-text whitespace-nowrap">{req.request_date ? new Date(req.request_date).toLocaleDateString("tr-TR") : "-"}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-blue-600 whitespace-nowrap">{req.reference || "-"}</td>
                    <td className="px-4 py-3 text-xs text-v3-text whitespace-nowrap">{req.date_type === "EXACT" ? `${req.date_details?.check_in ? new Date(req.date_details.check_in).toLocaleDateString("tr-TR") : "-"} - ${req.date_details?.check_out ? new Date(req.date_details.check_out).toLocaleDateString("tr-TR") : "-"}` : req.date_details?.text || "-"}</td>
                    <td className="px-4 py-3 text-xs text-v3-text whitespace-nowrap text-center font-bold bg-blue-50/50 dark:bg-blue-900/10">{req.nights || 0} Gece</td>
                    <td className="px-4 py-3 text-xs text-v3-text whitespace-nowrap">{req.room_details?.type === "TOTAL" ? `${req.room_details?.room || 0} / ${req.room_details?.pax || 0}` : `${(req.room_details?.sng||0) + (req.room_details?.dbl||0) + (req.room_details?.trp||0)} Oda`}</td>
                    <td className="px-4 py-3 text-xs text-v3-text whitespace-nowrap">{req.company_name || "-"}</td>
                    <td className="px-4 py-3 text-xs text-v3-text whitespace-nowrap">{req.agencies?.name || "-"}</td>
                    <td className="px-4 py-3 text-xs text-v3-text whitespace-nowrap text-center relative group/tooltip">
                      <span className="text-blue-500 font-medium cursor-help border-b border-dashed border-blue-500">
                        {req.mice_request_hotels?.length || 0} Otel
                      </span>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl text-gray-700 dark:text-gray-200 text-xs rounded-xl p-3 opacity-0 group-hover/tooltip:opacity-100 transition-all pointer-events-none z-[999]">
                        {req.mice_request_hotels && req.mice_request_hotels.length > 0 ? (
                          <ul className="text-left space-y-1.5 max-h-48 overflow-y-auto">
                            {req.mice_request_hotels.map((h:any, i:number) => (
                              <li key={i} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                                <span className="truncate" title={h.hotels?.name || "Bilinmiyor"}>{h.hotels?.name || "Bilinmiyor"}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          "Otel bulunamadı"
                        )}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-b-white dark:border-b-gray-800 drop-shadow-sm"></div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-center">{req.cocktail?.requested ? <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded font-bold">VAR</span> : "-"}</td>
                    <td className="px-4 py-3 text-xs text-center">{req.bar_night?.requested ? <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">VAR</span> : "-"}</td>
                    <td className="px-4 py-3 text-xs text-center">{req.meeting?.requested ? <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold">VAR</span> : "-"}</td>
                    <td className="px-4 py-3 text-xs text-center">{req.gala?.requested ? <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-bold">VAR</span> : "-"}</td>
                    <td className="px-4 py-3 text-xs text-center"><span className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 px-2 py-1 rounded font-medium">{req.status}</span></td>
                    <td className="px-4 py-3 text-xs text-right whitespace-nowrap">
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         {canEdit(Module.QUOTES) && (
                           <button onClick={() => router.push(`/requests/edit/${req.id}`)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Düzenle / İçine Gir">
                             <Edit className="w-4 h-4" />
                           </button>
                         )}
                         {canCreate(Module.QUOTES) && (
                           <button onClick={(e) => { e.stopPropagation(); handleCopy(req); }} className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors" title="Kopyala">
                             <Copy className="w-4 h-4" />
                           </button>
                         )}
                         {canDelete(Module.QUOTES) && (
                           <button onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, id: req.id, title: req.reference || req.company_name }); }} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Sil">
                             <Trash2 className="w-4 h-4" />
                           </button>
                         )}
                       </div>
                    </td>
                  </tr>
                ))
              )}

              </tbody>
            </table>
          </div>
          
          <div className="border-t border-v3-border bg-v3-surface">
            <PaginationControls
              page={page}
              pageSize={pageSize}
              total={totalCount}
              totalPages={1}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              preferenceKey="requests_page_size"
            />
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Talebi Sil"
        message={`'${deleteModal.title}' referanslı talebi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ isOpen: false, id: "", title: "" })}
      />
    </div>
  );
}
