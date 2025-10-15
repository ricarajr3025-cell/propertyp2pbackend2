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
const PropertyChat = require('./models/PropertyChat');

// Servir archivos subidos
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use(express.static(path.join(__dirname, '..', 'public'), { index: 'index.html' }));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// SOCKET.IO EVENTS
io.on('connection', (socket) => {
  console.log('🔌 Usuario conectado:', socket.id);

  // Transacciones
  socket.on('join-transaction', async ({ transactionId, userId }) => {
    const tx = await Transaction.findById(transactionId);
    if (tx && (tx.buyer.toString() === userId || tx.seller.toString() === userId)) {
      socket.join(transactionId);
      console.log(`Usuario ${socket.id} se unió a la transacción ${transactionId}`);
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
      }
    }
  });

  // Vehículos
  socket.on('join_vehicle_chat', (chatId) => {
    socket.join(chatId);
    console.log(`👤 Chat vehículo: ${chatId}`);
  });

  socket.on('send_vehicle_message', async (data) => {
    const { chatId, message, senderId, receiverId } = data;
    if (chatId && message && senderId) {
      const chatMsg = { sender: senderId, receiver: receiverId, message, timestamp: new Date() };
      let chat = await VehicleChat.findOne({ chatId });
      if (chat) {
        chat.messages.push(chatMsg);
        await chat.save();
      }
      io.to(chatId).emit('receive_vehicle_message', { chatId, message: chatMsg });
    }
  });

  // Propiedades
  socket.on('join_property_chat', (chatId) => {
    socket.join(chatId);
    console.log(`👤 Chat propiedad: ${chatId}`);
  });

  socket.on('send_property_message', async (data) => {
    const { chatId, message, senderId, receiverId } = data;
    if (chatId && message && senderId) {
      const chatMsg = { sender: senderId, receiver: receiverId, message, timestamp: new Date() };
      let chat = await PropertyChat.findOne({ chatId });
      if (chat) {
        chat.messages.push(chatMsg);
        await chat.save();
      }
      io.to(chatId).emit('receive_property_message', { chatId, message: chatMsg });
    }
  });

  // Alquileres
  socket.on('join_rental_property_chat', (chatId) => {
    socket.join(chatId);
    console.log(`👤 Chat alquiler: ${chatId}`);
  });

  socket.on('send_rental_property_message', async (data) => {
    const { chatId, message, senderId, receiverId } = data;
    if (chatId && message && senderId) {
      const chatMsg = { sender: senderId, receiver: receiverId, message, timestamp: new Date() };
      let chat = await RentalChat.findOne({ chatId });
      if (chat) {
        chat.messages.push(chatMsg);
        await chat.save();
      }
      io.to(chatId).emit('receive_rental_property_message', { chatId, message: chatMsg });
    }
  });

  socket.on('user_typing', (data) => {
    socket.to(data.chatId).emit('user_typing', data);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Usuario desconectado:', socket.id);
  });
});

// Conectar MongoDB
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

    // ✅ MONTAR RUTAS EN ORDEN CORRECTO
    console.log('📡 Montando rutas...');
    
    // Transacciones (CON io)
    app.use('/api/transactions', require('./routes/transaction')(io));
    console.log('  ✅ /api/transactions');
    
    app.use('/api/rental-transactions', require('./routes/rentalTransaction')(io));
    console.log('  ✅ /api/rental-transactions');
    
    // Chats (CON io)
    app.use('/api/property-chat', require('./routes/propertyChat')(io));
    console.log('  ✅ /api/property-chat');
    
    app.use('/api/vehicle-chat', require('./routes/vehicleChat')(io));
    console.log('  ✅ /api/vehicle-chat');
    
    // Chat de alquiler (SIN io)
    app.use('/api/rental-chat', require('./routes/rentalChat'));
    console.log('  ✅ /api/rental-chat');
    
    // Puerto
    app.get('/api/port', (req, res) => res.json({ port: PORT }));
    
    // Admin
    app.use('/api/admin', require('./routes/admin'));
    console.log('  ✅ /api/admin');

    server.listen(PORT, HOST, () => {
      console.log('');
      console.log(`🚀 Servidor corriendo en http://${HOST}:${PORT}`);
      console.log(`🔧 Puerto: ${PORT}`);
      console.log('');
      console.log('📡 Endpoints disponibles:');
      console.log('   POST /api/transactions - Crear transacción');
      console.log('   GET  /api/transactions - Listar transacciones');
      console.log('   POST /api/transactions/:id/pay - Marcar como pagado');
      console.log('');
    });
  })
  .catch(err => {
    console.error('❌ Error de conexión a MongoDB:', err.message);
    process.exit(1);
  });
