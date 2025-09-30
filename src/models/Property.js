const mongoose = require('mongoose');
const PropertySchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  description: String,
  price: Number,
  location: String,
  images: [String],
  available: { type: Boolean, default: true }
});
module.exports = mongoose.model('Property', PropertySchema);
