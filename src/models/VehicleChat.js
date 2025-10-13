const mongoose = require('mongoose');
const VehicleChatSchema = new mongoose.Schema({
  chatId: { type: String, unique: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  messages: [
    {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      message: String,
      timestamp: Date
    }
  ]
});
module.exports = mongoose.model('VehicleChat', VehicleChatSchema);