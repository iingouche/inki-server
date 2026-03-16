const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    previewImage: { type: String },
    videoUrl: { type: String },
    price: { type: Number, default: 0 },
    isPaid: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Movie', movieSchema);