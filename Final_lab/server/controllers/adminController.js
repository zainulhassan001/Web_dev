const slugify = require('slugify');
const User = require('../models/User');
const Ad = require('../models/Ad');
const Category = require('../models/Category');
const Message = require('../models/Message');
const SiteSetting = require('../models/SiteSetting');
const Notification = require('../models/Notification');

exports.dashboard = async (req, res, next) => {
  try {
    const [totalUsers, totalAds, activeAds, pendingAds, totalMessages, recentUsers] = await Promise.all([
      User.countDocuments(),
      Ad.countDocuments(),
      Ad.countDocuments({ status: 'active' }),
      Ad.countDocuments({ status: 'pending' }),
      Message.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5)
    ]);

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      stats: { totalUsers, totalAds, activeAds, pendingAds, totalMessages },
      recentUsers,
      active: 'dashboard'
    });
  } catch (err) {
    next(err);
  }
};

exports.users = async (req, res, next) => {
  try {
    const q = req.query.q || '';
    const filter = q ? {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    } : {};

    const users = await User.find(filter).sort({ createdAt: -1 });
    res.render('admin/users', { users, q, title: 'Manage Users', active: 'users' });
  } catch (err) {
    next(err);
  }
};

exports.toggleBan = async (req, res, next) => {
  try {
    if (String(req.params.id) === String(req.session.user._id)) {
      req.flash('error', 'You cannot ban your own account.');
      return res.redirect('/admin/users');
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/admin/users');
    }

    user.isBanned = !user.isBanned;
    await user.save();
    req.flash('success', 'User status updated.');
    res.redirect('/admin/users');
  } catch (err) {
    next(err);
  }
};

exports.toggleRole = async (req, res, next) => {
  try {
    if (String(req.params.id) === String(req.session.user._id)) {
      req.flash('error', 'You cannot change your own role.');
      return res.redirect('/admin/users');
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/admin/users');
    }

    user.role = user.role === 'admin' ? 'customer' : 'admin';
    await user.save();
    req.flash('success', 'User role updated.');
    res.redirect('/admin/users');
  } catch (err) {
    next(err);
  }
};

exports.ads = async (req, res, next) => {
  try {
    const status = req.query.status || 'pending';
    const filter = status === 'all' ? {} : { status };
    const ads = await Ad.find(filter).populate('category seller').sort({ createdAt: -1 });
    res.render('admin/ads', { ads, status, title: 'Manage Ads', active: 'ads' });
  } catch (err) {
    next(err);
  }
};

exports.updateAdStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const reason = (req.body.reason || '').trim();
    const ad = await Ad.findById(req.params.id).populate('seller');
    if (!ad) {
      req.flash('error', 'Ad not found.');
      return res.redirect('/admin/ads');
    }

    if (status === 'removed' && !reason) {
      req.flash('error', 'Removal reason is required.');
      return res.redirect('/admin/ads');
    }

    const prevStatus = ad.status;
    ad.status = status;
    await ad.save();

    if (ad.seller && prevStatus !== status) {
      let title = 'Ad status updated';
      let body = `Your ad "${ad.title}" is now ${status}.`;
      if (status === 'active') {
        title = 'Ad approved';
        body = `Your ad "${ad.title}" has been approved and is now live.`;
      }
      if (status === 'removed') {
        title = 'Ad removed';
        body = `Your ad "${ad.title}" was removed by an admin. Reason: ${reason}`;
      }
      await Notification.create({
        user: ad.seller._id,
        title,
        body,
        link: ad.slug ? `/ads/${ad.slug}` : ''
      });
    }
    req.flash('success', 'Ad status updated.');
    res.redirect('/admin/ads');
  } catch (err) {
    next(err);
  }
};

exports.deleteAd = async (req, res, next) => {
  try {
    const ad = await Ad.findById(req.params.id).populate('seller');
    if (!ad) {
      req.flash('error', 'Ad not found.');
      return res.redirect('/admin/ads');
    }

    const reason = (req.body.reason || '').trim();
    if (!reason) {
      req.flash('error', 'Removal reason is required.');
      return res.redirect('/admin/ads');
    }

    if (ad.seller) {
      await Notification.create({
        user: ad.seller._id,
        title: 'Ad removed',
        body: `Your ad "${ad.title}" was removed by an admin. Reason: ${reason}`,
        link: ''
      });
    }

    await Ad.findByIdAndDelete(req.params.id);
    req.flash('success', 'Ad deleted.');
    res.redirect('/admin/ads');
  } catch (err) {
    next(err);
  }
};

exports.toggleFeatured = async (req, res, next) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) {
      req.flash('error', 'Ad not found.');
      return res.redirect('/admin/ads');
    }

    ad.isFeatured = !ad.isFeatured;
    ad.featuredAt = ad.isFeatured ? new Date() : null;
    await ad.save();

    req.flash('success', ad.isFeatured ? 'Ad featured.' : 'Ad unfeatured.');
    res.redirect('/admin/ads');
  } catch (err) {
    next(err);
  }
};

exports.categories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort('displayOrder');
    res.render('admin/categories', { categories, title: 'Categories', active: 'categories' });
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, icon, displayOrder } = req.body;
    const slug = slugify(name, { lower: true, strict: true });
    await Category.create({ name, icon, displayOrder, slug });
    req.flash('success', 'Category created.');
    res.redirect('/admin/categories');
  } catch (err) {
    next(err);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { name, icon, displayOrder, isActive } = req.body;
    const slug = slugify(name, { lower: true, strict: true });
    await Category.findByIdAndUpdate(req.params.id, {
      name,
      icon,
      displayOrder,
      isActive: isActive === 'on',
      slug
    });
    req.flash('success', 'Category updated.');
    res.redirect('/admin/categories');
  } catch (err) {
    next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const Ad = require('../models/Ad');
    const adCount = await Ad.countDocuments({ category: req.params.id });
    if (adCount > 0) {
      req.flash('error', `Cannot delete: ${adCount} ad(s) still use this category. Reassign them first.`);
      return res.redirect('/admin/categories');
    }
    await Category.findByIdAndDelete(req.params.id);
    req.flash('success', 'Category deleted.');
    res.redirect('/admin/categories');
  } catch (err) {
    next(err);
  }
};


exports.analytics = async (req, res, next) => {
  try {
    const data = await Ad.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $project: { name: '$category.name', count: 1 } }
    ]);

    res.render('admin/analytics', {
      title: 'Analytics',
      active: 'analytics',
      chartLabels: data.map(d => d.name),
      chartValues: data.map(d => d.count)
    });
  } catch (err) {
    next(err);
  }
};

exports.settings = async (req, res, next) => {
  try {
    const settings = await SiteSetting.findOne() || await SiteSetting.create({});
    res.render('admin/settings', { settings, title: 'Settings', active: 'settings' });
  } catch (err) {
    next(err);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const { siteName, maintenanceMode, announcementBanner, contactEmail, allowNewRegistrations, campusOptions } = req.body;
    const campuses = (campusOptions || '')
      .split('\n')
      .map(item => item.trim())
      .filter(Boolean);
    await SiteSetting.findOneAndUpdate({}, {
      siteName,
      maintenanceMode: maintenanceMode === 'on',
      announcementBanner,
      contactEmail,
      allowNewRegistrations: allowNewRegistrations === 'on',
      campusOptions: campuses
    }, { upsert: true });

    req.flash('success', 'Settings updated.');
    res.redirect('/admin/settings');
  } catch (err) {
    next(err);
  }
};
