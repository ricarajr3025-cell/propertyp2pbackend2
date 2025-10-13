const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const RentalChat = require('../models/RentalChat');

// GET historial de chat entre interesado y rentista
router.get('/:chatId', auth, async (req, res) => {
  try {
    const chat = await RentalChat.findOne({ chatId: req.params.chatId });
    res.json(chat ? chat.messages : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
