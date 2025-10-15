const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const PropertyChat = require('../models/PropertyChat');
const Property = require('../models/Property');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname, '../../uploads/chat'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'property-chat-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = function(io) {
  
  // ============================================
  // CREAR O RECUPERAR CHAT (desde propiedad)
  // ============================================
  router.post('/start/:propertyId', auth, async (req, res) => {
    try {
      const property = await Property.findById(req.params.propertyId).populate('owner');

      if (!property) {
        return res.status(404).json({ error: 'Propiedad no encontrada' });
      }

      if (property.owner._id.toString() === req.user.id.toString()) {
        return res.status(400).json({ error: 'No puedes contactarte a ti mismo' });
      }

      const chatId = `property_${property._id}_${req.user.id}_${property.owner._id}`;
      let chat = await PropertyChat.findOne({ chatId });

      if (!chat) {
        chat = new PropertyChat({
          chatId,
          property: property._id,
          user: req.user.id,
          owner: property.owner._id,
          messages: []
        });
        await chat.save();
        console.log('✅ Nuevo chat de propiedad creado:', chatId);
      }

      chat = await PropertyChat.findOne({ chatId })
        .populate('property')
        .populate('user', 'name email avatar')
        .populate('owner', 'name email avatar');

      res.json(chat);
    } catch (err) {
      console.error('❌ Error al iniciar chat:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================
  // OBTENER CHAT POR CHAT ID
  // ============================================
  router.get('/:chatId', auth, async (req, res) => {
    try {
      const chat = await PropertyChat.findOne({ chatId: req.params.chatId })
        .populate('property')
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

  // ============================================
  // OBTENER TODOS LOS CHATS DEL USUARIO
  // ============================================
  router.get('/', auth, async (req, res) => {
    try {
      const chats = await PropertyChat.find({
        $or: [{ user: req.user.id }, { owner: req.user.id }]
      })
        .populate('property')
        .populate('user', 'name email avatar')
        .populate('owner', 'name email avatar')
        .sort({ updatedAt: -1 });

      console.log(`✅ ${chats.length} chats de propiedades encontrados`);
      res.json(chats);
    } catch (err) {
      console.error('❌ Error al obtener chats:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================
  // ENVIAR MENSAJE CON ARCHIVO
  // ============================================
  router.post('/:chatId/message', auth, upload.single('file'), async (req, res) => {
    try {
      const { message } = req.body;
      const file = req.file;

      if (!message?.trim() && !file) {
        return res.status(400).json({ error: 'Debes enviar un mensaje o un archivo' });
      }

      const chat = await PropertyChat.findOne({ chatId: req.params.chatId });

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

      io.to(req.params.chatId).emit('receive_property_message', {
        chatId: req.params.chatId,
        message: newMessage
      });

      console.log('✅ Mensaje de propiedad enviado:', { chatId: req.params.chatId });
      res.json(newMessage);
    } catch (err) {
      console.error('❌ Error al enviar mensaje:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================
  // ✅ NUEVO: OBTENER O CREAR CHAT (desde transacciones)
  // ============================================
  router.post('/get-or-create', auth, async (req, res) => {
    try {
      const { chatId, propertyId, ownerId } = req.body;

      if (!chatId || !propertyId || !ownerId) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos: chatId, propertyId, ownerId' });
      }

      console.log('🔍 Buscando/creando chat:', { chatId, propertyId, ownerId, userId: req.user.id });

      let chat = await PropertyChat.findOne({ chatId });

      if (!chat) {
        // Crear el chat si no existe
        const property = await Property.findById(propertyId).populate('owner');

        if (!property) {
          return res.status(404).json({ error: 'Propiedad no encontrada' });
        }

        // Determinar quién es user y quién es owner
        const userId = req.user.id === ownerId ? ownerId : req.user.id;
        const ownerIdFinal = ownerId;

        chat = new PropertyChat({
          chatId,
          property: propertyId,
          user: userId === ownerIdFinal ? userId : req.user.id,
          owner: ownerIdFinal,
          messages: []
        });
        await chat.save();
        console.log('✅ Nuevo chat creado desde transacción:', chatId);
      } else {
        console.log('✅ Chat existente recuperado:', chatId);
      }

      // Poblar datos completos
      chat = await PropertyChat.findOne({ chatId })
        .populate('property')
        .populate('user', 'name email avatar')
        .populate('owner', 'name email avatar');

      res.json(chat);
    } catch (err) {
      console.error('❌ Error al obtener/crear chat:', err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
