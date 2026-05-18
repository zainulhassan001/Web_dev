const express = require('express');
const router = express.Router();
const isLoggedIn = require('../middleware/isLoggedIn');
const Notification = require('../models/Notification');

router.get('/notifications', isLoggedIn, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.session.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.render('notifications/index', { notifications, title: 'Notifications' });
  } catch (err) {
    next(err);
  }
});

router.post('/notifications/:id/read', isLoggedIn, async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.session.user._id },
      { isRead: true }
    );
    res.redirect(req.headers.referer || '/notifications');
  } catch (err) {
    next(err);
  }
});

router.post('/notifications/read-all', isLoggedIn, async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.session.user._id, isRead: false },
      { isRead: true }
    );
    res.redirect(req.headers.referer || '/notifications');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
