const jwt = require('jsonwebtoken');
const Ad = require('../models/Ad');
const Category = require('../models/Category');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

exports.getAds = async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, page } = req.query;
    const LIMIT = 8;
    const currentPage = parseInt(page) || 1;
    const skip = (currentPage - 1) * LIMIT;

    const filter = { status: 'active' };
    if (q) filter.$text = { $search: q };
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const [ads, total] = await Promise.all([
      Ad.find(filter).populate('category seller').skip(skip).limit(LIMIT),
      Ad.countDocuments(filter)
    ]);

    return res.json({
      ads,
      total,
      page: currentPage,
      totalPages: Math.ceil(total / LIMIT)
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.getAdById = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id).populate('category seller');
    if (!ad) return res.status(404).json({ error: 'Ad not found' });

    await Ad.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    return res.json(ad);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.isBanned) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { user_id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.user_id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.startConversation = async (req, res) => {
  try {
    const { adId, recipientId } = req.body;
    if (!adId || !recipientId) {
      return res.status(400).json({ error: 'adId and recipientId are required' });
    }

    let conversation = await Conversation.findOne({
      ad: adId,
      participants: { $all: [req.user.user_id, recipientId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        ad: adId,
        participants: [req.user.user_id, recipientId]
      });
    }

    return res.json(conversation);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};
