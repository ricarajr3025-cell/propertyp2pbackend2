const mongoose = require('mongoose');

const VehicleChatSchema = new mongoose.Schema({
  chatId: { 
    type: String, 
    unique: true, 
    required: true,
    index: true 
  },
  vehicle: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vehicle', 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  messages: [
    {
      sender: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
      },
      receiver: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
      },
      message: { 
        type: String 
      },
      // ✅ NUEVO: Soporte para archivos adjuntos
      file: {
        filename: String,
        originalname: String,
        mimetype: String,
        size: Number,
        path: String,
        url: String
      },
      timestamp: { 
        type: Date, 
        default: Date.now 
      },
      read: {
        type: Boolean,
        default: false
      }
    }
  ],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

VehicleChatSchema.index({ user: 1, owner: 1 });
VehicleChatSchema.index({ vehicle: 1 });

VehicleChatSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('VehicleChat', VehicleChatSchema);
