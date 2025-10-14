require('dotenv').config();
const express = require('express');
const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const portfinder = require('portfinder');
const path = require('path');
const Transaction = require('./models/Transaction');
const RentalChat = require('./models/RentalChat');
const VehicleChat = require('./models/VehicleChat');

// Servir archivos subidos de la carpeta uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Servir /public estático
app.use(express.static(path.join(__dirname, '..', 'public'), { index: 'index.html' }));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// --- SOCKET.IO EVENTS ---
io.on('connection', (socket) => {
  console.log('🔌 Usuario conectado:', socket.id);

  // Transacciones de venta/alquiler (ya existentes)
  socket.on('join-transaction', async ({ transactionId, userId }) => {
    const tx = await Transaction.findById(transactionId);
    if (tx && (tx.buyer.toString() === userId || tx.seller.toString() === userId)) {
      socket.join(transactionId);
      console.log(`Usuario ${socket.id} se unió a la transacción ${transactionId}`);
    } else {
      socket.emit('error', 'Acceso denegado a esta transacción');
    }
  });

  socket.on('chat:message', async ({ transactionId, message, sender }) => {
    if (transactionId && message && sender) {
      const tx = await Transaction.findById(transactionId);
      if (tx && (tx.buyer.toString() === sender || tx.seller.toString() === sender)) {
        const chatMsg = { sender, message, timestamp: new Date() };
        tx.chatHistory.push(chatMsg);
        await tx.save();
        io.to(transactionId).emit('chat:message', { transactionId, ...chatMsg });
        console.log('Mensaje enviado y guardado', { transactionId, sender, message });
      } else {
        socket.emit('error', 'No autorizado para enviar mensajes en esta transacción');
      }
    } else {
      console.log('Datos de mensaje inválidos:', { transactionId, message, sender });
    }
  });

  // --- Chat entre interesado y rentista antes de la transacción ---
  socket.on('join-rental-chat', async ({ chatId }) => {
    socket.join(chatId);
    console.log(`Usuario ${socket.id} se unió al chat de alquiler ${chatId}`);
  });

  socket.on('rental-chat:message', async ({ chatId, sender, receiver, message }) => {
    const chatMsg = {
      sender,
      receiver,
      message,
      timestamp: new Date()
    };
    let chat = await RentalChat.findOne({ chatId });
    if (chat) {
      chat.messages.push(chatMsg);
      await chat.save();
    } else {
      await RentalChat.create({
        chatId,
        messages: [chatMsg]
      });
    }
    io.to(chatId).emit("rental-chat:message", chatMsg);
  });

  // ============================================
  // 🚗 CHAT DE VEHÍCULOS EN TIEMPO REAL
  // ============================================
  
  // Unirse a sala de chat de vehículo
  socket.on('join_vehicle_chat', (chatId) => {
    socket.join(chatId);
    console.log(`👤 Usuario ${socket.id} se unió al chat de vehículo: ${chatId}`);
  });

  // Enviar mensaje en chat de vehículo
  socket.on('send_vehicle_message', async (data) => {
    try {
      const { chatId, message, senderId, receiverId } = data;
      
      if (!chatId || !message || !senderId) {
        console.error('❌ Datos incompletos:', data);
        return;
      }

      const chatMsg = {
        sender: senderId,
        receiver: receiverId,
        message,
        timestamp: new Date()
      };

      // Buscar o crear el chat
      let chat = await VehicleChat.findOne({ chatId });
      
      if (chat) {
        chat.messages.push(chatMsg);
        await chat.save();
      } else {
        await VehicleChat.create({
          chatId,
          messages: [chatMsg]
        });
      }

      // Emitir el mensaje a todos en la sala
      io.to(chatId).emit('receive_vehicle_message', {
        chatId,
        message: chatMsg
      });

      console.log('✅ Mensaje de vehículo enviado:', { chatId, senderId, message });
    } catch (err) {
      console.error('❌ Error al enviar mensaje de vehículo:', err);
      socket.emit('error', { message: 'Error al enviar mensaje' });
    }
  });

  // Usuario está escribiendo
  socket.on('user_typing', (data) => {
    const { chatId, userId, isTyping } = data;
    socket.to(chatId).emit('user_typing', {
      chatId,
      userId,
      isTyping
    });
  });

  // Compatibilidad con evento anterior (vehicle-chat:message)
  socket.on('vehicle-chat:message', async ({ chatId, sender, receiver, message }) => {
    const chatMsg = {
      sender,
      receiver,
      message,
      timestamp: new Date()
    };
    let chat = await VehicleChat.findOne({ chatId });
    if (chat) {
      chat.messages.push(chatMsg);
      await chat.save();
    } else {
      await VehicleChat.create({
        chatId,
        messages: [chatMsg]
      });
    }
    io.to(chatId).emit("vehicle-chat:message", chatMsg);
    console.log('Mensaje enviado y guardado en vehículo', { chatId, sender, receiver, message });
  });

  socket.on('disconnect', () => {
    console.log('🔌 Usuario desconectado:', socket.id);
  });
});

// Conectar Mongo y levantar server
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/property-p2p', {
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000
})
  .then(async () => {
    console.log('✅ Conectado a MongoDB');
    portfinder.basePort = Number(process.env.PORT) || 3000;
    const PORT = await portfinder.getPortPromise();
    const HOST = '0.0.0.0';
    process.env.ACTUAL_PORT = PORT;

    // Rutas transaccionales (con io)
    app.use('/api/transactions', require('./routes/transaction')(io));
    app.use('/api/rental-transactions', require('./routes/rentalTransaction')(io));

    // Ruta para chat previo de alquiler
    app.use('/api/rental-chat', require('./routes/rentalChat'));

    // Ruta para chat de vehículos (ACTUALIZADA - ahora con io)
    app.use('/api/vehicle-chat', require('./routes/vehicleChat')(io));

    // exponer puerto actual
    app.get('/api/port', (req, res) => res.json({ port: PORT }));

    // modelo admin
    app.use('/api/admin', require('./routes/admin'));

    server.listen(PORT, HOST, () => {
      console.log(`🚀 Servidor corriendo en http://${HOST}:${PORT}`);
      console.log(`🔧 Puerto actual asignado: ${PORT}. Usa este puerto en tus solicitudes.`);
    });
  })
  .catch(err => {
    console.error('❌ Error de conexión a MongoDB:', err.message);
    process.exit(1);
  });