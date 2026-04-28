const { supabase } = require('../config/database');

class NotificationService {
  constructor() {
    this.io = null;
  }

  setSocketIO(io) {
    this.io = io;
  }

  // Veritabanına bildirim kaydet
  async createNotification(userId, title, message, type = 'info', actionUrl = null) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          action_url: actionUrl
        })
        .select()
        .single();

      if (error) throw error;

      // Gerçek zamanlı bildirim gönder
      this.sendRealTimeNotification(userId, data);

      return data;
    } catch (error) {
      console.error('❌ Bildirim oluşturma hatası:', error);
      throw error;
    }
  }

  // Gerçek zamanlı bildirim gönder
  sendRealTimeNotification(userId, notification) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit('notification', notification);
    }
  }

  // Kullanıcının bildirimlerini getir
  async getUserNotifications(userId, limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Bildirim getirme hatası:', error);
      throw error;
    }
  }

  // Bildirimi okundu olarak işaretle
  async markAsRead(notificationId, userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Bildirim güncelleme hatası:', error);
      throw error;
    }
  }

  // Tüm bildirimleri okundu olarak işaretle
  async markAllAsRead(userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Bildirim toplu güncelleme hatası:', error);
      throw error;
    }
  }

  // Okunmamış bildirim sayısını getir
  async getUnreadCount(userId) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('❌ Okunmamış bildirim sayısı hatası:', error);
      throw error;
    }
  }

  // Bildirim sil
  async deleteNotification(notificationId, userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('❌ Bildirim silme hatası:', error);
      throw error;
    }
  }

  // Sistem bildirimleri
  async sendSystemNotification(userId, message, type = 'info') {
    return this.createNotification(
      userId,
      'Sistem Bildirimi',
      message,
      type
    );
  }

  // Etkinlik bildirimleri
  async sendEventNotification(userId, eventTitle, message, type = 'info') {
    return this.createNotification(
      userId,
      `Etkinlik: ${eventTitle}`,
      message,
      type,
      `/events`
    );
  }

  // Proje bildirimleri
  async sendProjectNotification(userId, projectName, message, type = 'info') {
    return this.createNotification(
      userId,
      `Proje: ${projectName}`,
      message,
      type,
      `/projects`
    );
  }

  // Görev bildirimleri
  async sendTaskNotification(userId, taskTitle, message, type = 'info') {
    return this.createNotification(
      userId,
      `Görev: ${taskTitle}`,
      message,
      type,
      `/tasks`
    );
  }

  // Bütçe bildirimleri
  async sendBudgetNotification(userId, projectName, message, type = 'warning') {
    return this.createNotification(
      userId,
      `Bütçe Uyarısı: ${projectName}`,
      message,
      type,
      `/budget`
    );
  }

  // Toplu bildirim gönder
  async sendBulkNotification(userIds, title, message, type = 'info', actionUrl = null) {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      title,
      message,
      type,
      action_url: actionUrl
    }));

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) throw error;

      // Gerçek zamanlı bildirimleri gönder
      data.forEach(notification => {
        this.sendRealTimeNotification(notification.user_id, notification);
      });

      return data;
    } catch (error) {
      console.error('❌ Toplu bildirim hatası:', error);
      throw error;
    }
  }

  // Zamanlanmış bildirimleri kontrol et
  async checkScheduledNotifications() {
    try {
      // Yarınki etkinlikler için hatırlatma
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const { data: events, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          start_date,
          registrations!inner(
            id,
            user_id,
            users!inner(id, full_name, email)
          )
        `)
        .gte('start_date', tomorrow.toISOString())
        .lt('start_date', dayAfter.toISOString())
        .eq('status', 'active');

      if (error) throw error;

      // Her etkinlik için katılımcılara hatırlatma gönder
      for (const event of events) {
        for (const registration of event.registrations) {
          await this.sendEventNotification(
            registration.user_id,
            event.title,
            `Yarın ${event.title} etkinliği var! Saat: ${new Date(event.start_date).toLocaleTimeString('tr-TR')}`,
            'warning'
          );
        }
      }

      console.log(`✅ ${events.length} etkinlik için hatırlatma gönderildi`);
    } catch (error) {
      console.error('❌ Zamanlanmış bildirim kontrolü hatası:', error);
    }
  }
}

const notificationService = new NotificationService();

const setupNotificationService = () => {
  console.log('🔔 Bildirim servisi başlatıldı');
};

module.exports = {
  notificationService,
  setupNotificationService
}; 