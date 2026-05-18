const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const isLoggedIn = require('../middleware/isLoggedIn');
const isAdmin = require('../middleware/isAdmin');

router.use(isLoggedIn, isAdmin);

router.get('/', adminController.dashboard);
router.get('/users', adminController.users);
router.post('/users/:id/ban', adminController.toggleBan);
router.post('/users/:id/role', adminController.toggleRole);

router.get('/ads', adminController.ads);
router.post('/ads/:id/status', adminController.updateAdStatus);
router.post('/ads/:id/delete', adminController.deleteAd);
router.post('/ads/:id/feature', adminController.toggleFeatured);

router.get('/categories', adminController.categories);
router.post('/categories', adminController.createCategory);
router.post('/categories/:id', adminController.updateCategory);
router.post('/categories/:id/delete', adminController.deleteCategory);


router.get('/analytics', adminController.analytics);
router.get('/settings', adminController.settings);
router.post('/settings', adminController.updateSettings);

module.exports = router;
