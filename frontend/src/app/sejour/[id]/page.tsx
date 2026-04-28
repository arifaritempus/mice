'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { SejourService, SettingsService } from '@/lib/supabaseService';
import { getLogosForExcel } from '@/utils/logoUtils';
import { usePermissions, Module } from '@/lib/permissions';

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
  rooms: any[];
  flights: any[];
  transfers: any[];
  extraServices: any[];
  totals: any;
  currency: string;
  status: string;
  notes: string;
  collections: any[];
  salesInvoices: any[];
  purchaseInvoices: any[];
  created_at: string;
}

interface Room {
  id: string;
  roomNumber: string;
  hotelId: string;
  accommodationType?: string;
  roomType: string;
  guestInfo: string;
  price: number;
  currency: string;
  // Alış maliyeti için yeni alanlar
  costPrice?: number;
  costCurrency?: string;
}

interface FlightInfo {
  id: string;
  flightDate: string;
  airline: string;
  route: string;
  flightNo: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  currency: string;
  type: 'departure' | 'return';
  // Alış maliyeti için yeni alanlar
  costPrice?: number;
  costCurrency?: string;
}

interface TransferInfo {
  id: string;
  date: string;
  provider: string;
  type: 'private' | 'economic';
  vehicle: string;
  time: string;
  price: number;
  currency: string;
  direction: 'arrival' | 'return' | 'intermediate';
  // Alış maliyeti için yeni alanlar
  costPrice?: number;
  costCurrency?: string;
}

interface ExtraService {
  id: string;
  serviceType: string;
  provider: string;
  description: string;
  price: number;
  currency: string;
  // Alış maliyeti için yeni alanlar
  costPrice?: number;
  costCurrency?: string;
}

