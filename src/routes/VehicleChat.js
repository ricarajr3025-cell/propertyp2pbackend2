const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const VehicleChat = require('../models/VehicleChat');
const mongoose = require('mongoose');

// GET historial de chat entre interesado y dueño del vehículo
router.get('/:chatId', auth, async (req, res) => {
  try {
    const chat = await VehicleChat.findOne({ chatId: req.params.chatId });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    // Seguridad: solo user o owner puede leer
    if (!chat.user.equals(req.user._id) && !chat.owner.equals(req.user._id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(chat.messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST mensaje en chat de vehículo
router.post('/:chatId', auth, async (req, res) => {
  try {
    const { message, receiver, vehicleId } = req.body;
    if (!message || !receiver) return res.status(400).json({ error: 'Message and receiver required' });
    const chat = await VehicleChat.findOne({ chatId: req.params.chatId });
    const msg = {
      sender: req.user._id,
      receiver: mongoose.Types.ObjectId(receiver),
      message,
      timestamp: new Date()
    };
    if (chat) {
      if (!chat.user) chat.user = req.user._id;
      if (!chat.owner) chat.owner = mongoose.Types.ObjectId(receiver);
      chat.messages.push(msg);
      await chat.save();
    } else {
      if (!vehicleId) return res.status(400).json({ error: 'vehicleId required for new chat' });
      await VehicleChat.create({
        chatId: req.params.chatId,
        vehicle: mongoose.Types.ObjectId(vehicleId),
        user: req.user._id,
        owner: mongoose.Types.ObjectId(receiver),
        messages: [msg]
      });
    }
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET lista de chats del usuario (comprador/vendedor)
router.get('/list', auth, async (req, res) => {
  try {
    const userId = mongoose.Types.ObjectId(req.user._id);
    const chats = await VehicleChat.find({
      $or: [
        { user: userId },
        { owner: userId }
      ]
    }).populate("user owner vehicle");
    const mapped = chats.map(chat => ({
      chatId: chat.chatId,
      vehicle: chat.vehicle,
      otherUser: chat.owner._id.equals(userId) ? chat.user : chat.owner
    }));
    res.json(mapped);
  } catch (err) {
    console.error('Error en /list:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;