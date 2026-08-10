import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DocumentProcessorServiceClient } from "@google-cloud/documentai";
import path from "path";
import fs from "fs/promises";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const entityType = formData.get("entityType") as string;
    const entityId = formData.get("entityId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
       return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // 1. Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `ocr_uploads/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('invoices_bucket')
      .upload(fileName, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('invoices_bucket')
      .getPublicUrl(fileName);

    // 2. Call OCR Engine (Google Document AI)
    // Kimlik doğrulama için JSON dosyası aranıyor (proje kök dizininde)
    const keyPath = path.join(process.cwd(), "..", "google-credentials.json"); // Root'un bir üstü veya root
    const rootKeyPath = path.join(process.cwd(), "google-credentials.json");
    
    let resolvedKeyPath = null;
    try {
      await fs.access(keyPath);
      resolvedKeyPath = keyPath;
    } catch {
      try {
        await fs.access(rootKeyPath);
        resolvedKeyPath = rootKeyPath;
      } catch {
        const explicitPath = "/Users/arifari/Desktop/TT_Sistem_AG kopyası/google-credentials.json";
        try {
          await fs.access(explicitPath);
          resolvedKeyPath = explicitPath;
        } catch {
          console.warn("Google credentials JSON not found, falling back to mock data...");
        }
      }
    }

    let mockExtractedData = {
      invoiceNo: "INV-" + Math.floor(Math.random() * 100000),
      date: new Date().toISOString().split("T")[0],
      supplier: "Google OCR Bekleniyor",
      subtotal: 10000 + Math.floor(Math.random() * 5000),
      tax: 20,
      currency: "TRY",
      total: 0
    };
    mockExtractedData.total = mockExtractedData.subtotal * (1 + (mockExtractedData.tax / 100));

    const hasEnvCredentials = process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY;

    if (resolvedKeyPath || hasEnvCredentials) {
      try {
        const clientOptions: any = {
          apiEndpoint: 'eu-documentai.googleapis.com',
        };

        if (hasEnvCredentials) {
          clientOptions.credentials = {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
          };
        } else {
          clientOptions.keyFilename = resolvedKeyPath;
        }

        const client = new DocumentProcessorServiceClient(clientOptions);

        // Screenshot'tan alınan bilgiler
        const projectId = "51249713962";
        const location = "eu";
        const processorId = "eb25e12aba6aacf7";

        const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;

        // Dosyayı buffer olarak oku
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // MIME Type kontrolü (INVALID_ARGUMENT hatasını engellemek için)
        let mimeType = file.type;
        if (!mimeType || mimeType === 'application/octet-stream' || mimeType === 'binary/octet-stream') {
           const ext = (file.name || "").split('.').pop()?.toLowerCase();
           if (ext === 'pdf') mimeType = 'application/pdf';
           else if (ext === 'png') mimeType = 'image/png';
           else if (ext === 'tiff' || ext === 'tif') mimeType = 'image/tiff';
           else mimeType = 'image/jpeg';
        }
        
        // Eğer mimeType hala desteklenmeyen bir şeyse zorla jpeg yap (jpeg çoğu tarayıcı canvas veya standart image/ türüdür)
        if (!mimeType.includes('pdf') && !mimeType.includes('image/')) {
           mimeType = 'image/jpeg';
        }

        const request = {
          name,
          rawDocument: {
            content: buffer.toString('base64'),
            mimeType: mimeType,
          },
        };

        const [result] = await client.processDocument(request);
        const { document } = result;

        // Ayıklanan verileri bul
        if (document?.entities) {
           // Debug için JSON olarak kaydet
           try {
               require('fs').writeFileSync('entities.json', JSON.stringify(document.entities, null, 2));
           } catch (e) {
               console.error("Failed to write entities.json", e);
           }

           // Document AI başarılı oldu, rastgele oluşturulan mock verilerini sıfırla ki kullanıcıyı yanıltmasın
           mockExtractedData.invoiceNo = "";
           mockExtractedData.date = "";
           mockExtractedData.supplier = "";
           mockExtractedData.subtotal = 0;
           mockExtractedData.tax = 0;
           mockExtractedData.total = 0;
           mockExtractedData.currency = "TRY";

           let subtotal = 0;
           let tax = 0;
           let total = 0;
           
           // Sayı formatı düzeltici (örn: 119.660.00 veya 119.660,00 -> 119660.00)
           const parseAmount = (val: string) => {
              let s = val.replace(/[^0-9,.-]/g, "");
              if (s.includes(',')) {
                 s = s.replace(/\./g, "").replace(",", ".");
              } else {
                 const parts = s.split('.');
                 if (parts.length > 2) {
                   const decimal = parts.pop();
                   s = parts.join("") + "." + decimal;
                 } else if (parts.length === 2 && parts[1].length === 2) {
                   // 119660.00 durumu
                   s = parts[0] + "." + parts[1];
                 } else if (parts.length === 2 && parts[1].length === 3) {
                   // 119.660 durumu (ondalık yok, binlik ayracı nokta)
                   s = parts[0] + parts[1];
                 }
              }
              return parseFloat(s) || 0;
           };

           for (const entity of document.entities) {
             const type = entity.type;
             const text = entity.mentionText || "";
             
             if (type === "invoice_id") mockExtractedData.invoiceNo = text;
             if (type === "invoice_date") mockExtractedData.date = text;
             if (type === "supplier_name" || type === "receiver_name") mockExtractedData.supplier = text;
             if (type === "currency") mockExtractedData.currency = text;
             if (type === "net_amount") subtotal = parseAmount(text);
             if (type === "total_tax_amount") tax = parseAmount(text);
             if (type === "total_amount") total = parseAmount(text);
           }

           if (subtotal > 0) mockExtractedData.subtotal = subtotal;
           if (total > 0) mockExtractedData.total = total;
           if (tax > 0 && total > 0 && subtotal === 0) mockExtractedData.subtotal = total - tax;
           
           // KDV yüzdesini hesapla
           if (mockExtractedData.subtotal > 0 && tax > 0) {
              mockExtractedData.tax = Math.round((tax / mockExtractedData.subtotal) * 100);
           } else if (mockExtractedData.subtotal > 0 && mockExtractedData.total > 0) {
              mockExtractedData.tax = Math.round(((mockExtractedData.total - mockExtractedData.subtotal) / mockExtractedData.subtotal) * 100);
           } else {
              mockExtractedData.tax = 0;
           }

           // Eğer tarih bulunamadıysa raw text üzerinden Regex ile bulmayı dene (El yazısı faturalar için)
           const rawText = document.text || "";
           if (!mockExtractedData.date && rawText) {
              const dateMatch = rawText.match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/);
              if (dateMatch) {
                 const day = dateMatch[1].padStart(2, '0');
                 const month = dateMatch[2].padStart(2, '0');
                 let year = dateMatch[3];
                 // El yazısı OCR hatası düzeltici: 2015 okursa 2025 yap (2020 sonrası için genel bir heuristic)
                 if (year === "2015") year = "2025";
                 
                 mockExtractedData.date = `${year}-${month}-${day}`;
              }
           }
           
           // Eğer Tutar bulunamadıysa raw text üzerinden büyük sayıları Regex ile bulmayı dene
           if (mockExtractedData.total === 0 && rawText) {
              // Örn: 119.660,00 veya 119.660.00 veya 119,660.00
              const amountMatches = rawText.match(/\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})\b/g);
              if (amountMatches && amountMatches.length > 0) {
                  // En büyük sayıyı total kabul edelim
                  const parsedAmounts = amountMatches.map(m => parseAmount(m));
                  const maxAmount = Math.max(...parsedAmounts);
                  if (maxAmount > 0) {
                      mockExtractedData.total = maxAmount;
                      mockExtractedData.subtotal = maxAmount; // Şimdilik vergiyi 0 varsayalım
                      mockExtractedData.tax = 0;
                  }
              }
           }
           
           // Eğer Hizmet Açıklaması için bir field istenirse (şimdilik formda yok ama veriyi çekelim)
           let description = "";
           const descMatch = rawText.match(/A[CÇcç]IKLAMA\s*[:\-\n]*\s*([^\n]+)/i);
           if (descMatch) {
               description = descMatch[1].trim();
           }
           (mockExtractedData as any).description = description;

           // Satır (Item) desteği için items dizisini oluştur
           (mockExtractedData as any).items = [
               {
                   id: Math.random().toString(36).substring(7),
                   description: description || "Fatura Kalemi",
                   subtotal: mockExtractedData.subtotal,
                   taxRate: mockExtractedData.tax,
                   total: mockExtractedData.total
               }
           ];

         } else {
           mockExtractedData.supplier = "HATA: OCR Sonuç Döndüremedi (entities yok)";
         }

      } catch (ocrError: any) {
        console.error("Google Document AI Hatası:", ocrError);
        mockExtractedData.supplier = "OCR HATASI: " + (ocrError.message || "Bilinmeyen hata");
        mockExtractedData.invoiceNo = "-";
        mockExtractedData.subtotal = 0;
        mockExtractedData.total = 0;
        mockExtractedData.tax = 0;
        mockExtractedData.date = "";
      }
    } else {
      mockExtractedData.supplier = "HATA: Google Credentials Bulunamadı!";
      // Eğer credential yoksa 1.5 sn bekle (Mock loading)
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // 3. Save to uploaded_invoices table as PENDING
    const { data: invoiceData, error: dbError } = await supabase
      .from('uploaded_invoices')
      .insert({
        entity_type: entityType,
        entity_id: entityId || null,
        file_url: publicUrl,
        status: 'PROCESSING', // Modal'da review yapılıyor, save basılınca APPROVED olacak.
        extracted_data: mockExtractedData
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB error:", dbError);
      return NextResponse.json({ error: "Failed to save record" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      invoiceId: invoiceData.id,
      fileUrl: publicUrl,
      extractedData: mockExtractedData 
    });

  } catch (error: any) {
    console.error("OCR API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
