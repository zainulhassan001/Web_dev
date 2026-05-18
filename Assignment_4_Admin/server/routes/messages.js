const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const isLoggedIn = require('../middleware/isLoggedIn');

router.get('/', isLoggedIn, messageController.listConversations);
router.post('/conversations', isLoggedIn, messageController.startConversation);
router.get('/:conversationId', isLoggedIn, messageController.viewConversation);

module.exports = router;
