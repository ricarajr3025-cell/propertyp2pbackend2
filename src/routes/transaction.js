const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Property = require('../models/Property');
const auth = require('../middleware/auth');

module.exports = function(io) {

  // Iniciar transacción (compra)
  router.post('/buy/:propertyId', auth, async (req, res) => {
    const property = await Property.findById(req.params.propertyId);
    if (!property || !property.available) return res.status(404).json({ message: 'No disponible' });
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

  // Obtener transacciones del usuario
  router.get('/', auth, async (req, res) => {
    const txs = await Transaction.find({ $or: [{ buyer: req.user.id }, { seller: req.user.id }] })
      .populate('property buyer seller');
    res.json(txs);
  });

  // Liberar fondos (solo vendedor)
  router.post('/:id/release', auth, async (req, res) => {
    const tx = await Transaction.findById(req.params.id);
    if (!tx || tx.seller.toString() !== req.user.id) return res.status(403).json({ message: 'No autorizado' });
    tx.escrow = false;
    tx.status = 'completed';
    await tx.save();

    // Emitir evento al chat de la transacción
    io.to(tx._id.toString()).emit('transaction:status', { status: 'completed', transactionId: tx._id });

    res.json({ message: 'Fondos liberados, transacción completada' });
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

  return router;
};
