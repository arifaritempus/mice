require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
const logger = require('./utils/logger')('Server');

// Server başlatma
logger.info('EventIQ Backend başlatılıyor...');
logger.debug('Modüller yükleniyor...');

// Middleware ve servisler
logger.debug('Middleware ve servisler yükleniyor...');
const { authMiddleware } = require('./middleware/auth');
const { emailService } = require('./services/emailService');
const { notificationService, setupNotificationService } = require('./services/notificationService');
const { reportService } = require('./services/reportService');
const { reminderService } = require('./services/reminderService');
logger.success('Middleware ve servisler yüklendi');

// API rotaları
logger.debug('API rotaları yükleniyor...');
const authRoutes = require('./routes/auth');
const companiesRoutes = require('./routes/companies');
const projectsRoutes = require('./routes/projects');
const tasksRoutes = require('./routes/tasks');
const budgetRoutes = require('./routes/budget');
const categoriesRoutes = require('./routes/categories');
const customersRoutes = require('./routes/customers');
const vendorsRoutes = require('./routes/vendors');
const financialRoutes = require('./routes/financial');
const notificationsRoutes = require('./routes/notifications');
const filesRoutes = require('./routes/files');
const reportsRoutes = require('./routes/reports');
const approvalsRoutes = require('./routes/approvals');
const calendarRoutes = require('./routes/calendar');
const dashboardRoutes = require('./routes/dashboard');
const eventsRoutes = require('./routes/events');
const usersRoutes = require('./routes/users');
const goalsRoutes = require('./routes/goals');
const settingsRoutes = require('./routes/settings');
const sejourRoutes = require('./routes/sejour');
const operationsRoutes = require('./routes/operations');
const flightTicketsRoutes = require('./routes/flight-tickets');
const hotelExtrasRoutes = require('./routes/hotel-extras');
const projectTransfersRoutes = require('./routes/project-transfers');
const projectEventsActivitiesRoutes = require('./routes/project-events-activities');
logger.success('API rotaları yüklendi');

logger.debug('Express uygulaması oluşturuluyor...');
const app = express();
const server = createServer(app);
logger.debug('Socket.io sunucusu başlatılıyor...');
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    methods: ["GET", "POST"]
  }
});
logger.success('Express ve Socket.io hazır');

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true
}));

// Rate limiting and security after CORS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased for development
  message: { success: false, message: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin.' }
});
app.use(limiter);
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Socket.io bağlantı yönetimi
const socketLogger = require('./utils/logger')('Socket.IO');
io.on('connection', (socket) => {
  socketLogger.info('Kullanıcı bağlandı:', socket.id);

  // Kullanıcı oda katılımı
  socket.on('join-room', (room) => {
    socket.join(room);
    socketLogger.debug(`Kullanıcı ${socket.id} odaya katıldı: ${room}`);
  });

  // Oda ayrılma
  socket.on('leave-room', (room) => {
    socket.leave(room);
    socketLogger.debug(`Kullanıcı ${socket.id} odadan ayrıldı: ${room}`);
  });

  // Bağlantı kesme
  socket.on('disconnect', () => {
    socketLogger.info('Kullanıcı ayrıldı:', socket.id);
  });
});

// Socket.io'yu global olarak erişilebilir yap
global.io = io;

// Ana sayfa
app.get('/', (req, res) => {
  res.json({
    message: 'EventIQ Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api/*',
      docs: 'API dokümantasyonu için /api endpoint\'lerini kullanın'
    }
  });
});

// Sejour ana sayfası route'u
app.get('/sejour', (req, res) => {
  res.json({
    success: true,
    message: 'Sejour ana sayfası erişilebilir',
    timestamp: new Date().toISOString()
  });
});

