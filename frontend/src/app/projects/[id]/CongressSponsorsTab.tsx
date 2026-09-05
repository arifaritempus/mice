"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseService";
import { Building2, Plus, PieChart, Users, BedDouble, Plane, Car, BadgeDollarSign, X, Check, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

const CATEGORY_UUIDS = {
  "Kayıt": "69d22049-1113-49d7-bd28-8b4618dcf75a",
  "Konaklama": "d7bda8d3-0b42-45a1-958d-3b5239ee66b6",
  "Uçak": "52708355-de87-44ae-a733-d10bd7cf7a8b",
  "Transfer": "80b22984-83ba-41d7-bb8e-0d9c1968b614",
  "Ekstra": "e7bda8d3-0b42-45a1-958d-3b5239ee66b7" // Dummy UUID for Extras
};

export default function CongressSponsorsTab({ projectId, project }: { projectId: string; project: any }) {
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [extraDesc, setExtraDesc] = useState("");
  const [extraAmount, setExtraAmount] = useState("");
  const [extraCurrency, setExtraCurrency] = useState("EUR");
  const [extraExchangeRate, setExtraExchangeRate] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [extraCategory, setExtraCategory] = useState<string>("");

  
  useEffect(() => {
    const handleAddSponsor = () => {
      setSelectedCompanyId("");
      setExtraDesc("");
      setExtraAmount("");
      setExtraCurrency("EUR");
      setExtraExchangeRate("");
      setIsModalOpen(true);
    };
    window.addEventListener('action-add-sponsor', handleAddSponsor);
    return () => window.removeEventListener('action-add-sponsor', handleAddSponsor);
  }, []);
  
  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: sales } = await supabase
        .from("project_sales_items")
        .select("*, payer_company_id")
        .eq("project_id", projectId)
        .not("payer_company_id", "is", null);

      if (!sales) return;

      const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      const companyIds = [...new Set(sales.map(s => s.payer_company_id))].filter(isUUID);
      const { data: companies } = companyIds.length > 0 
        ? await supabase.from("agencies").select("id, name").in("id", companyIds)
        : { data: [] };
      
      const { data: cats } = await supabase.from("categories").select("id, name, parent_id");
      setCategories(cats || []);
      if (cats && cats.length > 0) setExtraCategory(cats[0].id);

      
      const { data: ags } = await supabase.from("agencies").select("id, name").order("name");
      if(ags) setAgencies(ags);

      const compMap: any = {};
      companies?.forEach(c => compMap[c.id] = c.name);

      const sponsorMap: any = {};
      
      sales.forEach(s => {
        const cid = s.payer_company_id;
        if (!sponsorMap[cid]) {
          sponsorMap[cid] = {
            id: cid,
            name: compMap[cid] || "Bilinmeyen Firma",
            totals: { kayit: 0, konaklama: 0, ucak: 0, transfer: 0 },
            extras: [], // Detaylı ekstra listesi
            total_revenue_try: 0,
            total_revenue_eur: 0,
            total_revenue_usd: 0,
          };
        }

        if (s.currency === "TRY") sponsorMap[cid].total_revenue_try += s.total_price || 0;
        else if (s.currency === "EUR") sponsorMap[cid].total_revenue_eur += s.total_price || 0;
        else if (s.currency === "USD") sponsorMap[cid].total_revenue_usd += s.total_price || 0;
        else sponsorMap[cid].total_revenue_try += s.total_price || 0; // Default fallback

        if (s.participant_id) {
          if (s.category === CATEGORY_UUIDS["Kayıt"]) sponsorMap[cid].totals.kayit += 1;
          else if (s.category === CATEGORY_UUIDS["Konaklama"]) sponsorMap[cid].totals.konaklama += 1;
          else if (s.category === CATEGORY_UUIDS["Uçak"]) sponsorMap[cid].totals.ucak += 1;
          else if (s.category === CATEGORY_UUIDS["Transfer"]) sponsorMap[cid].totals.transfer += 1;
          else {
             sponsorMap[cid].extras.push({
               id: s.id,
               desc: s.description || "Ekstra Hizmet",
               price: s.total_price,
               currency: s.currency
             });
          }
        } else {
          // Eğer participant_id yoksa bu manuel/ekstra bir satıştır. Her türlü ekstralara ekle.
          sponsorMap[cid].extras.push({
            id: s.id,
            desc: s.description || "Ekstra Satış",
            price: s.total_price,
            currency: s.currency
          });
        }
      });

      setSponsors(Object.values(sponsorMap));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };



  const handleDeleteExtra = async (id: string) => {
    if (!window.confirm("Bu satış kalemini silmek istediğinize emin misiniz?")) return;
    toast.loading("Siliniyor...");
    const { error } = await supabase.from("project_sales_items").delete().eq("id", id);
    toast.dismiss();
    if (error) {
      toast.error("Silinirken hata oluştu.");
    } else {
      toast.success("Satış kalemi silindi.");
      loadData();
    }
  };

  const openAddExtraModal = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setExtraDesc("");
    setExtraAmount("");
    setExtraCurrency("EUR");
    setIsModalOpen(true);
  };

  const saveExtraSponsorship = async () => {
    if (!selectedCompanyId || !extraDesc || !extraAmount) {
      toast.error("Lütfen tüm alanları doldurun.");
      return;
    }
    
    // Find the selected category to check if it has a parent
    const selectedCatObj = categories.find(c => c.id === extraCategory);
    const mainCategory = selectedCatObj?.parent_id ? selectedCatObj.parent_id : extraCategory;
    const subCategory = selectedCatObj?.parent_id ? extraCategory : null;

    toast.loading("Sponsorluk Ekleniyor...");
    const { error } = await supabase.from("project_sales_items").insert([{
      project_id: projectId,
      payer_company_id: selectedCompanyId,
      category: mainCategory,
      sub_category: subCategory,
      description: extraDesc,
      unit_price: parseFloat(extraAmount),
      unit_quantity: 1,
      total_price: parseFloat(extraAmount),
      currency: extraCurrency,
        exchange_rate: extraExchangeRate ? Number(extraExchangeRate) : null,
        fx: extraExchangeRate ? Number(extraExchangeRate) : null,
        total_try: extraExchangeRate ? (Number(extraAmount) || 0) * Number(extraExchangeRate) : null
    }]);

    toast.dismiss();
    if (error) {
      toast.error("Hata: " + error.message);
    } else {
      toast.success("Başarıyla Eklendi!");
      setIsModalOpen(false);
      loadData();
    }
  };

  if (loading) return <div className="p-8 text-center text-v3-muted">Sponsor verileri yükleniyor...</div>;

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="bg-v3-surface p-6 rounded-2xl border border-v3-border shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-emerald-500 flex items-center gap-2">
            <PieChart className="w-6 h-6" /> Kurumsal Sponsorluk ve P&L
          </h2>
          <p className="text-xs text-v3-muted mt-1">Firmaların kongreye sağladığı ciro, stant ve paket katılımlarını yönetin.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sponsors.map(sp => {
          return (
            <div key={sp.id} className="bg-white dark:bg-black/20 border border-v3-border rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all flex flex-col h-full">
              <div className="flex items-start justify-between mb-4 border-b border-v3-border pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/10`}>
                    <Building2 className={`w-5 h-5 text-purple-500`} />
                  </div>
                  <div>
                    <h3 className="font-black text-v3-text text-base line-clamp-1" title={sp.name}>{sp.name}</h3>
                    <p className={`text-[9px] font-black uppercase tracking-wider text-v3-muted`}>FİRMA / SPONSOR</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-2 mb-4">
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-black/5 dark:bg-white/5 p-2 rounded-lg text-center">
                    <p className="text-[10px] text-v3-muted font-bold">KAYIT</p>
                    <p className="text-sm font-black text-v3-text">{sp.totals.kayit} <span className="text-[10px] font-normal text-v3-muted">Pax</span></p>
                  </div>
                  <div className="bg-black/5 dark:bg-white/5 p-2 rounded-lg text-center">
                    <p className="text-[10px] text-v3-muted font-bold">ODA (BLOK)</p>
                    <p className="text-sm font-black text-v3-text">{sp.totals.konaklama} <span className="text-[10px] font-normal text-v3-muted">Oda</span></p>
                  </div>
                </div>

                {(sp.totals.ucak > 0 || sp.totals.transfer > 0) && (
                  <div className="flex items-center gap-4 text-[10px] text-v3-muted font-semibold bg-black/5 dark:bg-white/5 p-2 rounded-lg mb-4">
                    {sp.totals.ucak > 0 && <span className="flex items-center gap-1"><Plane className="w-3 h-3"/> Uçak: {sp.totals.ucak}</span>}
                    {sp.totals.transfer > 0 && <span className="flex items-center gap-1"><Car className="w-3 h-3"/> Transfer: {sp.totals.transfer}</span>}
                  </div>
                )}

                {/* Ekstra Satışlar Listesi */}
                {sp.extras.length > 0 && (
                  <div className="mt-4 border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-3">
                    <p className="text-[10px] font-black text-emerald-600 mb-2 flex items-center gap-1">
                      <BadgeDollarSign className="w-3 h-3" /> EKSTRA SPONSORLUKLAR
                    </p>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto no-scrollbar">
                      {sp.extras.map((ex: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-xs group/item">
                          <span className="text-v3-text line-clamp-1 flex-1 pr-2">{ex.desc}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold whitespace-nowrap">{ex.price.toLocaleString()} {ex.currency}</span>
                            <button onClick={() => handleDeleteExtra(ex.id)} className="text-v3-muted hover:text-red-500 transition-colors p-1" title="Sil">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-v3-border pt-4 mt-auto">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] text-v3-muted font-bold">TOPLAM SPONSORLUK HACMİ</p>
                </div>
                <div className="flex flex-col gap-1 mb-4">
                  {sp.total_revenue_eur > 0 && <p className="text-lg font-black text-blue-600">{sp.total_revenue_eur.toLocaleString()} <span className="text-xs">EUR</span></p>}
                  {sp.total_revenue_usd > 0 && <p className="text-lg font-black text-green-600">{sp.total_revenue_usd.toLocaleString()} <span className="text-xs">USD</span></p>}
                  {sp.total_revenue_try > 0 && <p className="text-lg font-black text-v3-text">{sp.total_revenue_try.toLocaleString()} <span className="text-xs">TRY</span></p>}
                </div>
                
                <button 
                  onClick={() => openAddExtraModal(sp.id)}
                  className="w-full py-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-purple-500 hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4" /> EKSTRA SATIŞ EKLE (STANT vb.)
                </button>
              </div>
            </div>
          )
        })}

        {sponsors.length === 0 && (
          <div className="col-span-full py-12 text-center text-v3-muted border-2 border-dashed border-v3-border rounded-2xl">
            Bu projede henüz kurum hesabına (Sponsor) kesilmiş bir satış yok.
            <br/>Katılımcıları yüklerken kurum seçtiğinizde burada belirecekler.
          </div>
        )}
      </div>

      {/* Tailwind Modal for Adding Extra Sponsorship */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-v3-surface w-full max-w-md rounded-2xl border border-v3-border shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-v3-muted hover:text-v3-text">
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <BadgeDollarSign className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-black text-v3-text">Sponsorluk Satışı Ekle</h3>
                <p className="text-[10px] text-v3-muted">Stant alanı, reklam veya uydu sempozyumu</p>
              </div>
            </div>

            <div className="space-y-4">

              <div>
                <label className="block text-xs font-bold text-v3-muted mb-1">Firma / Kurum</label>
                <select 
                  value={selectedCompanyId || ""} onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="w-full h-10 px-3 mb-3 rounded-lg border border-v3-border bg-black/5 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-v3-text"
                >
                  <option value="">-- Firma Seçin --</option>
                  {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-v3-muted mb-1">Kategori</label>
                <select 
                  value={extraCategory} onChange={(e) => setExtraCategory(e.target.value)}
                  className="w-full h-10 px-3 mb-3 rounded-lg border border-v3-border bg-black/5 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-v3-text"
                >
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <label className="block text-xs font-bold text-v3-muted mb-1">Satış Kalemi (Açıklama)</label>
                <input 
                  type="text" 
                  placeholder="Örn: 12m2 Ana Fuaye Stand Alanı"
                  value={extraDesc} onChange={(e) => setExtraDesc(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-v3-border bg-black/5 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-v3-text"
                />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-v3-muted mb-1">Tutar</label>
                  <input 
                    type="number" 
                    placeholder="Örn: 15000"
                    value={extraAmount} onChange={(e) => setExtraAmount(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-v3-border bg-black/5 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-v3-text"
                  />
                </div>
                <div className="w-1/4">
                  <label className="block text-xs font-bold text-v3-muted mb-1">Döviz</label>
                  <select 
                    value={extraCurrency} onChange={(e) => setExtraCurrency(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-v3-border bg-black/5 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-v3-text"
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="TRY">TRY</option>
                  </select>
                </div>
                <div className="w-1/4">
                  <label className="block text-xs font-bold text-v3-muted mb-1">Kur (Opsiyonel)</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Boş=TCMB"
                    className="w-full h-10 px-3 rounded-lg border border-v3-border bg-black/5 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-v3-text"
                    value={extraExchangeRate}
                    onChange={(e) => setExtraExchangeRate(e.target.value)}
                    title="Manuel kur belirlemek isterseniz girin. Boş bırakırsanız projenin genel kurunu kullanır."
                  />
                </div>
                <div className="w-1/4">
                  <label className="block text-xs font-bold text-v3-muted mb-1">Toplam TL</label>
                  <div className="w-full h-10 px-3 flex items-center rounded-lg border border-v3-border bg-gray-100 dark:bg-black/40 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {extraExchangeRate && extraAmount ? (Number(extraAmount) * Number(extraExchangeRate)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺' : '-'}
                  </div>
                </div>
              </div>

              <button 
                onClick={saveExtraSponsorship}
                className="w-full mt-4 h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Check className="w-5 h-5" /> Satışı Onayla ve Proformaya Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}