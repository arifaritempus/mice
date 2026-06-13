'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { SejourService, SettingsService } from '@/lib/supabaseService';
import { getLogosForExcel } from '@/utils/logoUtils';
import { usePermissions, Module } from '@/lib/permissions';

interface SejourRoom {
  roomNumber: string;
  hotelName?: string;
  roomType: string;
  guestInfo: string;
  price: number;
  currency: string;
}

interface SejourFlight {
  type: 'departure' | 'return';
  airline: string;
  flightNo: string;
  flightDate: string;
  route: string;
  pnr?: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  currency: string;
}

interface SejourTransfer {
  direction: 'arrival' | 'return' | 'intermediate';
  supplierName?: string;
  vehicle: string;
  type: 'private' | 'economic';
  time: string;
  price: number;
  currency: string;
}

interface SejourExtraService {
  serviceTypeName?: string;
  supplierName?: string;
  description: string;
  price: number;
  currency: string;
}

interface SejourData {
  id: string;
  voucherNumber: string;
  customerType: string;
  customerName: string;
  agencyName: string;
  checkInDate: string;
  checkOutDate: string;
  hotelName?: string;
  hotelAddress?: string;
  rooms: SejourRoom[];
  flights: SejourFlight[];
  transfers: SejourTransfer[];
  extraServices: SejourExtraService[];
  totals: Record<string, number>;
  currency: string;
  status: string;
  notes: string;
  created_at: string;
}

