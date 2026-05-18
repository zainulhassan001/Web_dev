const { validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const Ad = require('../models/Ad');
const { sendEmail } = require('../utils/email');

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array()[0].msg);
      return res.redirect('/register');
    }

    const { name, email, password, university } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      req.flash('error', 'Email already in use');
      return res.redirect('/register');
    }

    await User.create({ name, email, password, university });
    req.flash('success', 'Account created! Please log in.');
    res.redirect('/login');
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.isBanned) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }

    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      university: user.university
    };

    req.flash('success', `Welcome back, ${user.name}!`);
    res.redirect('/');
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Session destroy error:', err);
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
};

exports.profile = (req, res) => {
  res.render('user/profile', { title: 'My Profile' });
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, university, avatar, phone, bio } = req.body;
    const nextAvatar = req.processedAvatar || avatar || req.session.user.avatar;
    await User.findByIdAndUpdate(req.session.user._id, {
      name,
      university,
      avatar: nextAvatar,
      phone,
      bio
    });
    req.session.user.name = name;
    req.session.user.university = university;
    req.session.user.avatar = nextAvatar;
    req.flash('success', 'Profile updated.');
    res.redirect('/profile');
  } catch (err) {
    next(err);
  }
};

exports.removeAvatar = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.session.user._id, { avatar: '' });
    req.session.user.avatar = '';
    req.flash('success', 'Profile photo removed.');
    res.redirect('/profile');
  } catch (err) {
    next(err);
  }
};

exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    const fs = require('fs');
    const path = require('path');
    const Like = require('../models/Like');
    const Conversation = require('../models/Conversation');
    const Message = require('../models/Message');
    const Notification = require('../models/Notification');

    // 1. Find user's ads and delete their uploaded images from disk
    const userAds = await Ad.find({ seller: userId });
    for (const ad of userAds) {
      for (const imgPath of ad.images || []) {
        const fullPath = path.join(__dirname, '../../public', imgPath);
        fs.unlink(fullPath, () => {}); // best-effort cleanup
      }
    }

    // 2. Delete all related data in parallel
    const convos = await Conversation.find({ participants: userId }).select('_id');
    const convoIds = convos.map(c => c._id);

    await Promise.all([
      Ad.deleteMany({ seller: userId }),
      Like.deleteMany({ $or: [{ user: userId }, { ad: { $in: userAds.map(a => a._id) } }] }),
      Message.deleteMany({ conversation: { $in: convoIds } }),
      Conversation.deleteMany({ participants: userId }),
      Notification.deleteMany({ user: userId }),
      User.findByIdAndDelete(userId)
    ]);

    // 3. Destroy session properly
    req.session.destroy((err) => {
      if (err) console.error('Session destroy error:', err);
      res.clearCookie('connect.sid');
      res.redirect('/login');
    });
  } catch (err) {
    next(err);
  }
};

exports.sellerProfile = async (req, res, next) => {
  try {
    const seller = await User.findById(req.params.id).select('-password');
    if (!seller) {
      return res.status(404).render('error', { message: 'Seller not found', code: 404 });
    }

    const now = new Date();
    const ads = await Ad.find({
      seller: seller._id,
      status: 'active',
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }]
    }).sort({ isFeatured: -1, featuredAt: -1, createdAt: -1 });

    res.render('user/seller', { seller, ads, title: seller.name });
  } catch (err) {
    next(err);
  }
};

// ── Forgot Password ─────────────────────────────────────
exports.showForgotPassword = (req, res) => {
  res.render('auth/forgot-password', { title: 'Forgot Password' });
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always show success to prevent email enumeration
    if (!user) {
      req.flash('success', 'If that email is registered, you will receive a reset link shortly.');
      return res.redirect('/forgot-password');
    }

    // Generate secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateModifiedOnly: true });

    // Build reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${rawToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Uni Buy & Sell — Password Reset',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hi ${user.name},</p>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <p><a href="${resetUrl}" style="padding: 10px 20px; background: #6366f1; color: #fff; border-radius: 6px; text-decoration: none;">Reset Password</a></p>
        <p>This link expires in <strong>1 hour</strong>.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <hr>
        <small>Uni Buy & Sell</small>
      `
    });

    req.flash('success', 'If that email is registered, you will receive a reset link shortly.');
    res.redirect('/forgot-password');
  } catch (err) {
    next(err);
  }
};

// ── Reset Password ──────────────────────────────────────
exports.showResetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.flash('error', 'Reset link is invalid or has expired.');
      return res.redirect('/forgot-password');
    }

    res.render('auth/reset-password', { title: 'Reset Password', token: req.params.token });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.flash('error', 'Reset link is invalid or has expired.');
      return res.redirect('/forgot-password');
    }

    const { password, confirmPassword } = req.body;
    if (!password || password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters.');
      return res.redirect(`/reset-password/${req.params.token}`);
    }
    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect(`/reset-password/${req.params.token}`);
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    req.flash('success', 'Password has been reset. You can now log in.');
    res.redirect('/login');
  } catch (err) {
    next(err);
  }
};
