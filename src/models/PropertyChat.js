const mongoose = require('mongoose');

const PropertyChatSchema = new mongoose.Schema({
  chatId: { 
    type: String, 
    unique: true, 
    required: true,
    index: true 
  },
  property: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Property', 
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

PropertyChatSchema.index({ user: 1, owner: 1 });
PropertyChatSchema.index({ property: 1 });

PropertyChatSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('PropertyChat', PropertyChatSchema);
