"use client";

import React, { useState, useEffect } from "react";
import { X, FileSpreadsheet, Upload, Download, CheckCircle2, AlertTriangle, Users } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabaseService";
import { toast } from "react-hot-toast";

interface CongressParticipantBulkModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
}

const CATEGORY_UUIDS = {
  "Kayıt": "69d22049-1113-49d7-bd28-8b4618dcf75a",
  "Konaklama": "d7bda8d3-0b42-45a1-958d-3b5239ee66b6",
  "Uçak": "52708355-de87-44ae-a733-d10bd7cf7a8b",
  "Transfer": "80b22984-83ba-41d7-bb8e-0d9c1968b614"
};

export default function CongressParticipantBulkModal({ isOpen, onClose, projectId, onSuccess }: CongressParticipantBulkModalProps) {
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [currency, setCurrency] = useState<string>("EUR");
  const [mismatches, setMismatches] = useState<{type: string, excelValue: string, mappedId: string}[]>([]);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [mappingDict, setMappingDict] = useState<Record<string, string>>({});
  const [tempParsedData, setTempParsedData] = useState<any[]>([]);
  const [dbSuppliers, setDbSuppliers] = useState<any[]>([]);
  const [projectHotels, setProjectHotels] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const catKayit = CATEGORY_UUIDS["Kayıt"];
  const catKonaklama = CATEGORY_UUIDS["Konaklama"];
  const catUcak = CATEGORY_UUIDS["Uçak"];
  const catTransfer = CATEGORY_UUIDS["Transfer"];

  useEffect(() => {
    if (isOpen) {
      loadAgencies();
      loadDbData();
      setParsedData([]);
      setSelectedCompanyId("");
      setMappingDict({});
      setShowMappingModal(false);
    }
  }, [isOpen]);

  const loadAgencies = async () => {
    const { data } = await supabase.from('agencies').select('id, name').order('name');
    if (data) setAgencies(data);
  };

  const loadDbData = async () => {
    const { data: sups } = await supabase.from('suppliers').select('id, name');
    if (sups) setDbSuppliers(sups);
    const { data: hots } = await supabase.from('hotels').select('id, name');
    if (hots) setProjectHotels(hots);
    const { data: cats } = await supabase.from('categories').select('id, name, parent_id');
    if (cats) setCategories(cats);
  };

  const downloadTemplate = async () => {
    toast.loading("Şablon hazırlanıyor...");
    try {
      const kayitCats = categories.filter(c => c.parent_id === catKayit).map(c => c.name);
      const konaklamaCats = categories.filter(c => c.parent_id === catKonaklama).map(c => c.name);
      const ucakCats = categories.filter(c => c.parent_id === catUcak).map(c => c.name);
      const transferCats = categories.filter(c => c.parent_id === catTransfer).map(c => c.name);

      const hotelNames = projectHotels.map(h => h.name);
      const airlines = ["THY", "AJET", "PEGASUS", "SUNEXPRESS", "CORENDON"];

      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      
      const catSheet = workbook.addWorksheet('Kategoriler', { state: 'hidden' });
      catSheet.getColumn(1).values = ['Kayıt Tipleri', ...kayitCats];
      catSheet.getColumn(2).values = ['Oda Tipleri', ...konaklamaCats];
      catSheet.getColumn(3).values = ['Transfer Tipleri', ...transferCats];
      catSheet.getColumn(4).values = ['Oteller', ...hotelNames];
      catSheet.getColumn(5).values = ['Havayolları', ...airlines];

      const ws = workbook.addWorksheet('Rooming_List');
      
      ws.addRow([
        "KATILIMCI BİLGİLERİ", "", "", "", "", "", "", "",
        "KONAKLAMA", "", "", "",
        "GELİŞ UÇUŞ", "", "", "", "", "",
        "DÖNÜŞ UÇUŞ", "", "", "", "", "",
        "OPERASYONEL / EK ALANLAR (SİSTEM İÇİN)", "", "", "", "", "", "", "", "", "", "", "", "", "", ""
      ]);
      ws.mergeCells('A1:H1');
      ws.mergeCells('I1:L1');
      ws.mergeCells('M1:R1');
      ws.mergeCells('S1:X1');
      
      ws.addRow([
        "Sıra", "İsim", "Soyisim", "Kayıt Tipi", "Telefon", "E-posta", "TC/Pasaport", "Notlar",
        "Otel Adı", "Giriş Tarihi", "Çıkış Tarihi", "Oda Tipi",
        "Geliş Tarihi", "Kalkış Saati", "Parkur", "Havayolu", "Uçuş Kodu", "Tedarikçi",
        "Dönüş Tarihi", "Kalkış Saati", "Parkur", "Havayolu", "Uçuş Kodu", "Tedarikçi",
        "Geliş Transfer Tarihi", "Geliş Transfer Saati", "Geliş Transfer Güzergah", "Geliş Transfer Tipi", "Geliş Transfer Tedarikçi",
        "Dönüş Transfer Tarihi", "Dönüş Transfer Saati", "Dönüş Transfer Güzergah", "Dönüş Transfer Tipi", "Dönüş Transfer Tedarikçi",
        "Kayıt Ücreti", "Konaklama Ücreti", "Geliş Uçuş Ücreti", "Dönüş Uçuş Ücreti", "Geliş Transfer Ücreti", "Dönüş Transfer Ücreti"
      ]);
      
      const headerRow1 = ws.getRow(1);
      headerRow1.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow1.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow1.height = 30;
      
      const headerRow2 = ws.getRow(2);
      headerRow2.font = { bold: true };
      headerRow2.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      headerRow2.height = 40;

      for(let i=1; i<=8; i++) { headerRow1.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } }; headerRow2.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } }; }
      for(let i=9; i<=12; i++) { headerRow1.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9BBB59' } }; headerRow2.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF1DE' } }; }
      for(let i=13; i<=18; i++) { headerRow1.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF79646' } }; headerRow2.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE9D9' } }; }
      for(let i=19; i<=24; i++) { headerRow1.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8064A2' } }; headerRow2.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E0EC' } }; }
      for(let i=25; i<=40; i++) { headerRow1.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC0504D' } }; headerRow2.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2DCDB' } }; }

      const widths = [
        6, 15, 15, 15, 15, 20, 15, 20,
        20, 12, 12, 12,
        12, 12, 15, 15, 12, 15,
        12, 12, 15, 15, 12, 15,
        15, 15, 20, 15, 15,
        15, 15, 20, 15, 15,
        12, 12, 12, 12, 12, 12
      ];
      widths.forEach((w, i) => { ws.getColumn(i+1).width = w; });

      for (let i = 3; i <= 500; i++) {
        ws.getCell('D'+i).dataValidation = { type: 'list', allowBlank: true, formulae: ['Kategoriler!$A$2:$A$100'] };
        ws.getCell('I'+i).dataValidation = { type: 'list', allowBlank: true, formulae: ['Kategoriler!$D$2:$D$100'] };
        ws.getCell('L'+i).dataValidation = { type: 'list', allowBlank: true, formulae: ['Kategoriler!$B$2:$B$100'] };
        ws.getCell('P'+i).dataValidation = { type: 'list', allowBlank: true, formulae: ['Kategoriler!$E$2:$E$100'] };
        ws.getCell('V'+i).dataValidation = { type: 'list', allowBlank: true, formulae: ['Kategoriler!$E$2:$E$100'] };
        ws.getCell('AB'+i).dataValidation = { type: 'list', allowBlank: true, formulae: ['Kategoriler!$C$2:$C$100'] };
        ws.getCell('AG'+i).dataValidation = { type: 'list', allowBlank: true, formulae: ['Kategoriler!$C$2:$C$100'] };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "Kongre_Rooming_List_Sablonu.xlsx";
      a.click();
      toast.dismiss();
      toast.success("Şablon başarıyla indirildi.");
    } catch (err: any) {
      console.error(err);
      toast.dismiss();
      toast.error("Şablon oluşturulurken hata: " + err.message);
    }
  };

  const findSupplier = (nameStr: string) => {
    if (!nameStr) return null;
    const s1 = nameStr.trim();
    if (mappingDict[`Tedarikçi:${s1}`]) return mappingDict[`Tedarikçi:${s1}`];
    const sLow = s1.toLowerCase();
    let found = dbSuppliers.find(s => s.name.toLowerCase() === sLow) || projectHotels.find(h => h.name.toLowerCase() === sLow);
    if (!found) {
        found = dbSuppliers.find(s => s.name.toLowerCase().includes(sLow) || sLow.includes(s.name.toLowerCase())) || 
                projectHotels.find(h => h.name.toLowerCase().includes(sLow) || sLow.includes(h.name.toLowerCase()));
    }
    return found ? found.id : null;
  };

  const findSubCat = (nameStr: string | string[], parentId: string, type: string) => {
    if (!nameStr) return null;
    const searchTerms = Array.isArray(nameStr) ? nameStr : [nameStr];
    for (const str of searchTerms) {
        if (!str) continue;
        const s1 = str.trim();
        if (mappingDict[`${type}:${s1}`]) return mappingDict[`${type}:${s1}`];
    }
    for (const str of searchTerms) {
        if (!str) continue;
        const sLow = str.trim().toLowerCase();
        let found = categories.find(c => c.parent_id === parentId && c.name.toLowerCase() === sLow);
        if (!found) {
            found = categories.find(c => c.parent_id === parentId && (c.name.toLowerCase().includes(sLow) || sLow.includes(c.name.toLowerCase())));
        }
        if (found) return found.id;
    }
    return null;
  };

  const parseDate = (val: any) => {
    if (!val) return null;
    if (typeof val === 'number') {
      // Excel tarih
      if (val > 1) {
        const date = new Date((val - (25567 + 2)) * 86400 * 1000);
        return date.toISOString().split('T')[0];
      }
      return null; // Time part only, not a date
    }
    let str = String(val).trim();
    if (str.includes('.')) {
        const parts = str.split('.');
        if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    } else if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return str;
  };
  
  const parseTime = (val: any) => {
    if (!val) return null;
    if (typeof val === 'number') {
       // Excel saat formatı (0 ile 1 arası ondalık)
       if (val >= 0 && val < 1) {
           const totalSeconds = Math.round(val * 86400);
           const hours = Math.floor(totalSeconds / 3600);
           const minutes = Math.floor((totalSeconds % 3600) / 60);
           return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
       }
       // Eğer hem tarih hem saat ise
       if (val >= 1) {
           const frac = val - Math.floor(val);
           const totalSeconds = Math.round(frac * 86400);
           const hours = Math.floor(totalSeconds / 3600);
           const minutes = Math.floor((totalSeconds % 3600) / 60);
           return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
       }
    }
    let str = String(val).trim();
    if (str.includes(':')) {
       return str.split(':').slice(0, 2).join(':');
    } else if (str.length === 4 && !isNaN(Number(str))) {
       return `${str.substring(0,2)}:${str.substring(2,4)}`; // 1000 -> 10:00
    }
    return str;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames.find(s => s.toLowerCase().includes('rooming')) || wb.SheetNames.find(s => s !== 'Kategoriler') || wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        
        
        

        const dataRaw = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        if (!dataRaw || dataRaw.length === 0) {
          toast.error("Dosya boş.");
          return;
        }

        let formattedData: any[] = [];
        
        const firstCell = String(dataRaw[0]?.[0] || "").trim().toUpperCase();

        if (firstCell === "KATILIMCI BİLGİLERİ" || firstCell === "KATILIMCI BILGILERI") {
          // Master Template Mode
          const dataRows = dataRaw.slice(2);
          const masterHeaders = (dataRaw[1] || []).map((h: any) => h ? h.toString().toLowerCase().trim().replace(/\s+/g, ' ') : "");
          
          const odaNoIdx = masterHeaders.findIndex(h => h === "oda no" || h === "oda numarası" || h === "oda numarasi" || h === "odano" || h === "oda_no" || h === "room no");
          const unvanIdx = masterHeaders.findIndex(h => h === "unvan" || h === "title");

          formattedData = dataRows.map((row: any) => {
            if (!row || row.length === 0) return null;
            return {
              title: unvanIdx !== -1 ? row[unvanIdx] : "",
              first_name: row[1], 
              last_name: row[2], 
              tc_passport: row[6], 
              email: row[5], 
              phone: row[4], 
              registration_type: row[3] || "Delege", // Use Kayıt Tipi for Registration Type
              notes: row[7], 
              
              kayit_adi: row[3], 
              kayit_ucreti: parseFloat(row[34]) || 0, 
              
              konaklama_otel: row[8], 
              konaklama_checkin: parseDate(row[9]), 
              konaklama_checkout: parseDate(row[10]), 
              konaklama_oda: row[11], 
              konaklama_oda_no: odaNoIdx !== -1 && row[odaNoIdx] != null ? String(row[odaNoIdx]) : "", 
              konaklama_ucreti: parseFloat(row[35]) || 0, 
              
              ucus_tipi: "",
              ucus_gidis: parseDate(row[12]), 
              ucus_gidis_saati: parseTime(row[13]), 
              ucus_parkuru: row[14], 
              havayolu: row[15], 
              ucus_gidis_kodu: row[16], 
              ucus_tedarikci: row[17], 
              ucus_ucreti: parseFloat(row[36]) || 0, 
              
              ucus_donus: parseDate(row[18]), 
              ucus_donus_saati: parseTime(row[19]), 
              donus_ucus_parkuru: row[20], 
              donus_havayolu: row[21], 
              ucus_donus_kodu: row[22], 
              donus_ucus_tedarikci: row[23], 
              donus_ucus_ucreti: parseFloat(row[37]) || 0, 
              
              transfer_gidis: parseDate(row[24]), 
              transfer_gidis_saati: parseTime(row[25]), 
              transfer_guzergah: row[26], 
              transfer_arac_tipi: row[27], 
              transfer_tedarikci: row[28], 
              transfer_ucreti: parseFloat(row[38]) || 0,
              
              transfer_donus: parseDate(row[29]), 
              transfer_donus_saati: parseTime(row[30]), 
              donus_transfer_guzergah: row[31], 
              donus_transfer_arac_tipi: row[32], 
              donus_transfer_tedarikci: row[33], 
              donus_transfer_ucreti: parseFloat(row[39]) || 0
            };
          }).filter((r: any) => r && r.first_name);
        } else {
          // Standard / Older Template Mode (Find Header Row Dynamically)
          let headerRowIndex = 0;
          let bestMatchScore = 0;
          
          for (let i = 0; i < Math.min(10, dataRaw.length); i++) {
             const row = dataRaw[i];
             if (!row) continue;
             const strRow = row.map((c: any) => String(c).toLowerCase());
             
             let score = 0;
             if (strRow.some((c: string) => c.includes("ad") || c.includes("isim") || c.includes("soyad") || c.includes("kişi") || c.includes("misafir") || c.includes("katılımcı") || c.includes("yolcu"))) score += 2;
             if (strRow.some((c: string) => c.includes("tc") || c.includes("pasaport"))) score += 1;
             if (strRow.some((c: string) => c.includes("otel") || c.includes("oda"))) score += 1;
             if (strRow.some((c: string) => c.includes("uçuş") || c.includes("tarih") || c.includes("saat"))) score += 1;
             
             if (score > bestMatchScore) {
                 bestMatchScore = score;
                 headerRowIndex = i;
             }
          }

          const headers = dataRaw[headerRowIndex].map((h: any) => String(h || "").toLocaleLowerCase('tr-TR').trim());
          const dataRows = dataRaw.slice(headerRowIndex + 1);

          formattedData = dataRows.map((rawRow: any) => {
            if (!rawRow || rawRow.length === 0) return null;
            const row: any = {};
            headers.forEach((h: string, idx: number) => {
               if (h) row[h] = rawRow[idx];
            });

            let fName = row["ad"] || row["adı"] || row["first_name"] || row["isim"] || row["i̇sim"] || row["name"] || row["kişi"] || row["kisi"] || row["misafir"] || row["yolcu"] || "";
            let lName = row["soyad"] || row["soyadı"] || row["last_name"] || row["soyisim"] || row["surname"] || "";

            if (!fName && !lName) {
                const fullName = row["ad soyad"] || row["adı soyadı"] || row["isim soyisim"] || row["katılımcı"] || row["katilimci"] || "";
                if (fullName) {
                    const parts = String(fullName).trim().split(" ");
                    lName = parts.length > 1 ? parts.pop() || "" : "";
                    fName = parts.join(" ") || fullName;
                }
            }
            
            // Eğer hala isim bulamadıysak ama Excel'de ilk kolonlarda veri varsa, acil durum kurtarması yapalım
            // Belki başlıkları yanlış koydular, bari ilk kolonu İsim kabul edelim.
            if (!fName && rawRow[0] && typeof rawRow[0] === 'string') {
               fName = rawRow[0];
            }
            
            return {
              title: row["unvan"] || row["title"] || "",
              first_name: fName,
              last_name: lName,
              tc_passport: row["tc/pasaport"] || row["tc"] || row["tc kimlik"] || row["pasaport"] || row["tc_passport"] || row["tckn"] || "",
              email: row["e-posta"] || row["email"] || row["mail"] || row["e-mail"] || "",
              phone: row["telefon"] || row["phone"] || row["tel"] || row["cep telefonu"] || row["cep tel"] || "",
              registration_type: row["kayıt tipi (sistem)"] || row["kayıt tipi"] || "Delege",
              notes: row["özel notlar"] || row["notlar"] || row["not"] || row["notes"] || row["açıklama"] || "",
              
              kayit_adi: row["kayıt paketi"] || row["kayıt tipi"] || row["kayit_adi"] || "",
              kayit_ucreti: parseFloat(row["kayıt ücreti"]) || parseFloat(row["kayıt fiyatı"]) || 0,
              
              konaklama_otel: row["otel"] || row["otel adı"] || row["hotel"] || row["konaklama"] || "",
              konaklama_checkin: parseDate(row["giriş tarihi"]) || parseDate(row["check-in"]) || parseDate(row["checkin"]) || parseDate(row["c/in"]),
              konaklama_checkout: parseDate(row["çıkış tarihi"]) || parseDate(row["check-out"]) || parseDate(row["checkout"]) || parseDate(row["c/out"]),
              konaklama_oda: row["oda tipi"] || row["oda"] || "",
              konaklama_oda_no: String(row["oda no"] || row["oda numarası"] || row["oda numarasi"] || row["odano"] || row["oda_no"] || ""),
              konaklama_ucreti: parseFloat(row["konaklama ücreti"]) || parseFloat(row["oda ücreti"]) || parseFloat(row["konaklama fiyatı"]) || 0,
              
              ucus_tipi: row["uçuş tipi"] || "",
              ucus_gidis: parseDate(row["gidiş uçuş tarihi"]) || parseDate(row["gidiş tarihi"]) || parseDate(row["geliş tarihi"]) || parseDate(row["uçuş tarihi"]),
              ucus_gidis_saati: parseTime(row["gidiş uçuş saati"] || row["kalkış saati"] || row["gidiş saati"] || row["uçuş saati"]),
              ucus_parkuru: row["gidiş uçuş parkuru"] || row["parkur"] || row["gidiş parkuru"],
              havayolu: row["gidiş havayolu"] || row["havayolu"] || row["hava yolu"],
              ucus_gidis_kodu: row["gidiş uçuş kodu"] || row["uçuş kodu"] || row["gidiş kodu"],
              ucus_tedarikci: row["gidiş uçuş tedarikçi"] || row["tedarikçi"] || row["uçuş tedarikçi"],
              ucus_ucreti: parseFloat(row["gidiş uçuş ücreti"]) || parseFloat(row["geliş uçuş ücreti"]) || parseFloat(row["uçuş ücreti"]) || 0,
              
              ucus_donus: parseDate(row["dönüş uçuş tarihi"]) || parseDate(row["dönüş tarihi"]),
              ucus_donus_saati: parseTime(row["dönüş uçuş saati"] || row["dönüş kalkış saati"] || row["dönüş saati"]),
              donus_ucus_parkuru: row["dönüş uçuş parkuru"] || row["dönüş parkur"],
              donus_havayolu: row["dönüş havayolu"],
              ucus_donus_kodu: row["dönüş uçuş kodu"] || row["dönüş kodu"],
              donus_ucus_tedarikci: row["dönüş uçuş tedarikçi"],
              donus_ucus_ucreti: parseFloat(row["dönüş uçuş ücreti"]) || 0,
              
              transfer_gidis: parseDate(row["gidiş transfer tarihi"]) || parseDate(row["geliş transfer tarihi"]) || parseDate(row["transfer tarihi"]),
              transfer_gidis_saati: parseTime(row["gidiş transfer saati"] || row["geliş transfer saati"] || row["transfer saati"]),
              transfer_guzergah: row["gidiş transfer güzergahı"] || row["geliş transfer güzergah"] || row["güzergah"] || row["transfer güzergahı"],
              transfer_arac_tipi: row["gidiş transfer araç tipi"] || row["geliş transfer tipi"] || row["araç tipi"],
              transfer_tedarikci: row["gidiş transfer tedarikçi"] || row["geliş transfer tedarikçi"] || row["transfer tedarikçi"],
              transfer_ucreti: parseFloat(row["gidiş transfer ücreti"]) || parseFloat(row["geliş transfer ücreti"]) || parseFloat(row["transfer ücreti"]) || 0,
              
              transfer_donus: parseDate(row["dönüş transfer tarihi"]),
              transfer_donus_saati: parseTime(row["dönüş transfer saati"]),
              donus_transfer_guzergah: row["dönüş transfer güzergahı"] || row["dönüş transfer güzergah"],
              donus_transfer_arac_tipi: row["dönüş transfer araç tipi"] || row["dönüş transfer tipi"],
              donus_transfer_tedarikci: row["dönüş transfer tedarikçi"],
              donus_transfer_ucreti: parseFloat(row["dönüş transfer ücreti"]) || 0
            };
          }).filter((r: any) => r && r.first_name);
        }

        if (formattedData.length === 0) {
          const sampleHeaders = dataRaw.length > 0 ? dataRaw[0].slice(0, 5).join(", ") : "BOŞ";
          toast.error("Geçerli bir veri bulunamadı. Bulunan başlıklar: " + sampleHeaders.substring(0, 50));
          return;
        }


        const newMismatches: {type: string, excelValue: string, mappedId: string}[] = [];
        
        const addMismatch = (type: string, val: string) => {
          if (!val) return;
          const v = val.trim();
          if (v && !newMismatches.find(m => m.type === type && m.excelValue === v) && !mappingDict[`${type}:${v}`]) {
            newMismatches.push({ type, excelValue: v, mappedId: "" });
          }
        };

        formattedData.forEach((row, i) => {
          if (row.kayit_adi && !findSubCat([row.kayit_adi], catKayit, "Kayıt Tipi")) addMismatch("Kayıt Tipi", row.kayit_adi);
          if (row.konaklama_oda && !findSubCat([row.konaklama_oda, row.konaklama_otel], catKonaklama, "Oda Tipi")) addMismatch("Oda Tipi", row.konaklama_oda);
          
          if (row.konaklama_ucreti || row.konaklama_otel || row.konaklama_oda || row.konaklama_checkin || row.konaklama_checkout) {
            const hStr = row.konaklama_otel ? row.konaklama_otel.trim() : "(Boş Bırakılmış)";
            if (!mappingDict[`Otel:${hStr}`]) {
              const hLow = hStr.toLowerCase();
              const hMatch = hStr === "(Boş Bırakılmış)" ? null : (projectHotels.find(h => h.name.toLowerCase() === hLow) || projectHotels.find(h => h.name.toLowerCase().includes(hLow) || hLow.includes(h.name.toLowerCase())));
              if (!hMatch) addMismatch("Otel", hStr);
            }
          }
          
          if ((row.ucus_ucreti || row.ucus_parkuru) && !findSubCat([row.ucus_tipi, row.ucus_parkuru, row.havayolu], catUcak, "Uçuş Tipi")) addMismatch("Uçuş Tipi", row.ucus_tipi || row.ucus_parkuru || row.havayolu);
          if (row.ucus_tedarikci && !findSupplier(row.ucus_tedarikci)) addMismatch("Tedarikçi", row.ucus_tedarikci);
          
          if ((row.donus_ucus_ucreti || row.donus_ucus_parkuru) && !findSubCat([row.ucus_tipi, row.donus_ucus_parkuru, row.donus_havayolu], catUcak, "Uçuş Tipi")) addMismatch("Uçuş Tipi", row.ucus_tipi || row.donus_ucus_parkuru || row.donus_havayolu);
          if (row.donus_ucus_tedarikci && !findSupplier(row.donus_ucus_tedarikci)) addMismatch("Tedarikçi", row.donus_ucus_tedarikci);
          
          if ((row.transfer_ucreti || row.transfer_guzergah) && !findSubCat([row.transfer_arac_tipi, ""], catTransfer, "Transfer Tipi")) addMismatch("Transfer Tipi", row.transfer_arac_tipi);
          if (row.transfer_tedarikci && !findSupplier(row.transfer_tedarikci)) addMismatch("Tedarikçi", row.transfer_tedarikci);
          
          if ((row.donus_transfer_ucreti || row.donus_transfer_guzergah) && !findSubCat([row.donus_transfer_arac_tipi, ""], catTransfer, "Transfer Tipi")) addMismatch("Transfer Tipi", row.donus_transfer_arac_tipi);
          if (row.donus_transfer_tedarikci && !findSupplier(row.donus_transfer_tedarikci)) addMismatch("Tedarikçi", row.donus_transfer_tedarikci);
        });

        if (newMismatches.length > 0) {
          setMismatches(newMismatches);
          setTempParsedData(formattedData);
          setShowMappingModal(true);
          return;
        }

        setParsedData(formattedData);
        toast.success(`${formattedData.length} katılımcı listeye eklendi.`);
      } catch (error) {
        console.error(error);
        toast.error("Excel okuma hatası.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = async () => {
    if (parsedData.length === 0) return;
    setLoading(true);

    try {
      const payload = parsedData.map(row => ({
        project_id: projectId,
        company_id: selectedCompanyId || null,
        title: row.title,
        first_name: row.first_name,
        last_name: row.last_name,
        tc_passport: row.tc_passport_no || row.tc_passport,
        email: row.email,
        phone: row.phone,
        registration_type: row.registration_type,
        notes: row.notes
      }));

      const { data: insertedParticipants, error } = await supabase.from('project_participants').insert(payload).select();
      if (error) throw error;
      
      const flightsToInsert: any[] = [];
      const transfersToInsert: any[] = [];
      const servicesPayload: any[] = [];
      const accommodationsToInsert: any[] = [];
      
      insertedParticipants.forEach((p, idx) => {
        const row = parsedData[idx];
        
        // Ortak hId tanımı
        const hStr = row.konaklama_otel ? row.konaklama_otel.trim() : "";
        let hId = projectHotels.find(h => h.name.toLowerCase() === hStr.toLowerCase())?.id;
        if (!hId && hStr) {
           const mObj = mappingDict[`Otel:${hStr}`];
           if (mObj) hId = mObj;
        }

        if (row.kayit_ucreti || row.kayit_adi) {
          servicesPayload.push({
            project_id: projectId,
            participant_id: p.id,
            category: catKayit,
            sub_category: findSubCat([row.kayit_adi], catKayit, "Kayıt Tipi") || null,
            description: row.kayit_adi || "Kongre Kaydı",
            reference: null,
            unit_price: row.kayit_ucreti || 0,
            unit_quantity: 1,
            total_price: row.kayit_ucreti || 0,
            currency: currency,
            payer_company_id: selectedCompanyId || null
          });
        }

        if (row.konaklama_ucreti || row.konaklama_otel || row.konaklama_oda) {
          const hStr = row.konaklama_otel ? row.konaklama_otel.trim() : "(Boş Bırakılmış)";
          let hId = mappingDict[`Otel:${hStr}`];
          if (!hId && hStr) {
              const hLow = hStr.toLowerCase();
              const hMatch = projectHotels.find(h => h.name.toLowerCase() === hLow) || projectHotels.find(h => h.name.toLowerCase().includes(hLow) || hLow.includes(h.name.toLowerCase()));
              if (hMatch) hId = hMatch.id;
          }
          
          // Otomatik Blokaj / Odalama tablosu kaydı
          let cIn = row.konaklama_checkin || "";
          let cOut = row.konaklama_checkout || "";

          servicesPayload.push({
            project_id: projectId,
            participant_id: p.id,
            category: catKonaklama,
            sub_category: findSubCat([row.konaklama_oda, row.konaklama_otel], catKonaklama, "Oda Tipi") || null,
            description: row.konaklama_otel || "Konaklama",
            hotel_id: hId || null,
            reference: cIn,
            reference_code: cOut,
            voucher_no: row.konaklama_oda_no ? String(row.konaklama_oda_no) : "",
            unit_price: row.konaklama_ucreti || 0,
            unit_quantity: 1,
            total_price: row.konaklama_ucreti || 0,
            currency: currency,
            payer_company_id: selectedCompanyId || null
          });
          
          let nights = 0;
          if (cIn && cOut) {
              const dIn = new Date(cIn); // cIn is already YYYY-MM-DD from parseDate
              const dOut = new Date(cOut);
              if (!isNaN(dIn.getTime()) && !isNaN(dOut.getTime())) {
                  const diffTime = Math.abs(dOut.getTime() - dIn.getTime());
                  nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              }
          }

          accommodationsToInsert.push({
            project_id: projectId,
            participant_id: p.id,
            hotel_id: hId || null,
            first_name: p.first_name,
            last_name: p.last_name,
            room_type: row.konaklama_oda || "",
            room_number: row.konaklama_oda_no ? String(row.konaklama_oda_no) : "",
            nights: nights,
            check_in_date: cIn,
            check_out_date: cOut,
            package: row.konaklama_oda || "", 
            flight: row.ucus_parkuru || row.donus_ucus_parkuru || "",
            total: row.konaklama_ucreti || 0,
            currency: currency,
            room_note: row.notes || "",
            arrival_flight_code: row.ucus_gidis_kodu || "",
            arrival_flight_departure: row.ucus_gidis_saati || "",
            arrival_flight_arrival: "",
            return_flight_code: row.ucus_donus_kodu || "",
            return_flight_departure: row.ucus_donus_saati || "",
            return_flight_arrival: "",
          });
        }

        if (row.ucus_ucreti || row.ucus_parkuru || row.ucus_donus_ucreti || row.donus_ucus_parkuru) {
            let ucusRef = "";
            let ucusFiyat = 0;
            if (row.ucus_parkuru) {
                ucusRef += row.ucus_parkuru;
                ucusFiyat += (row.ucus_ucreti || 0);
            }
            if (row.donus_ucus_parkuru) {
                ucusRef += (ucusRef ? " | " : "") + row.donus_ucus_parkuru;
                ucusFiyat += (row.donus_ucus_ucreti || 0);
            }

            servicesPayload.push({
              _tempId: `flight-${p.id}`,
              project_id: projectId,
              participant_id: p.id,
              category: catUcak,
              sub_category: findSubCat([row.ucus_tipi, row.ucus_parkuru, row.havayolu, row.donus_ucus_parkuru, row.donus_havayolu], catUcak, "Uçuş Tipi") || null,
              description: "Uçak Bileti",
              reference: ucusRef,
              unit_price: ucusFiyat,
              unit_quantity: 1,
              total_price: ucusFiyat,
              currency: currency,
              payer_company_id: selectedCompanyId || null
            });
            
            // Uçak biletleri veritabanında TEK SATIRDA (Gidiş-Dönüş) tutuluyor.
            if (row.ucus_parkuru || row.donus_ucus_parkuru) {
                flightsToInsert.push({
                  _tempId: `flight-${p.id}`,
                  project_id: projectId,
                  ucus_tipi: row.ucus_tipi || "",
                  pnr: row.ucus_pnr || row.donus_ucus_pnr || null,
                  havayolu: row.havayolu || row.donus_havayolu || null,
                  gidis_tarihi: row.ucus_gidis || null,
                  gidis_saati: row.ucus_gidis_saati || null,
                  gidis_ucus_kodu: row.ucus_gidis_kodu || null,
                  donus_tarihi: row.ucus_donus || null,
                  donus_saati: row.ucus_donus_saati || null,
                  donus_ucus_kodu: row.ucus_donus_kodu || null,
                  guzergah: ucusRef || null,
                  tedarikci: findSupplier(row.ucus_tedarikci) || findSupplier(row.donus_ucus_tedarikci) || null,
                  misafirler: `${p.first_name} ${p.last_name}`,
                  kisi_sayisi: 1,
                  doviz: "EUR",
                  toplam_maliyet: 0,
                  toplam_satis: ucusFiyat || 0
                });
            }
        }
        
        // Geliş Transfer
        if (row.transfer_ucreti || row.transfer_guzergah) {
            const tempId = `transfer-${p.id}-gidis`;
            servicesPayload.push({
              _tempId: tempId,
              project_id: projectId,
              participant_id: p.id,
              category: catTransfer,
              sub_category: findSubCat([row.transfer_arac_tipi, ""], catTransfer, "Transfer Tipi") || null,
              description: "Transfer",
              reference: row.transfer_guzergah || "",
              reference_code: row.transfer_gidis || "",
              unit_price: row.transfer_ucreti || 0,
              unit_quantity: 1,
              total_price: row.transfer_ucreti || 0,
              currency: currency,
              payer_company_id: selectedCompanyId || null
            });
            transfersToInsert.push({
              _tempId: tempId,
              project_id: projectId,
              participant_id: p.id,
              hotel_id: hId || null,
              direction: "arrival",
              type_label: row.transfer_arac_tipi?.toLowerCase().includes("grup") ? "Grup" : "Özel",
              transfer_type: row.transfer_arac_tipi || null,
              route: row.transfer_guzergah || null,
              vehicle_type: row.transfer_arac_tipi || null,
              flight_code: row.ucus_gidis_kodu || null,
              supplier_name: findSupplier(row.transfer_tedarikci) || null,
              date: row.transfer_gidis || null,
              time: row.transfer_gidis_saati || null,
              passengers: [`${p.first_name} ${p.last_name}`]
            });
        }
        
        // Dönüş Transfer
        if (row.donus_transfer_ucreti || row.donus_transfer_guzergah) {
            const tempId = `transfer-${p.id}-donus`;
            servicesPayload.push({
              _tempId: tempId,
              project_id: projectId,
              participant_id: p.id,
              category: catTransfer,
              sub_category: findSubCat([row.donus_transfer_arac_tipi, ""], catTransfer, "Transfer Tipi") || null,
              description: "Transfer",
              reference: row.donus_transfer_guzergah || "",
              reference_code: row.transfer_donus || "",
              unit_price: row.donus_transfer_ucreti || 0,
              unit_quantity: 1,
              total_price: row.donus_transfer_ucreti || 0,
              currency: currency,
              payer_company_id: selectedCompanyId || null
            });
            transfersToInsert.push({
              _tempId: tempId,
              project_id: projectId,
              participant_id: p.id,
              hotel_id: hId || null,
              direction: "departure",
              type_label: row.donus_transfer_arac_tipi?.toLowerCase().includes("grup") ? "Grup" : "Özel",
              transfer_type: row.donus_transfer_arac_tipi || null,
              route: row.donus_transfer_guzergah || null,
              vehicle_type: row.donus_transfer_arac_tipi || null,
              flight_code: row.ucus_donus_kodu || null,
              supplier_name: findSupplier(row.donus_transfer_tedarikci) || null,
              date: row.transfer_donus || null,
              time: row.transfer_donus_saati || null,
              passengers: [`${p.first_name} ${p.last_name}`]
            });
        }
      });
      
      const itemsToInsert = servicesPayload.map(s => {
          const { id, _tempId, ...rest } = s;
          return rest;
      });

      if (itemsToInsert.length > 0) {
        const { data: insertedItems, error: srvError } = await supabase.from('project_sales_items').insert(itemsToInsert).select('id, category, description, reference, participant_id');
        if (srvError) console.error("Servisler eklenirken hata:", srvError);
        
        if (insertedItems && insertedItems.length === servicesPayload.length) {
            // Because Supabase returns rows in the exact order of insertion
            insertedItems.forEach((inserted, index) => {
               const original = servicesPayload[index];
               if (original._tempId) {
                   // Uçak
                   if (original.category === catUcak) {
                       const f = flightsToInsert.find(f => f._tempId === original._tempId);
                       if (f) { f.id = inserted.id; delete f._tempId; }
                   }
                   // Transfer
                   if (original.category === catTransfer) {
                       const t = transfersToInsert.find(t => t._tempId === original._tempId);
                       if (t) { t.id = inserted.id; delete t._tempId; }
                   }
               }
            });
            // Hâlâ silinmemiş _tempId varsa temizle
            flightsToInsert.forEach(f => delete f._tempId);
            transfersToInsert.forEach(t => delete t._tempId);
        } else if (insertedItems) {
            // Fallback (eğer sıra karışırsa vb)
            flightsToInsert.forEach(f => {
                if (f._tempId) {
                    const matchedItem = insertedItems.find(it => it.category === catUcak && `flight-${it.participant_id}` === f._tempId);
                    if (matchedItem) f.id = matchedItem.id;
                    delete f._tempId;
                }
            });
            transfersToInsert.forEach(t => {
                if (t._tempId) {
                    const isDonus = t._tempId.includes('-donus');
                    const matchedItem = insertedItems.find(it => it.category === catTransfer && it.participant_id === t.participant_id && (isDonus ? it.reference_code === t.date : it.reference_code === t.date));
                    if (matchedItem) t.id = matchedItem.id;
                    delete t._tempId;
                }
            });
        }
      }
      
      if (flightsToInsert.length > 0) { const {error} = await supabase.from('project_flight_tickets').upsert(flightsToInsert); if(error) console.error("FLIGHT INSERT ERROR:", error); }
      if (transfersToInsert.length > 0) { const {error} = await supabase.from('project_transfer_tour').upsert(transfersToInsert); if(error) console.error("TRANSFER INSERT ERROR:", error); }
      if (accommodationsToInsert.length > 0) { const {error} = await supabase.from('project_accommodation_items').insert(accommodationsToInsert); if(error) console.error("ACCOMMODATION INSERT ERROR:", error); }

      toast.success(`${payload.length} katılımcı ve hizmetleri başarıyla aktarıldı.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error("Kaydetme sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-v3-surface w-full max-w-5xl rounded-2xl shadow-2xl border border-gray-200 dark:border-v3-border overflow-hidden flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-v3-border bg-gray-50 dark:bg-white/5">
            <h2 className="text-lg font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              AKILLI İÇE AKTARIM (SMART IMPORT)
            </h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-200 dark:border-blue-900/30">
                  <h3 className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">1. Adım: Master Şablonu İndirin</h3>
                  <p className="text-[11px] text-blue-600/80 dark:text-blue-300/70 mb-3">
                    Sistemin kabul ettiği formatta katılımcı, konaklama, uçuş ve transfer verilerini aynı anda girmek için master şablonu indirin.
                  </p>
                  <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                    <Download className="w-4 h-4" /> Master Şablonu İndir
                  </button>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/30">
                  <h3 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2">2. Adım: Rooming List Yükleyin</h3>
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-lg cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-3 pb-4">
                      <Upload className="w-6 h-6 text-emerald-500 mb-2" />
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Dosya Seç veya Sürükle</p>
                    </div>
                    <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-200 dark:border-purple-900/30 h-full">
                  <h3 className="text-xs font-bold text-purple-700 dark:text-purple-400 mb-2">3. Adım: Toplu Sponsor / Kota Seçimi</h3>
                  <p className="text-[11px] text-purple-600/80 dark:text-purple-300/70 mb-4">
                    Yüklediğiniz listedeki <strong>TÜM</strong> katılımcıların ve hizmetlerinin faturası kime kesilecek? 
                    Örn: Pfizer kotalarını yüklüyorsanız listeden Pfizer'i seçin.
                  </p>
                  <div className="flex gap-2">
                    <select 
                      value={selectedCompanyId} 
                      onChange={(e) => setSelectedCompanyId(e.target.value)} 
                      className="flex-1 h-10 px-3 text-sm font-semibold bg-white dark:bg-black/20 border border-purple-200 dark:border-purple-800 rounded-lg text-purple-900 dark:text-purple-100 focus:border-purple-500 outline-none"
                    >
                      <option value="">-- Bireysel Ödeme (Kendi Ödeyecek) --</option>
                      {agencies.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                    
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-24 h-10 px-3 text-sm font-bold bg-white dark:bg-black/20 border border-purple-200 dark:border-purple-800 rounded-lg text-purple-900 dark:text-purple-100 focus:border-purple-500 outline-none"
                      title="Bu listedeki fiyatların döviz cinsi"
                    >
                      <option value="TRY">TRY</option>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
          
          <div className="p-5 border-t border-gray-200 dark:border-v3-border bg-gray-50 dark:bg-white/5 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2 text-xs font-bold text-gray-600 dark:text-v3-muted hover:text-gray-900 dark:hover:text-v3-text transition-colors">
              İPTAL
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={loading || parsedData.length === 0} 
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg shadow-emerald-500/20 transition-all"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              VERİLERİ İÇERİ AKTAR
            </button>
          </div>
        </div>
      </div>

      {showMappingModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-v3-bg rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
              <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-orange-500">⚠️</span> Eşleştirme Gerekli
              </h3>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30 dark:bg-transparent">
              <p className="text-sm text-v3-muted mb-6">Excel dosyanızdaki bazı veriler sistemdeki kayıtlarla otomatik olarak eşleştirilemedi. Lütfen aşağıdaki verilerin sistemdeki karşılıklarını seçin. Bu işlem sadece bu aktarım için geçerlidir.</p>
              
              <div className="space-y-4">
                {mismatches.map((m, idx) => {
                  let options: any[] = [];
                  if (m.type === "Kayıt Tipi") options = categories.filter(c => c.parent_id === catKayit);
                  else if (m.type === "Oda Tipi") options = categories.filter(c => c.parent_id === catKonaklama);
                  else if (m.type === "Uçuş Tipi") options = categories.filter(c => c.parent_id === catUcak);
                  else if (m.type === "Transfer Tipi") options = categories.filter(c => c.parent_id === catTransfer);
                  else if (m.type === "Otel") options = projectHotels;
                  else if (m.type === "Tedarikçi") options = [...dbSuppliers, ...projectHotels];

                  return (
                    <div key={idx} className="flex items-center gap-4 bg-white dark:bg-v3-surface border border-gray-200 dark:border-v3-border p-4 rounded-xl shadow-sm">
                      <div className="w-1/3">
                        <span className="text-[10px] font-black text-v3-muted uppercase block mb-1">{m.type}</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{m.excelValue}</span>
                      </div>
                      <div className="w-8 flex justify-center text-gray-300 dark:text-gray-600">→</div>
                      <div className="flex-1">
                        <select 
                          value={m.mappedId} 
                          onChange={e => {
                            const newM = [...mismatches];
                            newM[idx].mappedId = e.target.value;
                            setMismatches(newM);
                          }}
                          className="w-full h-10 px-3 text-sm font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded-lg text-v3-text outline-none focus:border-blue-500 transition-colors"
                        >
                          <option value="">-- Karşılığını Seçin --</option>
                          {options.map(o => (
                            <option key={o.id} value={o.id}>{o.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-v3-bg flex justify-end gap-3">
              <button 
                onClick={() => { setShowMappingModal(false); setTempParsedData([]); }} 
                className="px-6 py-2.5 text-sm font-bold text-gray-600 dark:text-v3-muted hover:text-gray-900 dark:hover:text-v3-text transition-colors"
              >
                İPTAL
              </button>
              <button 
                onClick={() => {
                  const unmapped = mismatches.filter(m => !m.mappedId);
                  if (unmapped.length > 0) {
                    alert("Lütfen tüm eşleştirmeleri tamamlayın veya iptal edip Excel dosyanızı düzeltin.");
                    return;
                  }
                  
                  const newDict = { ...mappingDict };
                  mismatches.forEach(m => {
                    newDict[`${m.type}:${m.excelValue}`] = m.mappedId;
                  });
                  setMappingDict(newDict);
                  setShowMappingModal(false);
                  
                  const formattedData = tempParsedData;
                  setTempParsedData([]);
                  
                  setParsedData(formattedData);
                  toast.success(`${formattedData.length} katılımcı listeye eklendi.`);
                }} 
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black uppercase tracking-wider rounded-lg shadow-lg shadow-blue-500/20 transition-all"
              >
                EŞLEŞTİRMELERİ KAYDET VE AKTAR
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
