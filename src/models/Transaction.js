const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, refPath: 'propertyModel' }, // <-- refPath!
  propertyModel: { type: String, enum: ['Property', 'RentalProperty'], required: true }, // <-- modelo de propiedad
  type: { type: String, enum: ['venta', 'alquiler'], required: true }, // <-- tipo de transacción
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['pending', 'paid', 'completed', 'appealed', 'cancelled'],
    default: 'pending'
  },
  paid: { type: Boolean, default: false },
  escrow: { type: Boolean, default: true },
  chatHistory: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    file: {
      originalname: String,
      mimetype: String,
      url: String,
      size: Number
    },
    timestamp: Date
  }],
  appeal: {
    status: { type: String, enum: ['none', 'pending', 'resolved'], default: 'none' },
    reason: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolution: String,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: Date,
    resolvedAt: Date
  }
});

module.exports = mongoose.model('Transaction', TransactionSchema);