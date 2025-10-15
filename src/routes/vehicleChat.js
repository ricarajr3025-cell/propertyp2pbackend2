const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const VehicleChat = require('../models/VehicleChat');
const Vehicle = require('../models/Vehicle');
const multer = require('multer');
const path = require('path');

// ✅ CONFIGURACIÓN DE MULTER PARA ARCHIVOS
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname, '../../uploads/chat'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'chat-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Permitir imágenes y documentos
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo imágenes y documentos.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // Límite de 10MB
});

module.exports = function(io) {
  
  // Crear o recuperar chat existente
  router.post('/start/:vehicleId', auth, async (req, res) => {
    try {
      const vehicle = await Vehicle.findById(req.params.vehicleId).populate('owner');
      
      if (!vehicle) {
        return res.status(404).json({ error: 'Vehículo no encontrado' });
      }

      if (vehicle.owner._id.toString() === req.user.id.toString()) {
        return res.status(400).json({ error: 'No puedes contactarte a ti mismo' });
      }

      const chatId = `${vehicle._id}_${req.user.id}_${vehicle.owner._id}`;
      let chat = await VehicleChat.findOne({ chatId });

      if (!chat) {
        chat = new VehicleChat({
          chatId,
          vehicle: vehicle._id,
          user: req.user.id,
          owner: vehicle.owner._id,
          messages: []
        });
        await chat.save();
        console.log('✅ Nuevo chat creado:', chatId);
      }

      chat = await VehicleChat.findOne({ chatId })
        .populate('vehicle')
        .populate('user', 'name email avatar')
        .populate('owner', 'name email avatar');

      res.json(chat);
    } catch (err) {
      console.error('❌ Error al iniciar chat:', err);
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

      const isParticipant = 
        chat.user._id.toString() === req.user.id.toString() ||
        chat.owner._id.toString() === req.user.id.toString();

      if (!isParticipant) {
        return res.status(403).json({ error: 'No tienes acceso a este chat' });
      }

      res.json(chat);
    } catch (err) {
      console.error('❌ Error al obtener chat:', err);
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
        .sort({ updatedAt: -1 });

      console.log(`✅ ${chats.length} chats encontrados para usuario ${req.user.id}`);
      res.json(chats);
    } catch (err) {
      console.error('❌ Error al obtener chats:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // ✅ NUEVO: Enviar mensaje con archivo adjunto
  router.post('/:chatId/message', auth, upload.single('file'), async (req, res) => {
    try {
      const { message } = req.body;
      const file = req.file;

      // Validar que haya al menos un mensaje o un archivo
      if (!message?.trim() && !file) {
        return res.status(400).json({ error: 'Debes enviar un mensaje o un archivo' });
      }

      const chat = await VehicleChat.findOne({ chatId: req.params.chatId });

      if (!chat) {
        return res.status(404).json({ error: 'Chat no encontrado' });
      }

      const isParticipant = 
        chat.user.toString() === req.user.id.toString() ||
        chat.owner.toString() === req.user.id.toString();

      if (!isParticipant) {
        return res.status(403).json({ error: 'No tienes acceso a este chat' });
      }

      const receiver = chat.user.toString() === req.user.id.toString() 
        ? chat.owner 
        : chat.user;

      const newMessage = {
        sender: req.user.id,
        receiver: receiver,
        message: message?.trim() || '',
        timestamp: new Date()
      };

      // ✅ Agregar información del archivo si existe
      if (file) {
        newMessage.file = {
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          url: `uploads/chat/${file.filename}`
        };
      }

      chat.messages.push(newMessage);
      chat.updatedAt = new Date();
      await chat.save();

      // Emitir mensaje por Socket.io
      io.to(req.params.chatId).emit('receive_vehicle_message', {
        chatId: req.params.chatId,
        message: newMessage
      });

      console.log('✅ Mensaje enviado:', { 
        chatId: req.params.chatId, 
        sender: req.user.id,
        hasFile: !!file
      });
      
      res.json(newMessage);
    } catch (err) {
      console.error('❌ Error al enviar mensaje:', err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
