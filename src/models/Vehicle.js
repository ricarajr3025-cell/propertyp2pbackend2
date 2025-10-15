const mongoose = require('mongoose');
const VehicleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  price: Number,
  images: [String],
  category: { 
    type: String, 
    enum: [
      'Auto', 'Moto', 'Camioneta', 'Camión', 'Bus', 'Bicicleta', 
      'Cuatrimoto', 'SUV', 'Pickup', 'Van', 'Tractor', 'Otro'
    ], 
    required: true 
  },
  location: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', VehicleSchema);
