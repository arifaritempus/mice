import React, { useState, useEffect } from "react";
import { X, CheckCircle2, Plane, Car, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabaseService";
import toast from "react-hot-toast";

interface CongressBulkServiceAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantIds: string[];
  projectId: string;
  project: any;
  onSuccess: () => void;
  participantsData: any[];
  projectHotels?: any[];
}

const CATEGORY_UUIDS = {
  "Uçak": "52708355-de87-44ae-a733-d10bd7cf7a8b",
  "Transfer": "80b22984-83ba-41d7-bb8e-0d9c1968b614"
};

export default function CongressBulkServiceAssignModal({ isOpen, onClose, participantIds, projectId, project, onSuccess, participantsData, projectHotels = [] }: CongressBulkServiceAssignModalProps) {

  const [activeTab, setActiveTab] = useState<"Uçak" | "Transfer">("Uçak");
  const [loading, setLoading] = useState(false);
  const [agencies, setAgencies] = useState<any[]>([]);

  const [flightData, setFlightData] = useState({
    guzergah: "", gidis_tarihi: "", gidis_saati: "", gidis_ucus_kodu: "", donus_tarihi: "", donus_saati: "", donus_ucus_kodu: "", pnr: "", havayolu: "", ucus_tipi: "", tedarikci: "", unit_price: 0, currency: "EUR", payer_company_id: ""
  });

  const [transferData, setTransferData] = useState({
    direction: "", type_label: "", date: "", time: "", flight_code: "", route: "", vehicle_type: "", supplier_name: "", hotel_id: "", transfer_type: "", unit_price: 0, currency: "EUR", payer_company_id: ""
  });

  useEffect(() => {
    if (isOpen) {
      const getAgencies = async () => {
        const { data } = await supabase.from('agencies').select('id, name');
        if (data) setAgencies(data);
      };
      getAgencies();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFlightSave = async () => {
    if (!flightData.guzergah && !flightData.gidis_tarihi) {
      toast.error("Lütfen gidiş tarihi veya parkur girin.");
      return;
    }
    setLoading(true);
    try {
      let successCount = 0;
      for (const pId of participantIds) {
        const participant = participantsData.find(p => p.id === pId);
        const salesPayload = {
          project_id: projectId,
          
          category: CATEGORY_UUIDS["Uçak"],
          description: flightData.guzergah,
          unit_price: flightData.unit_price,
          unit_quantity: 1,
          total_price: flightData.unit_price,
          currency: flightData.currency,
          payer_company_id: flightData.payer_company_id || participant?.company_id || null,
        };
        const { data: salesData, error: salesErr } = await supabase.from("project_sales_items").insert([salesPayload]).select().single();
        
        if (salesData && !salesErr) {
          const flightPayload = {
            id: salesData.id,
            project_id: projectId,
            
            tedarikci: flightData.tedarikci || null,
            pnr: flightData.pnr || null,
            havayolu: flightData.havayolu || null,
            ucus_tipi: flightData.ucus_tipi || null,
            gidis_tarihi: flightData.gidis_tarihi || null,
            gidis_saati: flightData.gidis_saati || null,
            gidis_ucus_kodu: flightData.gidis_ucus_kodu || null,
            donus_tarihi: flightData.donus_tarihi || null,
            donus_saati: flightData.donus_saati || null,
            donus_ucus_kodu: flightData.donus_ucus_kodu || null,
            guzergah: flightData.guzergah || null,
            misafirler: participant ? `${participant.first_name} ${participant.last_name}` + (participant.company_id ? ` - ${(agencies.find(a => a.id === participant.company_id) || {}).name || ""}` : "") : "",
            toplam_maliyet: 0,
            toplam_satis: Number(flightData.unit_price) || 0,
            pp_satis: Number(flightData.unit_price) || 0,
            satis_doviz: flightData.currency || "TRY",
            toplam_satis_tl: 0
          };
          await supabase.from("project_flight_tickets").insert([flightPayload]);
          successCount++;
        }
      }
      toast.success(`${successCount} adet uçak bileti başarıyla atandı.`);
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error("Hata: " + e.message);
    }
    setLoading(false);
  };

  const handleTransferSave = async () => {
    setLoading(true);
    try {
      let successCount = 0;
      for (const pId of participantIds) {
        const participant = participantsData.find(p => p.id === pId);
        const salesPayload = {
          project_id: projectId,
          
          category: CATEGORY_UUIDS["Transfer"],
          description: transferData.route,
          unit_price: transferData.unit_price,
          unit_quantity: 1,
          total_price: transferData.unit_price,
          currency: transferData.currency,
          payer_company_id: transferData.payer_company_id || participant?.company_id || null,
        };
        const { data: salesData, error: salesErr } = await supabase.from("project_sales_items").insert([salesPayload]).select().single();
        
        if (salesData && !salesErr) {
          const transferPayload = {
            id: salesData.id,
            project_id: projectId,
            
            direction: transferData.direction || null,
            type_label: transferData.type_label || null,
            date: transferData.date || null,
            time: transferData.time || null,
            flight_code: transferData.flight_code || null,
            route: transferData.route || null,
            transfer_type: transferData.transfer_type || null,
            vehicle_type: transferData.vehicle_type || null,
            supplier_name: transferData.supplier_name || null,
            passengers: [participant ? `${participant.first_name} ${participant.last_name}` + (participant.company_id ? ` - ${(agencies.find(a => a.id === participant.company_id) || {}).name || ""}` : "") : ""],
            cost_amount: 0
          };
          await supabase.from("project_transfer_tour").insert([transferPayload]);
          successCount++;
        }
      }
      toast.success(`${successCount} adet transfer başarıyla atandı.`);
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error("Hata: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-v3-bg w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-v3-border">
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-v3-text flex items-center gap-2">
              TOPLU HİZMET ATAMA
            </h2>
            <p className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Seçili {participantIds.length} katılımcıya aynı anda hizmet eklenecek.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-v3-border bg-gray-50 dark:bg-black/10">
          <button onClick={() => setActiveTab("Uçak")} className={`flex-1 py-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === "Uçak" ? "bg-white dark:bg-v3-bg text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"}`}>
            <Plane className="w-4 h-4" /> Uçak Bileti Ata
          </button>
          <button onClick={() => setActiveTab("Transfer")} className={`flex-1 py-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === "Transfer" ? "bg-white dark:bg-v3-bg text-orange-600 border-b-2 border-orange-600" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"}`}>
            <Car className="w-4 h-4" /> Transfer Ata
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {activeTab === "Uçak" && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-200 dark:border-blue-900/30 mb-6">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  Gireceğiniz bu uçuş bilgileri, seçtiğiniz {participantIds.length} kişinin her biri için <strong>ayrı ayrı bilet olarak</strong> Uçak Bileti sekmesine düşecektir.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Parkur (IST-AYT)</label>
                  <input type="text" value={flightData.guzergah} onChange={e => setFlightData({...flightData, guzergah: e.target.value})} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Gidiş Tarihi</label>
                  <input type="date" value={flightData.gidis_tarihi} onChange={e => setFlightData({...flightData, gidis_tarihi: e.target.value})} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Gidiş Saati & Kodu</label>
                  <div className="flex gap-1">
                    <input type="time" value={flightData.gidis_saati} onChange={e => setFlightData({...flightData, gidis_saati: e.target.value})} className="w-1/2 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                    <input type="text" placeholder="TK123" value={flightData.gidis_ucus_kodu} onChange={e => setFlightData({...flightData, gidis_ucus_kodu: e.target.value})} className="w-1/2 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Dönüş Tarihi</label>
                  <input type="date" value={flightData.donus_tarihi} onChange={e => setFlightData({...flightData, donus_tarihi: e.target.value})} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Dönüş Saati & Kodu</label>
                  <div className="flex gap-1">
                    <input type="time" value={flightData.donus_saati} onChange={e => setFlightData({...flightData, donus_saati: e.target.value})} className="w-1/2 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                    <input type="text" placeholder="TK124" value={flightData.donus_ucus_kodu} onChange={e => setFlightData({...flightData, donus_ucus_kodu: e.target.value})} className="w-1/2 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Uçuş Tipi (Grup/Münferit)</label>
                  <select value={flightData.ucus_tipi} onChange={e => setFlightData({...flightData, ucus_tipi: e.target.value})} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none">
                    <option value="">-- Seçiniz --</option>
                    <option value="GRUP">GRUP (Gidiş-Dönüş)</option>
                    <option value="MÜNFERİT">MÜNFERİT (Tek Yön)</option>
                  </select>
                </div>
<div>
                  <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Havayolu</label>
                  <input type="text" value={flightData.havayolu} onChange={e => setFlightData({...flightData, havayolu: e.target.value})} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">PNR</label>
                  <input type="text" value={flightData.pnr} onChange={e => setFlightData({...flightData, pnr: e.target.value})} placeholder="Ortak PNR varsa" className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Ödeyen Kurum</label>
                  <select value={flightData.payer_company_id} onChange={e => setFlightData({...flightData, payer_company_id: e.target.value})} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none">
                    <option value="">-- Katılımcının Kendi Firması --</option>
                    {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Bilet Satış Tutarı & Döviz (Kişi Başı)</label>
                  <div className="flex gap-2">
                    <input type="number" value={flightData.unit_price || 0} onChange={e => setFlightData({...flightData, unit_price: Number(e.target.value)})} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                    <select value={flightData.currency} onChange={e => setFlightData({...flightData, currency: e.target.value})} className="w-24 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none">
                      <option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="TRY">TRY</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Transfer" && (
            <div className="space-y-4">
              <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-200 dark:border-orange-900/30 mb-6">
                <p className="text-xs text-orange-800 dark:text-orange-300">
                  Gireceğiniz bu transfer bilgileri, seçtiğiniz {participantIds.length} kişinin her biri için Transfer sekmesine düşecektir.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Güzergah</label>
                  <input type="text" value={transferData.route} onChange={e => setTransferData({...transferData, route: e.target.value})} placeholder="Örn: HAVALİMANI - OTEL" className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Tarih</label>
                  <input type="date" value={transferData.date} onChange={e => setTransferData({...transferData, date: e.target.value})} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Saat</label>
                  <input type="time" value={transferData.time} onChange={e => setTransferData({...transferData, time: e.target.value})} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Uçuş Kodu</label>
                  <input type="text" value={transferData.flight_code} onChange={e => setTransferData({...transferData, flight_code: e.target.value})} placeholder="TK123" className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                </div>
                                <div>
                  <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Yön (Giriş/Çıkış)</label>
                  <select value={transferData.direction} onChange={e => {
                    const dir = e.target.value;
                    const hotel = projectHotels.find(h => h.id === transferData.hotel_id);
                    const hName = hotel ? hotel.name : "Otel";
                    let newRoute = transferData.route;
                    if (dir === "arrival") newRoute = "Havalimanı -> " + hName;
                    else if (dir === "departure") newRoute = hName + " -> Havalimanı";
                    else if (dir === "ara-transfer") newRoute = hName + " -> Diğer Nokta";
                    setTransferData({...transferData, direction: dir, route: newRoute});
                  }} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none">
                    <option value="">-- Seçiniz --</option>
                    <option value="arrival">Otele Giriş (Havalimanı &rarr; Otel)</option>
                    <option value="departure">Otelden Çıkış (Otel &rarr; Havalimanı)</option>
                    <option value="ara-transfer">Ara Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Otel Seçimi</label>
                  <select value={transferData.hotel_id} onChange={e => {
                    const hId = e.target.value;
                    const hotel = projectHotels.find(h => h.id === hId);
                    const hName = hotel ? hotel.name : "Otel";
                    let newRoute = transferData.route;
                    if (transferData.direction === "arrival") newRoute = "Havalimanı -> " + hName;
                    else if (transferData.direction === "departure") newRoute = hName + " -> Havalimanı";
                    else if (transferData.direction === "ara-transfer") newRoute = hName + " -> Diğer Nokta";
                    setTransferData({...transferData, hotel_id: hId, route: newRoute});
                  }} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none">
                    <option value="">-- Kongre Oteli Seçin --</option>
                    {projectHotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Araç Tipi</label>
                  <input type="text" value={transferData.vehicle_type} onChange={e => setTransferData({...transferData, vehicle_type: e.target.value})} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Ödeyen Kurum</label>
                  <select value={transferData.payer_company_id} onChange={e => setTransferData({...transferData, payer_company_id: e.target.value})} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none">
                    <option value="">-- Katılımcının Kendi Firması --</option>
                    {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Transfer Satış Tutarı & Döviz (Kişi Başı)</label>
                  <div className="flex gap-2">
                    <input type="number" value={transferData.unit_price || 0} onChange={e => setTransferData({...transferData, unit_price: Number(e.target.value)})} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                    <select value={transferData.currency} onChange={e => setTransferData({...transferData, currency: e.target.value})} className="w-24 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none">
                      <option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="TRY">TRY</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-200 dark:border-v3-border bg-gray-50 dark:bg-white/5 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2 text-xs font-bold text-gray-600 dark:text-v3-muted hover:text-gray-900 dark:hover:text-v3-text transition-colors">
            İPTAL
          </button>
          <button 
            onClick={activeTab === "Uçak" ? handleFlightSave : handleTransferSave} 
            disabled={loading} 
            className={`flex items-center gap-2 px-6 py-2.5 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg transition-all ${activeTab === "Uçak" ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20" : "bg-orange-600 hover:bg-orange-700 shadow-orange-500/20"}`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            SEÇİLİLERE ATA ({participantIds.length})
          </button>
        </div>
      </div>
    </div>
  );
}
