const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Ad = require('../models/Ad');

exports.listConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.session.user._id })
      .populate('participants')
      .populate('ad')
      .sort({ lastActivity: -1 });

    for (const conv of conversations) {
      conv.unreadCount = await Message.countDocuments({
        conversation: conv._id,
        sender: { $ne: req.session.user._id },
        isRead: false
      });
    }

    res.render('messages/index', {
      conversations,
      selectedConversation: null,
      messages: [],
      title: 'Messages'
    });
  } catch (err) {
    next(err);
  }
};

exports.startConversation = async (req, res, next) => {
  try {
    const { adId, recipientId } = req.body;
    if (!adId || !recipientId || !mongoose.Types.ObjectId.isValid(adId) || !mongoose.Types.ObjectId.isValid(recipientId)) {
      req.flash('error', 'Invalid conversation request.');
      return res.redirect('/ads');
    }
    const ad = await Ad.findById(adId);
    if (!ad) {
      req.flash('error', 'Ad not found.');
      return res.redirect('/ads');
    }

    let conversation = await Conversation.findOne({
      ad: adId,
      participants: { $all: [req.session.user._id, recipientId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        ad: adId,
        participants: [req.session.user._id, recipientId]
      });
    }

    res.redirect(`/messages/${conversation._id}`);
  } catch (err) {
    next(err);
  }
};

exports.viewConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId)
      .populate('participants')
      .populate('ad');

    if (!conversation) {
      return res.status(404).render('error', { message: 'Conversation not found', code: 404 });
    }

    // Authorization: only participants can view the conversation
    const isParticipant = conversation.participants.some(
      p => String(p._id) === String(req.session.user._id)
    );
    if (!isParticipant) {
      req.flash('error', 'Access denied.');
      return res.redirect('/messages');
    }

    const conversations = await Conversation.find({ participants: req.session.user._id })
      .populate('participants')
      .populate('ad')
      .sort({ lastActivity: -1 });

    for (const conv of conversations) {
      conv.unreadCount = await Message.countDocuments({
        conversation: conv._id,
        sender: { $ne: req.session.user._id },
        isRead: false
      });
    }

    const messages = await Message.find({ conversation: conversation._id })
      .populate('sender')
      .sort({ createdAt: 1 });

    await Message.updateMany(
      { conversation: conversation._id, sender: { $ne: req.session.user._id }, isRead: false },
      { isRead: true }
    );

    res.render('messages/index', {
      conversations,
      selectedConversation: conversation,
      messages,
      title: 'Messages'
    });
  } catch (err) {
    next(err);
  }
};