export default function SejourDetailPage() {
  const params = useParams();
  const router = useRouter();
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

  useEffect(() => {
    if (params.id) {
      loadSejourData();
    }
    loadLogos();
    loadCompanyInfo();
  }, [params.id]);

  const loadLogos = async () => {
    try {
      // Beyaz zeminli PDF icin gorunur (navy) logo seti
      const { iconLogoBase64, wordmarkLogoBase64 } = await getLogosForExcel(false);
      if (iconLogoBase64) {
        setDarkIconLogo(iconLogoBase64);
      }
      if (wordmarkLogoBase64) {
        setDarkWordmarkLogo(wordmarkLogoBase64);
      }
    } catch (error) {
      console.error('Error loading logos:', error);
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
    } catch (error) {
      console.error('Error loading company info:', error);
    }
  };

  const loadSejourData = async () => {
    try {
      setLoading(true);
      const sejourData = await SejourService.getSejourWithDetails(params.id as string);
      if (sejourData) {
        setSejour(sejourData);
      } else {
        setError('Sejour bulunamadı');
      }
    } catch (error) {
      console.error('Error loading sejour:', error);
      setError('Sejour yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const generateVoucherPDF = async () => {
    if (!voucherRef.current || !sejour) return;

    try {
      setIsGeneratingPDF(true);
      
      const voucherElement = voucherRef.current;
      
      // Her ihtimale karşı kısa bir gecikme ekle (logoların render olması için)
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
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      alert('PDF oluşturulurken hata oluştu: ' + (error as Error).message);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'KONFİRME':
        return 'bg-green-100 text-green-800';
      case 'İPTAL':
        return 'bg-red-100 text-red-800';
      case 'TEKLİF':
        return 'bg-blue-100 text-blue-800';
      case 'BEKLEMEDE':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
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
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{error || 'Sejour bulunamadı'}</span>
            </div>
          </div>
          <div className="mt-6">
            <Link
              href="/sejour"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Sejour Listesine Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
      {/* PDF Voucher - Gizli bölüm (Capture için off-screen) */}
      <div 
        ref={voucherRef} 
        className="absolute pointer-events-none" 
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
          {/* Elegant Header with Logos */}
          <div className="flex justify-between items-center border-b-[3px] border-gray-900 pb-6 mb-8">
            <div className="flex items-center">
              <img src={darkIconLogo || 'https://gzdfdnfkyedwnameflso.supabase.co/storage/v1/object/public/logos/light_icon_logo.png'} alt="Logo" className="w-16 h-auto object-contain" />
            </div>
            <div className="text-right flex flex-col items-end">
              <img src={darkWordmarkLogo || 'https://gzdfdnfkyedwnameflso.supabase.co/storage/v1/object/public/logos/light_wordmark_logo.png'} alt="Wordmark" className="h-6 w-auto object-contain mb-2" />
              <div className="text-[10px] tracking-[0.2em] text-gray-600 font-medium uppercase mt-1">OFFICIAL VOUCHER</div>
            </div>
          </div>

          {/* Voucher & Guest Profile */}
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="text-2xl font-light text-gray-900 tracking-wider mb-4 uppercase">RESERVATION DIRECTORY</h1>
              <div className="grid grid-cols-2 gap-x-12 gap-y-4">
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
            
            {/* Accommodation */}
            {sejour.rooms && sejour.rooms.length > 0 && (
              <div>
                <div className="border-b border-gray-300 pb-2 mb-4">
                  <h2 className="text-[10px] tracking-[0.3em] text-gray-900 font-bold uppercase">Accommodation Details</h2>
                </div>
                <div className="mb-3">
                  <h3 className="text-lg font-medium text-gray-900">{sejour.hotelName || sejour.rooms[0]?.hotelName || '-'}</h3>
                  {sejour.hotelAddress && <p className="text-xs text-gray-500 mt-1">{sejour.hotelAddress}</p>}
                </div>
                {sejour.rooms && sejour.rooms.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {sejour.rooms.map((room, idx) => (
                      <div key={idx} className="bg-white border border-gray-200 p-4 rounded-sm flex justify-between items-center">
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
                )}
              </div>
            )}

            {/* Flights */}
            {sejour.flights && sejour.flights.length > 0 && (
              <div>
                <div className="border-b border-gray-300 pb-2 mb-4 mt-6">
                  <h2 className="text-[10px] tracking-[0.3em] text-gray-900 font-bold uppercase">Flight Itinerary</h2>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 font-normal uppercase border-b border-gray-100">Direction</th>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 font-normal uppercase border-b border-gray-100">Airline / Flight No</th>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 font-normal uppercase border-b border-gray-100">Date</th>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 font-normal uppercase border-b border-gray-100">Route</th>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 font-normal uppercase border-b border-gray-100 text-right">PNR / Timing</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {sejour.flights.map((flight, idx) => (
                      <tr key={idx} className="border-b border-gray-50">
                        <td className="py-3 font-medium text-gray-900">{flight.type === 'departure' ? 'Gidiş' : 'Dönüş'}</td>
                        <td className="py-3 text-gray-700">{flight.airline} <span className="text-gray-600 ml-1">({flight.flightNo})</span></td>
                        <td className="py-3 text-gray-700">{flight.flightDate ? new Date(flight.flightDate).toLocaleDateString('tr-TR') : '-'}</td>
                        <td className="py-3 font-medium text-gray-900">{flight.route}</td>
                        <td className="py-3 text-right">
                          <span className="block font-semibold text-gray-900">{flight.pnr || 'N/A'}</span>
                          <span className="block text-[9px] text-gray-600 mt-0.5">{flight.departureTime} → {flight.arrivalTime}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Transfers */}
            {sejour.transfers && sejour.transfers.length > 0 && (
              <div>
                <div className="border-b border-gray-300 pb-2 mb-4 mt-6">
                  <h2 className="text-[10px] tracking-[0.3em] text-gray-900 font-bold uppercase">Transfer Services</h2>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 font-normal uppercase border-b border-gray-100">Direction</th>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 font-normal uppercase border-b border-gray-100">Vehicle Type</th>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 font-normal uppercase border-b border-gray-100">Transfer Type</th>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 font-normal uppercase border-b border-gray-100 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {sejour.transfers.map((trans, idx) => (
                      <tr key={idx} className="border-b border-gray-50">
                        <td className="py-3 font-medium text-gray-900">{trans.direction === 'arrival' ? 'Varış' : (trans.direction === 'return' ? 'Dönüş' : 'Ara')}</td>
                        <td className="py-3 text-gray-700">{trans.vehicle}</td>
                        <td className="py-3 text-gray-700">{trans.type === 'private' ? 'Özel' : 'Ekonomik'} Transfer</td>
                        <td className="py-3 font-semibold text-gray-900 text-right">{trans.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
          </div>

          {/* IMPORTANT NOTES */}
          {sejour.notes && (
            <div className="mt-12 bg-white border border-gray-200 p-4">
              <h3 className="text-[9px] tracking-widest text-gray-900 font-bold uppercase mb-2">IMPORTANT NOTES</h3>
              <p className="text-xs text-gray-600 leading-relaxed italic">{sejour.notes}</p>
            </div>
          )}

          {/* Footer (Extremely clean, like a letterhead footer) */}
          <div className="mt-16 pt-8 border-t-[1px] border-gray-200">
            <div className="flex justify-between items-end">
                <div>
                  <div className="text-sm font-semibold tracking-wide text-gray-900 mb-1">{companyInfo.company_name}</div>
                  <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-3">{companyInfo.company_address}</div>
                  <div className="flex gap-4 text-[9px] font-medium text-gray-600">
                    {companyInfo.company_phone && <span>T: {companyInfo.company_phone}</span>}
                    <span>E: {companyInfo.company_email}</span>
                    <span>W: {companyInfo.company_website}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[7px] text-gray-300 uppercase tracking-widest mb-1">Generated By System</div>
                  <div className="text-[10px] font-semibold text-gray-800 tracking-[0.2em]">{new Date().toLocaleDateString('tr-TR')}</div>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Normal Görünüm */}
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Sejour Detayı</h1>
            <p className="text-gray-600 dark:text-gray-600 mt-1 text-sm">Voucher: {sejour.voucherNumber}</p>
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={generateVoucherPDF}
              disabled={isGeneratingPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all duration-300 shadow-lg shadow-blue-500/20 active:scale-[0.98] flex items-center disabled:opacity-70 disabled:cursor-wait"
            >
              {isGeneratingPDF ? (
                <>
                  <svg className="animate-spin h-3 w-3 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  HAZIRLANIYOR...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  PDF VOUCHER İNDİR
                </>
              )}
            </button>
            {canEdit(Module.SEJOUR) && (
              <Link
                href={`/sejour/${sejour.id}/edit`}
                className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                Düzenle
              </Link>
            )}
            <Link
              href="/sejour"
              className="bg-gray-600 text-white px-3 py-1.5 rounded-md hover:bg-gray-700 transition-colors text-sm"
            >
              Geri Dön
            </Link>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(sejour.status)}`}>
          {sejour.status}
        </span>
      </div>

      {/* Main Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Temel Bilgiler</h2>
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Voucher Numarası</label>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{sejour.voucherNumber}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Müşteri Tipi</label>
              <p className="text-gray-900 dark:text-white">{sejour.customerType === 'agency' ? 'Acente' : 'Bireysel'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Müşteri Adı</label>
              <p className="text-gray-900 dark:text-white">{sejour.customerName}</p>
            </div>
            {sejour.agencyName && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Acente</label>
                <p className="text-gray-900 dark:text-white">{sejour.agencyName}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Check-in / Check-out</label>
              <p className="text-gray-900 dark:text-white">
                {new Date(sejour.checkInDate).toLocaleDateString('tr-TR')} - {new Date(sejour.checkOutDate).toLocaleDateString('tr-TR')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Toplam Tutarlar</h2>
          <div className="space-y-2">
            {sejour.totals && Object.entries(sejour.totals).map(([currency, amount]) => (
              <div key={currency}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{currency}</label>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{Number(amount).toLocaleString()} {currency}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Accommodation */}
      {sejour.rooms && sejour.rooms.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Konaklama Bilgileri</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Oda No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Otel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Oda Tipi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Misafir Bilgisi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fiyat</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sejour.rooms.map((room, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{room.roomNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {room.hotelName || room.hotel?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{room.roomType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{room.guestInfo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{room.price} {room.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Flights */}
      {sejour.flights && sejour.flights.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Uçuş Bilgileri</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tip</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Havayolu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Rota</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Uçuş No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Saatler</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fiyat</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sejour.flights.map((flight, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {flight.type === 'departure' ? 'Gidiş' : 'Dönüş'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{flight.airline}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{flight.route}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{flight.flightNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {flight.departureTime} - {flight.arrivalTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{flight.price} {flight.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transfers */}
      {sejour.transfers && sejour.transfers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Transfer Bilgileri</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Yön</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Sağlayıcı</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tip</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Araç</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Saat</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fiyat</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sejour.transfers.map((transfer, index) => (
                  <tr key={index} className="text-gray-900 dark:text-white">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {transfer.direction === 'arrival' ? 'Varış' : (transfer.direction === 'return' ? 'Dönüş' : 'Ara')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {transfer.supplierName || transfer.supplier?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {transfer.type === 'private' ? 'Özel' : 'Ekonomik'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{transfer.vehicle}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{transfer.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{transfer.price} {transfer.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Extra Services */}
      {sejour.extraServices && sejour.extraServices.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Ekstra Hizmetler</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Hizmet Tipi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Sağlayıcı</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Açıklama</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fiyat</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sejour.extraServices.map((service, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {service.serviceTypeName || service.serviceTypeObj?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {service.supplierName || service.supplier?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{service.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{service.price} {service.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notes */}
      {sejour.notes && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Notlar</h2>
          <p className="text-gray-900 dark:text-white">{sejour.notes}</p>
        </div>
      )}
    </div>
  );
} 