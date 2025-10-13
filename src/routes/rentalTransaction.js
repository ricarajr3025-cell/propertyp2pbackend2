module.exports = function(io) {
  const express = require('express');
  const router = express.Router();
  const Transaction = require('../models/Transaction');
  const RentalProperty = require('../models/RentalProperty');
  const RentalChat = require('../models/RentalChat');
  const auth = require('../middleware/auth');
  const multer = require('multer');
  const upload = multer({ dest: 'uploads/' });

  // Listar transacciones de alquiler del usuario
  router.get('/', auth, async (req, res) => {
    try {
      const txs = await Transaction.find({
        $or: [{ buyer: req.user.id }, { seller: req.user.id }],
        type: 'alquiler'
      })
      .populate({
        path: 'property',
        model: 'RentalProperty'
      })
      .populate('buyer seller');
      res.json(txs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Iniciar transacción de alquiler (renta)
  router.post('/rent/:propertyId', auth, async (req, res) => {
    try {
      const property = await RentalProperty.findById(req.params.propertyId);
      if (!property || !property.available) return res.status(404).json({ message: 'No disponible' });
      if (String(property.owner) === String(req.user.id)) {
        return res.status(400).json({ message: 'No puedes rentar tu propia propiedad.' });
      }
      const chatId = `rentalchat-${property._id}-${req.user.id}-${property.owner}`;
      const rentalChat = await RentalChat.findOne({ chatId });

      const transaction = new Transaction({
        property: property._id,
        propertyModel: 'RentalProperty',
        type: 'alquiler',
        buyer: req.user.id,
        seller: property.owner,
        status: 'pending',
        escrow: true,
        chatHistory: rentalChat ? rentalChat.messages : []
      });

      await transaction.save();
      res.json(transaction);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Marcar pagado
  router.post('/:id/pay', auth, async (req, res) => {
    const tx = await Transaction.findById(req.params.id).populate('property');
    if (!tx) return res.status(404).json({ message: 'No existe la transacción' });
    if (tx.buyer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Solo el arrendatario puede marcar pagado.' });
    }
    if (tx.status !== 'pending') {
      return res.status(400).json({ message: 'La renta ya fue pagada o completada.' });
    }
    tx.status = 'paid';
    tx.paid = true;
    await tx.save();

    // Marcar la propiedad como NO disponible
    if (tx.property) {
      tx.property.available = false;
      await tx.property.save();
    }

    res.json({ message: 'Pago de renta realizado', transaction: tx });
  });

  // Cancelar transacción de alquiler
  router.post('/:id/cancel', auth, async (req, res) => {
    const tx = await Transaction.findById(req.params.id).populate('property');
    if (!tx) return res.status(404).json({ message: 'No existe la transacción' });
    if (tx.buyer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Solo el arrendatario puede cancelar la transacción.' });
    }
    if (tx.status !== 'pending') {
      return res.status(400).json({ message: 'Solo se puede cancelar una transacción pendiente.' });
    }
    tx.status = 'cancelled';
    await tx.save();

    // Marcar propiedad como disponible otra vez
    if (tx.property) {
      tx.property.available = true;
      await tx.property.save();
    }

    res.json({ message: 'Transacción cancelada', transaction: tx });
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
}