// Favicon endpoint
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No content
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API rotaları - Auth middleware uygulandı
app.use('/api/auth', authRoutes); // Public - no auth needed
app.use('/api/companies', authMiddleware, companiesRoutes);
app.use('/api/projects', authMiddleware, projectsRoutes);
app.use('/api/tasks', authMiddleware, tasksRoutes);
app.use('/api/budget', authMiddleware, budgetRoutes);
// app.use('/api/agencies', authMiddleware, agenciesRoutes); // TODO: Create agencies routes
// app.use('/api/hotels', authMiddleware, hotelsRoutes); // TODO: Create hotels routes
app.use('/api/categories', (req, res, next) => {
  if (req.method === 'GET') return next();
  return authMiddleware(req, res, next);
}, categoriesRoutes);
app.use('/api/customers', authMiddleware, customersRoutes);
app.use('/api/vendors', authMiddleware, vendorsRoutes);
// app.use('/api/suppliers', authMiddleware, suppliersRoutes); // TODO: Create suppliers routes
app.use('/api/financial', authMiddleware, financialRoutes);
app.use('/api/notifications', authMiddleware, notificationsRoutes);
app.use('/api/files', authMiddleware, filesRoutes);
app.use('/api/reports', authMiddleware, reportsRoutes);
// app.use('/api/tickets', authMiddleware, ticketsRoutes); // TODO: Create tickets routes
app.use('/api/approvals', authMiddleware, approvalsRoutes);
app.use('/api/calendar', authMiddleware, calendarRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/events', authMiddleware, eventsRoutes);
app.use('/api/users', authMiddleware, usersRoutes);
app.use('/api/goals', authMiddleware, goalsRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);
app.use('/api/sejour', authMiddleware, sejourRoutes);
app.use('/api/operations', (req, res, next) => {
  if (req.method === 'GET') return next();
  return authMiddleware(req, res, next);
}, operationsRoutes);
app.use('/api/flight-tickets', authMiddleware, flightTicketsRoutes);
app.use('/api/hotel-extras', authMiddleware, hotelExtrasRoutes);
app.use('/api/project-transfers', authMiddleware, projectTransfersRoutes);
app.use('/api/project-events-activities', authMiddleware, projectEventsActivitiesRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Endpoint bulunamadı' });
});

// Global error handler - Always return JSON
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  const statusCode = error.statusCode || error.status || 500;
  const response = {
    success: false,
    message: error.message || 'Sunucu hatası',
    ...(process.env.NODE_ENV === 'development' && {
      error: error.message,
      stack: error.stack
    })
  };
  res.status(statusCode).json(response);
});

// Cron jobs - Geçici olarak devre dışı bırakıldı
// Günlük hatırlatıcılar ve operasyon özetleri (Her sabah 09:00)
cron.schedule('0 9 * * *', async () => {
  try {
    logger.info('Günlük hatırlatıcılar çalıştırılıyor...');
    await reminderService.checkAllReminders();
  } catch (error) {
    logger.error('Günlük hatırlatıcı hatası:', error);
  }
});

// Saatlik bildirimler
// cron.schedule('0 * * * *', async () => {
//   try {
//     console.log('Saatlik bildirimler kontrol ediliyor...');
//     // notificationService zaten import edildi, yeni instance oluşturmaya gerek yok
//     // Yaklaşan etkinlikler için bildirim gönder
//   } catch (error) {
//     console.error('Saatlik bildirim hatası:', error);
//   }
// });

// Etkinlik hatırlatıcıları
// cron.schedule('*/30 * * * *', async () => {
//   try {
//     console.log('Etkinlik hatırlatıcıları kontrol ediliyor...');
//     // emailService zaten import edildi, yeni instance oluşturmaya gerek yok
//     // 30 dakika içinde başlayacak etkinlikler için hatırlatma gönder
//   } catch (error) {
//     console.error('Etkinlik hatırlatıcı hatası:', error);
//   }
// });

// Yerelde frontend genelde 3001; API aynı hostta 3001 ile çakışmaması için varsayılan 3000.
const PORT = process.env.PORT || 3000;

console.log(`🌍 Sunucu ${PORT} portunda dinlemeye başlıyor...`);
setupNotificationService();
server.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 EventIQ Backend Server ${PORT} portunda çalışıyor`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 Socket.io aktif`);
  console.log(`⏰ Cron jobs aktif`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3001'}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(50));
  console.log('✅ Backend başarıyla başlatıldı!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM sinyali alındı, sunucu kapatılıyor...');
  server.close(() => {
    console.log('Sunucu başarıyla kapatıldı');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT sinyali alındı, sunucu kapatılıyor...');
  server.close(() => {
    console.log('Sunucu başarıyla kapatıldı');
    process.exit(0);
  });
}); 