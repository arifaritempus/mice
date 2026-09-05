"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseService";
import { toast } from "react-hot-toast";
import { Briefcase, Users, UserPlus, FileSpreadsheet, Building2, Search, Filter, Trash2, Edit, ChevronDown, CheckSquare, Settings2, Download, Printer, X } from "lucide-react";
import CongressBadgePrintModal from "./CongressBadgePrintModal";
import CongressParticipantModal from "./CongressParticipantModal";
import CongressParticipantBulkModal from "./CongressParticipantBulkModal";
import CongressBulkServiceAssignModal from "./CongressBulkServiceAssignModal";

export default function CongressParticipantsTab({ projectId, project, reloadProject }: { projectId: string; project: any; reloadProject?: () => void }) {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isBulkServiceModalOpen, setIsBulkServiceModalOpen] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredParticipants = participants.filter(p => {
    const text = `${p.first_name || ""} ${p.last_name || ""} ${p.company?.name || ""} ${p.title || ""} ${p.tc_passport || ""} ${p.email || ""} ${p.phone || ""} ${p.registration_type || ""} ${p.notes || ""}`.toLowerCase();
    if (searchTerms.length > 0 && !searchTerms.every(term => text.includes(term.toLowerCase()))) return false;
    if (searchInput && !text.includes(searchInput.toLowerCase())) return false;
    return true;
  });

  const handleOpenModal = (p?: any) => {
    setSelectedParticipant(p || null);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (projectId) {
      loadParticipants();
    }
  }, [projectId]);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_participants')
        .select(`
          *,
          company:company_id (id, name)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Servisleri ayrı çekiyoruz (Supabase PostgREST cache sorununu aşmak için)
      const { data: salesData } = await supabase
        .from('project_sales_items')
        .select('id, participant_id, category')
        .eq('project_id', projectId)
        .not('participant_id', 'is', null);

      const enhancedData = (data || []).map((p: any) => ({
        ...p,
        services: (salesData || []).filter((s: any) => s.participant_id === p.id)
      }));

      setParticipants(enhancedData);
    } catch (error) {
      console.error("Katılımcılar yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bu katılımcıyı ve ona bağlı tüm hizmetleri (satış, uçak, transfer) silmek istediğinize emin misiniz?")) return;
    try {
      const { data: sales } = await supabase.from('project_sales_items').select('id').eq('participant_id', id);
      if (sales && sales.length > 0) {
        const saleIds = sales.map(s => s.id);
        await supabase.from('project_flight_tickets').delete().in('id', saleIds);
        await supabase.from('project_transfer_tour').delete().in('id', saleIds);
      }
      await supabase.from('project_sales_items').delete().eq('participant_id', id);
      const { error } = await supabase.from('project_participants').delete().eq('id', id);
      if (error) throw error;
      
      toast.success("Katılımcı ve bağlı tüm hizmetleri silindi.");
      setParticipants(prev => prev.filter(p => p.id !== id));
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    } catch (err: any) {
      toast.error("Silinirken hata: " + err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Seçili ${selectedIds.size} katılımcıyı ve onlara bağlı TÜM satış, uçak, transfer kalemlerini silmek istediğinize emin misiniz?`)) return;

    try {
      const ids = Array.from(selectedIds);
      
      const { data: sales } = await supabase.from('project_sales_items').select('id').in('participant_id', ids);
      if (sales && sales.length > 0) {
        const saleIds = sales.map(s => s.id);
        await supabase.from('project_flight_tickets').delete().in('id', saleIds);
        await supabase.from('project_transfer_tour').delete().in('id', saleIds);
      }
      
      await supabase.from('project_sales_items').delete().in('participant_id', ids);
      const { error } = await supabase.from('project_participants').delete().in('id', ids);
      if (error) throw error;
      
      toast.success(`${ids.length} katılımcı ve bağlı hizmetleri silindi.`);
      setParticipants(prev => prev.filter(p => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
    } catch (err: any) {
      toast.error("Silinirken hata: " + err.message);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === participants.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(participants.map(p => p.id)));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Üst Kısım: Aksiyonlar ve Metrikler */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metrik Kartı 1 */}
        <div className="bg-v3-surface backdrop-blur-md rounded-xl p-4 border border-v3-border shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-v3-muted tracking-wider uppercase">Toplam Katılımcı</p>
              <h3 className="text-xl font-black text-v3-text">{participants.length}</h3>
            </div>
          </div>
        </div>

        {/* Aksiyon Butonları */}
        <div className="md:col-span-3 flex items-center justify-end gap-2">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 bg-white dark:bg-v3-bg p-1 rounded-xl border border-v3-border mr-2">
              <button onClick={() => setIsBulkServiceModalOpen(true)} className="h-8 px-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> HİZMET ATA ({selectedIds.size})
              </button>
              <button onClick={() => setShowBadgeModal(true)} className="h-8 px-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" /> Yaka Kartı ({selectedIds.size})
              </button>
              <button onClick={handleBulkDelete} className="h-8 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5" /> SİL ({selectedIds.size})
              </button>
            </div>
          )}
          <button onClick={() => setIsBulkModalOpen(true)} className="h-10 px-4 bg-v3-surface hover:bg-white/5 text-v3-text text-xs font-bold rounded-lg border border-v3-border transition-colors flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            TOPLU EXCEL YÜKLE
          </button>
          <button onClick={() => handleOpenModal()} className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20">
            <UserPlus className="w-4 h-4" />
            YENİ KATILIMCI
          </button>
        </div>
      </div>

      {/* Tablo Alanı */}
      <div className="bg-v3-surface backdrop-blur-md rounded-xl border border-v3-border shadow-lg overflow-hidden flex flex-col min-h-[400px]">
        {/* Toolbar */}
        <div className="p-3 border-b border-v3-border flex items-center justify-between bg-black/10 dark:bg-white/5">
          
          <div className="flex-1 flex flex-wrap items-center gap-2 p-1.5 bg-black/20 dark:bg-white/5 border border-v3-border rounded-lg min-h-[32px]">
            <Search className="w-4 h-4 text-v3-muted ml-1 shrink-0" />
            {searchTerms.map((term, idx) => (
              <span key={idx} className="flex items-center gap-1 bg-black/20 dark:bg-white/10 px-2 py-0.5 rounded text-xs font-bold text-v3-text">
                {term}
                <button onClick={() => setSearchTerms(prev => prev.filter((_, i) => i !== idx))} className="hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input 
              type="text"
              placeholder={searchTerms.length === 0 ? "İsim, kurum, e-posta ara (Enter'a basın)..." : "Yeni kelime ekle..."}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchInput.trim()) {
                  e.preventDefault();
                  if (!searchTerms.includes(searchInput.trim())) setSearchTerms(prev => [...prev, searchInput.trim()]);
                  setSearchInput("");
                }
              }}
              className="flex-1 bg-transparent border-none outline-none text-xs text-v3-text min-w-[200px]"
            />
          </div>
  
          <button className="h-8 px-3 bg-black/20 dark:bg-white/5 text-v3-muted hover:text-v3-text text-xs font-bold rounded-lg border border-v3-border transition-colors flex items-center gap-2">
            <Filter className="w-3.5 h-3.5" />
            FİLTRELE
          </button>
        </div>

        {/* Tablo */}
        <div className="flex-1 overflow-auto no-scrollbar relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : participants.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-v3-muted">
              <Users className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">Henüz katılımcı eklenmemiş</p>
              <p className="text-xs opacity-60 mt-1">Excel yükleyerek veya manuel katılımcı ekleyebilirsiniz.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/10 dark:bg-white/5 sticky top-0 z-10">
                  <th className="px-4 py-2 text-[10px] font-black tracking-wider text-v3-muted uppercase border-b border-v3-border w-10">
                    <input type="checkbox" checked={selectedIds.size === participants.length && participants.length > 0} onChange={toggleSelectAll} className="rounded bg-black/20 border-v3-border" />
                  </th>
                  <th className="px-4 py-2 text-[10px] font-black tracking-wider text-v3-muted uppercase border-b border-v3-border">KATILIMCI</th>
                  <th className="px-4 py-2 text-[10px] font-black tracking-wider text-v3-muted uppercase border-b border-v3-border">TİP</th>
                  <th className="px-4 py-2 text-[10px] font-black tracking-wider text-v3-muted uppercase border-b border-v3-border">SPONSOR/KURUM</th>
                  <th className="px-4 py-2 text-[10px] font-black tracking-wider text-v3-muted uppercase border-b border-v3-border text-center">KAYIT</th>
                  <th className="px-4 py-2 text-[10px] font-black tracking-wider text-v3-muted uppercase border-b border-v3-border text-center">KONAKLAMA</th>
                  <th className="px-4 py-2 text-[10px] font-black tracking-wider text-v3-muted uppercase border-b border-v3-border text-center">UÇUŞ</th>
                  <th className="px-4 py-2 text-[10px] font-black tracking-wider text-v3-muted uppercase border-b border-v3-border text-center">TRANSFER</th>
                  <th className="px-4 py-2 text-[10px] font-black tracking-wider text-v3-muted uppercase border-b border-v3-border text-right">AKSİYON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-v3-border">
                {participants.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => handleOpenModal(p)}>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded bg-black/20 border-v3-border" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-v3-text">{p.first_name} {p.last_name}</span>
                        <span className="text-[10px] text-v3-muted">{p.email || p.phone || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                        p.registration_type === 'VIP' ? 'bg-amber-500/10 text-amber-500' :
                        p.registration_type === 'Speaker' ? 'bg-purple-500/10 text-purple-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {p.registration_type || 'Delege'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-v3-muted" />
                        <span className="text-xs font-medium text-v3-text">{p.company?.name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex w-2 h-2 rounded-full ${p.services?.some((s: any) => s.category === '69d22049-1113-49d7-bd28-8b4618dcf75a') ? 'bg-orange-500' : 'bg-v3-muted opacity-30'}`} title={p.services?.some((s: any) => s.category === '69d22049-1113-49d7-bd28-8b4618dcf75a') ? "Kayıt paketi var" : "Kayıt paketi yok"}></span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex w-2 h-2 rounded-full ${p.services?.some((s: any) => s.category === 'd7bda8d3-0b42-45a1-958d-3b5239ee66b6') ? 'bg-emerald-500' : 'bg-v3-muted opacity-30'}`} title={p.services?.some((s: any) => s.category === 'd7bda8d3-0b42-45a1-958d-3b5239ee66b6') ? "Konaklama var" : "Konaklama yok"}></span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex w-2 h-2 rounded-full ${p.services?.some((s: any) => s.category === '52708355-de87-44ae-a733-d10bd7cf7a8b') ? 'bg-blue-500' : 'bg-v3-muted opacity-30'}`} title={p.services?.some((s: any) => s.category === '52708355-de87-44ae-a733-d10bd7cf7a8b') ? "Uçuş var" : "Uçuş yok"}></span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex w-2 h-2 rounded-full ${p.services?.some((s: any) => s.category === '80b22984-83ba-41d7-bb8e-0d9c1968b614') ? 'bg-purple-500' : 'bg-v3-muted opacity-30'}`} title={p.services?.some((s: any) => s.category === '80b22984-83ba-41d7-bb8e-0d9c1968b614') ? "Transfer var" : "Transfer yok"}></span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); handleOpenModal(p); }} className="text-[10px] font-bold text-blue-400 hover:text-blue-300">
                          DÜZENLE
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="text-v3-muted hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <CongressParticipantModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          projectId={projectId}
          project={project}
          participant={selectedParticipant}
          onSuccess={() => { loadParticipants(); if (reloadProject) reloadProject(); }}
        />
      )}

      {isBulkServiceModalOpen && (
        <CongressBulkServiceAssignModal
          isOpen={isBulkServiceModalOpen}
          onClose={() => setIsBulkServiceModalOpen(false)}
          participantIds={Array.from(selectedIds)}
          projectId={projectId}
          project={project}
          participantsData={participants}
          projectHotels={project?.hotels_data || []}
          onSuccess={() => { loadParticipants(); if (reloadProject) reloadProject(); setSelectedIds(new Set()); }}
        />
      )}

      {isBulkModalOpen && (
        <CongressParticipantBulkModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          projectId={projectId}
          onSuccess={loadParticipants}
        />
      )}

      {showBadgeModal && (
        <CongressBadgePrintModal
          project={project}
          participants={participants.filter((p: any) => selectedIds.has(p.id))}
          onClose={() => setShowBadgeModal(false)}
        />
      )}
    </div>
  );
}
