import re

with open("frontend/src/app/requests/page.tsx", "r") as f:
    text = f.read()

# 1. Update tooltip styling (Light mode, clean)
old_tooltip = r'<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-\[10px\] rounded-lg p-2 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">.*?<div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>\s*</div>'

new_tooltip = """<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl text-gray-700 dark:text-gray-200 text-xs rounded-xl p-3 opacity-0 group-hover/tooltip:opacity-100 transition-all pointer-events-none z-50">
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
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-white dark:border-t-gray-800 drop-shadow-sm"></div>
                      </div>"""
text = re.sub(old_tooltip, new_tooltip, text, flags=re.DOTALL)

# 2. Update default date states and add filtering logic
text = text.replace('const [dateStart, setDateStart] = useState<string>("");', 'const [dateStart, setDateStart] = useState<string>(new Date().toISOString().split("T")[0]);')
text = text.replace('const [dateEnd, setDateEnd] = useState<string>("");', 'const [dateEnd, setDateEnd] = useState<string>(new Date().toISOString().split("T")[0]);')

# Update fetchRequests to use filters
fetch_func_old = """const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error, count } = await supabase
        .from("mice_requests")
        .select(`
          *,
          agencies (name),
          mice_request_hotels (
            hotels (name)
          )
        `, { count: "exact" })
        .order("created_at", { ascending: false });"""

fetch_func_new = """const fetchRequests = async () => {
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
      
      if (dateStart) query = query.gte("request_date", dateStart);
      if (dateEnd) query = query.lte("request_date", dateEnd);
      if (globalInput) {
        query = query.or(`reference.ilike.%${globalInput}%,company_name.ilike.%${globalInput}%`);
      }

      const { data, error, count } = await query.order("created_at", { ascending: false });"""
text = text.replace(fetch_func_old, fetch_func_new)

# Add dependencies to useEffect
text = text.replace('useEffect(() => {\n    fetchRequests();\n  }, [page, pageSize]);', 'useEffect(() => {\n    fetchRequests();\n  }, [page, pageSize, dateStart, dateEnd, globalInput]);')

with open("frontend/src/app/requests/page.tsx", "w") as f:
    f.write(text)

print("requests/page.tsx updated successfully!")
