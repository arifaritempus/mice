
"use client";

import React, { useState, useEffect } from "react";
import { X, User, Briefcase, Phone, Mail, FileText, CheckCircle2, Building2, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseService";
import { toast } from "react-hot-toast";

interface CongressParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant?: any;
  projectId: string;
  onSuccess: () => void;
  project?: any;
}

export default function CongressParticipantModal({ isOpen, onClose, participant, projectId, onSuccess, project }: CongressParticipantModalProps) {
  const [activeTab, setActiveTab] = useState<"info"|"registration"|"accommodation"|"flight"|"transfer"|"companion">("info");
  const [loading, setLoading] = useState(false);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [projectHotels, setProjectHotels] = useState<any[]>([]);

  // Veri Listeleri
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [accommodations, setAccommodations] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const catKayit = "69d22049-1113-49d7-bd28-8b4618dcf75a";
  const catKonaklama = "d7bda8d3-0b42-45a1-958d-3b5239ee66b6";
  const catUcak = "52708355-de87-44ae-a733-d10bd7cf7a8b";
  const catTransfer = "80b22984-83ba-41d7-bb8e-0d9c1968b614";
  const [transfers, setTransfers] = useState<any[]>([]);
  const [companions, setCompanions] = useState<any[]>([]);

  // Form State ler
  const [formData, setFormData] = useState<any>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    tc_passport: "",
    company_id: "",
    title: "",
    registration_type: "Delege",
    notes: ""
  });

  const CATEGORY_UUIDS = {
    "Kayıt": "69d22049-1113-49d7-bd28-8b4618dcf75a",
    "Konaklama": "d7bda8d3-0b42-45a1-958d-3b5239ee66b6",
    "Uçak": "52708355-de87-44ae-a733-d10bd7cf7a8b",
    "Transfer": "80b22984-83ba-41d7-bb8e-0d9c1968b614"
  };

  useEffect(() => {
    if (isOpen) {
      loadAgencies();
      if (participant) {
        setFormData({
          first_name: participant.first_name || "",
          last_name: participant.last_name || "",
          email: participant.email || "",
          phone: participant.phone || "",
          tc_passport: participant.tc_passport || "",
          company_id: participant.company_id || "",
          title: participant.title || "",
          registration_type: participant.registration_type || "Delege",
          notes: participant.notes || ""
        });
        loadServices();
        loadCompanions();
      } else {
        setFormData({
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          tc_passport: "",
          company_id: "",
          title: "",
          registration_type: "Delege",
          notes: ""
        });
        setRegistrations([]);
        setAccommodations([]);
        setFlights([]);
        setTransfers([]);
        setCompanions([]);
      }
    }
  }, [isOpen, participant]);

  useEffect(() => {
    const loadData = async () => {
      const { data: agData } = await supabase.from('agencies').select('id, name').order('name');
      if (agData) setAgencies(agData);

      const { data: pData } = await supabase.from('projects').select('hotels_data').eq('id', projectId).single();
      if (pData?.hotels_data && Array.isArray(pData.hotels_data)) {
        const hIds = pData.hotels_data.map((h: any) => h.hotel_id).filter(Boolean);
        if (hIds.length > 0) {
          const { data } = await supabase.from('hotels').select('id, name').in('id', hIds);
          if (data) setProjectHotels(data);
        }
      }
      
      const { data: catData } = await supabase.from('categories').select('*').order('name');
      if (catData) setCategories(catData); 
    }
    loadData();
  }, [project]);

  const loadAgencies = async () => {
    const { data } = await supabase.from("agencies").select("id, name").order("name");
    if (data) setAgencies(data);
  };

  const loadCompanions = async () => {
    if (!participant?.id) return;
    const { data } = await supabase.from("project_participants").select("*").eq("project_id", projectId).eq("registration_type", "Refakatçi").like("notes", `%parent:${participant.id}%`);
    if(data) setCompanions(data);
  };

  const loadServices = async () => {
    if (!participant?.id) return;
    const { data: salesData } = await supabase
      .from("project_sales_items")
      .select("*")
      .eq("project_id", projectId)
      .eq("participant_id", participant.id);

    if (salesData) {
      // Fetch operational data for flights and transfers
      const flightIds = salesData.filter(i => i.category === CATEGORY_UUIDS["Uçak"]).map(i => i.id);
      const transferIds = salesData.filter(i => i.category === CATEGORY_UUIDS["Transfer"]).map(i => i.id);
      
      let flightsOps = [];
      let transfersOps = [];
      
      if (flightIds.length > 0) {
        const { data: fData } = await supabase.from("project_flight_tickets").select("*").in("id", flightIds);
        if (fData) flightsOps = fData;
      }
      if (transferIds.length > 0) {
        const { data: tData } = await supabase.from("project_transfer_tour").select("*").in("id", transferIds);
        if (tData) transfersOps = tData;
      }

      setRegistrations(salesData.filter(i => i.category === CATEGORY_UUIDS["Kayıt"]));
      setAccommodations(salesData.filter(i => i.category === CATEGORY_UUIDS["Konaklama"]));
      
      setFlights(salesData.filter(i => i.category === CATEGORY_UUIDS["Uçak"]).map(item => {
        const op = flightsOps.find(f => f.id === item.id) || {};
        return { ...op, ...item };
      }));
      
      setTransfers(salesData.filter(i => i.category === CATEGORY_UUIDS["Transfer"]).map(item => {
        const op = transfersOps.find(t => t.id === item.id) || {};
        return { ...op, ...item };
      }));
    }
  };

  
  const addEmptyCompanion = () => {
    setCompanions([...companions, { id: "temp_" + Date.now(), isNew: true, first_name: "", last_name: "", tc_passport: "" }]);
  };

  const updateCompanionField = (id: string, field: string, value: any) => {
    setCompanions(p => p.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const saveCompanion = async (comp: any) => {
    if (!participant?.id) { toast.error("Önce ana katılımcıyı kaydedin!"); return; }
    setLoading(true);
    try {
      const payload = {
        project_id: projectId,
        first_name: comp.first_name,
        last_name: comp.last_name,
        tc_passport: comp.tc_passport,
        registration_type: "Refakatçi",
        notes: `parent:${participant.id}`
      };
      if (!comp.isNew) {
        await supabase.from("project_participants").update(payload).eq("id", comp.id);
        toast.success("Refakatçi güncellendi.");
      } else {
        await supabase.from("project_participants").insert([payload]);
        toast.success("Refakatçi eklendi.");
      }
      loadCompanions();
      onSuccess();
    } catch(e) {
      toast.error("Hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const removeCompanion = async (id: string) => {
    if (!id.startsWith("temp_")) {
      if(confirm("Refakatçiyi silmek istediğinize emin misiniz?")) {
        await supabase.from("project_participants").delete().eq("id", id);
        toast.success("Refakatçi silindi.");
        loadCompanions();
        onSuccess();
      }
    } else {
      setCompanions(p => p.filter(c => c.id !== id));
    }
  };

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        project_id: projectId,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        tc_passport: formData.tc_passport,
        company_id: formData.company_id || null,
        title: formData.title,
        registration_type: formData.registration_type,
        notes: formData.notes
      };

      if (participant?.id) {
        await supabase.from("project_participants").update(payload).eq("id", participant.id);
        toast.success("Katılımcı güncellendi.");
        
        // Update operational tables
        const companyName = formData.company_id ? (agencies.find(a => a.id === formData.company_id)?.name || "") : "";
        const newFullName = `${formData.first_name} ${formData.last_name}` + (companyName ? ` - ${companyName}` : "");
        
        const { data: sales } = await supabase.from("project_sales_items").select("id").eq("participant_id", participant.id);
        if (sales && sales.length > 0) {
          const saleIds = sales.map(s => s.id);
          
          await supabase.from("project_flight_tickets").update({ misafirler: newFullName }).in("id", saleIds);
          
          const { data: transfers } = await supabase.from("project_transfer_tour").select("id, is_group, vehicle_assigned").in("id", saleIds);
          let hasWarning = false;
          
          if (transfers && transfers.length > 0) {
            hasWarning = transfers.some(t => t.is_group || t.vehicle_assigned);
            
            const updatableTransfers = transfers.filter(t => !t.is_group && !t.vehicle_assigned).map(t => t.id);
            if (updatableTransfers.length > 0) {
              await supabase.from("project_transfer_tour").update({ passengers: [newFullName] }).in("id", updatableTransfers);
            }
          }
          
          if (hasWarning) {
            toast.error("UYARI: Bu katılımcının dahil olduğu GRUPLANMIŞ veya ARAÇ ATANMIŞ transferler var! İsim değişikliği o transferlere yansımadı, manuel kontrol edin.", { duration: 6000 });
          }
        }
      } else {
        await supabase.from("project_participants").insert([payload]);
        toast.success("Katılımcı eklendi.");
        onClose();
      }
      onSuccess();
    } catch (err: any) {
      toast.error("İşlem sırasında hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const addEmptyService = (category: "Kayıt" | "Konaklama" | "Uçak" | "Transfer") => {
    const emptyObj = {
      id: "temp_" + Date.now(),
      isNew: true,
      category: CATEGORY_UUIDS[category as keyof typeof CATEGORY_UUIDS],
      payer_company_id: participant?.company_id || "",
      unit_price: 0,
      currency: "EUR",
      start_date: "",
      end_date: "",
      description: "",
      hotel_id: ""
    };
    if (category === "Kayıt") setRegistrations([...registrations, emptyObj]);
    if (category === "Konaklama") setAccommodations([...accommodations, emptyObj]);
    if (category === "Uçak") setFlights([...flights, emptyObj]);
    if (category === "Transfer") setTransfers([...transfers, emptyObj]);
  };

  const updateServiceField = (category: string, id: string, field: string, value: any) => {
    if (category === "Kayıt") setRegistrations(p => p.map(i => i.id === id ? { ...i, [field]: value } : i));
    if (category === "Konaklama") setAccommodations(p => p.map(i => i.id === id ? { ...i, [field]: value } : i));
    if (category === "Uçak") setFlights(p => p.map(i => i.id === id ? { ...i, [field]: value } : i));
    if (category === "Transfer") setTransfers(p => p.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeService = async (category: string, id: string) => {
    if (!id.startsWith("temp_")) {
      if (confirm("Bu hizmeti silmek istediğinize emin misiniz?")) {
        setLoading(true);
        await supabase.from("project_sales_items").delete().eq("id", id);
        if (category === "Uçak") await supabase.from("project_flight_tickets").delete().eq("id", id);
        if (category === "Transfer") await supabase.from("project_transfer_tour").delete().eq("id", id);
        setLoading(false);
        toast.success("Hizmet silindi.");
        onSuccess();
      } else return;
    }
    if (category === "Kayıt") setRegistrations(p => p.filter(i => i.id !== id));
    if (category === "Konaklama") setAccommodations(p => p.filter(i => i.id !== id));
    if (category === "Uçak") setFlights(p => p.filter(i => i.id !== id));
    if (category === "Transfer") setTransfers(p => p.filter(i => i.id !== id));
  };

  const saveServiceRow = async (category: string, item: any) => {
    if (!participant?.id) { toast.error("Önce katılımcıyı kaydedin!"); return; }
    setLoading(true);
    try {
      const payload: any = {
        project_id: projectId,
        participant_id: participant.id,
        category: CATEGORY_UUIDS[category as keyof typeof CATEGORY_UUIDS],
        description: category === "Uçak" ? item.description : category === "Transfer" ? item.route : item.description,
        reference: category === "Uçak" ? (item.gidis_tarihi ? item.gidis_tarihi + (item.gidis_saati ? 'T'+item.gidis_saati : '') : null) : category === "Transfer" ? (item.date ? item.date + (item.time ? 'T'+item.time : '') : null) : (item.reference || null),
        unit_price: item.unit_price,
        unit_quantity: 1,
        total_price: item.unit_price,
        currency: item.currency,
        payer_company_id: item.payer_company_id || null,
        exchange_rate: Number(item.exchange_rate) || null,
        fx: Number(item.exchange_rate) || null,
        total_try: Number(item.exchange_rate) ? (Number(item.unit_price) || 0) * Number(item.exchange_rate) : null
      };

      if (category === "Konaklama") {
        payload.hotel_id = item.hotel_id || null;
      }
      
      if (category === "Konaklama" || category === "Uçak" || category === "Transfer") {
        payload.reference_code = item.reference_code || null;
      }
      
      if (category === "Konaklama") {
        payload.voucher_no = item.voucher_no || null;
      }

      payload.sub_category = item.sub_category || null;

      let savedId = item.id;
      if (!item.isNew) {
        await supabase.from("project_sales_items").update(payload).eq("id", item.id);
        toast.success("Hizmet güncellendi.");
      } else {
        const { data, error } = await supabase.from("project_sales_items").insert([payload]).select().single();
        if (data) savedId = data.id;
        toast.success("Hizmet eklendi.");
      }

      if (category === "Uçak") {
        const flightPayload = {
          id: savedId,
          project_id: projectId,
          tedarikci: item.tedarikci || null,
          pnr: item.pnr || null,
          havayolu: item.havayolu || null,
          ucus_tipi: item.ucus_tipi || item.sub_category || null,
          gidis_tarihi: item.gidis_tarihi || (item.reference ? item.reference.split("T")[0] : null),
          gidis_saati: item.gidis_saati || (item.reference && item.reference.includes("T") ? item.reference.split("T")[1].substring(0,5) : null),
          gidis_ucus_kodu: item.gidis_ucus_kodu || null,
          donus_tarihi: item.donus_tarihi || (item.reference_code ? item.reference_code.split("T")[0] : null),
          donus_saati: item.donus_saati || (item.reference_code && item.reference_code.includes("T") ? item.reference_code.split("T")[1].substring(0,5) : null),
          donus_ucus_kodu: item.donus_ucus_kodu || null,
          guzergah: item.guzergah || item.description || null,
          misafirler: participant ? `${participant.first_name} ${participant.last_name}` + (participant.company_id ? ` - ${(agencies.find(a => a.id === participant.company_id) || {}).name || ""}` : "") : "",
          toplam_maliyet: 0,
          toplam_satis: Number(item.total_price) || 0
        };
        const { error: fErr } = await supabase.from("project_flight_tickets").upsert(flightPayload); if (fErr) console.error("Flight Upsert Error:", fErr); else console.log("Flight Upsert Success");
      }

      if (category === "Transfer") {
        const transferPayload = {
          id: savedId,
          project_id: projectId,
          
          direction: item.direction || null,
          type_label: item.type_label || null,
          date: item.date || null,
          time: item.time || null,
          flight_code: item.flight_code || null,
          route: item.route || item.description || null,
          transfer_type: item.transfer_type || null,
          vehicle_type: item.vehicle_type || null,
          supplier_name: item.supplier_name || null,
          vehicle_assigned: item.vehicle_assigned || null,
          passengers: participant ? `${participant.first_name} ${participant.last_name}` + (participant.company_id ? ` - ${(agencies.find(a => a.id === participant.company_id) || {}).name || ""}` : "") : "",
          cost_amount: 0
        };
        const { error: tErr } = await supabase.from("project_transfer_tour").upsert(transferPayload); if (tErr) console.error("Transfer Upsert Error:", tErr); else console.log("Transfer Upsert Success");
      }

      loadServices();
      onSuccess();
    } catch (err: any) {
      toast.error("Kaydedilemedi.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-v3-surface w-full max-w-5xl rounded-2xl shadow-2xl border border-gray-200 dark:border-v3-border overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-v3-border bg-gray-50 dark:bg-white/5">
          <h2 className="text-lg font-black text-gray-800 dark:text-v3-text uppercase tracking-widest flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            {participant ? "Katılımcı Hizmet Yönetimi" : "Yeni Katılımcı Ekle"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-v3-muted" />
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-v3-border bg-gray-50/50 dark:bg-black/10 px-5 overflow-x-auto">
          <button onClick={() => setActiveTab("info")} className={"px-5 py-4 text-xs font-black uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors " + (activeTab === "info" ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 dark:text-v3-muted hover:text-gray-900 dark:hover:text-v3-text")}>Kimlik Bilgileri</button>
          {participant && (
            <>
              <button onClick={() => setActiveTab("registration")} className={"px-5 py-4 text-xs font-black uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors " + (activeTab === "registration" ? "border-orange-500 text-orange-600 dark:text-orange-400" : "border-transparent text-gray-500 dark:text-v3-muted hover:text-gray-900 dark:hover:text-v3-text")}>Kayıt (Registration)</button>
              <button onClick={() => setActiveTab("accommodation")} className={"px-5 py-4 text-xs font-black uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors " + (activeTab === "accommodation" ? "border-emerald-500 text-emerald-600 dark:text-emerald-400" : "border-transparent text-gray-500 dark:text-v3-muted hover:text-gray-900 dark:hover:text-v3-text")}>Konaklama</button>
              <button onClick={() => setActiveTab("flight")} className={"px-5 py-4 text-xs font-black uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors " + (activeTab === "flight" ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 dark:text-v3-muted hover:text-gray-900 dark:hover:text-v3-text")}>Uçak Bileti</button>
              <button onClick={() => setActiveTab("transfer")} className={"px-5 py-4 text-xs font-black uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors " + (activeTab === "transfer" ? "border-purple-500 text-purple-600 dark:text-purple-400" : "border-transparent text-gray-500 dark:text-v3-muted hover:text-gray-900 dark:hover:text-v3-text")}>Transfer</button>
              <button onClick={() => setActiveTab("companion")} className={"px-5 py-4 text-xs font-black uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors " + (activeTab === "companion" ? "border-pink-500 text-pink-600 dark:text-pink-400" : "border-transparent text-gray-500 dark:text-v3-muted hover:text-gray-900 dark:hover:text-v3-text")}>Refakatçi</button>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-v3-bg">
          {activeTab === "info" && (
            <form id="participantForm" onSubmit={handleInfoSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-black text-gray-500 dark:text-v3-muted uppercase mb-1">Ad</label><input type="text" required value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className="w-full h-10 px-3 text-sm font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded-lg text-gray-800 dark:text-v3-text focus:border-blue-500 outline-none" /></div>
                <div><label className="block text-[10px] font-black text-gray-500 dark:text-v3-muted uppercase mb-1">Soyad</label><input type="text" required value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className="w-full h-10 px-3 text-sm font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded-lg text-gray-800 dark:text-v3-text focus:border-blue-500 outline-none" /></div>
                <div><label className="block text-[10px] font-black text-gray-500 dark:text-v3-muted uppercase mb-1">Unvan</label><input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full h-10 px-3 text-sm font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded-lg text-gray-800 dark:text-v3-text focus:border-blue-500 outline-none" /></div>
                <div><label className="block text-[10px] font-black text-gray-500 dark:text-v3-muted uppercase mb-1">TC / Pasaport</label><input type="text" value={formData.tc_passport} onChange={e => setFormData({...formData, tc_passport: e.target.value})} className="w-full h-10 px-3 text-sm font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded-lg text-gray-800 dark:text-v3-text focus:border-blue-500 outline-none" /></div>
                <div><label className="block text-[10px] font-black text-gray-500 dark:text-v3-muted uppercase mb-1">E-posta</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full h-10 px-3 text-sm font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded-lg text-gray-800 dark:text-v3-text focus:border-blue-500 outline-none" /></div>
                <div><label className="block text-[10px] font-black text-gray-500 dark:text-v3-muted uppercase mb-1">Telefon</label><input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full h-10 px-3 text-sm font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded-lg text-gray-800 dark:text-v3-text focus:border-blue-500 outline-none" /></div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 dark:text-v3-muted uppercase mb-1">Kayıt Tipi</label>
                  <select value={formData.registration_type} onChange={e => setFormData({...formData, registration_type: e.target.value})} className="w-full h-10 px-3 text-sm font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded-lg text-gray-800 dark:text-v3-text focus:border-blue-500 outline-none">
                    <option value="Delege">Delege</option>
                    <option value="Konuşmacı">Konuşmacı (Speaker)</option>
                    <option value="VIP">VIP</option>
                    <option value="Firma Temsilcisi">Firma Temsilcisi</option>
                    <option value="Görevli">Görevli</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 dark:text-v3-muted uppercase mb-1 text-blue-600 dark:text-blue-400">Genel Sponsor Kurum</label>
                  <select value={formData.company_id || ""} onChange={e => setFormData({...formData, company_id: e.target.value})} className="w-full h-10 px-3 text-sm font-semibold bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg text-blue-900 dark:text-blue-100 focus:border-blue-500 outline-none">
                    <option value="">-- Bireysel (Sponsorsuz) --</option>
                    {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="block text-[10px] font-black text-gray-500 dark:text-v3-muted uppercase mb-1">Özel Notlar</label><textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full h-20 p-3 text-sm font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded-lg text-gray-800 dark:text-v3-text focus:border-blue-500 outline-none resize-none" /></div>
            </form>
          )}

          
          {activeTab === "registration" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-v3-text flex items-center gap-2"><span className="text-orange-500">🎫</span> Kongre Kayıt Paketleri</h3>
                <button onClick={() => addEmptyService("Kayıt")} className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-bold rounded-lg hover:bg-orange-200 dark:hover:bg-orange-500/30 transition-colors"><Plus className="w-3 h-3" /> YENİ EKLE</button>
              </div>
              
              {registrations.length === 0 && <p className="text-xs text-v3-muted text-center py-6">Kayıtlı paket bulunamadı.</p>}

              {registrations.map((item, idx) => (
                <div key={item.id} className="bg-v3-surface border border-v3-border rounded-xl p-4 space-y-4 relative">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Kayıt Paketi (Kategori)</label>
                      <select value={item.sub_category || ""} onChange={e => updateServiceField("Kayıt", item.id, "sub_category", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none">
                        <option value="">-- Kategori Seçin --</option>
                        {categories.filter(c => c.parent_id === catKayit).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1 text-orange-600 dark:text-orange-400">Ödeyen Kurum</label>
                      <select value={item.payer_company_id || ""} onChange={e => updateServiceField("Kayıt", item.id, "payer_company_id", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-orange-50/50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded text-orange-900 dark:text-orange-100 outline-none">
                        <option value="">-- Katılımcı (Bireysel) --</option>
                        {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-4 mt-2 pt-3 border-t border-gray-100 dark:border-white/5">
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Tutar & Döviz</label>
                      <div className="flex gap-2">
                        <input type="number" value={item.unit_price || 0} onChange={e => updateServiceField("Kayıt", item.id, "unit_price", Number(e.target.value))} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                        <select value={item.currency || "EUR"} onChange={e => updateServiceField("Kayıt", item.id, "currency", e.target.value)} className="w-20 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none">
                          <option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="TRY">TRY</option>
                        </select>
                        <input type="number" step="0.0001" placeholder="Kur" value={item.exchange_rate || ''} onChange={e => updateServiceField("Kayıt", item.id, "exchange_rate", e.target.value)} title="Manuel kur. Boş bırakırsanız projenin genel kurunu kullanır." className="w-20 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                        <div className="h-9 px-3 flex items-center bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-v3-border rounded text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap min-w-[90px]" title="Toplam TL (Sadece manuel kur girilirse anlık görünür)">
                          {item.exchange_rate && item.unit_price ? (Number(item.unit_price) * Number(item.exchange_rate)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺' : '-'}
                        </div>
                        <button onClick={() => saveServiceRow("Kayıt", item)} disabled={loading} className="px-4 bg-orange-600 text-white rounded text-xs font-bold hover:bg-orange-700">KAYDET</button>
                        <button onClick={() => removeService("Kayıt", item.id)} className="px-3 bg-red-100 text-red-600 rounded hover:bg-red-200"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "accommodation" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-v3-text flex items-center gap-2"><Building2 className="w-4 h-4 text-emerald-500" /> Konaklamalar</h3>
                <button onClick={() => addEmptyService("Konaklama")} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors"><Plus className="w-3 h-3" /> YENİ EKLE</button>
              </div>
              
              {accommodations.length === 0 && <p className="text-xs text-v3-muted text-center py-6">Kayıtlı konaklama bulunamadı.</p>}

              {accommodations.map((item, idx) => (
                <div key={item.id} className="bg-v3-surface border border-v3-border rounded-xl p-4 space-y-4 relative">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Otel Seçin</label>
                      <select value={item.hotel_id || ""} onChange={e => updateServiceField("Konaklama", item.id, "hotel_id", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none">
                        <option value="">-- Otel Seçin --</option>
                        {projectHotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Oda Tipi</label>
                      <select value={item.sub_category || ""} onChange={e => updateServiceField("Konaklama", item.id, "sub_category", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none">
                        <option value="">-- Oda Tipi Seçin --</option>
                        {categories.filter(c => c.parent_id === catKonaklama).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1 text-emerald-600 dark:text-emerald-400">Ödeyen Kurum</label>
                      <select value={item.payer_company_id || ""} onChange={e => updateServiceField("Konaklama", item.id, "payer_company_id", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 rounded text-emerald-900 dark:text-emerald-100 outline-none">
                        <option value="">-- Katılımcı (Bireysel) --</option>
                        {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Check-in</label>
                      <input type="date" value={item.reference || ""} onChange={e => updateServiceField("Konaklama", item.id, "reference", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Check-out</label>
                      <input type="date" value={item.reference_code || ""} onChange={e => updateServiceField("Konaklama", item.id, "reference_code", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Oda No</label>
                      <input type="text" value={item.voucher_no || ""} onChange={e => updateServiceField("Konaklama", item.id, "voucher_no", e.target.value)} placeholder="Örn: 101" className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                    </div>
                    <div className="md:col-span-5 mt-2 pt-3 border-t border-gray-100 dark:border-white/5">
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Tutar & Döviz</label>
                      <div className="flex gap-2">
                        <input type="number" value={item.unit_price || 0} onChange={e => updateServiceField("Konaklama", item.id, "unit_price", Number(e.target.value))} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                        <select value={item.currency || "EUR"} onChange={e => updateServiceField("Konaklama", item.id, "currency", e.target.value)} className="w-20 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none">
                          <option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="TRY">TRY</option>
                        </select>
                        <input type="number" step="0.0001" placeholder="Kur" value={item.exchange_rate || ''} onChange={e => updateServiceField("Konaklama", item.id, "exchange_rate", e.target.value)} title="Manuel kur. Boş bırakırsanız projenin genel kurunu kullanır." className="w-20 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                        <div className="h-9 px-3 flex items-center bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-v3-border rounded text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap min-w-[90px]" title="Toplam TL (Sadece manuel kur girilirse anlık görünür)">
                          {item.exchange_rate && item.unit_price ? (Number(item.unit_price) * Number(item.exchange_rate)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺' : '-'}
                        </div>
                        <button onClick={() => saveServiceRow("Konaklama", item)} disabled={loading} className="px-4 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700">KAYDET</button>
                        <button onClick={() => removeService("Konaklama", item.id)} className="px-3 bg-red-100 text-red-600 rounded hover:bg-red-200"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "flight" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-v3-text flex items-center gap-2"><span className="text-blue-500">✈️</span> Uçuşlar</h3>
                <button onClick={() => addEmptyService("Uçak")} className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-colors"><Plus className="w-3 h-3" /> YENİ EKLE</button>
              </div>
              
              {flights.length === 0 && <p className="text-xs text-v3-muted text-center py-6">Kayıtlı uçuş bulunamadı.</p>}

              {flights.map((item, idx) => (
                <div key={item.id} className="bg-v3-surface border border-v3-border rounded-xl p-4 space-y-4 relative">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    
                    {/* Row 1 */}
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Uçuş Sınıfı</label>
                      <select value={item.sub_category || ""} onChange={e => updateServiceField("Uçak", item.id, "sub_category", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none">
                        <option value="">-- Sınıf --</option>
                        {categories.filter(c => c.parent_id === catUcak).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Parkur (IST-AYT vb.)</label>
                      <input type="text" value={item.description || ""} onChange={e => updateServiceField("Uçak", item.id, "description", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Gidiş Tarih / Saat / Kod</label>
                      <div className="flex gap-2">
                        <input type="date" value={item.gidis_tarihi || ""} onChange={e => updateServiceField("Uçak", item.id, "gidis_tarihi", e.target.value)} className="w-1/2 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                        <input type="time" value={item.gidis_saati || ""} onChange={e => updateServiceField("Uçak", item.id, "gidis_saati", e.target.value)} className="w-1/4 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                        <input type="text" placeholder="Kod" value={item.gidis_ucus_kodu || ""} onChange={e => updateServiceField("Uçak", item.id, "gidis_ucus_kodu", e.target.value)} className="w-1/4 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                      </div>
                    </div>

                    {/* Row 2 */}
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">PNR</label>
                      <input type="text" value={item.pnr || ""} onChange={e => updateServiceField("Uçak", item.id, "pnr", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Havayolu</label>
                      <input type="text" value={item.havayolu || ""} onChange={e => updateServiceField("Uçak", item.id, "havayolu", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Dönüş Tarih / Saat / Kod</label>
                      <div className="flex gap-2">
                        <input type="date" value={item.donus_tarihi || ""} onChange={e => updateServiceField("Uçak", item.id, "donus_tarihi", e.target.value)} className="w-1/2 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                        <input type="time" value={item.donus_saati || ""} onChange={e => updateServiceField("Uçak", item.id, "donus_saati", e.target.value)} className="w-1/4 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                        <input type="text" placeholder="Kod" value={item.donus_ucus_kodu || ""} onChange={e => updateServiceField("Uçak", item.id, "donus_ucus_kodu", e.target.value)} className="w-1/4 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                      </div>
                    </div>

                    {/* Row 3 */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Tedarikçi</label>
                      <input type="text" value={item.tedarikci || ""} onChange={e => updateServiceField("Uçak", item.id, "tedarikci", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1 text-blue-600 dark:text-blue-400">Ödeyen Kurum</label>
                      <select value={item.payer_company_id || ""} onChange={e => updateServiceField("Uçak", item.id, "payer_company_id", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded text-blue-900 dark:text-blue-100 outline-none">
                        <option value="">-- Katılımcı (Bireysel) --</option>
                        {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>

                    {/* Row 4 */}
                    <div className="md:col-span-4 mt-2 pt-3 border-t border-gray-100 dark:border-white/5">
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Tutar & Döviz</label>
                      <div className="flex gap-2">
                        <input type="number" value={item.unit_price || 0} onChange={e => updateServiceField("Uçak", item.id, "unit_price", Number(e.target.value))} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                        <select value={item.currency || "EUR"} onChange={e => updateServiceField("Uçak", item.id, "currency", e.target.value)} className="w-20 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none">
                          <option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="TRY">TRY</option>
                        </select>
                        <input type="number" step="0.0001" placeholder="Kur" value={item.exchange_rate || ''} onChange={e => updateServiceField("Uçak", item.id, "exchange_rate", e.target.value)} title="Manuel kur. Boş bırakırsanız projenin genel kurunu kullanır." className="w-20 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                        <div className="h-9 px-3 flex items-center bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-v3-border rounded text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap min-w-[90px]" title="Toplam TL (Sadece manuel kur girilirse anlık görünür)">
                          {item.exchange_rate && item.unit_price ? (Number(item.unit_price) * Number(item.exchange_rate)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺' : '-'}
                        </div>
                        <button onClick={() => saveServiceRow("Uçak", item)} disabled={loading} className="px-4 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700">KAYDET</button>
                        <button onClick={() => removeService("Uçak", item.id)} className="px-3 bg-red-100 text-red-600 rounded hover:bg-red-200"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}{activeTab === "companion" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-v3-text flex items-center gap-2"><span className="text-pink-500">👨‍👩‍👧</span> Refakatçi (Eş/Çocuk)</h3>
                <button onClick={addEmptyCompanion} className="flex items-center gap-1 px-3 py-1.5 bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 text-xs font-bold rounded-lg hover:bg-pink-200 dark:hover:bg-pink-500/30 transition-colors"><Plus className="w-3 h-3" /> REFAKATÇİ EKLE</button>
              </div>
              
              {companions.length === 0 && <p className="text-xs text-v3-muted text-center py-6">Kayıtlı refakatçi bulunamadı.</p>}

              {companions.map((item, idx) => (
                <div key={item.id} className="bg-v3-surface border border-v3-border rounded-xl p-4 space-y-4 relative">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Ad</label>
                      <input type="text" value={item.first_name || ""} onChange={e => updateCompanionField(item.id, "first_name", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Soyad</label>
                      <input type="text" value={item.last_name || ""} onChange={e => updateCompanionField(item.id, "last_name", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">TC / Pasaport</label>
                      <input type="text" value={item.tc_passport || ""} onChange={e => updateCompanionField(item.id, "tc_passport", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Aksiyon</label>
                      <div className="flex gap-2">
                        <button onClick={() => saveCompanion(item)} disabled={loading} className="w-full h-9 bg-pink-600 text-white rounded text-xs font-bold hover:bg-pink-700">KAYDET</button>
                        <button onClick={() => removeCompanion(item.id)} className="w-9 h-9 flex items-center justify-center bg-red-100 text-red-600 rounded hover:bg-red-200 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}          {activeTab === "transfer" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-v3-text flex items-center gap-2"><span className="text-indigo-500">🚙</span> Transferler</h3>
                <button onClick={() => addEmptyService("Transfer")} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-500/30 transition-colors"><Plus className="w-3 h-3" /> YENİ EKLE</button>
              </div>
              
              {transfers.length === 0 && <p className="text-xs text-v3-muted text-center py-6">Kayıtlı transfer bulunamadı.</p>}

              {transfers.map((item, idx) => (
                <div key={item.id} className="bg-v3-surface border border-v3-border rounded-xl p-4 space-y-4 relative">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Transfer Tipi</label>
                      <select value={item.sub_category || ""} onChange={e => updateServiceField("Transfer", item.id, "sub_category", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none">
                        <option value="">-- Araç Tipi --</option>
                        {categories.filter(c => c.parent_id === catTransfer).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Güzergah (HVL-Otel vb.)</label>
                      <input type="text" value={item.route || ""} onChange={e => updateServiceField("Transfer", item.id, "route", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Tarih / Saat</label>
                      <div className="flex gap-1">
                        <input type="date" value={item.date || ""} onChange={e => updateServiceField("Transfer", item.id, "date", e.target.value)} className="w-2/3 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                        <input type="time" value={item.time || ""} onChange={e => updateServiceField("Transfer", item.id, "time", e.target.value)} className="w-1/3 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Yön (Geliş / Dönüş)</label>
                      <input type="text" value={item.direction || ""} onChange={e => updateServiceField("Transfer", item.id, "direction", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Tedarikçi Adı</label>
                      <input type="text" value={item.supplier_name || ""} onChange={e => updateServiceField("Transfer", item.id, "supplier_name", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Araç Tipi / Transfer Türü</label>
                      <div className="flex gap-1">
                        <input type="text" placeholder="Araç Tipi" value={item.vehicle_type || ""} onChange={e => updateServiceField("Transfer", item.id, "vehicle_type", e.target.value)} className="w-1/2 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                        <input type="text" placeholder="Tür (VIP vb.)" value={item.transfer_type || ""} onChange={e => updateServiceField("Transfer", item.id, "transfer_type", e.target.value)} className="w-1/2 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Uçuş Kodu</label>
                      <input type="text" value={item.flight_code || ""} onChange={e => updateServiceField("Transfer", item.id, "flight_code", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1 text-indigo-600 dark:text-indigo-400">Ödeyen Kurum</label>
                      <select value={item.payer_company_id || ""} onChange={e => updateServiceField("Transfer", item.id, "payer_company_id", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-900/30 rounded text-indigo-900 dark:text-indigo-100 outline-none">
                        <option value="">-- Katılımcı (Bireysel) --</option>
                        {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>

                    <div className="md:col-span-4 mt-2 pt-3 border-t border-gray-100 dark:border-white/5">
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Tutar & Döviz</label>
                      <div className="flex gap-2">
                        <input type="number" value={item.unit_price || 0} onChange={e => updateServiceField("Transfer", item.id, "unit_price", Number(e.target.value))} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                        <select value={item.currency || "EUR"} onChange={e => updateServiceField("Transfer", item.id, "currency", e.target.value)} className="w-20 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none">
                          <option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="TRY">TRY</option>
                        </select>
                        <input type="number" step="0.0001" placeholder="Kur" value={item.exchange_rate || ''} onChange={e => updateServiceField("Transfer", item.id, "exchange_rate", e.target.value)} title="Manuel kur. Boş bırakırsanız projenin genel kurunu kullanır." className="w-20 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                        <div className="h-9 px-3 flex items-center bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-v3-border rounded text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap min-w-[90px]" title="Toplam TL (Sadece manuel kur girilirse anlık görünür)">
                          {item.exchange_rate && item.unit_price ? (Number(item.unit_price) * Number(item.exchange_rate)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺' : '-'}
                        </div>
                        <button onClick={() => saveServiceRow("Transfer", item)} disabled={loading} className="px-4 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700">KAYDET</button>
                        <button onClick={() => removeService("Transfer", item.id)} className="px-3 bg-red-100 text-red-600 rounded hover:bg-red-200"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-200 dark:border-v3-border bg-gray-50 dark:bg-white/5 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2 text-xs font-bold text-gray-600 dark:text-v3-muted hover:text-gray-900 dark:hover:text-v3-text transition-colors">
            KAPAT
          </button>
          {activeTab === "info" && (
            <button form="participantForm" type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg shadow-blue-500/20 transition-all">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              KAYDET
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
