require('dotenv').config();
const express = require('express');
const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const portfinder = require('portfinder');
const path = require('path');
const Transaction = require('./models/Transaction');

// Servir archivos subidos de la carpeta uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// servir /public estático
app.use(express.static(path.join(__dirname, '..', 'public'), { index: 'index.html' }));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));

// --- SOCKET.IO EVENTS ---
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

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

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
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

    // montar ruta de transactions PASANDO io
    app.use('/api/transactions', require('./routes/transaction')(io));

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