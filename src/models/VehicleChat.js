const mongoose = require('mongoose');

const VehicleChatSchema = new mongoose.Schema({
  chatId: { type: String, unique: true, required: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  messages: [
    {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      message: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Actualizar updatedAt antes de guardar
VehicleChatSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('VehicleChat', VehicleChatSchema);