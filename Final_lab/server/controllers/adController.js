const slugify = require('slugify');
const Ad = require('../models/Ad');
const Category = require('../models/Category');
const SiteSetting = require('../models/SiteSetting');
const Notification = require('../models/Notification');

const DEFAULT_CAMPUS_OPTIONS = [
  'Comsats Lahore campus',
  'Comsats Islamabad',
  'PUCIT',
  'UOL',
  'UMT'
];

const getCampusOptions = async () => {
  const settings = await SiteSetting.findOne();
  if (settings && settings.campusOptions && settings.campusOptions.length > 0) {
    return settings.campusOptions;
  }
  return DEFAULT_CAMPUS_OPTIONS;
};

exports.browse = async (req, res, next) => {
  try {
    const { q, category, minPrice, maxPrice, sort, page, campus } = req.query;

    const LIMIT = 8;
    const currentPage = parseInt(page) || 1;
    const skip = (currentPage - 1) * LIMIT;

    // Build filter object
    const now = new Date();
    const filter = {
      status: 'active',
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }]
    };

    if (q) filter.$text = { $search: q };
    if (category) filter.category = category;
    if (campus) filter.campus = campus;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Build sort object (featured first)
    let sortObj = { isFeatured: -1, featuredAt: -1, createdAt: -1 }; // default: newest
    if (sort === 'price_asc') sortObj = { isFeatured: -1, featuredAt: -1, price: 1 };
    if (sort === 'price_desc') sortObj = { isFeatured: -1, featuredAt: -1, price: -1 };
    if (sort === 'oldest') sortObj = { isFeatured: -1, featuredAt: -1, createdAt: 1 };

    const campusOptions = await getCampusOptions();
    const [ads, total, categories] = await Promise.all([
      Ad.find(filter).populate('category seller').sort(sortObj).skip(skip).limit(LIMIT),
      Ad.countDocuments(filter),
      Category.find({ isActive: true }).sort('displayOrder')
    ]);

    const totalPages = Math.ceil(total / LIMIT);

    res.render('ads/browse', {
      ads, categories, campusOptions, total, currentPage, totalPages,
      query: { q, category, minPrice, maxPrice, sort, campus },
      title: 'Browse Ads'
    });
  } catch (err) {
    next(err);
  }
};

exports.showPostForm = async (req, res, next) => {
  try {
    const [categories, campusOptions] = await Promise.all([
      Category.find({ isActive: true }).sort('displayOrder'),
      getCampusOptions()
    ]);
    res.render('ads/post', { categories, campusOptions, title: 'Post Ad' });
  } catch (err) {
    next(err);
  }
};

exports.createAd = async (req, res, next) => {
  try {
    const { title, description, price, category, condition, campus } = req.body;
    const images = req.processedImages || [];

    let slug = slugify(title, { lower: true, strict: true });
    const exists = await Ad.findOne({ slug });
    if (exists) slug = `${slug}-${Date.now()}`;

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await Ad.create({
      title,
      description,
      price,
      category,
      condition,
      images,
      campus: campus || req.session.user?.university || '',
      seller: req.session.user._id,
      slug,
      status: 'pending',
      expiresAt
    });

    req.flash('success', 'Ad submitted for review. It will appear once approved.');
    res.redirect('/user/my-ads');
  } catch (err) {
    next(err);
  }
};

exports.showAd = async (req, res, next) => {
  try {
    const ad = await Ad.findOne({ slug: req.params.slug }).populate('category seller');
    if (!ad) {
      return res.status(404).render('error', { message: 'Ad not found', code: 404 });
    }

    const isOwner = req.session.user && String(ad.seller?._id) === String(req.session.user._id);
    const isAdmin = req.session.user && req.session.user.role === 'admin';
    if (ad.expiresAt && ad.expiresAt < new Date() && !isOwner && !isAdmin) {
      return res.status(404).render('error', { message: 'Ad has expired', code: 404 });
    }

    await Ad.findByIdAndUpdate(ad._id, { $inc: { views: 1 } });
    res.render('ads/detail', { ad, title: ad.title });
  } catch (err) {
    next(err);
  }
};

exports.showEditForm = async (req, res, next) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) {
      return res.status(404).render('error', { message: 'Ad not found', code: 404 });
    }
    if (String(ad.seller) !== String(req.session.user._id)) {
      req.flash('error', 'Access denied.');
      return res.redirect('/ads');
    }

    const [categories, campusOptions] = await Promise.all([
      Category.find({ isActive: true }).sort('displayOrder'),
      getCampusOptions()
    ]);
    res.render('ads/edit', { ad, categories, campusOptions, title: 'Edit Ad' });
  } catch (err) {
    next(err);
  }
};

exports.updateAd = async (req, res, next) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) {
      return res.status(404).render('error', { message: 'Ad not found', code: 404 });
    }
    if (String(ad.seller) !== String(req.session.user._id)) {
      req.flash('error', 'Access denied.');
      return res.redirect('/ads');
    }

    const { title, description, price, category, condition, status, campus } = req.body;
    const images = req.processedImages || [];
    let slug = ad.slug;
    if (title && title !== ad.title) {
      slug = slugify(title, { lower: true, strict: true });
      const exists = await Ad.findOne({ slug, _id: { $ne: ad._id } });
      if (exists) slug = `${slug}-${Date.now()}`;
    }

    const update = { slug };
    if (title) update.title = title;
    if (description) update.description = description;
    if (price !== undefined) update.price = price;
    if (category) update.category = category;
    if (condition) update.condition = condition;
    if (campus !== undefined) update.campus = campus;
    if (status) update.status = status;
    if (images.length > 0) update.images = images;

    await Ad.findByIdAndUpdate(req.params.id, update);
    req.flash('success', 'Ad updated.');
    res.redirect(`/ads/${slug}`);
  } catch (err) {
    next(err);
  }
};

exports.deleteAd = async (req, res, next) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) {
      return res.status(404).render('error', { message: 'Ad not found', code: 404 });
    }
    const isOwner = String(ad.seller) === String(req.session.user._id);
    const isAdmin = req.session.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      req.flash('error', 'Access denied.');
      return res.redirect('/ads');
    }

    if (isAdmin && !isOwner) {
      await Notification.create({
        user: ad.seller,
        title: 'Ad removed',
        body: `Your ad "${ad.title}" was removed by an admin.`,
        link: ''
      });
    }

    await Ad.findByIdAndDelete(req.params.id);
    req.flash('success', 'Ad deleted.');
    res.redirect('/ads');
  } catch (err) {
    next(err);
  }
};

exports.myAds = async (req, res, next) => {
  try {
    const ads = await Ad.find({ seller: req.session.user._id }).sort({ createdAt: -1 });
    res.render('user/my-ads', { ads, title: 'My Ads' });
  } catch (err) {
    next(err);
  }
};

exports.getOnSaleAds = async (req, res, next) => {
  try {
    // Fetch all ads that are currently on sale (and active)
    const ads = await Ad.find({ 
      isOnSale: true,
      status: 'active'
    }).populate('category seller').sort({ createdAt: -1 });

    // Since we want client-side pagination, we pass all results at once
    res.render('ads/onsale', { ads, title: 'On-Sale Products' });
  } catch (err) {
    next(err);
  }
};
