import re

with open("frontend/src/app/requests/page.tsx", "r") as f:
    text = f.read()

# Add ConfirmModal and Icons imports
if "ConfirmModal" not in text:
    text = text.replace('import LoadingSpinner from "@/components/LoadingSpinner";', 'import LoadingSpinner from "@/components/LoadingSpinner";\nimport ConfirmModal from "@/components/ConfirmModal";\nimport { Edit, Copy, Trash2 } from "lucide-react";')

# Update fetch to include hotels
fetch_original = """        .select(`
          *,
          agencies (name)
        `, { count: "exact" })"""
fetch_new = """        .select(`
          *,
          agencies (name),
          mice_request_hotels (
            hotels (name)
          )
        `, { count: "exact" })"""
text = text.replace(fetch_original, fetch_new)

# Add ConfirmModal state and delete handler
if "const [deleteModal, setDeleteModal]" not in text:
    modal_state = """
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
     // Optional: To be implemented fully later. Basic shell for copy.
     toast.success("Kopyalama özelliği detay sayfasından yapılabilecektir.");
  };
"""
    text = text.replace("const fetchRequests = async () => {", modal_state + "\n  const fetchRequests = async () => {")

# Add ConfirmModal JSX at the end of the return
if "<ConfirmModal" not in text:
    modal_jsx = """      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Talebi Sil"
        message={`'${deleteModal.title}' referanslı talebi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ isOpen: false, id: "", title: "" })}
      />
    </div>
  );
}"""
    text = text.replace("    </div>\n  );\n}", modal_jsx)

# Replace table row mapping with double click and new icons
row_original = r'requests\.map\(\(req\) => \(\s*<tr key=\{req\.id\} className="hover:bg-v3-surface transition-colors">.*?</tr>\s*\)\)'
row_new = """requests.map((req) => (
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
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-[10px] rounded-lg p-2 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
                        {req.mice_request_hotels && req.mice_request_hotels.length > 0 ? (
                          <ul className="text-left space-y-1">
                            {req.mice_request_hotels.map((h:any, i:number) => (
                              <li key={i}>• {h.hotels?.name || "Bilinmiyor"}</li>
                            ))}
                          </ul>
                        ) : (
                          "Otel bulunamadı"
                        )}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-center">{req.meeting?.requested ? <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold">VAR</span> : "-"}</td>
                    <td className="px-4 py-3 text-xs text-center">{req.cocktail?.requested ? <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded font-bold">VAR</span> : "-"}</td>
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
                ))"""
text = re.sub(row_original, row_new, text, flags=re.DOTALL)

with open("frontend/src/app/requests/page.tsx", "w") as f:
    f.write(text)

print("Applied updates successfully!")
