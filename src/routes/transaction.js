const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Property = require('../models/Property');
const auth = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Puedes cambiarlo por Cloudinary, S3, etc.

module.exports = function(io) {
  // Iniciar transacción (compra)
  router.post('/buy/:propertyId', auth, async (req, res) => {
    const property = await Property.findById(req.params.propertyId);
    if (!property || !property.available) return res.status(404).json({ message: 'No disponible' });
    // Validación para evitar que el owner compre su propia propiedad
    if (String(property.owner) === String(req.user.id)) {
      return res.status(400).json({ message: 'No puedes comprar tu propia propiedad.' });
    }
       
    const transaction = new Transaction({
      property: property._id,
      buyer: req.user.id,
      seller: property.owner,
      status: 'pending',
      escrow: true
    });
    property.available = false;
    await property.save();
    await transaction.save();
    res.json(transaction);
  });

  // Simular pago en testnet (nuevo endpoint)
  router.post('/:id/pay', auth, async (req, res) => {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: 'No existe la transacción' });
    if (tx.buyer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Solo el comprador puede pagar.' });
    }
    if (tx.status !== 'pending') {
      return res.status(400).json({ message: 'La transacción ya fue pagada o completada.' });
    }
    tx.status = 'paid';
    tx.paid = true;
    await tx.save();
    res.json({ message: 'Pago simulado realizado', transaction: tx });
  });

  // Obtener transacciones del usuario
  router.get('/', auth, async (req, res) => {
    const txs = await Transaction.find({ $or: [{ buyer: req.user.id }, { seller: req.user.id }] })
      .populate('property buyer seller');
    res.json(txs);
  });

  // Liberar fondos (solo comprador)
  router.post('/:id/release', auth, async (req, res) => {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: 'No existe' });
    if (tx.buyer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Solo el comprador puede liberar los fondos.' });
    }
    if (tx.status !== 'pending' || !tx.escrow) {
      return res.status(400).json({ message: 'No se puede liberar fondos.' });
    }
    tx.escrow = false;
    tx.status = 'completed';
    await tx.save();
    io.to(tx._id.toString()).emit('transaction:released', { transactionId: tx._id });
    res.json({ message: 'Fondos liberados y traspaso completado.' });
  });

  // Apelar transacción
  router.post('/:id/appeal', auth, async (req, res) => {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: 'No existe' });
    tx.appeal = {
      status: 'pending',
      reason: req.body.reason,
      createdBy: req.user.id,
      createdAt: Date.now()
    };
    tx.status = 'appealed';
    await tx.save();

    // Emitir evento de apelación
    io.to(tx._id.toString()).emit('transaction:appealed', { transactionId: tx._id, reason: req.body.reason });

    res.json({ message: 'Apelación enviada' });
  });

  // Obtener historial de chat de una transacción
  router.get('/:id/chat', auth, async (req, res) => {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: 'No existe' });
    res.json(tx.chatHistory || []);
  });

  // Adjuntar archivo en el chat
  router.post('/:id/chat/upload', auth, upload.single('file'), async (req, res) => {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: 'No existe' });
    // Solo participantes pueden adjuntar
    if (![tx.buyer.toString(), tx.seller.toString()].includes(req.user.id)) {
      return res.status(403).json({ message: 'Solo participantes pueden adjuntar archivos.' });
    }
    const chatMsg = {
      sender: req.user.id,
      message: req.body.message || '',
      file: {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        url: `/uploads/${req.file.filename}`,
        size: req.file.size
      },
      timestamp: new Date()
    };
    tx.chatHistory.push(chatMsg);
    await tx.save();
    io.to(tx._id.toString()).emit('chat:message', { transactionId: tx._id, ...chatMsg });
    res.json(chatMsg);
  });

  return router;
};
