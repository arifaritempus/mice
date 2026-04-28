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
          message: message, // Bu alan artık HTML içeriği taşıyor
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
    const { data } = await supabaseAdmin.from('projects').select('id, title, manager_id').eq('id', projectId).single();
    return data;
  }

  async checkQuoteOptions() {
    try {
      const today = moment().format('YYYY-MM-DD');
      const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
      const { data: quotes } = await supabaseAdmin.from('quotes').select('*').or(`valid_until.eq.${today},valid_until.eq.${tomorrow},option_date.eq.${today},option_date.eq.${tomorrow}`).in('status', ['draft', 'sent']);
      if (!quotes) return;

      for (const quote of quotes) {
        const user = await this.getUser(quote.created_by);
        if (user && user.email) {
          const date = quote.valid_until || quote.option_date;
          const isToday = date === today;
          const subject = `${isToday ? 'ACİL: ' : '' }Opsiyon Hatırlatması: Teklif #${quote.quote_number}`;
          const html = `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2 style="color: ${isToday ? '#dc2626' : '#2563eb'}; border-bottom: 2px solid #eee; padding-bottom: 10px;">Teklif Opsiyon Hatırlatması</h2>
              <p>Aşağıdaki teklifin opsiyon süresi <strong>${isToday ? 'BUGÜN' : 'YARIN'}</strong> doluyor:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background: #f9fafb;"><td style="padding: 10px; border: 1px solid #eee;"><strong>Teklif No:</strong></td><td style="padding: 10px; border: 1px solid #eee;">${quote.quote_number}</td></tr>
                <tr><td style="padding: 10px; border: 1px solid #eee;"><strong>Müşteri:</strong></td><td style="padding: 10px; border: 1px solid #eee;">${quote.client_name}</td></tr>
                <tr style="background: #f9fafb;"><td style="padding: 10px; border: 1px solid #eee;"><strong>Tarih:</strong></td><td style="padding: 10px; border: 1px solid #eee;">${moment(date).format('DD.MM.YYYY')}</td></tr>
              </table>
              <p>Lütfen teklif durumunu kontrol ediniz.</p>
              <a href="${process.env.FRONTEND_URL}/quotes/${quote.id}" style="display: inline-block; background: ${isToday ? '#dc2626' : '#2563eb'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Teklifi Görüntüle</a>
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
      const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
      const { data: plans } = await supabaseAdmin.from('project_collection_plans').select('*').or(`date.eq.${today},date.eq.${tomorrow}`);
      if (!plans) return;

      for (const plan of plans) {
        const project = await this.getProject(plan.project_id);
        if (project) {
          const user = await this.getUser(project.manager_id);
          if (user && user.email) {
            const isToday = plan.date === today;
            const subject = `${isToday ? 'BUGÜN: ' : ''}Tahsilat Hatırlatması: ${project.title}`;
            const html = `
              <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #059669; border-bottom: 2px solid #eee; padding-bottom: 10px;">Tahsilat Hatırlatması</h2>
                <p>Aşağıdaki projenin planlanmış bir tahsilatı <strong>${isToday ? 'BUGÜN' : 'YARIN'}</strong> gerçekleşecektir:</p>
                <div style="background: #ecfdf5; padding: 20px; border-radius: 12px; border-left: 5px solid #10b981; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>Proje:</strong> ${project.title}</p>
                  <p style="margin: 5px 0;"><strong>Tutar:</strong> <span style="font-size: 18px; color: #059669; font-weight: bold;">${plan.amount} ${plan.currency}</span></p>
                  <p style="margin: 5px 0;"><strong>Açıklama:</strong> ${plan.description || '-'}</p>
                </div>
                <a href="${process.env.FRONTEND_URL}/projects/view/${project.id}?tab=financial" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Projeyi Görüntüle</a>
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
      const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
      const { data: plans } = await supabaseAdmin.from('project_payment_plans').select('*').or(`date.eq.${today},date.eq.${tomorrow}`);
      if (!plans) return;

      for (const plan of plans) {
        const project = await this.getProject(plan.project_id);
        if (project) {
          const user = await this.getUser(project.manager_id);
          if (user && user.email) {
            const isToday = plan.date === today;
            const subject = `${isToday ? 'ACİL: ' : ''}Ödeme Hatırlatması: ${project.title}`;
            const html = `
              <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #dc2626; border-bottom: 2px solid #eee; padding-bottom: 10px;">Ödeme Hatırlatması</h2>
                <p>Aşağıdaki projenin planlanmış bir ödemesi <strong>${isToday ? 'BUGÜN' : 'YARIN'}</strong> gerçekleşecektir:</p>
                <div style="background: #fef2f2; padding: 20px; border-radius: 12px; border-left: 5px solid #ef4444; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>Proje:</strong> ${project.title}</p>
                  <p style="margin: 5px 0;"><strong>Alacaklı:</strong> ${plan.hotel || '-'}</p>
                  <p style="margin: 5px 0;"><strong>Tutar:</strong> <span style="font-size: 18px; color: #dc2626; font-weight: bold;">${plan.amount} ${plan.currency}</span></p>
                </div>
                <a href="${process.env.FRONTEND_URL}/projects/view/${project.id}?tab=financial" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Projeyi Görüntüle</a>
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
      const { data: options } = await supabaseAdmin.from('ticket_options').select('*').or(`option_end_date.eq.${today},option_end_date.eq.${tomorrow}`).eq('status', 'active');
      if (!options || options.length === 0) return;

      const subject = `Bilet Opsiyon Hatırlatması (${options.length} Bilet)`;
      let tableRows = '';
      for (const opt of options) {
        const isToday = opt.option_end_date === today;
        tableRows += `<tr style="border-bottom: 1px solid #eee; background: ${isToday ? '#fff1f2' : 'transparent'};">
          <td style="padding: 12px;">${opt.pnr || '-'}</td>
          <td style="padding: 12px;">${opt.airline || '-'}</td>
          <td style="padding: 12px;">${opt.route || '-'}</td>
          <td style="padding: 12px; color: ${isToday ? '#be123c' : 'inherit'}; font-weight: bold;">${isToday ? 'BUGÜN' : 'YARIN'}</td>
        </tr>`;
      }

      const html = `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #2563eb;">Bilet Opsiyon Hatırlatması</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; border: 1px solid #eee;">
            <tr style="background: #f3f4f6;"><th>PNR</th><th>Havayolu</th><th>Güzergah</th><th>Vade</th></tr>
            ${tableRows}
          </table>
          <a href="${process.env.FRONTEND_URL}/tickets/options" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">Yönet</a>
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
      const { data: plans } = await supabaseAdmin.from('ticket_payment_plans').select('*').eq('status', 'active');
      if (!plans) return;

      let reminders = [];
      for (const plan of plans) {
        const due = plan.installments?.filter(inst => inst.date === today || inst.date === tomorrow);
        if (due?.length > 0) {
          const { data: opt } = await supabaseAdmin.from('ticket_options').select('pnr, airline').eq('id', plan.ticket_id).single();
          due.forEach(inst => reminders.push({ ...inst, pnr: opt?.pnr, airline: opt?.airline }));
        }
      }
      if (reminders.length === 0) return;

      const subject = `Bilet Ödeme Hatırlatması (${reminders.length} Ödeme)`;
      let rows = '';
      for (const rem of reminders) {
        const isToday = rem.date === today;
        rows += `<tr style="border-bottom: 1px solid #eee; background: ${isToday ? '#fff1f2' : 'transparent'};">
          <td style="padding: 12px;">${rem.pnr}</td>
          <td style="padding: 12px;">${rem.airline}</td>
          <td style="padding: 12px; color: ${isToday ? '#be123c' : 'inherit'}; font-weight: bold;">${isToday ? 'BUGÜN' : 'YARIN'}</td>
          <td style="padding: 12px; font-weight: bold;">${rem.amount} ${rem.currency}</td>
        </tr>`;
      }
      const html = `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #dc2626;">Bilet Ödeme Hatırlatması</h2>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #eee;">
            <tr style="background: #fef2f2;"><th>PNR</th><th>Havayolu</th><th>Vade</th><th>Tutar</th></tr>
            ${rows}
          </table>
          <a href="${process.env.FRONTEND_URL}/tickets/payments" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">Yönet</a>
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
      const fetch = async (d) => {
        const { data: tr } = await supabaseAdmin.from('project_transfer_tour').select('*').eq('date', d);
        const { data: op } = await supabaseAdmin.from('operations').select('*').eq('start_date', d);
        return { tr: tr || [], op: op || [] };
      };
      const t = await fetch(today);
      const m = await fetch(tomorrow);

      if (t.tr.length || t.op.length || m.tr.length || m.op.length) {
        const subject = `Operasyon Özeti (${moment(today).format('DD.MM')})`;
        const render = (o, label) => {
          let s = `<h3 style="background: #f3f4f6; padding: 10px; border-radius: 8px;">${label}</h3><ul>`;
          o.tr.forEach(x => s += `<li><strong>Transfer:</strong> ${x.route} (${x.time})</li>`);
          o.op.forEach(x => s += `<li><strong>Hizmet:</strong> ${x.title}</li>`);
          return s + '</ul>';
        };
        const html = `<div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #2563eb;">Günlük Operasyon Özeti</h2>
          ${render(t, 'Bugün')} ${render(m, 'Yarın')}
        </div>`;
        try { await emailService.sendEmail(adminEmail, subject, html); } catch (e) { logger.error('Email error:', e.message); }
        await this.createNotification(adminEmail, subject, html, 'info', 'operations');
      }
    } catch (error) { logger.error('checkDailyOperations error:', error); }
  }
}

module.exports = { reminderService: new ReminderService() };
