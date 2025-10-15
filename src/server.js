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
const PropertyChat = require('./models/PropertyChat'); // ✅ NUEVO

// Servir archivos subidos de la carpeta uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Servir /public estático
app.use(express.static(path.join(__dirname, '..', 'public'), { index: 'index.html' }));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// ============================================
// SOCKET.IO EVENTS
// ============================================
io.on('connection', (socket) => {
  console.log('🔌 Usuario conectado:', socket.id);

  // ============================================
  // TRANSACCIONES DE VENTA/ALQUILER (ya existentes)
  // ============================================
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

  // ============================================
  // 🚗 CHAT DE VEHÍCULOS EN TIEMPO REAL
  // ============================================
  socket.on('join_vehicle_chat', (chatId) => {
    socket.join(chatId);
    console.log(`👤 Usuario ${socket.id} se unió al chat de vehículo: ${chatId}`);
  });

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

      io.to(chatId).emit('receive_vehicle_message', {
        chatId,
        message: chatMsg
      });

      console.log('✅ Mensaje de vehículo enviado:', { chatId, senderId });
    } catch (err) {
      console.error('❌ Error al enviar mensaje de vehículo:', err);
      socket.emit('error', { message: 'Error al enviar mensaje' });
    }
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

  // ============================================
  // 🏠 CHAT DE PROPIEDADES EN VENTA (NUEVO)
  // ============================================
  socket.on('join_property_chat', (chatId) => {
    socket.join(chatId);
    console.log(`👤 Usuario ${socket.id} se unió al chat de propiedad: ${chatId}`);
  });

  socket.on('send_property_message', async (data) => {
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

      let chat = await PropertyChat.findOne({ chatId });
      
      if (chat) {
        chat.messages.push(chatMsg);
        await chat.save();
      } else {
        await PropertyChat.create({
          chatId,
          messages: [chatMsg]
        });
      }

      io.to(chatId).emit('receive_property_message', {
        chatId,
        message: chatMsg
      });

      console.log('✅ Mensaje de propiedad enviado:', { chatId, senderId });
    } catch (err) {
      console.error('❌ Error al enviar mensaje de propiedad:', err);
      socket.emit('error', { message: 'Error al enviar mensaje' });
    }
  });

  // ============================================
  // 🏘️ CHAT DE PROPIEDADES EN ALQUILER (ACTUALIZADO)
  // ============================================
  socket.on('join-rental-chat', async ({ chatId }) => {
    socket.join(chatId);
    console.log(`Usuario ${socket.id} se unió al chat de alquiler ${chatId}`);
  });

  socket.on('join_rental_property_chat', (chatId) => {
    socket.join(chatId);
    console.log(`👤 Usuario ${socket.id} se unió al chat de alquiler: ${chatId}`);
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
    console.log('Mensaje de alquiler enviado (formato antiguo)', { chatId });
  });

  socket.on('send_rental_property_message', async (data) => {
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

      io.to(chatId).emit('receive_rental_property_message', {
        chatId,
        message: chatMsg
      });

      console.log('✅ Mensaje de alquiler enviado:', { chatId, senderId });
    } catch (err) {
      console.error('❌ Error al enviar mensaje de alquiler:', err);
      socket.emit('error', { message: 'Error al enviar mensaje' });
    }
  });

  // ============================================
  // USUARIO ESCRIBIENDO (COMPARTIDO)
  // ============================================
  socket.on('user_typing', (data) => {
    const { chatId, userId, isTyping } = data;
    socket.to(chatId).emit('user_typing', {
      chatId,
      userId,
      isTyping
    });
  });

  // ============================================
  // DESCONEXIÓN
  // ============================================
  socket.on('disconnect', () => {
    console.log('🔌 Usuario desconectado:', socket.id);
  });
});

// ============================================
// CONECTAR A MONGODB Y LEVANTAR SERVIDOR
// ============================================
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

    // ============================================
    // MONTAR RUTAS CON SOCKET.IO
    // ============================================
    
    // Rutas de transacciones (con io)
    app.use('/api/transactions', require('./routes/transaction')(io));
    app.use('/api/rental-transactions', require('./routes/rentalTransaction')(io));

    // ✅ NUEVO: Chat de propiedades en venta
    app.use('/api/property-chat', require('./routes/propertyChat')(io));

    // Chat de vehículos (con io)
    app.use('/api/vehicle-chat', require('./routes/vehicleChat')(io));

    // Chat de alquiler (sin io - solo HTTP)
    app.use('/api/rental-chat', require('./routes/rentalChat'));

    // Exponer puerto actual
    app.get('/api/port', (req, res) => res.json({ port: PORT }));

    // Panel de administración
    app.use('/api/admin', require('./routes/admin'));

    // ============================================
    // INICIAR SERVIDOR
    // ============================================
    server.listen(PORT, HOST, () => {
      console.log(`🚀 Servidor corriendo en http://${HOST}:${PORT}`);
      console.log(`🔧 Puerto actual asignado: ${PORT}. Usa este puerto en tus solicitudes.`);
      console.log('');
      console.log('📡 Eventos de Socket.io habilitados:');
      console.log('   🚗 Vehículos: join_vehicle_chat, send_vehicle_message');
      console.log('   🏠 Propiedades: join_property_chat, send_property_message');
      console.log('   🏘️ Alquileres: join_rental_property_chat, send_rental_property_message');
      console.log('   💬 Transacciones: join-transaction, chat:message');
      console.log('');
    });
  })
  .catch(err => {
    console.error('❌ Error de conexión a MongoDB:', err.message);
    process.exit(1);
  });