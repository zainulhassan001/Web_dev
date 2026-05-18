const express = require('express');
const router = express.Router();
const isLoggedIn = require('../middleware/isLoggedIn');
const Like = require('../models/Like');
const Ad = require('../models/Ad');
const Notification = require('../models/Notification');

router.post('/likes/:adId/toggle', isLoggedIn, async (req, res) => {
  const { adId } = req.params;
  const userId = req.session.user._id;

  try {
    // Atomic: try to remove existing like in one operation
    const removed = await Like.findOneAndDelete({ user: userId, ad: adId });
    if (removed) {
      await Ad.findByIdAndUpdate(adId, { $inc: { likesCount: -1 } });
      return res.json({ liked: false });
    }

    // No existing like — create one (use unique index to prevent duplicates)
    try {
      await Like.create({ user: userId, ad: adId });
    } catch (dupErr) {
      // If a duplicate key error fires (concurrent request), treat as already liked
      if (dupErr.code === 11000) return res.json({ liked: true });
      throw dupErr;
    }
    const ad = await Ad.findByIdAndUpdate(adId, { $inc: { likesCount: 1 } }, { new: true });
    if (ad && String(ad.seller) !== String(userId)) {
      await Notification.create({
        user: ad.seller,
        title: 'New like on your ad',
        body: `Someone liked "${ad.title}".`,
        link: ad.slug ? `/ads/${ad.slug}` : ''
      });
    }
    return res.json({ liked: true });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.get('/user/liked-ads', isLoggedIn, async (req, res, next) => {
  try {
    const likes = await Like.find({ user: req.session.user._id }).populate({
      path: 'ad',
      populate: ['category', 'seller']
    });
    const ads = likes.map(like => like.ad).filter(Boolean);
    res.render('user/liked-ads', { ads, title: 'Saved Ads' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
