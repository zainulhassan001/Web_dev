require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// Logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// CORS (for API routes)
app.use('/api', cors());

// Rate limiter for API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', apiLimiter);

// Session
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } // 7 days
});
app.use(sessionMiddleware);

// Share session with Socket.io
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

// Flash messages
app.use(flash());

// CSRF protection
const { csrfToken, csrfProtect } = require('./middleware/csrf');
app.use(csrfToken);
app.use(csrfProtect);

// Lightweight global template variables (no DB queries)
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  // Defaults — overridden by loadBadgeCounts for EJS routes
  res.locals.unreadCount = 0;
  res.locals.notificationCount = 0;
  res.locals.notifications = [];
  next();
});

// Heavy badge/notification counts — only for EJS routes that render nav
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
const Notification = require('./models/Notification');

const loadBadgeCounts = async (req, res, next) => {
  if (!req.session.user) return next();
  try {
    const convs = await Conversation.find({ participants: req.session.user._id }).select('_id');
    const convIds = convs.map(c => c._id);
    const [unread, notifCount, notifItems] = await Promise.all([
      Message.countDocuments({
        conversation: { $in: convIds },
        sender: { $ne: req.session.user._id },
        isRead: false
      }),
      Notification.countDocuments({ user: req.session.user._id, isRead: false }),
      Notification.find({ user: req.session.user._id }).sort({ createdAt: -1 }).limit(5)
    ]);
    res.locals.unreadCount = unread;
    res.locals.notificationCount = notifCount;
    res.locals.notifications = notifItems;
  } catch { /* defaults already set */ }
  next();
};

// Routes — EJS routes get badge counts, API routes do not
app.use('/', loadBadgeCounts, require('./routes/auth'));
app.use('/ads', loadBadgeCounts, require('./routes/ads'));
app.use('/messages', loadBadgeCounts, require('./routes/messages'));
app.use('/', loadBadgeCounts, require('./routes/likes'));
app.use('/', loadBadgeCounts, require('./routes/notifications'));
app.use('/admin', loadBadgeCounts, require('./routes/admin'));
app.use('/api/v1', require('./routes/api/v1'));

// Socket.io
require('./socket/chat')(io);

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found', code: 404 });
});

// Error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = 'Upload failed. Please try again.';
    if (err.code === 'LIMIT_FILE_SIZE') message = 'Each image must be 5MB or less.';
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') message = 'You can upload up to 5 images.';

    if (req.originalUrl.startsWith('/api/')) {
      return res.status(400).json({ error: message });
    }

    req.flash('error', message);
    const backUrl = req.get('Referrer') || '/';
    return res.redirect(backUrl);
  }
  console.error(err.stack);
  res.status(500).render('error', { message: 'Something went wrong', code: 500 });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
