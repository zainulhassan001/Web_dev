const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const Category = require('../models/Category');
const Ad = require('../models/Ad');
const authController = require('../controllers/authController');
const adController = require('../controllers/adController');
const isLoggedIn = require('../middleware/isLoggedIn');
const { upload, processAvatar } = require('../middleware/upload');

// Home page
router.get('/', async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort('displayOrder');
    const featuredAds = await Ad.find({ status: 'active' })
      .populate('category seller')
      .sort({ createdAt: -1 })
      .limit(6);
    res.render('index', { categories, featuredAds, title: 'Uni Buy & Sell' });
  } catch (err) {
    next(err);
  }
});

router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'Register' });
});

router.post('/register', [
  body('name').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], authController.register);

router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Login' });
});

router.post('/login', authController.login);

router.get('/logout', authController.logout);

router.get('/profile', isLoggedIn, authController.profile);
router.post('/profile', isLoggedIn, upload.single('avatarFile'), processAvatar, authController.updateProfile);
router.post('/profile/avatar/remove', isLoggedIn, authController.removeAvatar);
router.post('/account/delete', isLoggedIn, authController.deleteAccount);
router.get('/user/my-ads', isLoggedIn, adController.myAds);
router.get('/seller/:id', authController.sellerProfile);

// Forgot / Reset Password
router.get('/forgot-password', authController.showForgotPassword);
router.post('/forgot-password', authController.forgotPassword);
router.get('/reset-password/:token', authController.showResetPassword);
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router;
