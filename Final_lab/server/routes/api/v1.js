const router = require('express').Router();
const verifyToken = require('../../middleware/verifyToken');
const apiController = require('../../controllers/apiController');

// Public routes
router.get('/ads', apiController.getAds);
router.get('/ads/:id', apiController.getAdById);

// Auth
router.post('/auth/login', apiController.login);

// Protected routes
router.get('/user/profile', verifyToken, apiController.getProfile);
router.post('/conversations', verifyToken, apiController.startConversation);

module.exports = router;
