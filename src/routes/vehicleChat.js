const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const VehicleChat = require('../models/VehicleChat');
const Vehicle = require('../models/Vehicle');

module.exports = function(io) {
  // Crear o recuperar un chat existente
  router.post('/start/:vehicleId', auth, async (req, res) => {
    try {
      const vehicle = await Vehicle.findById(req.params.vehicleId).populate('owner');
      if (!vehicle) {
        return res.status(404).json({ error: 'Vehículo no encontrado' });
      }

      // Evitar que el dueño se contacte a sí mismo
      if (vehicle.owner._id.toString() === req.user.id.toString()) {
        return res.status(400).json({ error: 'No puedes contactarte a ti mismo' });
      }

      // Crear chatId único: vehicleId_userId_ownerId
      const chatId = `${vehicle._id}_${req.user.id}_${vehicle.owner._id}`;
      let chat = await VehicleChat.findOne({ chatId });

      if (!chat) {
        // Crear nuevo chat
        chat = new VehicleChat({
          chatId,
          vehicle: vehicle._id,
          user: req.user.id,
          owner: vehicle.owner._id,
          messages: []
        });
        await chat.save();
      }

      // Poblar datos completos
      chat = await VehicleChat.findOne({ chatId })
        .populate('vehicle')
        .populate('user', 'name email avatar')
        .populate('owner', 'name email avatar');

      res.json(chat);
    } catch (err) {
      console.error('Error al iniciar chat:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Obtener historial de chat
  router.get('/:chatId', auth, async (req, res) => {
    try {
      const chat = await VehicleChat.findOne({ chatId: req.params.chatId })
        .populate('vehicle')
        .populate('user', 'name email avatar')
        .populate('owner', 'name email avatar')
        .populate('messages.sender', 'name avatar')
        .populate('messages.receiver', 'name avatar');

      if (!chat) {
        return res.status(404).json({ error: 'Chat no encontrado' });
      }

      // Verificar que el usuario autenticado sea parte del chat
      const isParticipant = 
        chat.user._id.toString() === req.user.id.toString() ||
        chat.owner._id.toString() === req.user.id.toString();

      if (!isParticipant) {
        return res.status(403).json({ error: 'No tienes acceso a este chat' });
      }

      res.json(chat);
    } catch (err) {
      console.error('Error al obtener chat:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Obtener todos los chats del usuario
  router.get('/', auth, async (req, res) => {
    try {
      const chats = await VehicleChat.find({
        $or: [{ user: req.user.id }, { owner: req.user.id }]
      })
        .populate('vehicle')
        .populate('user', 'name email avatar')
        .populate('owner', 'name email avatar')
        .sort({ 'messages.timestamp': -1 });

      res.json(chats);
    } catch (err) {
      console.error('Error al obtener chats:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Enviar mensaje (HTTP)
  router.post('/:chatId/message', auth, async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
      }

      const chat = await VehicleChat.findOne({ chatId: req.params.chatId });

      if (!chat) {
        return res.status(404).json({ error: 'Chat no encontrado' });
      }

      // Verificar que el usuario sea parte del chat
      const isParticipant = 
        chat.user.toString() === req.user.id.toString() ||
        chat.owner.toString() === req.user.id.toString();

      if (!isParticipant) {
        return res.status(403).json({ error: 'No tienes acceso a este chat' });
      }

      // Determinar el receptor
      const receiver = chat.user.toString() === req.user.id.toString() 
        ? chat.owner 
        : chat.user;

      const newMessage = {
        sender: req.user.id,
        receiver: receiver,
        message: message.trim(),
        timestamp: new Date()
      };

      chat.messages.push(newMessage);
      await chat.save();

      // Emitir mensaje por Socket.io
      io.to(req.params.chatId).emit('receive_vehicle_message', {
        chatId: req.params.chatId,
        message: newMessage
      });

      res.json(newMessage);
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};