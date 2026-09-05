"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabaseService";
import { BedDouble, Users, ArrowRightLeft, Building, User, Trash2, CheckCircle2, AlertTriangle, Info, Search, Maximize2, Minimize2, X, CalendarDays, Calculator, Download } from "lucide-react";
import { toast } from "react-hot-toast";
import CongressParticipantModal from "./CongressParticipantModal";

export default function CongressRoomingTab({ projectId, project }: { projectId: string; project: any }) {
  const [participants, setParticipants] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [hotelMap, setHotelMap] = useState<Record<string, string>>({});
  const [selectedHotelId, setSelectedHotelId] = useState<string>("");
  const [showReconModal, setShowReconModal] = useState(false);
  const [reconReport, setReconReport] = useState<any>(null);
  
  const [poolSearchTerms, setPoolSearchTerms] = useState<string[]>([]);
  const [poolSearchInput, setPoolSearchInput] = useState("");
  const [roomSearchTerms, setRoomSearchTerms] = useState<string[]>([]);
  const [roomSearchInput, setRoomSearchInput] = useState("");
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showForecast, setShowForecast] = useState(false);
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [projectId, project]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: hData } = await supabase.from('hotels').select('id, name');
      const hMap: Record<string, string> = {};
      if (hData) hData.forEach(h => hMap[h.id] = h.name);
      setHotelMap(hMap);

      if (project?.hotels_data && project.hotels_data.length > 0) {
        setSelectedHotelId("all");
      }

      const { data: pData } = await supabase.from('project_participants').select(`*, company:company_id(name)`).eq('project_id', projectId);
      const { data: sData } = await supabase.from('project_sales_items').select('participant_id, description, hotel_id, reference, reference_code, voucher_no').eq('project_id', projectId).eq('category', 'd7bda8d3-0b42-45a1-958d-3b5239ee66b6').not('participant_id', 'is', null);
      const { data: fData } = await supabase.from('project_sales_items').select('participant_id, description, reference, reference_code').eq('project_id', projectId).eq('category', '52708355-de87-44ae-a733-d10bd7cf7a8b').not('participant_id', 'is', null);

      if (pData && sData) {
        const withHotels = pData.filter(p => sData.some(s => s.participant_id === p.id)).map(p => {
          const sItem = sData.find(s => s.participant_id === p.id);
          const fItem = fData?.find(f => f.participant_id === p.id);
          return { 
            ...p, 
            room_type: sItem?.description || 'DBL', 
            hotel_id: sItem?.hotel_id, 
            c_in: sItem?.reference, 
            c_out: sItem?.reference_code, 
            voucher_no: sItem?.voucher_no,
            flight_desc: fItem?.description || null,
            flight_in: fItem?.reference || null,
            flight_out: fItem?.reference_code || null
          }; 
        });
        
        const initialRooms: any[] = [];
        const finalPool: any[] = [];
        const roomMap: Record<string, any> = {};

        withHotels.forEach(p => {
          if (p.voucher_no) {
            const companyName = p.company?.name || "Bireysel";
            // Gruplama mantığını Şirkete göre DEĞİL, Otele ve Oda Numarasına göre yapıyoruz!
            const roomKey = (p.hotel_id || "belirsiz_otel") + "_" + p.voucher_no;
            
            if (!roomMap[roomKey]) {
              roomMap[roomKey] = {
                id: `room_${Date.now()}_${Math.random()}`,
                room_number: p.voucher_no,
                type: p.room_type,
                hotel_id: p.hotel_id,
                company_name: companyName,
                occupants: []
              };
              initialRooms.push(roomMap[roomKey]);
            }
            roomMap[roomKey].occupants.push(p);
          } else {
            finalPool.push(p);
          }
        });

        setRooms(initialRooms);
        setParticipants(finalPool);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createRoom = (type: 'SNG' | 'DBL') => {
    const newRoom = { id: `room_${Date.now()}`, room_number: `Oda ${rooms.length + 101}`, type, occupants: [], hotel_id: selectedHotelId, company_name: "Atanmamış" };
    setRooms([...rooms, newRoom]);
  };

  const updateOccupantDate = async (roomId: string, participantId: string, field: 'reference' | 'reference_code', value: string) => {
    // 1. Update local state immediately
    setRooms(prev => prev.map(r => {
      if (r.id !== roomId) return r;
      return {
        ...r,
        occupants: r.occupants.map((o: any) => o.id === participantId ? { ...o, [field === 'reference' ? 'c_in' : 'c_out']: value } : o)
      };
    }));
    
    // 2. Update participants array too so if they return to pool it keeps date
    setParticipants(prev => prev.map(p => p.id === participantId ? { ...p, [field === 'reference' ? 'c_in' : 'c_out']: value } : p));
    
    // 3. Update DB
    await supabase.from('project_sales_items')
      .update({ [field]: value })
      .eq('participant_id', participantId)
      .eq('project_id', projectId)
      .eq('category', 'd7bda8d3-0b42-45a1-958d-3b5239ee66b6');
    
    toast.success("Tarih güncellendi.");
  };

  const handleDrop = async (e: React.DragEvent, roomId: string) => {
    e.preventDefault();
    const pId = e.dataTransfer.getData("participant_id");
    if (!pId) return;

    const pIndex = participants.findIndex(p => p.id === pId);
    if (pIndex === -1) return; 
    
    const p = participants[pIndex];
    
    const targetRoom = rooms.find(r => r.id === roomId);
    if (!targetRoom) return;

    if (targetRoom.type === 'SNG' && targetRoom.occupants.length >= 1) { toast.error("Single odaya 1'den fazla kişi eklenemez!"); return; }
    if (targetRoom.type === 'DBL' && targetRoom.occupants.length >= 2) { toast.error("Double odaya 2'den fazla kişi eklenemez!"); return; }

    const targetRoomNumber = targetRoom.room_number;

    setRooms(prev => prev.map(r => {
      if (r.id === roomId) {
        let newCompanyName = r.company_name;
        const pCompany = p.company?.name || "Bireysel";
        if (r.occupants.length === 0) {
           newCompanyName = pCompany;
        } else if (r.company_name !== pCompany && r.company_name !== "Atanmamış") {
           toast("Farklı firmadan bir kişiyi aynı odaya koyuyorsunuz!", { icon: "⚠️" });
        }
        return { ...r, company_name: newCompanyName, occupants: [...r.occupants, p] };
      }
      return r;
    }));

    setParticipants(prev => prev.filter(x => x.id !== pId));
    
    await supabase.from('project_sales_items')
      .update({ voucher_no: targetRoomNumber })
      .eq('participant_id', pId)
      .eq('project_id', projectId)
      .eq('category', 'd7bda8d3-0b42-45a1-958d-3b5239ee66b6');
    toast.success("Odaya yerleştirildi.");
  };

  const removeFromRoom = async (roomId: string, occId: string) => {
    const targetRoom = rooms.find(r => r.id === roomId);
    if (!targetRoom) return;
    
    const removedPerson = targetRoom.occupants.find((o: any) => o.id === occId);
    if (!removedPerson) return;

    setRooms(prev => prev.map(r => {
      if (r.id === roomId) {
        return { ...r, occupants: r.occupants.filter((o: any) => o.id !== occId) };
      }
      return r;
    }));
    
    setParticipants(prev => [...prev, removedPerson]);
    
    await supabase.from('project_sales_items')
      .update({ voucher_no: null })
      .eq('participant_id', occId)
      .eq('project_id', projectId)
      .eq('category', 'd7bda8d3-0b42-45a1-958d-3b5239ee66b6');
    toast.success("Bekleyenlere alındı.");
  };

  const handleDropToWaitlist = async (e: React.DragEvent) => {
    e.preventDefault();
    const pId = e.dataTransfer.getData("room_occupant_id");
    const roomId = e.dataTransfer.getData("from_room_id");
    if (!pId || !roomId) return;
    await removeFromRoom(roomId, pId);
  };

  const allowDrop = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDragStart = (e: React.DragEvent, pId: string) => { e.dataTransfer.setData("participant_id", pId); };

  const activeHotelData = useMemo(() => {
    if (!project?.hotels_data) return null;
    if (selectedHotelId === "all") {
      const totalRooms = project.hotels_data.reduce((sum: number, h: any) => sum + (h.room_count || 0), 0);
      return { room_count: totalRooms };
    }
    return project.hotels_data.find((h: any) => h.hotel_id === selectedHotelId) || null;
  }, [selectedHotelId, project]);

  const roomsForActiveHotel = selectedHotelId === "all" ? rooms : rooms.filter(r => r.hotel_id === selectedHotelId);
  const allotmentTotal = activeHotelData?.room_count || 0;
  const allotmentUsed = roomsForActiveHotel.length;
  const allotmentLeft = allotmentTotal - allotmentUsed;
  const isOverbooked = allotmentLeft < 0;

  const filteredPool = participants.filter(p => {
    if (selectedHotelId !== "all" && p.hotel_id !== selectedHotelId) return false;
    const text = `${p.first_name} ${p.last_name} ${p.company?.name || ""}`.toLowerCase();
    if (poolSearchTerms.length > 0 && !poolSearchTerms.every(term => text.includes(term.toLowerCase()))) return false;
    if (poolSearchInput && !text.includes(poolSearchInput.toLowerCase())) return false;
    return true;
  });

  const forecastData = useMemo(() => {
    const counts: Record<string, number> = {};
    roomsForActiveHotel.forEach(r => {
      if (r.occupants.length > 0) {
        let earliestIn = "2099-12-31";
        let latestOut = "1970-01-01";
        r.occupants.forEach((o: any) => {
          if (o.c_in && o.c_in < earliestIn) earliestIn = o.c_in;
          if (o.c_out && o.c_out > latestOut) latestOut = o.c_out;
        });
        
        if (earliestIn !== "2099-12-31" && latestOut !== "1970-01-01") {
          let current = new Date(earliestIn);
          const end = new Date(latestOut);
          while (current < end) {
            const dateStr = current.toISOString().split('T')[0];
            counts[dateStr] = (counts[dateStr] || 0) + 1;
            current.setDate(current.getDate() + 1);
          }
        }
      }
    });
    return Object.entries(counts).sort((a,b) => a[0].localeCompare(b[0]));
  }, [roomsForActiveHotel]);

  if (loading) return <div className="p-8 text-center text-v3-muted">Odalama verileri yükleniyor...</div>;

  const containerClass = isFullscreen 
    ? "fixed inset-0 z-[9999] bg-v3-bg p-6 overflow-y-auto flex flex-col gap-6" 
    : "flex flex-col gap-6 w-full transition-all";

  // Group rooms by company for rendering

  const getDates = (startDate: string, endDate: string) => {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    while (current < end) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const exportRoomsToExcel = async () => {
    try {
      const ExcelJS = (await import("exceljs")).default || await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      
      const { getLogosForExcel } = await import("@/utils/logoUtils");
      const logos = await getLogosForExcel(true);
      const { iconLogoBase64, wordmarkLogoBase64 } = logos;
      
      const sheet = workbook.addWorksheet("Otel Blokaj Listesi");
      sheet.pageSetup = { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.25, right: 0.25, top: 0.3, bottom: 0.3, header: 0.3, footer: 0.3 } };
      sheet.views = [{ state: "normal", showGridLines: false }];
      
      sheet.columns = [
        { width: 15 }, // Oda No
        { width: 12 }, // Oda Tipi
        { width: 30 }, // Otel
        { width: 30 }, // Firma
        { width: 35 }, // Katılımcı
        { width: 15 }, // Giriş
        { width: 15 }, // Çıkış
      ];

      // Draw Headers
      sheet.getRow(1).height = 45;
      sheet.getRow(2).height = 5;
      sheet.mergeCells("A1:G1");
      const hCell = sheet.getCell("A1");
      hCell.value = "OTEL BLOKAJ VE ODALAMA LİSTESİ";
      hCell.font = { name: "Arial", size: 18, bold: true, color: { argb: "FF000000" } };
      hCell.alignment = { vertical: "middle", horizontal: "center" };
      hCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };
      hCell.border = { bottom: { style: "medium", color: { argb: "FF000000" } } };

      if (iconLogoBase64) {
        const iconId = workbook.addImage({ base64: iconLogoBase64, extension: "png" });
        sheet.addImage(iconId, { tl: { col: 0.1, row: 0.1 }, ext: { width: 50, height: 50 } });
      }
      if (wordmarkLogoBase64) {
        const wordmarkId = workbook.addImage({ base64: wordmarkLogoBase64, extension: "png" });
        sheet.addImage(wordmarkId, { tl: { col: 6.0, row: 0.1 }, ext: { width: 85, height: 85 } });
      }

      // Column Headers
      const headers = ["Oda No", "Oda Tipi", "Otel Adı", "Kurum / Firma", "Katılımcı Ad Soyad", "Giriş Tarihi", "Çıkış Tarihi"];
      const hr = sheet.getRow(4);
      hr.height = 25;
      headers.forEach((h, i) => {
        const cell = hr.getCell(i + 1);
        cell.value = h;
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
        cell.border = { top: { style: "thin" }, bottom: { style: "medium" }, left: { style: "thin" }, right: { style: "thin" } };
      });

      let currentRow = 5;
      
      filteredRoomsForActiveHotel.forEach(r => {
        if (r.occupants.length === 0) {
          const row = sheet.getRow(currentRow++);
          row.height = 22;
          row.values = [r.room_number, r.type, hotelMap[r.hotel_id] || "", r.company_name, "(BOŞ ODA)", "", ""];
          row.eachCell(c => {
             c.alignment = { vertical: "middle", horizontal: "center" };
             c.border = { bottom: { style: "thin", color: { argb: "FFEEEEEE" } } };
             c.font = { italic: true, color: { argb: "FF999999" } };
          });
        } else {
          r.occupants.forEach((occ: any) => {
            const row = sheet.getRow(currentRow++);
            row.height = 22;
            row.values = [
              r.room_number, 
              r.type, 
              hotelMap[r.hotel_id] || "", 
              occ.company?.name || r.company_name, 
              `${occ.first_name} ${occ.last_name}`, 
              occ.c_in || "", 
              occ.c_out || ""
            ];
            row.eachCell((c, colNumber) => {
               c.alignment = { vertical: "middle", horizontal: colNumber === 5 ? "left" : "center" };
               c.border = { bottom: { style: "thin", color: { argb: "FFEEEEEE" } } };
            });
          });
        }
      });
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Blokaj_Listesi_${project?.name || "Proje"}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error("Excel oluşturulurken hata oluştu.");
    }
  };

  const generateReconciliation = () => {
    let report: any = { SNG: 0, DBL: 0, TRP: 0, total_nights: 0, details: {} };

    roomsForActiveHotel.forEach(room => {
      let minIn: Date | null = null;
      let maxOut: Date | null = null;
      
      room.occupants.forEach((occ: any) => {
        if (!occ.c_in || !occ.c_out) return;
        
        const cInParts = occ.c_in.split("."); // format is dd.mm.yyyy? Wait, my earlier check showed it might be string, need to handle both
        let cInD = new Date(occ.c_in);
        if (isNaN(cInD.getTime()) && cInParts.length === 3) cInD = new Date(`${cInParts[2]}-${cInParts[1]}-${cInParts[0]}`);
        
        const cOutParts = occ.c_out.split(".");
        let cOutD = new Date(occ.c_out);
        if (isNaN(cOutD.getTime()) && cOutParts.length === 3) cOutD = new Date(`${cOutParts[2]}-${cOutParts[1]}-${cOutParts[0]}`);

        if (isNaN(cInD.getTime()) || isNaN(cOutD.getTime())) return;

        if (!minIn || cInD < minIn) minIn = cInD;
        if (!maxOut || cOutD > maxOut) maxOut = cOutD;
      });

      if (!minIn || !maxOut) return;

      const dates = getDates(minIn.toISOString().split("T")[0], maxOut.toISOString().split("T")[0]);
      dates.forEach(dateStr => {
        let paxCount = 0;
        room.occupants.forEach((occ: any) => {
           if (!occ.c_in || !occ.c_out) return;
           
           const cInParts = occ.c_in.split(".");
           let cInD = new Date(occ.c_in);
           if (isNaN(cInD.getTime()) && cInParts.length === 3) cInD = new Date(`${cInParts[2]}-${cInParts[1]}-${cInParts[0]}`);
           
           const cOutParts = occ.c_out.split(".");
           let cOutD = new Date(occ.c_out);
           if (isNaN(cOutD.getTime()) && cOutParts.length === 3) cOutD = new Date(`${cOutParts[2]}-${cOutParts[1]}-${cOutParts[0]}`);
           
           if (isNaN(cInD.getTime()) || isNaN(cOutD.getTime())) return;
           
           const inStr = cInD.toISOString().split("T")[0];
           const outStr = cOutD.toISOString().split("T")[0];

           if (inStr <= dateStr && outStr > dateStr) {
             paxCount++;
           }
        });

        if (paxCount > 0) {
          if (!report.details[dateStr]) report.details[dateStr] = { SNG: 0, DBL: 0, TRP: 0 };
          
          if (paxCount === 1) { report.SNG++; report.details[dateStr].SNG++; }
          else if (paxCount === 2) { report.DBL++; report.details[dateStr].DBL++; }
          else { report.TRP++; report.details[dateStr].TRP++; }
          
          report.total_nights++;
        }
      });
    });

    setReconReport(report);
    setShowReconModal(true);
  };

  const filteredRoomsForActiveHotel = roomsForActiveHotel.filter(r => {
    const occupantText = r.occupants.map((o: any) => `${o.first_name || ""} ${o.last_name || ""} ${o.company?.name || ""} ${o.title || ""} ${o.tc_passport || ""} ${o.email || ""} ${o.phone || ""} ${o.c_in || ""} ${o.c_out || ""}`).join(" ");
    const text = `${r.room_number || ""} ${r.type || ""} ${r.company_name || ""} ${hotelMap[r.hotel_id] || ""} ${occupantText}`.toLowerCase();
    
    if (roomSearchTerms.length > 0 && !roomSearchTerms.every(term => text.includes(term.toLowerCase()))) return false;
    if (roomSearchInput && !text.includes(roomSearchInput.toLowerCase())) return false;
    return true;
  });

  const groupedRooms = filteredRoomsForActiveHotel.reduce((acc, r) => {
    (acc[r.company_name] = acc[r.company_name] || []).push(r);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="bg-v3-surface p-6 rounded-2xl border border-v3-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-emerald-500 flex items-center gap-2">
            <BedDouble className="w-6 h-6" /> Otel Blokajı ve Odalama
          </h2>
          <p className="text-xs text-v3-muted mt-1">Projeye tanımlı otellerin blokajlarını yönetin ve kişileri odalara yerleştirin.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={generateReconciliation}
            className="h-10 px-4 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap"
          >
            <Calculator className="w-4 h-4" /> Mutabakat & Geceleme Raporu
          </button>
          {project?.hotels_data && project.hotels_data.length > 0 ? (
            <select
              value={selectedHotelId}
              onChange={(e) => setSelectedHotelId(e.target.value)}
              className="h-10 px-4 bg-white dark:bg-black/20 border border-v3-border rounded-lg text-sm font-black text-v3-text focus:border-emerald-500 outline-none"
            >
              <option value="all">TÜMÜ</option>
              {project.hotels_data.map((h: any) => (
                <option key={h.id} value={h.hotel_id}>{hotelMap[h.hotel_id] || "Bilinmeyen Otel"}</option>
              ))}
            </select>
          ) : (
            <div className="text-orange-500 text-xs font-bold bg-orange-500/10 px-4 py-2 rounded-lg">Otelsiz Proje</div>
          )}
          
          <button onClick={() => setShowForecast(!showForecast)} className={`h-10 px-4 flex items-center gap-2 rounded-lg text-xs font-bold transition-colors ${showForecast ? 'bg-purple-500 text-white' : 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20'}`}>
            <CalendarDays className="w-4 h-4" /> FORECAST
          </button>
          <button onClick={exportRoomsToExcel} className="h-10 px-4 flex items-center gap-2 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors whitespace-nowrap">
            <Download className="w-4 h-4" /> EXCEL AKTAR
          </button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="w-10 h-10 flex items-center justify-center rounded-lg bg-black/10 dark:bg-white/5 hover:bg-black/20 dark:hover:bg-white/10 transition-colors text-v3-text">
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {showForecast && forecastData.length > 0 && (
        <div className="bg-purple-500/10 border border-purple-500/20 p-6 rounded-2xl flex gap-6 overflow-x-auto">
          {forecastData.map(([date, count]) => (
            <div key={date} className="bg-v3-surface border border-v3-border p-4 rounded-xl min-w-[120px] text-center shadow-lg">
              <p className="text-[10px] font-bold text-v3-muted mb-2">{date}</p>
              <p className="text-3xl font-black text-purple-500">{count}</p>
              <p className="text-[10px] text-v3-muted uppercase">Dolu Oda</p>
            </div>
          ))}
        </div>
      )}

      {project?.hotels_data && project.hotels_data.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-v3-surface rounded-xl p-4 border border-v3-border shadow-sm flex items-center justify-between">
              <div><p className="text-[10px] font-bold text-v3-muted uppercase">TOPLAM BLOKAJ</p><h3 className="text-2xl font-black text-v3-text mt-1">{allotmentTotal} Oda</h3></div>
              <Building className="w-8 h-8 text-v3-muted opacity-30" />
            </div>
            <div className="bg-v3-surface rounded-xl p-4 border border-v3-border shadow-sm flex items-center justify-between">
              <div><p className="text-[10px] font-bold text-v3-muted uppercase">AÇILAN / KULLANILAN ODA</p><h3 className="text-2xl font-black text-blue-500 mt-1">{allotmentUsed} Oda</h3></div>
              <BedDouble className="w-8 h-8 text-blue-500 opacity-30" />
            </div>
            <div className={`bg-v3-surface rounded-xl p-4 border ${isOverbooked ? 'border-red-500 bg-red-500/5' : 'border-emerald-500 bg-emerald-500/5'} shadow-sm flex items-center justify-between`}>
              <div>
                <p className={`text-[10px] font-bold uppercase ${isOverbooked ? 'text-red-500' : 'text-emerald-600'}`}>{isOverbooked ? "OVERBOOK" : "KALAN BLOKAJ"}</p>
                <h3 className={`text-2xl font-black mt-1 ${isOverbooked ? 'text-red-500' : 'text-emerald-500'}`}>{Math.abs(allotmentLeft)} Oda</h3>
              </div>
              {isOverbooked ? <AlertTriangle className="w-8 h-8 text-red-500 opacity-50" /> : <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-50" />}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
            {/* Havuz */}
            <div 
              onDrop={handleDropToWaitlist} 
              onDragOver={allowDrop} 
              className={`bg-black/10 dark:bg-white/5 border border-v3-border rounded-xl p-4 flex flex-col transition-colors hover:border-emerald-500/50 ${isFullscreen ? 'w-[350px]' : 'md:w-1/4'}`}
            >
              <h3 className="text-sm font-bold text-v3-text mb-4 flex items-center justify-between">
                <span>Oda Bekleyenler</span>
                <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full">{participants.filter(p => selectedHotelId === "all" || p.hotel_id === selectedHotelId).length}</span>
              </h3>
              <div className="flex flex-wrap items-center gap-2 mb-4 bg-white dark:bg-black/20 border border-v3-border rounded-lg p-2 min-h-[44px]">
                <Search className="w-4 h-4 text-v3-muted shrink-0 ml-1" />
                {poolSearchTerms.map((term, i) => (
                  <span key={i} className="flex items-center gap-1 bg-black/5 dark:bg-white/10 px-2 py-1 rounded text-[10px] font-bold text-v3-text">
                    {term}
                    <button onClick={() => setPoolSearchTerms(prev => prev.filter(t => t !== term))} className="text-v3-muted hover:text-red-500"><X className="w-3 h-3" /></button>
                  </span>
                ))}
                <input 
                  type="text" placeholder={poolSearchTerms.length === 0 ? "İsim veya kurum ara (Enter'a basın)..." : "Yeni kelime ekle..."} 
                  value={poolSearchInput} 
                  onChange={(e) => setPoolSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && poolSearchInput.trim()) {
                      e.preventDefault();
                      if (!poolSearchTerms.includes(poolSearchInput.trim())) setPoolSearchTerms(prev => [...prev, poolSearchInput.trim()]);
                      setPoolSearchInput("");
                    }
                  }}
                  className="flex-1 bg-transparent border-none outline-none text-xs text-v3-text min-w-[150px]"
                />
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2 no-scrollbar">
                {filteredPool.map(p => (
                  <div key={p.id} draggable onDragStart={(e) => handleDragStart(e, p.id)} onClick={() => setEditingParticipantId(p.id)} className="bg-white dark:bg-v3-surface p-3 rounded-lg border border-v3-border cursor-grab hover:border-emerald-500 transition-colors shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-v3-muted" />
                      <span className="text-xs font-bold text-v3-text">{p.first_name} {p.last_name}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] mb-1.5">
                      <span className="text-v3-muted truncate max-w-[120px]">{p.company?.name || 'Bireysel'}</span>
                      <span className={`px-1.5 py-0.5 rounded ${p.room_type === 'SNG' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'} font-bold`}>{p.room_type}</span>
                    </div>
                    {selectedHotelId === "all" && p.hotel_id && (
                      <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded mb-1.5 w-max">
                        {hotelMap[p.hotel_id] || "Bilinmeyen Otel"}
                      </div>
                    )}
                    {p.c_in && p.c_out && (
                      <div className="flex items-center justify-between text-[9px] text-v3-muted bg-black/5 dark:bg-white/5 px-1.5 py-1 rounded">
                        <span>C/In: {p.c_in}</span><span>C/Out: {p.c_out}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Odalar (Firmalara Göre Gruplu) */}
            <div className="bg-v3-surface border border-v3-border rounded-xl p-4 flex flex-col flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-4 border-b border-v3-border gap-4">
                <h3 className="text-sm font-bold text-v3-text flex items-center gap-2 whitespace-nowrap"><Building className="w-4 h-4" /> {selectedHotelId === "all" ? "Tüm Otellerin" : hotelMap[selectedHotelId]} Odaları</h3>
                <div className="flex-1 flex justify-center max-w-xl">
                  <div className="flex flex-wrap items-center gap-2 w-full bg-white dark:bg-black/20 border border-v3-border rounded-lg p-2 min-h-[44px]">
                    <Search className="w-4 h-4 text-v3-muted shrink-0 ml-1" />
                    {roomSearchTerms.map((term, i) => (
                      <span key={i} className="flex items-center gap-1 bg-black/5 dark:bg-white/10 px-2 py-1 rounded text-[10px] font-bold text-v3-text">
                        {term}
                        <button onClick={() => setRoomSearchTerms(prev => prev.filter(t => t !== term))} className="text-v3-muted hover:text-red-500"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                    <input 
                      type="text" placeholder={roomSearchTerms.length === 0 ? "Oda no, misafir, firma ara (Enter'a basın)..." : "Yeni kelime ekle..."} 
                      value={roomSearchInput} 
                      onChange={(e) => setRoomSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && roomSearchInput.trim()) {
                          e.preventDefault();
                          if (!roomSearchTerms.includes(roomSearchInput.trim())) setRoomSearchTerms(prev => [...prev, roomSearchInput.trim()]);
                          setRoomSearchInput("");
                        }
                      }}
                      className="flex-1 bg-transparent border-none outline-none text-xs text-v3-text min-w-[200px]"
                    />
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {selectedHotelId !== "all" && (
                    <>
                      <button onClick={() => createRoom('SNG')} className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-bold rounded-lg">+ SINGLE</button>
                      <button onClick={() => createRoom('DBL')} className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 text-xs font-bold rounded-lg">+ DOUBLE</button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto flex flex-col gap-8 no-scrollbar">
                {Object.entries(groupedRooms).map(([compName, compRooms]: [string, any]) => (
                  <div key={compName} className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-v3-border pb-2">
                      <h4 className="text-xs font-black text-purple-500">{compName.toUpperCase()} BLOKAJI</h4>
                      <span className="text-[10px] font-bold text-v3-muted bg-black/10 dark:bg-white/5 px-2 py-1 rounded">Kullanılan: {compRooms.length} Oda</span>
                    </div>
                    <div className="flex flex-col gap-4">
                      {compRooms.map((r: any) => (
                        <div key={r.id} onDrop={(e) => handleDrop(e, r.id)} onDragOver={allowDrop} className={`flex flex-col md:flex-row items-stretch border-2 border-dashed rounded-xl p-4 gap-4 transition-colors ${r.occupants.length === (r.type === 'SNG' ? 1 : 2) ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-v3-border hover:border-blue-500/50'}`}>
                          
                          {/* Sol Kısım: Oda Bilgisi */}
                          <div className="flex flex-col justify-center items-start md:w-48 border-b md:border-b-0 md:border-r border-v3-border pr-4 pb-4 md:pb-0 shrink-0">
                            <span className="text-lg font-black text-v3-text">{r.room_number}</span>
                            <span className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 ${r.type === 'SNG' ? 'text-emerald-500' : 'text-blue-500'}`}>
                              {r.type} ODA ({r.occupants.length}/{r.type === 'SNG' ? 1 : 2})
                            </span>
                            {selectedHotelId === "all" && (
                              <span className="text-[9px] font-bold text-v3-muted bg-v3-bg px-2 py-0.5 rounded mt-2 w-max">{hotelMap[r.hotel_id]}</span>
                            )}
                          </div>
                          
                          {/* Sağ Kısım: Katılımcılar (Tek Satır) */}
                          <div className="flex-1 flex flex-col gap-2 min-h-[40px]">
                            {r.occupants.length === 0 && <div className="text-xs text-v3-muted flex items-center justify-center w-full italic h-full">Sürükleyin</div>}
                            {r.occupants.map((occ: any) => (
                              <div 
                                key={occ.id} 
                                draggable 
                                onDragStart={(e) => {
                                  e.dataTransfer.setData("room_occupant_id", occ.id);
                                  e.dataTransfer.setData("from_room_id", r.id);
                                }}
                                onClick={() => setEditingParticipantId(occ.id)}
                                className="flex flex-wrap md:flex-nowrap items-center gap-3 bg-black/5 dark:bg-white/5 px-3 py-2 rounded-lg border border-v3-border relative group cursor-grab"
                              >
                                
                                {/* İsim */}
                                <div className="flex items-center gap-2 min-w-[150px] shrink-0">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                  <div className="flex flex-col">
                                    <span className="font-bold text-xs text-v3-text truncate">{occ.first_name} {occ.last_name}</span>
                                    <span className="text-[9px] text-v3-muted truncate max-w-[150px]">{occ.company?.name || 'Bireysel'}</span>
                                  </div>
                                </div>
                                
                                {/* C-In / C-Out */}
                                <div className="flex items-center gap-2 shrink-0 bg-white dark:bg-black/20 px-2 py-1 rounded border border-v3-border">
                                  <span className="text-[9px] font-black text-v3-muted uppercase">C-IN:</span>
                                  <input 
                                    type="date" 
                                    value={occ.c_in || ''} 
                                    onClick={e => e.stopPropagation()}
                                    onChange={(e) => updateOccupantDate(r.id, occ.id, 'reference', e.target.value)} 
                                    className="bg-transparent text-[10px] font-semibold text-v3-text outline-none focus:text-emerald-500 cursor-pointer" 
                                  />
                                  <span className="text-[9px] font-black text-v3-muted uppercase ml-2">C-OUT:</span>
                                  <input 
                                    type="date" 
                                    value={occ.c_out || ''} 
                                    onClick={e => e.stopPropagation()}
                                    onChange={(e) => updateOccupantDate(r.id, occ.id, 'reference_code', e.target.value)} 
                                    className="bg-transparent text-[10px] font-semibold text-v3-text outline-none focus:text-emerald-500 cursor-pointer" 
                                  />
                                </div>

                                {/* Uçuş */}
                                <div className="flex-1 min-w-[100px]">
                                  {(occ.flight_desc || occ.flight_in || occ.flight_out) && (
                                    <div className="flex items-center gap-2 text-[10px] text-v3-muted truncate">
                                      <span className="font-bold text-blue-500 shrink-0">✈️ {occ.flight_desc || 'Uçuş'}</span>
                                      <span className="truncate">
                                        (G: {occ.flight_in || '-'} | D: {occ.flight_out || '-'})
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Çarpı */}
                                <button onClick={(e) => { e.stopPropagation(); removeFromRoom(r.id, occ.id); }} className="text-v3-muted hover:text-red-500 p-1 rounded hover:bg-red-500/10 transition-colors shrink-0">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                                
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
      {showReconModal && reconReport && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-v3-surface w-full max-w-2xl rounded-2xl border border-v3-border shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setShowReconModal(false)} className="absolute top-4 right-4 text-v3-muted hover:text-v3-text">
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className="font-black text-v3-text">Otel Geceleme & Mutabakat Raporu</h3>
                <p className="text-[10px] text-v3-muted">Odadaki kişilerin C-In / C-Out tarihlerine göre GECE BAZLI hesaplanmış gerçek oda tipi (SNG/DBL) dökümü.</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl text-center">
                <p className="text-xs text-v3-muted font-bold mb-1">Toplam Gece</p>
                <p className="text-2xl font-black text-v3-text">{reconReport.total_nights}</p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-center">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-1">SNG Gece</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{reconReport.SNG}</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-center">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">DBL Gece</p>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{reconReport.DBL}</p>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl text-center">
                <p className="text-xs text-orange-600 dark:text-orange-400 font-bold mb-1">TRP+ Gece</p>
                <p className="text-2xl font-black text-orange-600 dark:text-orange-400">{reconReport.TRP}</p>
              </div>
            </div>

            <div className="border border-v3-border rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/5 dark:bg-white/5 text-xs font-bold text-v3-muted">
                  <tr>
                    <th className="px-4 py-2">Tarih (Gece)</th>
                    <th className="px-4 py-2 text-center">SNG Oda</th>
                    <th className="px-4 py-2 text-center">DBL Oda</th>
                    <th className="px-4 py-2 text-center">TRP+ Oda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-v3-border">
                  {Object.keys(reconReport.details).sort().map(date => (
                    <tr key={date} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-2 font-semibold text-v3-text">{new Date(date).toLocaleDateString("tr-TR")}</td>
                      <td className="px-4 py-2 text-center text-emerald-600 font-bold">{reconReport.details[date].SNG || "-"}</td>
                      <td className="px-4 py-2 text-center text-blue-600 font-bold">{reconReport.details[date].DBL || "-"}</td>
                      <td className="px-4 py-2 text-center text-orange-600 font-bold">{reconReport.details[date].TRP || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <p className="text-[10px] text-v3-muted mt-4 text-center">
              Not: Bu rapor, aktif seçili olan oteldeki odaların içindeki kişilerin konaklama sürelerini satır satır analiz ederek geceleme (Night) bazlı SNG/DBL hesaplar. Erken ayrılanların olduğu odalar o geceden sonra otomatik SNG'ye düşer.
            </p>
          </div>
        </div>
      )}
      {editingParticipantId && (
        <CongressParticipantModal
          isOpen={!!editingParticipantId}
          onClose={() => setEditingParticipantId(null)}
          participant={participants.find(p => p.id === editingParticipantId) || rooms.flatMap(r => r.occupants).find(p => p.id === editingParticipantId)}
          projectId={projectId}
          onSuccess={() => {
            loadData();
            setEditingParticipantId(null);
          }}
        />
      )}
    </div>
  );
}
