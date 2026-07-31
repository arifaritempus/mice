import React, { forwardRef } from 'react';
import moment from 'moment';
import 'moment/locale/tr';

moment.locale('tr');

export interface ContractTemplateProps {
  project: any;
  agency: any;
  settings: any;
  hotelName: string;
  roomsText: string;
  paxText: string;
  hasMeeting: boolean;
  hasGala: boolean;
  hotelConcept: string;
  paymentPlans: any[];
  budgetTotal: number;
  budgetCurrency: string;
}

const ContractTemplate = forwardRef<HTMLDivElement, ContractTemplateProps>(
  ({ project, agency, settings, hotelName, roomsText, paxText, hasMeeting, hasGala, hotelConcept, paymentPlans, budgetTotal, budgetCurrency }, ref) => {
    
    const formattedBudget = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: budgetCurrency || 'EUR' }).format(budgetTotal || 0);
    const startDate = project?.start_date ? moment(project.start_date).format('DD MMMM YYYY, dddd') : '-';
    const endDate = project?.end_date ? moment(project.end_date).format('DD MMMM YYYY, dddd') : '-';
    const currentDate = moment().format('DD MMMM YYYY, dddd');
    
    const companyName = settings?.companyName || settings?.company_name || 'TEMPUS TRAVEL';
    const companyAddress = settings?.companyAddress || settings?.company_address || 'Burhan Nalbantoğlu Caddesi, No 18/1, Ortaköy, Lefkoşa';
    const companyEmail = settings?.companyEmail || settings?.company_email || 'muhasebe@tempustravel.co';
    const agencyName = agency?.companyName || agency?.company_name || agency?.name || 'MÜŞTERİ';
    const agencyContact = agency?.contactPerson || agency?.contact_person || agency?.authorized_person || agency?.name || 'Yetkili';
    const agencyAddress = agency?.address || '................';
    const lightIcon = settings?.lightIconLogo;
    const lightWordmark = settings?.lightWordmarkLogo;
    const lightMenu = settings?.lightMenuLogo;
    
    // Logic: if both are undefined, fallback to lightMenu on the left.
    const hasIconOrWordmark = lightIcon || lightWordmark;
    const senderName = project?.user?.name || project?.owner_name || companyName;

    return (
      <div 
        ref={ref} 
        style={{ 
          width: '100%', 
          maxWidth: '850px', 
          backgroundColor: 'white', 
          color: '#000', 
          padding: '40px 60px', 
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', 
          fontSize: '13px', 
          lineHeight: '1.7',
          fontWeight: 300
        }}
        className="contract-template-container"
      >
        <style dangerouslySetInnerHTML={{__html: `
          .contract-template-container strong, .contract-template-container b {
            font-weight: 500;
            color: #000;
          }
          .contract-template-container p, 
          .contract-template-container li, 
          .contract-template-container tr,
          .contract-template-container h3,
          .contract-template-container h4,
          .contract-template-container h5 {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        `}} />
        {/* COVER PAGE */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '800px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', marginBottom: '20px', borderBottom: '1px solid #000' }}>
            {/* Sol Üst */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {hasIconOrWordmark ? (
                lightIcon ? <img src={lightIcon} alt="Icon Logo" style={{ height: '50px', objectFit: 'contain' }} /> : <div style={{ fontSize: '18px', letterSpacing: '4px', fontWeight: 300, color: '#000' }}>{companyName}</div>
              ) : (
                lightMenu ? <img src={lightMenu} alt="Menu Logo" style={{ height: '40px', objectFit: 'contain' }} /> : <div style={{ fontSize: '18px', letterSpacing: '4px', fontWeight: 300, color: '#000' }}>{companyName}</div>
              )}
            </div>
            
            {/* Sağ Üst */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {hasIconOrWordmark && lightWordmark && (
                <img src={lightWordmark} alt="Wordmark Logo" style={{ height: '63px', objectFit: 'contain' }} />
              )}
            </div>
          </div>

          <table style={{ width: '100%', marginBottom: '40px', fontSize: '13px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={{ width: '150px', padding: '4px 0' }}>REFERANS</td><td>: {project?.reference || project?.reference_code || '-'}</td></tr>
              <tr><td style={{ padding: '4px 0' }}>TARİH</td><td>: {currentDate}</td></tr>
              <tr><td style={{ padding: '4px 0' }}>KİMDEN</td><td>: {senderName}</td></tr>
              <tr><td style={{ padding: '4px 0' }}>KİME</td><td>: {agencyContact}</td></tr>
              <tr><td style={{ padding: '4px 0' }}>MÜŞTERİ</td><td>: {agencyName}</td></tr>
              <tr><td style={{ padding: '4px 0' }}>KONU</td><td>: {project?.companyName || project?.company_name || agencyName}</td></tr>
            </tbody>
          </table>
          <hr style={{ border: 'none', borderBottom: '1px solid #000', marginBottom: '40px' }} />

          <p style={{ marginBottom: '20px' }}>Sayın {agencyContact},</p>
          <p style={{ marginBottom: '15px' }}>Öncelikle {companyName} olarak bizleri tercih ettiğiniz için teşekkür ederiz.<br/>
          Ekte detayları belirtilen organizasyon talebinizle ilgili kontrat bilgilerinize sunulmuştur.</p>
          <p style={{ marginBottom: '15px' }}>Kontratın, yetkili kişi tarafından imzalanmış ve kaşelenmiş halinin, en geç 3 gün içerisinde ilgili mail adreslerimize taranmış görüntüsünün ({companyEmail}) iletilmesini ve ardından ıslak imzalı halini kargo ile tarafımıza göndermenizi önemle rica ederiz.</p>
          <p style={{ marginBottom: '15px' }}>Kontratın - herhangi bir gerekçe gösterilmeksizin - size sunulduktan sonraki 3 gün içerisinde imzalanmaması halinde tarafımızca iptal edileceğini üzülerek bildirmek isteriz.</p>
          <p style={{ marginBottom: '40px' }}>{companyName}'a göstermiş olduğunuz ilgiye tekrar teşekkür eder, süregelen iş birliğimizin artarak devam etmesini dileriz.</p>
          <p>Saygılarımızla</p>
          
          <div style={{ marginTop: 'auto', paddingTop: '50px' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: '10px', textAlign: 'center', fontSize: '10px', letterSpacing: '1px' }}>
              <span style={{ fontWeight: 500 }}>{companyName}</span> {companyAddress}<br/>
              {settings?.companyPhone || '+90 (539) 112 33 33'} &nbsp; {companyEmail} {settings?.companyWebsite ? <>&nbsp; {settings.companyWebsite}</> : null}
            </div>
          </div>
        </div>

        <div className="html2pdf__page-break"></div>

        {/* PAGE 2 / CONTRACT START */}
        <h2 style={{ textAlign: 'center', fontSize: '15px', fontWeight: 400, marginBottom: '30px' }}>HİZMET SÖZLEŞMESİ</h2>
        
        <h3 style={{ fontSize: '13px', fontWeight: 500, marginTop: '20px', marginBottom: '10px' }}>1. SÖZLEŞMENİN TARAFLARI</h3>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Bir tarafta, {companyAddress} adresinde mukim {companyName} ile diğer tarafta {agencyAddress} adresinde mukim {agencyName} aşağıdaki maddeler çerçevesinde bu sözleşmeyi düzenlemiş ve karşılıklı olarak anlaşmaya varmışlardır. İşbu sözleşmede bundan böyle; {companyName}, “ACENTE” olarak, {agencyName} “MÜŞTERİ” olarak, her ikisi birlikte “TARAFLAR” olarak anılacaklardır.</p>

        <h3 style={{ fontSize: '13px', fontWeight: 500, marginTop: '20px', marginBottom: '10px' }}>2. SÖZLEŞMENİN KONUSU</h3>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>İşbu sözleşmenin konusu, bu sözleşme ve ekleri ile birlikte detayları belirlenen organizasyona ilişkin acente tarafından müşteriye verilecek hizmetler hususunda, tarafların karşılıklı hak ve yükümlülüklerinin belirlenmesini kapsamaktadır.</p>

        <h3 style={{ fontSize: '13px', fontWeight: 500, marginTop: '20px', marginBottom: '10px' }}>3. SÖZLEŞMENİN SÜRESİ</h3>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>İşbu sözleşmenin süresi, sözleşmenin imzaya alındığı tarih itibariyle başlar ve yine ayni sözleşmede belirlenen ödemeler ile birlikte varsa ilgili sözleşmede konu olan işten kaynaklı sonradan oluşacak yeni alacaklar tahsil edildikten sonra tamamlanır.</p>

        <h3 style={{ fontSize: '13px', fontWeight: 500, marginTop: '20px', marginBottom: '10px' }}>4. REZERVASYON KOŞULLARI</h3>
        
        <h4 style={{ fontSize: '13px', fontWeight: 500, marginTop: '10px', marginBottom: '10px' }}>4.1. Organizasyon Detayları</h4>
        <table style={{ width: '100%', marginBottom: '20px', fontSize: '13px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr><td style={{ width: '150px', padding: '3px 0' }}>Etkinlik Adı</td><td>: {project?.companyName || project?.company_name || agencyName}</td></tr>
            <tr><td style={{ padding: '3px 0' }}>Otel Adı</td><td>: {hotelName}</td></tr>
            <tr><td style={{ padding: '3px 0' }}>Giriş Tarihi</td><td>: {startDate}</td></tr>
            <tr><td style={{ padding: '3px 0' }}>Çıkış Tarihi</td><td>: {endDate}</td></tr>
            <tr><td style={{ padding: '3px 0' }}>Oda / Kişi</td><td>: {project?.room_pax || project?.room_info || `${project?.totalRooms || project?.total_rooms || project?.rooms || roomsText} | ${project?.totalPax || project?.total_pax || project?.pax || paxText}`}</td></tr>
            <tr><td style={{ padding: '3px 0' }}>Konsept</td><td>: {hotelConcept !== '-' ? hotelConcept : (project?.concept || 'ULTRA HER ŞEY DAHİL')}</td></tr>
            {hasMeeting && <tr><td style={{ padding: '3px 0' }}>Toplantı</td><td>: VAR</td></tr>}
            {hasGala && <tr><td style={{ padding: '3px 0' }}>Gala</td><td>: VAR</td></tr>}
          </tbody>
        </table>
        
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Tüm konaklamalar giriş günü öğle yemeği ile başlar ve çıkış günü sabah kahvaltısı ile son bulur.</p>

        <h4 style={{ fontSize: '13px', fontWeight: 500, marginTop: '10px', marginBottom: '10px' }}>4.2. Garanti Oda & Kişi Sayısı</h4>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Madde 4.1. ile belirlenen detaylarda MÜŞTERİ adına otelde bloke edilen tüm odalar dolu - boş garantilidir. MÜŞTERİ, işbu sözleşme ile garanti ettiği tüm oda ve gecelerin ücretlerini ödemekle yükümlü olduğunu peşinen kabul eder. Garanti edilen odalar haricinde MÜŞTERİ ve 3.parti tedarikçileri için otelde ve veya yan otelde herhangi bir oda tutulmamaktadır.</p>

        <h4 style={{ fontSize: '13px', fontWeight: 500, marginTop: '10px', marginBottom: '10px' }}>4.3. Oda Blokajları | Giriş & Çıkış Saatleri</h4>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Otel konaklama odalarının yerini | konumunu | tipini garanti etmez ve aksi belirtilmedikçe odalar “Herhangi Bir Oda Tipi” ile blokajlanır. Odalara girişler en erken saat 14:00 ve odalardan çıkışlar en geç saat 12:00’da gerçekleştirilmektedir.</p>

        <h4 style={{ fontSize: '13px', fontWeight: 500, marginTop: '10px', marginBottom: '10px' }}>4.4. Oda Dağılımları</h4>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Oda dağılımlarında yukarıda belirtilen rezervasyon listeleri dikkate alınacak olup, Müşteri’nin organizasyon başlangıcında misafirlerin otele giriş yapacağı gün oda dağılım listesi üzerinde yapacağı değişiklik taleplerine istinaden ortaya çıkabilecek hatalardan veya yaşanacak aksaklıklardan Tempus Travel ve / veya Otel sorumlu tutulamaz.</p>
        
        <h4 style={{ fontSize: '13px', fontWeight: 500, marginTop: '10px', marginBottom: '10px' }}>4.5. Yiyecek & İçecek</h4>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Giriş günü alınacak sabah kahvaltısı ve çıkış günü alınacak öğle ve akşam yemekleri her durumda ekstra olarak ücretlendirilir.</p>

        <h4 style={{ fontSize: '13px', fontWeight: 500, marginTop: '10px', marginBottom: '10px' }}>4.6. Rezervasyon Listeleri</h4>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Rezervasyonlara ait konaklama, uçak bileti, transfer listeleri müşteri tarafından acenteye otele giriş tarihinden en az 7 gün önce iletilecektir. Listelerde, rezervasyon detayları (geliş ve dönüş tarihleri, geliş ve dönüş uçuş ve transfer bilgileri) ile birlikte misafirlerin ad, soyad, kimlik numarası veya pasaport numarası yer almalıdır. Tüm listelerin oluşturulması ve zamanında acenteye iletilmesi müşteri sorumluluğundadır.</p>

        <h3 style={{ fontSize: '13px', fontWeight: 500, marginTop: '20px', marginBottom: '10px' }}>5. MALİ ŞARTLAR</h3>
        
        <h4 style={{ fontSize: '13px', fontWeight: 500, marginTop: '10px', marginBottom: '10px' }}>5.1. Ücretlendirme</h4>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>TARAFLAR, bu anlaşma ve anlaşmanın vazgeçilmez bir parçası kabul edilen EK-2 : Bütçe üzerinde görülen hizmetler ve bu hizmetlere ilişkin belirlenen ücretler konusunda anlaşmaya varmışlardır. Bu anlaşmaya göre müşteri, işten kaynaklanabilecek yeni alacaklar ile birlikte ücretleri acenteye ödemeyi yükümlenmiştir.</p>

        <h4 style={{ fontSize: '13px', fontWeight: 500, marginTop: '10px', marginBottom: '10px' }}>5.2. Ana Hesap</h4>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>EK-2 : Bütçeye göre organizasyona ait toplam bütçe {formattedBudget}'dir, bu bütçe sadece EK-2 : Bütçe içinde yer alan hizmetleri kapsamaktadır. Bütçede yer almayan ancak daha sonra eklenecek ek hizmetlerden ve/veya mevcut hizmetlerde yaşanacak sayısal artışlardan doğacak ek bedeller için ACENTE’nin gerekli görmesi halinde yeni ödeme planı yapılacaktır.</p>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Garanti edilen oda & kişi sayılarının tamamlanamaması halinde; sözleşmenin iptal şartları baz alınarak eksik kalan oda x geceleme miktarı sözleşme fiyatları ile ana hesaba eklenerek mutabakat yapılacaktır. Garanti edilen oda & kişi sayısının aşılması halinde güncel (organizasyon içinde gerçekleşen) sayılar ile mutabakat düzenlenecektir.</p>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>İşbu sözleşmede MÜŞTERİ tarafından garanti edilen oda & kişi sayıları için ACENTE tarafından garanti edilen ücretler geçerli olacaktır. ACENTE bu ücretlerde sözleşmede garanti edilen kişi sayısı tamamlanana kadar herhangi bir değişiklik yapamaz.</p>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Yukarıda maddeler halinde belirtilmiş olan ödeme planına uyulmaması ve / veya ödemelerde gecikme olması halinde iş bu sözleşme hükümleri geçersiz sayılarak, Organizasyon ve bağlı tüm hizmetlerin {companyName} tarafından tek taraflı iptali gerçekleştirilir.</p>

        <h4 style={{ fontSize: '13px', fontWeight: 500, marginTop: '10px', marginBottom: '10px' }}>5.3. Ödeme Planı</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: 'none' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <th style={{ padding: '8px 4px', textAlign: 'left', fontWeight: 500 }}>Ödemeler</th>
              <th style={{ padding: '8px 4px', textAlign: 'left', fontWeight: 500 }}>Tarihler</th>
              <th style={{ padding: '8px 4px', textAlign: 'left', fontWeight: 500 }}>Tutar</th>
              <th style={{ padding: '8px 4px', textAlign: 'left', fontWeight: 500 }}>Yöntem</th>
              <th style={{ padding: '8px 4px', textAlign: 'left', fontWeight: 500 }}>Not</th>
            </tr>
          </thead>
          <tbody>
            {paymentPlans && paymentPlans.length > 0 ? paymentPlans.map((plan: any, idx: number) => {
               const planDate = plan.date || plan.collection_date || plan.paymentDate || '-';
               const planAmount = plan.amount ? `${plan.amount} ${budgetCurrency}` : '-';
               const methodStr = plan.collectionType || plan.collection_type || plan.payment_method || plan.method || 'Banka Transferi';
               
               return (
                 <tr key={idx} style={{ borderBottom: '1px solid #f9f9f9' }}>
                   <td style={{ padding: '8px 4px' }}>{plan.name || plan.description || `${idx + 1}. Taksit`}</td>
                   <td style={{ padding: '8px 4px' }}>{planDate}</td>
                   <td style={{ padding: '8px 4px' }}>{planAmount}</td>
                   <td style={{ padding: '8px 4px' }}>{methodStr}</td>
                   <td style={{ padding: '8px 4px' }}>{plan.notes || plan.note || (idx === 0 ? 'Geri Ödenmez Tutar' : '')}</td>
                 </tr>
               );
            }) : (
              <tr>
                <td colSpan={5} style={{ padding: '8px 4px', textAlign: 'center', color: '#888' }}>
                  Ödeme planı bulunmamaktadır.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <h4 style={{ fontSize: '13px', fontWeight: 500, marginTop: '10px', marginBottom: '10px' }}>5.4. Ödeme Koşulları</h4>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>MÜŞTERİ, ödemelerini banka havalesi veya kredi kartı ile yapabilir.<br/>
        MÜŞTERİ, ödemelerini kredi kartı ile yaparsa %4,5 banka komisyonu ödemeyi kabul eder.<br/>
        MÜŞTERİ, ödemelerini geciktirirse eksik ödemeye aylık %5 vade farkı ödemeyi kabul eder.<br/>
        MÜŞTERİ, ödemelerini ilgili tarihte TL olarak yapması durumunda çekin bankadan hesaba geçtiği gün itibarı ile sözleşmede belirtilen {budgetCurrency} tutar (kambiyo vergiside eklenerek) alımı yapılır arada oluşan fark + , - olarak iade veya tahsilatı şirketler tarafından bir sonraki iş günü ödemeleri gerçekleştirilir.</p>

        <h4 style={{ fontSize: '13px', fontWeight: 500, marginTop: '10px', marginBottom: '10px' }}>5.5. Para Birimi</h4>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>İş bu sözleşme kapsamında kullanılacak para birimi {budgetCurrency}'dur. MÜŞTERİ tüm ödemeleri {budgetCurrency} olarak yapacağını peşinen taahhüt etmiştir ancak ödemelerin TL ile yapılması halinde, ödeme yapılan güne ait TCMB {budgetCurrency} Döviz Efektif Satış kuru baz alınacaktır.</p>

        {settings?.bankAccounts && settings.bankAccounts.length > 0 && (
          <>
            <h4 style={{ fontSize: '13px', fontWeight: 500, marginTop: '10px', marginBottom: '10px' }}>5.6. Banka Hesapları</h4>
            <div style={{ marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #ccc' }}>
                    <th style={{ padding: '8px 4px', textAlign: 'left', fontWeight: 500 }}>FİRMA UNVANI</th>
                    <th style={{ padding: '8px 4px', textAlign: 'left', fontWeight: 500 }}>BANKA ADI</th>
                    <th style={{ padding: '8px 4px', textAlign: 'left', fontWeight: 500 }}>DÖVİZ</th>
                    <th style={{ padding: '8px 4px', textAlign: 'left', fontWeight: 500 }}>IBAN</th>
                    <th style={{ padding: '8px 4px', textAlign: 'left', fontWeight: 500 }}>SWIFT KODU</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.bankAccounts.map((acc: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px 4px' }}>{acc.companyTitle}</td>
                      <td style={{ padding: '8px 4px' }}>{acc.bankName}</td>
                      <td style={{ padding: '8px 4px' }}>{acc.currency}</td>
                      <td style={{ padding: '8px 4px' }}>{acc.iban}</td>
                      <td style={{ padding: '8px 4px' }}>{acc.swiftCode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <h3 style={{ fontSize: '13px', fontWeight: 500, marginTop: '20px', marginBottom: '10px' }}>6. DİĞER HALLER</h3>
        <h4 style={{ fontSize: '13px', fontWeight: 500, marginTop: '10px', marginBottom: '10px' }}>6.1. Rezervasyonların İptali (Konaklama Rezervasyonları)</h4>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Sözleşmeyle birlikte geçerli olacak iptal / ceza şartları aşağıdaki gibi karara bağlanmıştır.<br/>
        MÜŞTERİ aşağıda belirtilen iptal haklarından bir (1) tanesini yalnız bir (1) kere kullanabilir. Bu maddede aşağıda belirtilen iptal haklarından birini kullanan müşteri, diğerlerinden vazgeçmiş sayılır.</p>
        
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}><strong>Geliş tarihine 120 gün ile 90 kala</strong>, sözleşmenin 5.3. maddesinde belirtilen “Geri Ödenmez Tutar” hariç olmak üzere geriye kalan tüm otel rezervasyonları no show bedeli olmaksızın iptal edilebilir.</p>
        
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}><strong>Geliş tarihine 90 gün ile 60 gün kala</strong>, sözleşmenin 5.3. maddesinde belirtilen “Geri Ödenmez Tutar” hariç olmak üzere oda rezervasyonlarının %20’si No Show bedeli olmaksızın iptal edilebilir. %20'den fazla iptalde, iptal edilen her odanın tüm geceleri No Show bedeli olarak MÜŞTERİ ye fatura edilecektir.</p>
        
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}><strong>Geliş tarihine 60 gün ile 30 gün kala</strong>, sözleşmenin 5.3 maddesinde belirtilen “Geri Ödenmez Tutar” hariç olmak üzere oda rezervasyonlarının %10’u No Show bedeli olmaksızın iptal edilebilir. %10'dan fazla iptalde, iptal edilen her odanın tüm geceleri no Show bedeli olarak MÜŞTERİ ye fatura edilecektir.</p>
        
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}><strong>Geliş tarihine 30 günden az kalınca</strong>, iptal edilen her odanın tüm geceleri No Show bedeli olarak MÜŞTERİ’ye fatura edilecektir. Rezervasyon giriş tarihinden sonra giren ve | veya çıkış tarihinden önce çıkan her odanın tüm eksik geceleri no show bedeli olarak MÜŞTERİ’ye fatura edilecektir. MÜŞTERİ, iptal ücretinin fahiş olmadığını peşinen kabul ve beyan eder.</p>

        <h4 style={{ fontSize: '13px', fontWeight: 500, marginTop: '10px', marginBottom: '10px' }}>6.2. Mücbir Sebepler</h4>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Tarafların kendi kontrollerinde olmayan ve kendi hatalarından kaynaklanmayan şartlardan savaş, olağanüstü hal, seferberlik, ayaklanma, sivil kargaşa, grev, lokavt, salgın hastalık, hükümetlerin, yerel veya ulusal idarelerin, maliye ve diğer kazai makamların kararları, ülkelerin ulusal otoritelerinin yurttan çıkışta veya girişte engelleyici bir karar alması, yangın, deprem, infilak veya başka bir sebepten ötürü ayrılan odaların hasar görmesi veya tahrip olması gibi tarafların kontrolü haricinde zuhur eden haller de iki taraf için mücbir sebep sayılır.</p>
        
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>TARAFLAR, mücbir sebeplerden dolayı ortaya çıkan gecikmelerden, hizmetin ifa edilememesinden veya gecikmeli olarak ifa edilmesinden veya yine mücbir sebeplerden dolayı bu sözleşme ile ilgili herhangi bir yükümlülüğün veya taahhüdün yerine getirilememesinden veya gecikmeli olarak yerine getirilmesi gibi hallerden doğan zarar, kayıp veya masraflardan sorumlu değillerdir.</p>
        
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>MÜŞTERİ ve ACENTE müştereken ortaya çıkan mücbir sebebin etkinlik üzerindeki etkilerini tayin edecek, hasıl olan kayıp ve maliyet artışlarının TARAFLARIN ortak çıkarları doğrultusunda tamamen ortadan kaldırılması, eğer bu mümkün olamıyorsa en makul şekilde yeniden ayarlanması için karşılıklı iyiniyet çerçevesinde azami gayreti sarf edeceklerdir.</p>
        
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Her bir taraf, mücbir sebep nedeniyle gecikme veya ifa edememeyi öne sürecek taraf, mücbir sebebin oluşumundan itibaren 30 gün içinde diğer tarafa yazılı bildirimde bulunacak ve bu durumu resmi belgeler ile tevsik edecektir.</p>
        
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Müşteri'nin veya adına hareket eden yetkililerinin, iş bu sözleşme veya eklerini ve / veya detaylarını kısmen veya tamamen üçüncü şahıslara veya kurumlara ibraz etmesi kesinlikle yasaktır.</p>

        <h3 style={{ fontSize: '13px', fontWeight: 500, marginTop: '20px', marginBottom: '10px' }}>7. FESİH İHBAR</h3>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Taraflardan birinin sözleşme konusu mükellefiyetlerini yerine getirmemesi halinde, diğer taraf, noterden göndereceği ihtarname ile mükellefiyetini, ihtarnamenin kendisine tebliğinden itibaren, ihtarnamede durumun özelliğine uygun olarak tanıyacağı makul süre içinde yerine getirmesini, aksi halde sözleşmenin tek taraflı olarak feshedileceğini karşı tarafa bildirir. Bu süre içinde ihtar edilen taraf mükellefiyetlerini yerine getirmez ise, sözleşme bildirilen bu sürenin sonunda kendiliğinden feshedilmiş kabul edilir.</p>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Taraflara ait tüzel kişiliği süresinin dolması, feshi veya hakkında tasfiye kararı alınması, konkordatoya başvurması, iflasının istenmesi, aleyhine yapılan icra takibinin yapılması veya icranın semeresiz kalması, aleyhine aciz vesikası alınması, başka bir şirket ile birleşmesi, malvarlığının devri üzerine taraflar dilerse söz konusu olayları ıttıla tarihinden itibaren derhal sözleşmeyi tek taraflı feshe yetkilidir. Bu takdirde, teminatlar irat kaydedilir ve ayrıca acentenin uğradığı menfi ve müspet zararlar müşteri tarafından tazmin edilir.</p>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Sözleşme'ye konu hizmetin ifası sırasında ve/veya sonrasında; Müşteri, Müşteri'nin çalışanları, katılımcıları Otel / Tesis malına, ekipmanlarına, sistemlerine vs. verilecek maddi – manevi her türlü doğrudan / dolaylı zarardan Otel ve TEMPUS TRAVEL'a karşı Müşteri müteselsil olarak ve doğrudan sorumludur.</p>

        <h3 style={{ fontSize: '13px', fontWeight: 500, marginTop: '20px', marginBottom: '10px' }}>8. SÖZLEŞMENİN DEVREDİLMEZLİĞİ</h3>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Müşteri, acentenin önceden yazılı iznini almaksızın bu sözleşmedeki yükümlülüklerini gerçek ve tüzel üçüncü bir şahsa devredemeyecek, bir başka gerçek ve tüzel üçüncü bir şahsa bir sebeple bu sözleşmede ve dolayısıyla ilgili yasal hükümlerde kayıtlı sorumluluklarına ortak edemeyecek ve acentedeki hak ve alacaklarını başkasına devir ve temlik edemeyecektir.</p>

        <h3 style={{ fontSize: '13px', fontWeight: 500, marginTop: '20px', marginBottom: '10px' }}>9. GİZLİLİK ve KİŞİSEL VERİLERİN KORUNMASI</h3>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Taraflar, işbu Sözleşmenin ifası dolayısıyla öğrendiği, gerek karşı taraflara ve üçüncü kişilere ait kendisine tevdii edilen işlerle ilgili her türlü bilgi, görsel, standart ve uygulama, yazılım, program, eğitim, doküman, yazışma ve üçüncü kişilerce yasal yollarla elde edilmiş bilgiler dışındaki tüm (gerek yazılı ve gerekse elektronik ortamda sağlanmış olsun gerekse doğrudan ya da dolaylı yoldan edinilmiş olsun) bilgi ve materyalleri “Ticari Sır” ve “Gizli Bilgi” olarak kabul etmeyi ve bu bilgileri, herhangi bir süre ile sınırlı olmaksızın diğer Tarafın yazılı izni olmadan, üçüncü kişilere vermemeyi, açıklamamayı, kamuya duyurmamayı, değiştirmemeyi, diğer Tarafın yetkilendirdiği kişilerin erişimlerini engellememeyi ve bu şekilde sonuçlanacak sair davranışlardan kaçınmayı taahhüt eder. Taraflar kendi çalışanları ve hizmet ifasında kullandığı kişilerin de gizlilik hükümlerine tabi olduğunu işbu gizlilik taahhüdünün gerek kendileri gerek bu kişiler tarafından ihlali durumunda, ihlale uğrayan Tarafın uğramış olduğu doğrudan zarar ve ziyanını hiçbir itirazda bulunmaksızın müşterek ve müteselsil sorumlu sıfatı ile ilk talepte ve derhal nakden ve defaten ödemeyi kabul ve taahhüt eder.</p>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Sözleşme gereği kendisine Gizli Bilgiler açıklanan Taraf, elde etmiş olduğu bu bilgileri sadece Sözleşme kapsamında bulunan iş ile ilgili konularda kullanacaktır ve bu bilgileri sadece iş için gereken zaman ve nispette çoğaltacaktır. Bu bilgileri, sadece işin yürütülmesi için bilmesi gereken personel ve bağlı ve yan kuruluş, acente, taşeron gibi iş ile ilgili firmaların personellerine işin ifası için gereken nispette verecek ve kendilerine Gizli Bilgi verilen kişiler, Sözleşme kapsamında belirtilen gizlilik yükümlülüğü konusunda haberdar edilecektir. Bu kişilerin ihlallerinde ilgili Taraf ihlalden dolayı oluşan zarardan sorumlu olup karşı Tarafın ilk talebi üzerine söz konusu zararı derhal nakden ve defaten tazmin edecektir. Bilgilerin verildiği Taraf, bu bilgileri diğer Tarafın yazılı onayı olmadan, yasalar gereği ilgili mercilere açıklamak yükümlülüğü hariç, kati surette üçüncü taraflara vermeyecektir.</p>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Taraflar, işbu Sözleşme konusu faaliyetlerin yerine getirilmesi sırasında kullandığı diğer Tarafa ait ister elektronik ortamda isterse yazılı belge halinde temin edilmiş olsun her türlü bilgi varlıklarını Sözleşmenin herhangi bir sebeple sona ermesi halinde, diğer tarafın yazılı talebi doğrultusunda en geç 3 (üç) iş günü içerisinde imha veya iade edecektir.</p>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Resmi ve idari kurumlar tarafından talep edilen ve temini zorunlu bilgiler ile daha önce kamuya mal olmuş bilgiler yukarıdaki taahhüdün istisnalarını teşkil eder.</p>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>İşbu Sözleşmenin herhangi bir nedenle sona ermesi hali, gizlilik hak ve yükümlülüklerin sona ermesine sebep olmaz, bu hak ve yükümlülükler Sözleşme 'den bağımsız taahhütler olarak ve feriliklerini kaybederek Taraflar arasında yürürlüğünü devam ettirecektir.</p>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>İşbu maddedeki “Kişisel Veri”, “Özel Nitelikli Kişisel Veri”, “Kişisel Verilerin İşlenmesi”, “Veri İşleyen”, “Veri Sorumlusu”, “İlgili Kişi”, “Teknik ve İdari Tedbir” “Kişisel Verileri Koruma Kurumu” terimleri 6698 sayılı Kişisel Verilerin Korunması Kanunu (Bundan sonra “KVKK” olarak anılacaktır.), ikincil mevzuatı ve Kişisel Verileri Koruma Kurulu (Bundan sonra “Kurul” olarak anılacaktır.) kararlarındaki tanımlar kapsamında kullanılmaktadır.</p>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>İşbu Sözleşme kapsamında Taraflar yapılan işleme göre Veri İşleyen sıfatına veya Veri Sorumlusu sıfatına haiz olabilirler.</p>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Kişisel veriler, KVKK ve ilgili diğer mevzuata uygun olarak işlenmiş ve aktarılmış olacaktır. Taraflar, işbu sözleşmenin akdi yahut ifası kapsamında, yazılı, sözlü, fiziki, elektronik veyahut SİSTEM erişimi sağlamak suretiyle olarak paylaşmış oldukları her türlü kişisel verinin, KVKK’ya, ikincil mevzuatına, Kurul düzenlemeleri ile kararlarına ve sair mevzuata uygun şekilde elde edildiğini, işlendiğini ve aktarıldığını kabul, beyan ve taahhüt eder.</p>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Taraflar, taraflar arasındaki tüm ticari ilişkilere yönelik yürürlükteki sözleşme veya sözleşmelerin kapsamındaki süreçler sırasında, ilgili sözleşme veya sözleşmelerin ifası için zorunlu olan ve tarafların birbirlerine kişisel veri aktarımı gerçekleştirdiği hallerde, kişisel verilerin hukuka aykırı olarak işlenmesini önlemek, kişisel verilere hukuka aykırı erişilmesini önlemek ve kişisel verilerin muhafazasını sağlamak amacıyla kişisel verinin niteliğine göre uygun güvenlik düzeyini temin etmeye yönelik gerekli her türlü teknik ve idari tedbirleri almakla yükümlüdür.</p>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>İşbu sözleşmenin ifasına dair süreçler sırasında, Veri Sorumlusu taraf, kişisel verileri diğer taraf ile paylaştığı hallerde, ilgili kişisel verilerin diğer tarafa aktarılmasına ve diğer tarafça işlenmesine ilişkin olarak, ilgili kişilere (veri sahiplerine) yönelik KVKK ve yürürlükte bulunan her türlü sair mevzuat kapsamında aydınlatma yükümlülüğünü yerine getirdiğini ve ilgili kişilerin (veri sahiplerinin) açık rızalarının alınmasının gerektiği hallerde, ilgili kişilerin (veri sahiplerinin) bahsi geçen mevzuata uygun içerik ve formatta rızalarını aldığını kabul, beyan ve taahhüt eder.</p>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Taraflar, işbu Sözleşme kapsamında kendilerine iletilen her türlü kişisel veriyi KVKK ve sair mevzuat kapsamında tamamen gizli tutacaklarını, kişisel verileri yalnızca işbu sözleşme konusu hizmetlerin yerine getirilebilmesi bakımından zorunlu olduğu kadarıyla işleyeceklerini kabul, beyan ve taahhüt eder. Veri Sorumlusu olan taraf; Veri İşleyen tarafa hizmet ile sınırlı, bağlantılı ve ölçülü olmayan kişisel verileri aktarmayacağını; aksi halde sorumluluğun kendisine ait olduğunu peşinen kabul, beyan ve taahhüt eder.</p>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>İşbu sözleşmenin ifası kapsamında kişisel verilere erişen ve kişisel verileri elinde bulunduran Taraf, bu verilerin hukuka aykırı olarak işlenmesini ve bu verilere hukuka aykırı erişilmesini önlemek ve verilerin muhafazasını sağlamak amacıyla, gerekli her türlü teknik ve idari tedbirleri almak zorundadır. Veri sorumlusunun talimatları sebebiyle bir ihlal oluşması halinde, sorumluluk talimat veren Veri Sorumlusuna ait olacaktır.</p>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Taraflar, kişisel verileri yalnızca işbu sözleşme konusu hizmetlerin yerine getirilebilmesi bakımından zorunlu olduğu kadarıyla işleyeceklerini, çalışanlarının verilere erişim ve verileri işleme yetkilerini KVKK’ya uygun olarak sadece işbu sözleşme konusu hizmetin yerine getirilmesi için gerektiği ölçüde tanımlayacaklarını; çalışanlarının bu erişim yetkilerini kullanırken eriştikleri bilgileri ve erişim için kullandıkları şifreleri/metotları hiç kimse ile paylaşmamaları için gerekli tüm tedbirleri alıp çalışanlarını bu konuda bilgilendireceklerini; çalışanlarını KVKK kapsamındaki yükümlülükleri hakkında bilgilendireceklerini ve çalışanlarına bu kapsamda düzenli eğitim vereceklerini kabul, beyan ve taahhüt eder.</p>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Taraflar, ilgili kişisel verilerin işlenmesini gerektiren sebeplerin ortadan kalkmasını takiben, kanunlarda belirtilen yükümlülükler ve istisnai haller saklı kalmak kaydıyla, ilgili kişisel verileri KVKK ve sair mevzuat hükümleri doğrultusunda derhal sileceklerini, yok edeceklerini veya anonim hale getireceklerini kabul, beyan ve taahhüt eder.</p>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Taraflar, ilgili kişiler tarafından 6698 Sayılı Kanun’un 11’inci maddesine dayandırılan söz konusu ticari iş ilişkisi süresince işlenen her tür veri hakkında yapılan başvuruların sonuçlandırılmasında birbirlerine yardım sağlamayı taahhüt ederler. İlgili kişinin Veri Sorumlusu olan taraftan, ilgili yasal mevzuat kapsamındaki haklarıyla ilgili bir talepte bulunması halinde, ilgili taraf söz konusu talebe ilişkin olarak en kısa sürede (en geç 3 iş günü içerisinde) diğer tarafa yazılı bildirimde bulunacak ve gerekli aksiyonları derhal alacaktır.</p>

        <h3 style={{ fontSize: '13px', fontWeight: 500, marginTop: '20px', marginBottom: '10px' }}>10. TEBLİGATLAR</h3>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Tarafların birbirlerine yapacakları tebligatlarda yukarıda belirtilen adresler geçerli olacak, adres değişiklikleri diğer tarafa yazılı olarak bildirilmedikçe tarafların birbirine yapacakları her türlü tebligat bu sözleşmede yazılı adreslerine yapılacak ve tebliğ edilmese dahi geçerli tebliğ edilmiş sayılacaktır.</p>

        <h3 style={{ fontSize: '13px', fontWeight: 500, marginTop: '20px', marginBottom: '10px' }}>11. DAMGA VERGİSİ</h3>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Bu sözleşmeden ve uygulanmasından doğacak damga vergisi MÜŞTERİ tarafından ödenecektir. Sözleşmenin yürürlükte kaldığı süre içinde herhangi bir kanun ve mevzuat değişikliği sonucunda ortaya çıkabilecek vergi ve resimlerden doğan farklar ilgili tarafça (Muhatabı tarafından) karşılanacaktır.</p>

        <h3 style={{ fontSize: '13px', fontWeight: 500, marginTop: '20px', marginBottom: '10px' }}>12. İHTİLAFLARIN HALİ</h3>
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>Bu sözleşmeden doğan tüm ihtilaflar hususunda öncelikle karşılıklı anlayış ve ticari teamüllere göre çözülmesi için azami çaba sarf edilecektir. Aksi halde Kuzey Kıbrıs Türk Cumhuriyeti Mahkeme ve İcra Müdürlükleri yetkili olacaktır.</p>
        
        <p style={{ textAlign: 'justify', marginBottom: '15px' }}>İşbu sözleşme on iki (12) maddeden ve ön kapak yazısı dahil sekiz (8) sayfadan ve iki (2) ekten ibaret olup taraflarca {currentDate} tarihinde, sözleşmenin aslı {companyName} 'de kalacak şekilde bir (1) nüsha olarak imzalanmış, bu tarih veya en geç sözleşmede belirlenen ilk ödeme tarihi itibariyle ödemenin yapılarak ödeme kaydının muhasebeleşmesini takiben yürürlüğe girecektir.</p>
        <p style={{ textAlign: 'justify', marginBottom: '30px' }}>Sözleşmede belirtilen tarihte anlaşılan hususlarda ödemenin yapılmaması halinde ACENTE sözleşmeyi tek taraflı olarak fesih etme hakkına sahiptir.</p>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px', marginBottom: '50px' }}>
          <div style={{ textAlign: 'center', width: '45%' }}>
            <p style={{ fontWeight: 500, marginBottom: '5px' }}>{companyName}</p>
            <p>Adına</p>
          </div>
          <div style={{ textAlign: 'center', width: '45%' }}>
            <p style={{ fontWeight: 500, marginBottom: '5px' }}>{agencyName}</p>
            <p>Adına</p>
          </div>
        </div>

        <h3 style={{ fontSize: '13px', fontWeight: 500, marginTop: '40px', marginBottom: '10px' }}>EKLER</h3>
        <p style={{ marginBottom: '15px' }}>Ekler iş bu sözleşmenin ayrılmaz ve vazgeçilmez bir parçasıdır.</p>
        <p style={{ marginBottom: '5px' }}>EK-1 : Otel Fact Sheet (Konsept)</p>
        <p>EK-2 : Bütçe</p>
        
      </div>
    );
  }
);

ContractTemplate.displayName = 'ContractTemplate';

export default ContractTemplate;
