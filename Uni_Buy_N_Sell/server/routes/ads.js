const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const adController = require('../controllers/adController');
const isLoggedIn = require('../middleware/isLoggedIn');
const { upload, processImages } = require('../middleware/upload');

// Validation rules for ad creation/editing
const adValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Description is required (max 2000 characters)'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category')
    .isMongoId()
    .withMessage('Please select a valid category'),
  body('condition')
    .isIn(['new', 'like-new', 'good', 'fair', 'poor'])
    .withMessage('Please select a valid condition')
];

// Middleware to handle validation results
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    return res.redirect('back');
  }
  next();
};

router.get('/', adController.browse);
router.get('/post', isLoggedIn, adController.showPostForm);
router.post('/', isLoggedIn, upload.array('images', 5), processImages, adValidation, handleValidation, adController.createAd);
router.get('/:slug', adController.showAd);
router.get('/:id/edit', isLoggedIn, adController.showEditForm);
router.post('/:id/edit', isLoggedIn, upload.array('images', 5), processImages, adValidation, handleValidation, adController.updateAd);
router.post('/:id/delete', isLoggedIn, adController.deleteAd);

module.exports = router;

