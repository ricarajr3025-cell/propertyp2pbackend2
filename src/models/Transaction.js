const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  property: { 
    type: mongoose.Schema.Types.ObjectId, 
    refPath: 'propertyModel',
    required: true
  },
  propertyModel: { 
    type: String, 
    enum: ['Property', 'RentalProperty', 'Vehicle'], 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['venta', 'alquiler'], 
    required: true 
  },
  buyer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  seller: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  // ✅ NUEVOS CAMPOS
  offerPrice: { 
    type: Number, 
    required: true 
  },
  currency: { 
    type: String, 
    default: 'COP',
    enum: ['COP', 'USD', 'EUR']
  },
  status: {
    type: String,
    enum: [
      'pending_validation',  // ✅ NUEVO: Esperando validación inicial
      'pending',            // Esperando pago
      'paid',               // Pagado
      'in_escrow',          // Fondos en escrow
      'completed',          // Completado
      'appealed',           // Apelado
      'cancelled'           // Cancelado
    ],
    default: 'pending_validation'
  },
  paid: { 
    type: Boolean, 
    default: false 
  },
  escrow: { 
    type: Boolean, 
    default: true 
  },
  // ✅ NUEVO: Información de pago
  paymentInfo: {
    method: String,           // 'bank_transfer', 'crypto', 'cash'
    transactionId: String,    // ID de transacción externa
    paymentDate: Date,
    receiptUrl: String
  },
  // ✅ NUEVO: Fechas importantes
  validatedAt: Date,
  paidAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  // Chat history
  chatHistory: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    file: {
      originalname: String,
      mimetype: String,
      url: String,
      size: Number
    },
    timestamp: { type: Date, default: Date.now }
  }],
  // Sistema de apelaciones
  appeal: {
    status: { 
      type: String, 
      enum: ['none', 'pending', 'resolved'], 
      default: 'none' 
    },
    reason: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolution: String,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: Date,
    resolvedAt: Date
  },
  // ✅ NUEVO: Notificaciones
  notifications: [{
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Índices para búsquedas rápidas
TransactionSchema.index({ buyer: 1, status: 1 });
TransactionSchema.index({ seller: 1, status: 1 });
TransactionSchema.index({ property: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
