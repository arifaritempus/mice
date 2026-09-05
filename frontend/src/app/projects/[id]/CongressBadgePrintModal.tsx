import React, { useEffect } from "react";
import { X, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function CongressBadgePrintModal({ participants, onClose, project }: any) {
  useEffect(() => {
    // Add a class to body to help with print styles
    document.body.classList.add("printing-badges");
    return () => {
      document.body.classList.remove("printing-badges");
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[99999] bg-gray-100 flex flex-col">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-section, #print-section * {
            visibility: visible;
          }
          #print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            margin: 0;
            size: A4 portrait;
          }
          .badge-container {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10mm !important;
            padding: 10mm !important;
          }
          .badge-card {
            page-break-inside: avoid;
            border: 1px solid #ccc !important;
            height: 130mm !important;
            width: 90mm !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Header - No Print */}
      <div className="h-16 bg-white border-b flex items-center justify-between px-6 no-print shadow-sm">
        <div>
          <h2 className="text-lg font-black text-gray-900">Yaka Kartı Basımı</h2>
          <p className="text-xs text-gray-500">{participants.length} katılımcı seçildi.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => window.print()} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-2 transition-colors">
            <Printer className="w-4 h-4" /> Yazdır
          </button>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-y-auto p-8 bg-gray-100 no-print flex justify-center">
        <div className="max-w-5xl w-full">
          <p className="text-center text-sm text-gray-500 mb-8">Aşağıdaki görünüm A4 kağıdına 2'li sığacak şekilde tasarlanmıştır. "Yazdır" butonuna bastığınızda bu kontroller gizlenecektir.</p>
          
          <div id="print-section" className="bg-white p-8 rounded-xl shadow-lg min-h-screen">
            <div className="badge-container grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center">
              {participants.map((p: any, i: number) => (
                <div key={i} className="badge-card bg-white w-[90mm] h-[130mm] rounded-2xl border-2 border-gray-200 shadow-md flex flex-col relative overflow-hidden">
                  
                  {/* Badge Header / Banner */}
                  <div className="h-[30mm] bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center p-4 text-center">
                    <h3 className="text-white font-black text-lg line-clamp-2 leading-tight uppercase tracking-wider">{project?.name || "KONGRE / ETKİNLİK"}</h3>
                  </div>

                  {/* Badge Body */}
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <h1 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight leading-none">{p.first_name}</h1>
                    <h2 className="text-2xl font-bold text-gray-700 mb-6 uppercase tracking-widest">{p.last_name}</h2>
                    
                    <div className="w-16 h-1 bg-gray-200 rounded-full mb-6"></div>
                    
                    <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-1">{p.company?.name || p.company_name || "BİREYSEL"}</p>
                    <p className="text-xs text-gray-500 font-semibold mb-3">{p.title || ""}</p>
                    {p.registration_type && (
                      <div className="px-4 py-1.5 bg-gray-900 text-white rounded-full text-xs font-black uppercase tracking-widest mt-auto shadow-sm">
                        {p.registration_type}
                      </div>
                    )}
                  </div>

                  {/* Badge Footer with QR */}
                  <div className="h-[35mm] bg-gray-50 border-t border-gray-100 flex items-center justify-between px-6">
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kayıt No</span>
                      <span className="text-xs font-black text-gray-700 font-mono">{p.tc_passport ? p.tc_passport.slice(-4) : p.id.slice(0, 6).toUpperCase()}</span>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border shadow-sm">
                      <QRCodeSVG value={typeof window !== 'undefined' ? `${window.location.origin}/verify/${p.id}` : `https://ttsistem.com/verify/${p.id}`} size={64} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
