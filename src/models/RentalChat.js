const mongoose = require('mongoose');
const RentalChatSchema = new mongoose.Schema({
  chatId: { type: String, unique: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'RentalProperty' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Interesado
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Rentista
  messages: [
    {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      message: String,
      timestamp: Date
    }
  ]
});
module.exports = mongoose.model('RentalChat', RentalChatSchema);
