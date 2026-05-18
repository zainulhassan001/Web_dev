const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter
});

// Middleware to resize and save images after multer
const processImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();

  const uploadDir = path.join(__dirname, '../../public/uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  req.processedImages = [];
  for (const file of req.files) {
    const filename = `ad-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
    await sharp(file.buffer)
      .resize(1200, 900, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(path.join(uploadDir, filename));
    req.processedImages.push(`/uploads/${filename}`);
  }
  next();
};

const processAvatar = async (req, res, next) => {
  if (!req.file) return next();

  const uploadDir = path.join(__dirname, '../../public/uploads/avatars');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const filename = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
  await sharp(req.file.buffer)
    .resize(300, 300, { fit: 'cover' })
    .webp({ quality: 85 })
    .toFile(path.join(uploadDir, filename));

  req.processedAvatar = `/uploads/avatars/${filename}`;
  next();
};

module.exports = { upload, processImages, processAvatar };