export default function SejourDetailPage() {
  const params = useParams();
  const { canEdit } = usePermissions();
  const [sejour, setSejour] = useState<SejourData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const voucherRef = useRef<HTMLDivElement>(null);
  const [darkIconLogo, setDarkIconLogo] = useState<string>('');
  const [darkWordmarkLogo, setDarkWordmarkLogo] = useState<string>('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({
    company_name: 'TEMPUS TRAVEL',
    company_email: 'info@tempustravel.co',
    company_phone: '',
    company_address: '',
    company_website: 'www.tempustravel.co'
  });

  const loadSejourData = useCallback(async () => {
    try {
      setLoading(true);
      const sejourData = await SejourService.getSejourWithDetails(params.id as string);
      if (sejourData) {
        setSejour(sejourData as SejourData);
      } else {
        setError('Sejour bulunamadı');
      }
    } catch (err) {
      console.error('Error loading sejour:', err);
      setError('Sejour yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      loadSejourData();
    }
    
    const loadLogos = async () => {
      try {
        const { iconLogoBase64, wordmarkLogoBase64 } = await getLogosForExcel(false);
        if (iconLogoBase64) setDarkIconLogo(iconLogoBase64);
        if (wordmarkLogoBase64) setDarkWordmarkLogo(wordmarkLogoBase64);
      } catch (err) {
        console.error('Error loading logos:', err);
      }
    };

    const loadCompanyInfo = async () => {
      try {
        const settings = await SettingsService.getSettings();
        const generalSettings = settings.general_settings || {};
        setCompanyInfo({
          company_name: generalSettings.company_name || 'TEMPUS TRAVEL',
          company_email: generalSettings.company_email || 'info@tempustravel.co',
          company_phone: generalSettings.company_phone || '',
          company_address: generalSettings.company_address || '',
          company_website: generalSettings.company_website || generalSettings.company_email?.split('@')[1] || 'www.tempustravel.co'
        });
      } catch (err) {
        console.error('Error loading company info:', err);
      }
    };

    loadLogos();
    loadCompanyInfo();
  }, [params.id, loadSejourData]);

  const generateVoucherPDF = async () => {
    if (!voucherRef.current || !sejour) return;

    try {
      setIsGeneratingPDF(true);
      
      const voucherElement = voucherRef.current;
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(voucherElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: true,
        width: 794,
        windowWidth: 794
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, Math.min(imgHeight, pageHeight));
      pdf.save(`voucher-${sejour.voucherNumber}.pdf`);
    } catch (err) {
      console.error('PDF oluşturma hatası:', err);
      alert('PDF oluşturulurken hata oluştu: ' + (err as Error).message);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'KONFİRME': return 'bg-green-100 text-green-800';
      case 'İPTAL': return 'bg-red-100 text-red-800';
      case 'TEKLİF': return 'bg-blue-100 text-blue-800';
      case 'BEKLEMEDE': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !sejour) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-lg shadow-sm">
            <span className="font-medium">{error || 'Sejour bulunamadı'}</span>
          </div>
          <div className="mt-6">
            <Link href="/sejour" className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              Sejour Listesine Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
      {/* PDF Voucher - Hidden area for capture */}
      <div 
        ref={voucherRef} 
        className="no-theme-root"
        style={{ 
          position: 'absolute',
          left: '-9999px', 
          top: '0', 
          width: '210mm', 
          backgroundColor: 'white',
          color: '#1a1a1a',
          fontFamily: "'Inter', system-ui, sans-serif",
          zIndex: -100
        }}
      >
        <div className="bg-white px-10 py-12 w-full min-h-[297mm] text-gray-900" style={{fontFamily: "'Inter', sans-serif"}}>
          {/* Header with Logos */}
          <div className="flex justify-between items-center border-b-[3px] border-gray-900 pb-6 mb-8">
            <div className="flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {darkIconLogo && <img src={darkIconLogo} alt="Logo" className="w-16 h-auto object-contain" />}
            </div>
            <div className="text-right flex flex-col items-end">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {darkWordmarkLogo && <img src={darkWordmarkLogo} alt="Wordmark" className="h-6 w-auto object-contain mb-2" />}
              <div className="text-[10px] tracking-[0.2em] text-gray-600 font-medium uppercase mt-1">OFFICIAL VOUCHER</div>
            </div>
          </div>

          {/* Voucher & Guest Profile */}
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="text-2xl font-light text-gray-900 tracking-wider mb-4 uppercase">RESERVATION DIRECTORY</h1>
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 responsive-filter-grid">
                <div>
                  <span className="block text-[8px] tracking-[0.2em] text-gray-600 uppercase mb-1">GUEST NAME</span>
                  <span className="block text-sm font-medium text-gray-900">{sejour.customerName}</span>
                </div>
                <div>
                  <span className="block text-[8px] tracking-[0.2em] text-gray-600 uppercase mb-1">GUEST TYPE</span>
                  <span className="block text-sm font-medium text-gray-900">{sejour.customerType === 'agency' ? `Agency (${sejour.agencyName || ''})` : 'Individual'}</span>
                </div>
                <div>
                  <span className="block text-[8px] tracking-[0.2em] text-gray-600 uppercase mb-1">CHECK IN</span>
                  <span className="block text-sm font-medium text-gray-900">{sejour.checkInDate ? new Date(sejour.checkInDate).toLocaleDateString('tr-TR') : '-'}</span>
                </div>
                <div>
                  <span className="block text-[8px] tracking-[0.2em] text-gray-600 uppercase mb-1">CHECK OUT</span>
                  <span className="block text-sm font-medium text-gray-900">{sejour.checkOutDate ? new Date(sejour.checkOutDate).toLocaleDateString('tr-TR') : '-'}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
               <span className="block text-[8px] tracking-[0.2em] text-gray-600 uppercase mb-2">VOUCHER NO</span>
               <span className="block text-3xl font-light tracking-widest text-gray-900">{sejour.voucherNumber}</span>
            </div>
          </div>

          {/* ITINERARY */}
          <div className="space-y-8">
            {sejour.rooms && sejour.rooms.length > 0 && (
              <div>
                <div className="border-b border-gray-300 pb-2 mb-4">
                  <h2 className="text-[10px] tracking-[0.3em] text-gray-900 font-bold uppercase">Accommodation Details</h2>
                </div>
                <div className="mb-3">
                  <h3 className="text-lg font-medium text-gray-900">{sejour.hotelName || sejour.rooms[0]?.hotelName || '-'}</h3>
                  {sejour.hotelAddress && <p className="text-xs text-gray-500 mt-1">{sejour.hotelAddress}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {sejour.rooms.map((room, idx) => (
                    <div key={`room-${idx}`} className="bg-white border border-gray-200 p-4 rounded-sm flex justify-between items-center">
                      <div>
                        <span className="block text-[8px] tracking-widest text-gray-600 uppercase mb-1">ROOM {room.roomNumber || idx + 1}</span>
                        <span className="block text-xs font-semibold text-gray-900">{room.roomType}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[8px] tracking-widest text-gray-600 uppercase mb-1">GUESTS</span>
                        <span className="block text-xs font-medium text-gray-700">{room.guestInfo}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sejour.flights && sejour.flights.length > 0 && (
              <div>
                <div className="border-b border-gray-300 pb-2 mb-4 mt-6">
                  <h2 className="text-[10px] tracking-[0.3em] text-gray-900 font-bold uppercase">Flight Itinerary</h2>
                </div>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 uppercase">Direction</th>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 uppercase">Airline</th>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 uppercase">Date</th>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 uppercase">Route</th>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 uppercase text-right">PNR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sejour.flights.map((flight, idx) => (
                      <tr key={`flight-${idx}`} className="border-b border-gray-50">
                        <td className="py-3 font-medium">{flight.type === 'departure' ? 'Gidiş' : 'Dönüş'}</td>
                        <td className="py-3">{flight.airline} ({flight.flightNo})</td>
                        <td className="py-3">{flight.flightDate ? new Date(flight.flightDate).toLocaleDateString('tr-TR') : '-'}</td>
                        <td className="py-3 font-medium">{flight.route}</td>
                        <td className="py-3 text-right">
                          <span className="block font-semibold">{flight.pnr || 'N/A'}</span>
                          <span className="text-[9px] text-gray-600">{flight.departureTime} - {flight.arrivalTime}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {sejour.transfers && sejour.transfers.length > 0 && (
              <div>
                <div className="border-b border-gray-300 pb-2 mb-4 mt-6">
                  <h2 className="text-[10px] tracking-[0.3em] text-gray-900 font-bold uppercase">Transfer Services</h2>
                </div>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 uppercase">Direction</th>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 uppercase">Vehicle</th>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 uppercase">Type</th>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 uppercase text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sejour.transfers.map((trans, idx) => (
                      <tr key={`transfer-${idx}`} className="border-b border-gray-50">
                        <td className="py-3 font-medium">{trans.direction === 'arrival' ? 'Varış' : (trans.direction === 'return' ? 'Dönüş' : 'Ara')}</td>
                        <td className="py-3">{trans.vehicle}</td>
                        <td className="py-3">{trans.type === 'private' ? 'Özel' : 'Ekonomik'}</td>
                        <td className="py-3 font-semibold text-right">{trans.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {sejour.notes && (
            <div className="mt-12 bg-white border border-gray-200 p-4">
              <h3 className="text-[9px] tracking-widest text-gray-900 font-bold uppercase mb-2">IMPORTANT NOTES</h3>
              <p className="text-xs text-gray-600 leading-relaxed italic">{sejour.notes}</p>
            </div>
          )}

          <div className="mt-16 pt-8 border-t border-gray-200">
            <div className="flex justify-between items-end">
              <div>
                <div className="text-sm font-semibold tracking-wide mb-1">{companyInfo.company_name}</div>
                <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-3">{companyInfo.company_address}</div>
                <div className="flex gap-4 text-[9px] font-medium text-gray-600">
                  {companyInfo.company_phone && <span>T: {companyInfo.company_phone}</span>}
                  <span>E: {companyInfo.company_email}</span>
                  <span>W: {companyInfo.company_website}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-semibold tracking-[0.2em]">{new Date().toLocaleDateString('tr-TR')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main UI */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Sejour Detayı</h1>
          <p className="text-gray-600 mt-1 text-sm">Voucher: {sejour.voucherNumber}</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={generateVoucherPDF} disabled={isGeneratingPDF} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-70">
            {isGeneratingPDF ? 'HAZIRLANIYOR...' : 'PDF VOUCHER İNDİR'}
          </button>
          {canEdit(Module.SEJOUR) && (
            <Link href={`/sejour/${sejour.id}/edit`} className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 transition-colors text-sm">
              Düzenle
            </Link>
          )}
          <Link href="/sejour" className="bg-gray-600 text-white px-3 py-1.5 rounded-md hover:bg-gray-700 transition-colors text-sm">
            Geri Dön
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(sejour.status)}`}>
          {sejour.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-base font-semibold mb-2">Temel Bilgiler</h2>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500">Müşteri:</span> {sejour.customerName} ({sejour.customerType === 'agency' ? `Acente: ${sejour.agencyName}` : 'Bireysel'})</p>
            <p><span className="text-gray-500">Tarih:</span> {new Date(sejour.checkInDate).toLocaleDateString('tr-TR')} - {new Date(sejour.checkOutDate).toLocaleDateString('tr-TR')}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-base font-semibold mb-2">Toplam Tutarlar</h2>
          <div className="space-y-1 text-sm font-semibold">
            {sejour.totals && Object.entries(sejour.totals).map(([cur, amt]) => (
              <p key={cur}>{Number(amt).toLocaleString()} {cur}</p>
            ))}
          </div>
        </div>
      </div>

      {sejour.rooms?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4 overflow-x-auto">
          <h2 className="text-base font-semibold mb-2">Konaklama</h2>
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Oda</th>
                <th className="px-4 py-2 text-left">Otel</th>
                <th className="px-4 py-2 text-left">Tip</th>
                <th className="px-4 py-2 text-left">Misafir</th>
                <th className="px-4 py-2 text-left">Fiyat</th>
              </tr>
            </thead>
            <tbody>
              {sejour.rooms.map((room, i) => (
                <tr key={`room-row-${i}`} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="px-4 py-2">{room.roomNumber}</td>
                  <td className="px-4 py-2">{room.hotelName || '-'}</td>
                  <td className="px-4 py-2">{room.roomType}</td>
                  <td className="px-4 py-2">{room.guestInfo}</td>
                  <td className="px-4 py-2">{room.price} {room.currency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sejour.flights?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4 overflow-x-auto">
          <h2 className="text-base font-semibold mb-2">Uçuşlar</h2>
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Tip</th>
                <th className="px-4 py-2 text-left">Havayolu</th>
                <th className="px-4 py-2 text-left">Rota</th>
                <th className="px-4 py-2 text-left">No</th>
                <th className="px-4 py-2 text-left">Saat</th>
                <th className="px-4 py-2 text-left">Fiyat</th>
              </tr>
            </thead>
            <tbody>
              {sejour.flights.map((f, i) => (
                <tr key={`flight-row-${i}`} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="px-4 py-2">{f.type === 'departure' ? 'Gidiş' : 'Dönüş'}</td>
                  <td className="px-4 py-2">{f.airline}</td>
                  <td className="px-4 py-2">{f.route}</td>
                  <td className="px-4 py-2">{f.flightNo}</td>
                  <td className="px-4 py-2">{f.departureTime} - {f.arrivalTime}</td>
                  <td className="px-4 py-2">{f.price} {f.currency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sejour.transfers?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4 overflow-x-auto">
          <h2 className="text-base font-semibold mb-2">Transferler</h2>
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Yön</th>
                <th className="px-4 py-2 text-left">Sağlayıcı</th>
                <th className="px-4 py-2 text-left">Tip</th>
                <th className="px-4 py-2 text-left">Araç</th>
                <th className="px-4 py-2 text-left">Saat</th>
                <th className="px-4 py-2 text-left">Fiyat</th>
              </tr>
            </thead>
            <tbody>
              {sejour.transfers.map((t, i) => (
                <tr key={`transfer-row-${i}`} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="px-4 py-2">{t.direction === 'arrival' ? 'Varış' : (t.direction === 'return' ? 'Dönüş' : 'Ara')}</td>
                  <td className="px-4 py-2">{t.supplierName || '-'}</td>
                  <td className="px-4 py-2">{t.type === 'private' ? 'Özel' : 'Ekonomik'}</td>
                  <td className="px-4 py-2">{t.vehicle}</td>
                  <td className="px-4 py-2">{t.time}</td>
                  <td className="px-4 py-2">{t.price} {t.currency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sejour.notes && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-base font-semibold mb-2">Notlar</h2>
          <p className="text-sm">{sejour.notes}</p>
        </div>
      )}
    </div>
  );
}