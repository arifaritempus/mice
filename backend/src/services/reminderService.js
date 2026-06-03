const { supabaseAdmin } = require('../config/database');
const { emailService } = require('./emailService');
const moment = require('moment');
const logger = require('../utils/logger')('ReminderService');

class ReminderService {
  /**
   * Ayarlardan admin e-posta adresini getirir.
   */
  async getAdminEmail() {
    try {
      const { data, error } = await supabaseAdmin
        .from('settings')
        .select('value')
        .eq('key', 'general_settings')
        .single();

      if (error || !data) return process.env.ADMIN_EMAIL || 'mice@tempustravel.co';
      
      const settings = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
      return settings.mail_reply_to || settings.company_email || process.env.ADMIN_EMAIL || 'mice@tempustravel.co';
    } catch (error) {
      logger.error('getAdminEmail hatası:', error);
      return process.env.ADMIN_EMAIL || 'mice@tempustravel.co';
    }
  }

  /**
   * Bildirim oluşturur (Veritabanına kaydeder)
   */
  async createNotification(userIdOrEmail, title, message, type = 'info', relatedType = null, relatedId = null) {
    try {
      let targetId = userIdOrEmail;
      
      if (!targetId || (typeof targetId === 'string' && targetId.includes('@'))) {
        const email = targetId;
        const { data: userByEmail } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', email)
          .single();
        
        if (userByEmail) {
          targetId = userByEmail.id;
        } else {
          const { data: firstAdmin } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('role', 'super_admin')
            .limit(1)
            .single();
          
          if (firstAdmin) {
            targetId = firstAdmin.id;
          } else {
            logger.error(`❌ Bildirim için hedef kullanıcı bulunamadı: ${email}`);
            return;
          }
        }
      }

      const { error } = await supabaseAdmin
        .from('notifications')
        .insert([{
          user_id: targetId,
          title: title,
          message: message,
          type: type,
          is_read: false,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        logger.error('Bildirim oluşturma hatası:', error);
      } else {
        logger.info(`🔔 Bildirim oluşturuldu: ${title}`);
      }
    } catch (error) {
      logger.error('createNotification hatası:', error);
    }
  }

  /**
   * Tüm hatırlatıcıları kontrol eder
   */
  async checkAllReminders() {
    logger.info('⏰ Hatırlatıcılar kontrol ediliyor...');
    try {
      const adminEmail = await this.getAdminEmail();
      await this.checkQuoteOptions();
      await this.checkCollectionPlans();
      await this.checkPaymentPlans();
      await this.checkTicketOptions(adminEmail);
      await this.checkTicketPayments(adminEmail);
      await this.checkDailyOperations(adminEmail);
      logger.success('✅ Tüm hatırlatıcılar başarıyla kontrol edildi.');
    } catch (error) {
      logger.error('❌ Hatırlatıcı kontrolü sırasında genel hata:', error);
    }
  }

  async getUser(userId) {
    if (!userId) return null;
    const { data } = await supabaseAdmin.from('users').select('id, full_name, email, role').eq('id', userId).single();
    return data;
  }

  async getProject(projectId) {
    if (!projectId) return null;
    const { data } = await supabaseAdmin.from('projects').select('id, name, title, manager_id').eq('id', projectId).single();
    return data;
  }

  async checkQuoteOptions() {
    try {
      const today = moment().format('YYYY-MM-DD');
      const dayAfterTomorrow = moment().add(2, 'days').format('YYYY-MM-DD');
      
      const { data: quotes } = await supabaseAdmin
        .from('quotes')
        .select('*')
        .in('status', ['draft', 'sent'])
        .or(`valid_until.gte.${today},option_date.gte.${today}`)
        .or(`valid_until.lt.${dayAfterTomorrow},option_date.lt.${dayAfterTomorrow}`);
        
      if (!quotes) return;

      for (const quote of quotes) {
        const user = await this.getUser(quote.created_by);
        if (user && user.email) {
          const date = quote.valid_until || quote.option_date;
          // Verify it's actually today or tomorrow
          const dateStr = moment(date).format('YYYY-MM-DD');
          if (dateStr < today || dateStr >= dayAfterTomorrow) continue;
          
          const isToday = dateStr === today;
          const subject = `${isToday ? 'ACİL: ' : '' }Opsiyon Hatırlatması: Teklif #${quote.quote_number}`;
          
          const html = `
            <div style="font-family: sans-serif; color: #333;">
              <h3 style="color: ${isToday ? '#dc2626' : '#2563eb'}; margin-bottom: 15px;">Teklif Opsiyon Hatırlatması</h3>
              <p>Aşağıdaki teklifin opsiyon süresi <strong>${isToday ? 'BUGÜN' : 'YARIN'}</strong> doluyor:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
                <tr><td style="padding: 10px; border: 1px solid #eee; background: #f9fafb;"><strong>Teklif No</strong></td><td style="padding: 10px; border: 1px solid #eee;">${quote.quote_number}</td></tr>
                <tr><td style="padding: 10px; border: 1px solid #eee; background: #f9fafb;"><strong>Müşteri</strong></td><td style="padding: 10px; border: 1px solid #eee;">${quote.client_name}</td></tr>
                <tr><td style="padding: 10px; border: 1px solid #eee; background: #f9fafb;"><strong>Opsiyon Tarihi</strong></td><td style="padding: 10px; border: 1px solid #eee;">${moment(date).format('DD.MM.YYYY')}</td></tr>
                <tr><td style="padding: 10px; border: 1px solid #eee; background: #f9fafb;"><strong>Durum</strong></td><td style="padding: 10px; border: 1px solid #eee;">${quote.status}</td></tr>
              </table>
              <p>Lütfen teklif durumunu kontrol ederek gerekli aksiyonu alınız.</p>
            </div>
          `;
          
          try { await emailService.sendEmail(user.email, subject, html); } catch (e) { logger.error('Email error:', e.message); }
          await this.createNotification(user.id, subject, html, isToday ? 'error' : 'warning', 'quote', quote.id);
        }
      }
    } catch (error) { logger.error('checkQuoteOptions error:', error); }
  }

  async checkCollectionPlans() {
    try {
      const today = moment().format('YYYY-MM-DD');
      const dayAfterTomorrow = moment().add(2, 'days').format('YYYY-MM-DD');
      
      const { data: plans } = await supabaseAdmin
        .from('project_collection_plans')
        .select('*, projects(*, agencies(name), hotels(name))')
        .gte('date', today)
        .lt('date', dayAfterTomorrow)
        .eq('status', 'pending');
        
      if (!plans) return;

      for (const plan of plans) {
        const project = plan.projects;
        if (project) {
          const user = await this.getUser(project.manager_id);
          if (user && user.email) {
            const isToday = moment(plan.date).format('YYYY-MM-DD') === today;
            const agencyName = project.agencies?.name || project.company_name || '-';
            const hotelName = project.hotels?.name || '-';
            const dateRange = project.start_date ? `${moment(project.start_date).format('DD.MM.YYYY')} - ${moment(project.end_date).format('DD.MM.YYYY')}` : '-';
            
            const subject = `${isToday ? 'BUGÜN: ' : ''}Tahsilat Hatırlatması: ${project.reference || project.title}`;
            
            const html = `
              <div style="font-family: sans-serif; color: #333;">
                <h3 style="color: #059669; margin-bottom: 15px;">Tahsilat Hatırlatması</h3>
                <p>Aşağıdaki projenin planlanmış bir tahsilatı <strong>${isToday ? 'BUGÜN' : 'YARIN'}</strong> gerçekleşecektir:</p>
                
                <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; border-left: 5px solid #10b981; margin: 20px 0;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr><td style="padding: 5px 0; color: #666; width: 120px;"><strong>Proje Ref:</strong></td><td style="font-weight: bold;">${project.reference || '-'}</td></tr>
                    <tr><td style="padding: 5px 0; color: #666;"><strong>Müşteri:</strong></td><td style="font-weight: bold;">${agencyName}</td></tr>
                    <tr><td style="padding: 5px 0; color: #666;"><strong>Otel:</strong></td><td>${hotelName}</td></tr>
                    <tr><td style="padding: 5px 0; color: #666;"><strong>Tarih:</strong></td><td>${dateRange}</td></tr>
                    <tr><td style="padding: 10px 0 5px 0; border-top: 1px solid #d1fae5; margin-top: 5px;" colspan="2"></td></tr>
                    <tr><td style="padding: 5px 0; color: #666;"><strong>Tahsilat Tutarı:</strong></td><td style="font-size: 18px; color: #059669; font-weight: bold;">${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: plan.currency }).format(plan.amount)}</td></tr>
                    <tr><td style="padding: 5px 0; color: #666;"><strong>Vade Tarihi:</strong></td><td style="font-weight: bold; color: ${isToday ? '#dc2626' : 'inherit'}">${moment(plan.date).format('DD.MM.YYYY')}</td></tr>
                    <tr><td style="padding: 5px 0; color: #666;"><strong>Açıklama:</strong></td><td>${plan.description || '-'}</td></tr>
                  </table>
                </div>
                
                <p style="font-size: 13px; color: #666;">Tahsilatın gerçekleştiğini teyit ederek sisteme girişini yapınız.</p>
              </div>
            `;
            
            try { await emailService.sendEmail(user.email, subject, html); } catch (e) { logger.error('Email error:', e.message); }
            await this.createNotification(user.id, subject, html, isToday ? 'success' : 'info', 'project', project.id);
          }
        }
      }
    } catch (error) { logger.error('checkCollectionPlans error:', error); }
  }

  async checkPaymentPlans() {
    try {
      const today = moment().format('YYYY-MM-DD');
      const dayAfterTomorrow = moment().add(2, 'days').format('YYYY-MM-DD');
      
      const { data: plans } = await supabaseAdmin
        .from('project_payment_plans')
        .select('*, projects(*, agencies(name), hotels(name))')
        .gte('date', today)
        .lt('date', dayAfterTomorrow)
        .eq('status', 'pending');
        
      if (!plans) return;

      for (const plan of plans) {
        const project = plan.projects;
        if (project) {
          const user = await this.getUser(project.manager_id);
          if (user && user.email) {
            const isToday = moment(plan.date).format('YYYY-MM-DD') === today;
            const agencyName = project.agencies?.name || project.company_name || '-';
            const hotelName = project.hotels?.name || '-';
            const dateRange = project.start_date ? `${moment(project.start_date).format('DD.MM.YYYY')} - ${moment(project.end_date).format('DD.MM.YYYY')}` : '-';
            
            const subject = `${isToday ? 'ACİL: ' : ''}Ödeme Hatırlatması: ${project.reference || project.title}`;
            
            const html = `
              <div style="font-family: sans-serif; color: #333;">
                <h3 style="color: #dc2626; margin-bottom: 15px;">Ödeme Hatırlatması</h3>
                <p>Aşağıdaki projenin planlanmış bir ödemesi <strong>${isToday ? 'BUGÜN' : 'YARIN'}</strong> gerçekleşecektir:</p>
                
                <div style="background: #fef2f2; padding: 20px; border-radius: 12px; border-left: 5px solid #ef4444; margin: 20px 0;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr><td style="padding: 5px 0; color: #666; width: 120px;"><strong>Proje Ref:</strong></td><td style="font-weight: bold;">${project.reference || '-'}</td></tr>
                    <tr><td style="padding: 5px 0; color: #666;"><strong>Müşteri:</strong></td><td>${agencyName}</td></tr>
                    <tr><td style="padding: 5px 0; color: #666;"><strong>Otel:</strong></td><td>${hotelName}</td></tr>
                    <tr><td style="padding: 5px 0; color: #666;"><strong>Tarih:</strong></td><td>${dateRange}</td></tr>
                    <tr><td style="padding: 10px 0 5px 0; border-top: 1px solid #fee2e2; margin-top: 5px;" colspan="2"></td></tr>
                    <tr><td style="padding: 5px 0; color: #666;"><strong>Alacaklı:</strong></td><td style="font-weight: bold;">${plan.hotel || plan.supplier || '-'}</td></tr>
                    <tr><td style="padding: 5px 0; color: #666;"><strong>Ödeme Tutarı:</strong></td><td style="font-size: 18px; color: #dc2626; font-weight: bold;">${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: plan.currency }).format(plan.amount)}</td></tr>
                    <tr><td style="padding: 5px 0; color: #666;"><strong>Vade Tarihi:</strong></td><td style="font-weight: bold; color: #dc2626;">${moment(plan.date).format('DD.MM.YYYY')}</td></tr>
                  </table>
                </div>
                
                <p style="font-size: 13px; color: #666;">Ödemenin planlanan tarihte yapılması operasyonel sürdürülebilirlik için önem arz etmektedir.</p>
              </div>
            `;
            
            try { await emailService.sendEmail(user.email, subject, html); } catch (e) { logger.error('Email error:', e.message); }
            await this.createNotification(user.id, subject, html, isToday ? 'error' : 'warning', 'project', project.id);
          }
        }
      }
    } catch (error) { logger.error('checkPaymentPlans error:', error); }
  }

  async checkTicketOptions(adminEmail) {
    try {
      const today = moment().format('YYYY-MM-DD');
      const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
      const dayAfterTomorrow = moment().add(2, 'days').format('YYYY-MM-DD');
      
      const { data: options } = await supabaseAdmin
        .from('ticket_options')
        .select('*')
        .gte('option_end_date', today)
        .lt('option_end_date', dayAfterTomorrow)
        .eq('status', 'active');
        
      if (!options || options.length === 0) return;

      const subject = `Bilet Opsiyon Hatırlatması (${options.length} Bilet)`;
      let tableRows = '';
      for (const opt of options) {
        const isToday = moment(opt.option_end_date).format('YYYY-MM-DD') === today;
        tableRows += `
          <tr style="border-bottom: 1px solid #eee; background: ${isToday ? '#fff1f2' : 'transparent'};">
            <td style="padding: 12px; font-size: 13px;">${opt.pnr || '-'}</td>
            <td style="padding: 12px; font-size: 13px;">${opt.airline || '-'}</td>
            <td style="padding: 12px; font-size: 13px;">${opt.route || '-'}</td>
            <td style="padding: 12px; font-size: 13px;">${opt.passenger_count || 0}</td>
            <td style="padding: 12px; font-size: 13px; color: ${isToday ? '#be123c' : 'inherit'}; font-weight: bold;">
              ${moment(opt.option_end_date).format('DD.MM')} ${opt.option_end_time || ''}
            </td>
          </tr>
        `;
      }

      const html = `
        <div style="font-family: sans-serif; color: #333;">
          <h3 style="color: #2563eb; margin-bottom: 15px;">Uçak Bileti Opsiyon Hatırlatması</h3>
          <p>Aşağıdaki biletlerin opsiyon süreleri dolmak üzeredir:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; border: 1px solid #eee;">
            <tr style="background: #f3f4f6;">
              <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase;">PNR</th>
              <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase;">Havayolu</th>
              <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase;">Güzergah</th>
              <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase;">Kişi</th>
              <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase;">Vade</th>
            </tr>
            ${tableRows}
          </table>
          <p style="margin-top: 15px; font-size: 13px; color: #666;">Lütfen opsiyonları kontrol ederek biletleme veya iptal işlemlerini yapınız.</p>
        </div>
      `;
      
      try { await emailService.sendEmail(adminEmail, subject, html); } catch (e) { logger.error('Email error:', e.message); }
      await this.createNotification(adminEmail, subject, html, 'warning', 'tickets');
    } catch (error) { logger.error('checkTicketOptions error:', error); }
  }

  async checkTicketPayments(adminEmail) {
    try {
      const today = moment().format('YYYY-MM-DD');
      const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
      
      const { data: plans } = await supabaseAdmin
        .from('ticket_payment_plans')
        .select('*')
        .eq('status', 'active');
        
      if (!plans) return;

      let reminders = [];
      for (const plan of plans) {
        const due = plan.installments?.filter(inst => {
          if (!inst.date) return false;
          const instDate = moment(inst.date).format('YYYY-MM-DD');
          return instDate === today || instDate === tomorrow;
        });
        if (due?.length > 0) {
          const { data: opt } = await supabaseAdmin
            .from('ticket_options')
            .select('pnr, airline, supplier, company_name, passenger_count')
            .eq('id', plan.ticket_id)
            .single();
            
          due.forEach(inst => reminders.push({ 
            ...inst, 
            pnr: opt?.pnr, 
            airline: opt?.airline,
            supplier: opt?.supplier,
            company: opt?.company_name,
            passengers: opt?.passenger_count
          }));
        }
      }
      
      if (reminders.length === 0) return;

      const subject = `Bilet Ödeme Hatırlatması (${reminders.length} Ödeme)`;
      let rows = '';
      for (const rem of reminders) {
        const isToday = moment(rem.date).format('YYYY-MM-DD') === today;
        rows += `
          <tr style="border-bottom: 1px solid #eee; background: ${isToday ? '#fff1f2' : 'transparent'};">
            <td style="padding: 12px; font-size: 13px;">
              <div style="font-weight: bold;">${rem.pnr || '-'}</div>
              <div style="font-size: 11px; color: #666;">${rem.airline || '-'}</div>
            </td>
            <td style="padding: 12px; font-size: 13px;">
              <div>${rem.company || '-'}</div>
              <div style="font-size: 11px; color: #666;">${rem.supplier || '-'}</div>
            </td>
            <td style="padding: 12px; font-size: 13px; color: ${isToday ? '#be123c' : 'inherit'}; font-weight: bold;">
              ${isToday ? 'BUGÜN' : 'YARIN'}
            </td>
            <td style="padding: 12px; font-size: 13px; font-weight: bold; text-align: right;">
              ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: rem.currency || 'TRY' }).format(rem.amount)}
            </td>
          </tr>
        `;
      }
      
      const html = `
        <div style="font-family: sans-serif; color: #333;">
          <h3 style="color: #dc2626; margin-bottom: 15px;">Uçak Bileti Ödeme Hatırlatması</h3>
          <p>Bugün ve yarın yapılması gereken bilet ödemeleri aşağıdadır:</p>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #eee; margin-top: 15px;">
            <tr style="background: #fef2f2;">
              <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase;">PNR / Havayolu</th>
              <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase;">Müşteri / Tedarikçi</th>
              <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase;">Vade</th>
              <th style="padding: 12px; text-align: right; font-size: 12px; text-transform: uppercase;">Tutar</th>
            </tr>
            ${rows}
          </table>
          <p style="margin-top: 15px; font-size: 13px; color: #666;">Lütfen ödemelerin zamanında yapıldığından emin olunuz.</p>
        </div>
      `;
      
      try { await emailService.sendEmail(adminEmail, subject, html); } catch (e) { logger.error('Email error:', e.message); }
      await this.createNotification(adminEmail, subject, html, 'error', 'tickets');
    } catch (error) { logger.error('checkTicketPayments error:', error); }
  }

  async checkDailyOperations(adminEmail) {
    try {
      const today = moment().format('YYYY-MM-DD');
      const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
      
      const fetchOps = async (d) => {
        const { data: transfers } = await supabaseAdmin
          .from('project_transfer_tour')
          .select('*, projects(title)')
          .eq('date', d);
          
        const { data: operations } = await supabaseAdmin
          .from('operations')
          .select('*')
          .eq('start_date', d);
          
        return { transfers: transfers || [], operations: operations || [] };
      };
      
      const todayOps = await fetchOps(today);
      const tomorrowOps = await fetchOps(tomorrow);

      if (todayOps.transfers.length || todayOps.operations.length || tomorrowOps.transfers.length || tomorrowOps.operations.length) {
        const subject = `Günlük Operasyon Özeti (${moment(today).format('DD.MM.YYYY')})`;
        
        const renderSection = (ops, label) => {
          if (!ops.transfers.length && !ops.operations.length) return '';
          
          let s = `<h4 style="background: #f3f4f6; padding: 10px; border-radius: 8px; margin-top: 20px;">${label}</h4><ul style="padding-left: 20px;">`;
          
          ops.transfers.forEach(x => {
            s += `<li style="margin-bottom: 8px;">
              <strong>Transfer:</strong> ${x.route} (${x.time})<br/>
              <span style="font-size: 12px; color: #666;">Proje: ${x.projects?.title || '-'}</span>
            </li>`;
          });
          
          ops.operations.forEach(x => {
            s += `<li style="margin-bottom: 8px;">
              <strong>Hizmet:</strong> ${x.title}<br/>
              <span style="font-size: 12px; color: #666;">Açıklama: ${x.description || '-'}</span>
            </li>`;
          });
          
          return s + '</ul>';
        };
        
        const html = `
          <div style="font-family: sans-serif; color: #333;">
            <h3 style="color: #2563eb; margin-bottom: 10px;">Günlük Operasyon Özeti</h3>
            <p>Bugün ve yarın için planlanan operasyon detayları:</p>
            ${renderSection(todayOps, 'Bugün')}
            ${renderSection(tomorrowOps, 'Yarın')}
          </div>
        `;
        
        try { await emailService.sendEmail(adminEmail, subject, html); } catch (e) { logger.error('Email error:', e.message); }
        await this.createNotification(adminEmail, subject, html, 'info', 'operations');
      }
    } catch (error) { logger.error('checkDailyOperations error:', error); }
  }
}

module.exports = { reminderService: new ReminderService() };
