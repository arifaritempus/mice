import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseService";
import { Plane, Car, Search, Calendar, Users, MapPin, ArrowRight, Download } from "lucide-react";
import { toast } from "react-hot-toast";

export default function CongressLogisticsTab({ projectId, project }: { projectId: string; project: any }) {
  const [loading, setLoading] = useState(true);
  const [flights, setFlights] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<"flights" | "transfers">("flights");
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch Flights
      const { data: flightData } = await supabase
        .from("project_flight_tickets")
        .select(`
          *,
          participant:project_participants(first_name, last_name, company_name, title, tc_passport)
        `)
        .eq("project_id", projectId);

      // Fetch Transfers
      const { data: transferData } = await supabase
        .from("project_transfer_tour")
        .select(`
          *,
          participant:project_participants(first_name, last_name, company_name, title)
        `)
        .eq("project_id", projectId);

      setFlights(flightData || []);
      setTransfers(transferData || []);
    } catch (err: any) {
      toast.error("Veriler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  if (loading) return <div className="p-8 text-center text-v3-muted">Lojistik verileri yükleniyor...</div>;

  // Filter flights
  const filteredFlights = flights.filter(f => {
    const term = searchTerm.toLowerCase();
    const p = f.participant || {};
    return (
      (p.first_name && p.first_name.toLowerCase().includes(term)) ||
      (p.last_name && p.last_name.toLowerCase().includes(term)) ||
      (f.gidis_ucus_kodu && f.gidis_ucus_kodu.toLowerCase().includes(term)) ||
      (f.guzergah && f.guzergah.toLowerCase().includes(term)) ||
      (f.guzergah && f.guzergah.toLowerCase().includes(term))
    );
  }).sort((a, b) => new Date(a.flight_date || 0).getTime() - new Date(b.flight_date || 0).getTime());

  // Filter transfers
  const filteredTransfers = transfers.filter(t => {
    const term = searchTerm.toLowerCase();
    const p = t.participant || {};
    return (
      (p.first_name && p.first_name.toLowerCase().includes(term)) ||
      (p.last_name && p.last_name.toLowerCase().includes(term)) ||
      (t.transfer_route && t.transfer_route.toLowerCase().includes(term)) ||
      (t.vehicle_type && t.vehicle_type.toLowerCase().includes(term))
    );
  }).sort((a, b) => new Date(a.transfer_date || 0).getTime() - new Date(b.transfer_date || 0).getTime());

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-v3-surface p-6 rounded-2xl border border-v3-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-blue-500 flex items-center gap-2">
            <Plane className="w-6 h-6" /> Uçuş & Transfer Manifestosu
          </h2>
          <p className="text-xs text-v3-muted mt-1">Katılımcıların varış, dönüş ve havalimanı transfer operasyonlarını anlık takip edin.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-v3-border">
          <button
            onClick={() => setActiveSubTab("flights")}
            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === "flights" ? "bg-white dark:bg-v3-bg text-blue-600 shadow-sm" : "text-v3-muted hover:text-v3-text"
            }`}
          >
            <Plane className="w-4 h-4" /> Uçuşlar ({flights.length})
          </button>
          <button
            onClick={() => setActiveSubTab("transfers")}
            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === "transfers" ? "bg-white dark:bg-v3-bg text-purple-600 shadow-sm" : "text-v3-muted hover:text-v3-text"
            }`}
          >
            <Car className="w-4 h-4" /> Transferler ({transfers.length})
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-v3-muted" />
          <input
            type="text"
            placeholder="İsim, uçuş no, parkur veya araç ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-white dark:bg-v3-surface border border-v3-border rounded-xl text-sm font-semibold focus:border-blue-500 outline-none transition-colors"
          />
        </div>
        
        {/* Placeholder for Excel Export */}
        <button className="h-10 px-4 bg-white dark:bg-v3-surface border border-v3-border hover:bg-black/5 rounded-xl text-xs font-bold text-v3-text transition-colors flex items-center gap-2 ml-auto">
          <Download className="w-4 h-4 text-emerald-500" /> Excel İndir
        </button>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-v3-surface rounded-2xl border border-v3-border shadow-sm overflow-hidden">
        {activeSubTab === "flights" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/5 dark:bg-white/5 text-xs font-bold text-v3-muted uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Katılımcı</th>
                  <th className="px-6 py-4 text-center">Uçuş Tarihi</th>
                  <th className="px-6 py-4 text-center">Uçuş No</th>
                  <th className="px-6 py-4">Parkur</th>
                  <th className="px-6 py-4 text-center">Bilet Sınıfı</th>
                  <th className="px-6 py-4 text-right">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-v3-border">
                {filteredFlights.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-v3-muted">Uçuş kaydı bulunamadı.</td></tr>
                ) : filteredFlights.map((f, i) => (
                  <tr key={f.id || i} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-3">
                      <p className="font-bold text-v3-text uppercase">{f.participant?.first_name} {f.participant?.last_name}</p>
                      <p className="text-[10px] text-v3-muted font-semibold">{f.participant?.company_name || "BİREYSEL"}</p>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold text-xs">
                        <Calendar className="w-3.5 h-3.5" />
                        {f.gidis_tarihi ? new Date(f.gidis_tarihi).toLocaleDateString("tr-TR") : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="font-mono font-black text-gray-700 dark:text-gray-300">{f.gidis_ucus_kodu || "-"}</span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-v3-text">
                        <span>{f.guzergah || "?"}</span>
                        <ArrowRight className="w-3 h-3 text-v3-muted" />
                        <span>{f.guzergah || "?"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-v3-muted">{f.ticket_class || "-"}</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                      <span className="text-xs font-bold text-emerald-600">ONAYLI</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeSubTab === "transfers" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/5 dark:bg-white/5 text-xs font-bold text-v3-muted uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Katılımcı</th>
                  <th className="px-6 py-4 text-center">Tarih</th>
                  <th className="px-6 py-4">Güzergah</th>
                  <th className="px-6 py-4 text-center">Araç Tipi</th>
                  <th className="px-6 py-4 text-center">Kişi Sayısı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-v3-border">
                {filteredTransfers.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-v3-muted">Transfer kaydı bulunamadı.</td></tr>
                ) : filteredTransfers.map((t, i) => (
                  <tr key={t.id || i} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-3">
                      <p className="font-bold text-v3-text uppercase">{t.participant?.first_name} {t.participant?.last_name}</p>
                      <p className="text-[10px] text-v3-muted font-semibold">{t.participant?.company_name || "BİREYSEL"}</p>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 font-bold text-xs">
                        <Calendar className="w-3.5 h-3.5" />
                        {t.transfer_date ? new Date(t.transfer_date).toLocaleDateString("tr-TR") : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-v3-text">
                        <MapPin className="w-3.5 h-3.5 text-purple-500" />
                        <span>{t.transfer_route || "-"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-[10px] uppercase tracking-wider font-bold text-gray-700 dark:text-gray-300">
                        {t.vehicle_type || "STANDART"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center font-black text-v3-text">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="w-3.5 h-3.5 text-v3-muted" /> {t.pax_count || 1}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
