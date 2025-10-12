const mongoose = require('mongoose');
const PropertySchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  description: String,
  price: Number,
  location: String,
  propertyType: {
    type: String,
    enum: ['Casa', 'Lote', 'Apartamento', 'Edificio', 'Local Comercial', 'Bodega' ],
    required: true
  },
  images: [String],
  available: { type: Boolean, default: true }
});
module.exports = mongoose.model('Property', PropertySchema);
