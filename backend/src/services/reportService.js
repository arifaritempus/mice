const ExcelJS = require('exceljs');
const { PDFDocument, rgb } = require('pdf-lib');
const { supabase } = require('../config/database');
const moment = require('moment');

class ReportService {
  constructor() {
    this.workbook = new ExcelJS.Workbook();
  }

  // Excel raporu oluştur
  async generateExcelReport(data, reportType, filename) {
    try {
      const worksheet = this.workbook.addWorksheet(reportType);
      
      switch (reportType) {
        case 'events':
          this.createEventsReport(worksheet, data);
          break;
        case 'financial':
          this.createFinancialReport(worksheet, data);
          break;
        case 'projects':
          this.createProjectsReport(worksheet, data);
          break;
        case 'customers':
          this.createCustomersReport(worksheet, data);
          break;
        default:
          throw new Error('Bilinmeyen rapor tipi');
      }

      const buffer = await this.workbook.xlsx.writeBuffer();
      return buffer;
    } catch (error) {
      console.error('❌ Excel rapor oluşturma hatası:', error);
      throw error;
    }
  }

  // Etkinlik raporu
  createEventsReport(worksheet, events) {
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 36 },
      { header: 'Başlık', key: 'title', width: 30 },
      { header: 'Konum', key: 'location', width: 25 },
      { header: 'Başlangıç', key: 'start_date', width: 20 },
      { header: 'Bitiş', key: 'end_date', width: 20 },
      { header: 'Durum', key: 'status', width: 15 },
      { header: 'Kapasite', key: 'capacity', width: 12 },
      { header: 'Kayıtlar', key: 'current_registrations', width: 12 },
      { header: 'Fiyat', key: 'price', width: 15 },
      { header: 'Oluşturulma', key: 'created_at', width: 20 }
    ];

    events.forEach(event => {
      worksheet.addRow({
        id: event.id,
        title: event.title,
        location: event.location,
        start_date: moment(event.start_date).format('DD.MM.YYYY HH:mm'),
        end_date: moment(event.end_date).format('DD.MM.YYYY HH:mm'),
        status: this.translateStatus(event.status),
        capacity: event.capacity || 0,
        current_registrations: event.current_registrations || 0,
        price: event.price ? `${event.price} ${event.currency || 'TRY'}` : 'Ücretsiz',
        created_at: moment(event.created_at).format('DD.MM.YYYY')
      });
    });

    // Başlık stilini ayarla
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  }

  // Finansal rapor
  createFinancialReport(worksheet, transactions) {
    worksheet.columns = [
      { header: 'Tarih', key: 'transaction_date', width: 15 },
      { header: 'Tip', key: 'type', width: 15 },
      { header: 'Kategori', key: 'category', width: 20 },
      { header: 'Açıklama', key: 'description', width: 40 },
      { header: 'Tutar', key: 'amount', width: 15 },
      { header: 'Para Birimi', key: 'currency', width: 12 },
      { header: 'Durum', key: 'status', width: 15 },
      { header: 'Proje', key: 'project_name', width: 25 }
    ];

    transactions.forEach(transaction => {
      worksheet.addRow({
        transaction_date: moment(transaction.transaction_date).format('DD.MM.YYYY'),
        type: this.translateTransactionType(transaction.type),
        category: transaction.category,
        description: transaction.description,
        amount: transaction.amount,
        currency: transaction.currency,
        status: this.translateStatus(transaction.status),
        project_name: transaction.project_name || '-'
      });
    });

    // Toplam satırı ekle
    const totalRow = worksheet.addRow({
      transaction_date: 'TOPLAM',
      type: '',
      category: '',
      description: '',
      amount: transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0),
      currency: 'TRY',
      status: '',
      project_name: ''
    });

    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F0F0' }
    };

    // Başlık stilini ayarla
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  }

  // Proje raporu
  createProjectsReport(worksheet, projects) {
    worksheet.columns = [
      { header: 'Proje Adı', key: 'name', width: 30 },
      { header: 'Açıklama', key: 'description', width: 40 },
      { header: 'Durum', key: 'status', width: 15 },
      { header: 'Öncelik', key: 'priority', width: 15 },
      { header: 'Başlangıç', key: 'start_date', width: 15 },
      { header: 'Bitiş', key: 'end_date', width: 15 },
      { header: 'Bütçe', key: 'budget', width: 15 },
      { header: 'Gerçek Maliyet', key: 'actual_cost', width: 15 },
      { header: 'İlerleme', key: 'progress', width: 15 }
    ];

    projects.forEach(project => {
      worksheet.addRow({
        name: project.name,
        description: project.description,
        status: this.translateStatus(project.status),
        priority: this.translatePriority(project.priority),
        start_date: project.start_date ? moment(project.start_date).format('DD.MM.YYYY') : '-',
        end_date: project.end_date ? moment(project.end_date).format('DD.MM.YYYY') : '-',
        budget: project.budget ? `${project.budget} TRY` : '-',
        actual_cost: project.actual_cost ? `${project.actual_cost} TRY` : '-',
        progress: `${project.progress || 0}%`
      });
    });

    // Başlık stilini ayarla
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  }

  // Müşteri raporu
  createCustomersReport(worksheet, customers) {
    worksheet.columns = [
      { header: 'Ad', key: 'first_name', width: 20 },
      { header: 'Soyad', key: 'last_name', width: 20 },
      { header: 'E-posta', key: 'email', width: 30 },
      { header: 'Telefon', key: 'phone', width: 15 },
      { header: 'Şirket', key: 'company_name', width: 25 },
      { header: 'Pozisyon', key: 'position', width: 20 },
      { header: 'Şehir', key: 'city', width: 15 },
      { header: 'Durum', key: 'status', width: 15 },
      { header: 'Kaynak', key: 'source', width: 20 },
      { header: 'Kayıt Tarihi', key: 'created_at', width: 15 }
    ];

    customers.forEach(customer => {
      worksheet.addRow({
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        phone: customer.phone,
        company_name: customer.company_name,
        position: customer.position,
        city: customer.city,
        status: this.translateCustomerStatus(customer.status),
        source: customer.source,
        created_at: moment(customer.created_at).format('DD.MM.YYYY')
      });
    });

    // Başlık stilini ayarla
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  }

  // PDF raporu oluştur
  async generatePDFReport(data, reportType, filename) {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 boyutu
      const { width, height } = page.getSize();

      // Başlık
      page.drawText(`EventIQ - ${this.getReportTitle(reportType)}`, {
        x: 50,
        y: height - 50,
        size: 20,
        color: rgb(0.1, 0.1, 0.1)
      });

      // Tarih
      page.drawText(`Rapor Tarihi: ${moment().format('DD.MM.YYYY HH:mm')}`, {
        x: 50,
        y: height - 80,
        size: 12,
        color: rgb(0.5, 0.5, 0.5)
      });

      // İçerik
      let yPosition = height - 120;
      data.forEach((item, index) => {
        if (yPosition < 100) {
          page = pdfDoc.addPage([595.28, 841.89]);
          yPosition = height - 50;
        }

        const text = this.formatPDFContent(item, reportType);
        page.drawText(text, {
          x: 50,
          y: yPosition,
          size: 10,
          color: rgb(0.1, 0.1, 0.1)
        });

        yPosition -= 20;
      });

      const pdfBytes = await pdfDoc.save();
      return pdfBytes;
    } catch (error) {
      console.error('❌ PDF rapor oluşturma hatası:', error);
      throw error;
    }
  }

  // Rapor başlığını getir
  getReportTitle(reportType) {
    const titles = {
      events: 'Etkinlik Raporu',
      financial: 'Finansal Rapor',
      projects: 'Proje Raporu',
      customers: 'Müşteri Raporu'
    };
    return titles[reportType] || 'Rapor';
  }

  // PDF içeriğini formatla
  formatPDFContent(item, reportType) {
    switch (reportType) {
      case 'events':
        return `${item.title} - ${item.location} (${moment(item.start_date).format('DD.MM.YYYY')})`;
      case 'financial':
        return `${item.description} - ${item.amount} ${item.currency} (${moment(item.transaction_date).format('DD.MM.YYYY')})`;
      case 'projects':
        return `${item.name} - ${item.status} - İlerleme: ${item.progress}%`;
      case 'customers':
        return `${item.first_name} ${item.last_name} - ${item.email} - ${item.status}`;
      default:
        return JSON.stringify(item);
    }
  }

  // Durum çevirisi
  translateStatus(status) {
    const statusMap = {
      draft: 'Taslak',
      published: 'Yayınlandı',
      active: 'Aktif',
      completed: 'Tamamlandı',
      cancelled: 'İptal',
      pending: 'Beklemede',
      confirmed: 'Onaylandı',
      planning: 'Planlama',
      on_hold: 'Duraklatıldı'
    };
    return statusMap[status] || status;
  }

  // İşlem tipi çevirisi
  translateTransactionType(type) {
    const typeMap = {
      income: 'Gelir',
      expense: 'Gider',
      refund: 'İade'
    };
    return typeMap[type] || type;
  }

  // Öncelik çevirisi
  translatePriority(priority) {
    const priorityMap = {
      low: 'Düşük',
      medium: 'Orta',
      high: 'Yüksek',
      urgent: 'Acil'
    };
    return priorityMap[priority] || priority;
  }

  // Müşteri durumu çevirisi
  translateCustomerStatus(status) {
    const statusMap = {
      active: 'Aktif',
      inactive: 'Pasif',
      lead: 'Potansiyel',
      prospect: 'Aday'
    };
    return statusMap[status] || status;
  }

  // Veritabanından rapor verisi getir
  async getReportData(reportType, filters = {}) {
    try {
      let query;
      
      switch (reportType) {
        case 'events':
          query = supabase
            .from('events')
            .select('*')
            .order('created_at', { ascending: false });
          break;
          
        case 'financial':
          query = supabase
            .from('financial_transactions')
            .select(`
              *,
              projects(name)
            `)
            .order('transaction_date', { ascending: false });
          break;
          
        case 'projects':
          query = supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });
          break;
          
        case 'customers':
          query = supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });
          break;
          
        default:
          throw new Error('Geçersiz rapor tipi');
      }

      // Filtreleri uygula
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data;
    } catch (error) {
      console.error('❌ Rapor verisi getirme hatası:', error);
      throw error;
    }
  }
}

const reportService = new ReportService();

const setupReportService = () => {
  console.log('📊 Rapor servisi başlatıldı');
};

module.exports = {
  reportService,
  setupReportService
}; 