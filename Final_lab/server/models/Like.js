const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ad: { type: mongoose.Schema.Types.ObjectId, ref: 'Ad', required: true }
}, { timestamps: true });

likeSchema.index({ user: 1, ad: 1 }, { unique: true });

module.exports = mongoose.model('Like', likeSchema);
