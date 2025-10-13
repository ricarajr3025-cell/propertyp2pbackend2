const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const VehicleChat = require('../models/VehicleChat');

// GET historial de chat entre interesado y dueño del vehículo
router.get('/:chatId', auth, async (req, res) => {
  try {
    const chat = await VehicleChat.findOne({ chatId: req.params.chatId });
    res.json(chat ? chat.messages : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST mensaje en chat de vehículo
router.post('/:chatId', auth, async (req, res) => {
  try {
    const { message, receiver } = req.body;
    const chat = await VehicleChat.findOne({ chatId: req.params.chatId });
    const msg = {
      sender: req.user.id,
      receiver,
      message,
      timestamp: new Date()
    };
    if (chat) {
      chat.messages.push(msg);
      await chat.save();
    } else {
      await VehicleChat.create({
        chatId: req.params.chatId,
        messages: [msg]
      });
    }
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;