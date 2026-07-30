import re

with open("frontend/src/app/requests/page.tsx", "r") as f:
    text = f.read()

# Add supabase import if not present
if "import { supabase }" not in text:
    text = text.replace('import { toast } from "react-hot-toast";', 'import { toast } from "react-hot-toast";\nimport { supabase } from "@/lib/supabase";')
    
# Add useEffect for fetching
fetch_code = """
  const [requests, setRequests] = useState<any[]>([]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error, count } = await supabase
        .from("mice_requests")
        .select(`
          *,
          agencies (name)
        `, { count: "exact" })
        .order("created_at", { ascending: false });

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
  }, [page, pageSize]);
"""

# Insert fetch_code right after totalCount state
if "const [requests, setRequests] = useState" not in text:
    text = text.replace("const [totalCount, setTotalCount] = useState(0);", "const [totalCount, setTotalCount] = useState(0);\n" + fetch_code)

# Replace the empty state in tbody with mapping over requests
mapping_code = """
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-20 text-center">
                    <p className="text-v3-muted text-sm font-medium">Filtrelere uygun kayıt bulunamadı.</p>
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-v3-surface transition-colors">
                    <td className="px-4 py-3 text-xs text-v3-text whitespace-nowrap">{req.request_date ? new Date(req.request_date).toLocaleDateString("tr-TR") : "-"}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-blue-600 whitespace-nowrap">{req.reference || "-"}</td>
                    <td className="px-4 py-3 text-xs text-v3-text whitespace-nowrap">{req.date_type === "EXACT" ? `${req.date_details?.check_in ? new Date(req.date_details.check_in).toLocaleDateString("tr-TR") : "-"} - ${req.date_details?.check_out ? new Date(req.date_details.check_out).toLocaleDateString("tr-TR") : "-"}` : req.date_details?.text || "-"}</td>
                    <td className="px-4 py-3 text-xs text-v3-text whitespace-nowrap text-center font-bold bg-blue-50/50 dark:bg-blue-900/10">{req.nights || 0} Gece</td>
                    <td className="px-4 py-3 text-xs text-v3-text whitespace-nowrap">{req.room_details?.type === "TOTAL" ? `${req.room_details?.room || 0} / ${req.room_details?.pax || 0}` : `${(req.room_details?.sng||0) + (req.room_details?.dbl||0) + (req.room_details?.trp||0)} Oda`}</td>
                    <td className="px-4 py-3 text-xs text-v3-text whitespace-nowrap">{req.company_name || "-"}</td>
                    <td className="px-4 py-3 text-xs text-v3-text whitespace-nowrap">{req.agencies?.name || "-"}</td>
                    <td className="px-4 py-3 text-xs text-v3-text whitespace-nowrap text-center"><button className="text-blue-500 hover:underline">Otelleri Gör</button></td>
                    <td className="px-4 py-3 text-xs text-center">{req.meeting?.requested ? <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold">VAR</span> : "-"}</td>
                    <td className="px-4 py-3 text-xs text-center">{req.cocktail?.requested ? <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded font-bold">VAR</span> : "-"}</td>
                    <td className="px-4 py-3 text-xs text-center">{req.gala?.requested ? <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-bold">VAR</span> : "-"}</td>
                    <td className="px-4 py-3 text-xs text-center"><span className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 px-2 py-1 rounded font-medium">{req.status}</span></td>
                    <td className="px-4 py-3 text-xs text-right whitespace-nowrap">
                       <button className="text-blue-500 font-medium hover:underline">Detay</button>
                    </td>
                  </tr>
                ))
              )}
"""

text = re.sub(r'<tr>\s*<td colSpan=\{13\} className="py-20 text-center">.*?</tr>', mapping_code, text, flags=re.DOTALL)

with open("frontend/src/app/requests/page.tsx", "w") as f:
    f.write(text)
print("Updated requests list successfully!")
