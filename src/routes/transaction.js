const express = require('express');
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Property = require('../models/Property');
const RentalProperty = require('../models/RentalProperty');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

module.exports = (io) => {
  const router = express.Router();

  // ============================================
  // CREAR NUEVA TRANSACCIÓN DE VENTA
  // ============================================
  router.post('/', auth, async (req, res) => {
    try {
      const { property_id, offer_price, currency = 'COP', propertyType = 'Property' } = req.body;

      // Validaciones
      if (!property_id || !offer_price) {
        return res.status(400).json({ 
          error: 'property_id y offer_price son obligatorios' 
        });
      }

      // Determinar el modelo correcto
      let PropertyModel;
      let modelName;
      
      if (propertyType === 'Vehicle') {
        PropertyModel = Vehicle;
        modelName = 'Vehicle';
      } else if (propertyType === 'RentalProperty') {
        PropertyModel = RentalProperty;
        modelName = 'RentalProperty';
      } else {
        PropertyModel = Property;
        modelName = 'Property';
      }

      // Buscar la propiedad/vehículo
      const property = await PropertyModel.findById(property_id).populate('owner');

      if (!property) {
        return res.status(404).json({ error: 'Propiedad/Vehículo no encontrado' });
      }

      // Verificar que el comprador no sea el mismo que el vendedor
      if (property.owner._id.toString() === req.user.id) {
        return res.status(400).json({ 
          error: 'No puedes crear una transacción con tu propia propiedad' 
        });
      }

      // Verificar que la propiedad esté disponible
      if (property.available === false) {
        return res.status(400).json({ 
          error: 'Esta propiedad ya no está disponible' 
        });
      }

      // Verificar si ya existe una transacción activa
      const existingTransaction = await Transaction.findOne({
        property: property_id,
        buyer: req.user.id,
        status: { $in: ['pending_validation', 'pending', 'paid', 'in_escrow'] }
      });

      if (existingTransaction) {
        return res.status(400).json({ 
          error: 'Ya tienes una transacción activa para esta propiedad',
          transactionId: existingTransaction._id
        });
      }

      // Crear la transacción
      const transaction = new Transaction({
        property: property_id,
        propertyModel: modelName,
        type: propertyType === 'RentalProperty' ? 'alquiler' : 'venta',
        buyer: req.user.id,
        seller: property.owner._id,
        offerPrice: offer_price,
        currency: currency,
        status: 'pending_validation',
        escrow: true,
        paid: false
      });

      await transaction.save();

      // Marcar propiedad como no disponible
      property.available = false;
      await property.save();

      // Crear notificación para el vendedor
      transaction.notifications.push({
        recipient: property.owner._id,
        message: `Nuevo interés en tu ${modelName === 'Vehicle' ? 'vehículo' : 'propiedad'}: ${property.title}. Oferta: ${currency} ${offer_price.toLocaleString()}`,
        read: false
      });
      await transaction.save();

      // Emitir evento de Socket.io
      io.emit('new_transaction', {
        transactionId: transaction._id,
        sellerId: property.owner._id.toString(),
        buyerId: req.user.id,
        propertyTitle: property.title
      });

      // Poblar datos para la respuesta
      const populatedTransaction = await Transaction.findById(transaction._id)
        .populate('property')
        .populate('buyer', 'name email avatar')
        .populate('seller', 'name email avatar');

      res.status(201).json({
        message: 'Transacción iniciada exitosamente',
        transaction: populatedTransaction
      });

    } catch (error) {
      console.error('❌ Error al crear transacción:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // OBTENER TRANSACCIONES DEL USUARIO
  // ============================================
  router.get('/', auth, async (req, res) => {
    try {
      const { status, type } = req.query;
      
      const query = {
        $or: [{ buyer: req.user.id }, { seller: req.user.id }]
      };

      if (status) {
        query.status = status;
      }

      if (type) {
        query.type = type;
      }

      const transactions = await Transaction.find(query)
        .populate({
          path: 'property',
          populate: { path: 'owner', select: 'name email avatar' }
        })
        .populate('buyer', 'name email avatar')
        .populate('seller', 'name email avatar')
        .sort({ createdAt: -1 });

      res.json(transactions);
    } catch (error) {
      console.error('❌ Error al obtener transacciones:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // OBTENER DETALLE DE TRANSACCIÓN
  // ============================================
  router.get('/:id', auth, async (req, res) => {
    try {
      const transaction = await Transaction.findById(req.params.id)
        .populate({
          path: 'property',
          populate: { path: 'owner', select: 'name email avatar phone whatsapp' }
        })
        .populate('buyer', 'name email avatar phone whatsapp')
        .populate('seller', 'name email avatar phone whatsapp');

      if (!transaction) {
        return res.status(404).json({ error: 'Transacción no encontrada' });
      }

      // Verificar que el usuario sea parte de la transacción
      if (
        transaction.buyer._id.toString() !== req.user.id &&
        transaction.seller._id.toString() !== req.user.id
      ) {
        return res.status(403).json({ error: 'No tienes acceso a esta transacción' });
      }

      res.json(transaction);
    } catch (error) {
      console.error('❌ Error al obtener transacción:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // VALIDAR TRANSACCIÓN (VENDEDOR)
  // ============================================
  router.post('/:id/validate', auth, async (req, res) => {
    try {
      const transaction = await Transaction.findById(req.params.id)
        .populate('property')
        .populate('buyer', 'name email')
        .populate('seller', 'name email');

      if (!transaction) {
        return res.status(404).json({ error: 'Transacción no encontrada' });
      }

      // Solo el vendedor puede validar
      if (transaction.seller._id.toString() !== req.user.id) {
        return res.status(403).json({ 
          error: 'Solo el vendedor puede validar esta transacción' 
        });
      }

      if (transaction.status !== 'pending_validation') {
        return res.status(400).json({ 
          error: 'Esta transacción ya fue validada o está en otro estado' 
        });
      }

      transaction.status = 'pending';
      transaction.validatedAt = new Date();

      // Notificar al comprador
      transaction.notifications.push({
        recipient: transaction.buyer._id,
        message: `El vendedor validó tu oferta. Ahora puedes proceder con el pago.`,
        read: false
      });

      await transaction.save();

      io.emit('transaction_validated', {
        transactionId: transaction._id,
        buyerId: transaction.buyer._id.toString()
      });

      res.json({
        message: 'Transacción validada exitosamente',
        transaction
      });
    } catch (error) {
      console.error('❌ Error al validar transacción:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // MARCAR COMO PAGADO (COMPRADOR)
  // ============================================
  router.post('/:id/pay', auth, async (req, res) => {
    try {
      const { paymentMethod, transactionId, receiptUrl } = req.body;
      
      const transaction = await Transaction.findById(req.params.id)
        .populate('property')
        .populate('buyer', 'name email')
        .populate('seller', 'name email');

      if (!transaction) {
        return res.status(404).json({ error: 'Transacción no encontrada' });
      }

      // Solo el comprador puede marcar como pagado
      if (transaction.buyer._id.toString() !== req.user.id) {
        return res.status(403).json({ 
          error: 'Solo el comprador puede marcar esta transacción como pagada' 
        });
      }

      if (transaction.status !== 'pending') {
        return res.status(400).json({ 
          error: 'La transacción debe estar en estado pending para ser pagada' 
        });
      }

      transaction.status = 'in_escrow';
      transaction.paid = true;
      transaction.paidAt = new Date();
      transaction.paymentInfo = {
        method: paymentMethod,
        transactionId: transactionId,
        receiptUrl: receiptUrl,
        paymentDate: new Date()
      };

      // Notificar al vendedor
      transaction.notifications.push({
        recipient: transaction.seller._id,
        message: `El comprador realizó el pago. Los fondos están en escrow.`,
        read: false
      });

      await transaction.save();

      io.emit('transaction_paid', {
        transactionId: transaction._id,
        sellerId: transaction.seller._id.toString()
      });

      res.json({
        message: 'Pago registrado exitosamente',
        transaction
      });
    } catch (error) {
      console.error('❌ Error al registrar pago:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // LIBERAR FONDOS (COMPRADOR)
  // ============================================
  router.post('/:id/release', auth, async (req, res) => {
    try {
      const transaction = await Transaction.findById(req.params.id)
        .populate('property')
        .populate('buyer', 'name email')
        .populate('seller', 'name email');

      if (!transaction) {
        return res.status(404).json({ error: 'Transacción no encontrada' });
      }

      // Solo el comprador puede liberar fondos
      if (transaction.buyer._id.toString() !== req.user.id) {
        return res.status(403).json({ 
          error: 'Solo el comprador puede liberar los fondos' 
        });
      }

      if (transaction.status !== 'in_escrow') {
        return res.status(400).json({ 
          error: 'Los fondos deben estar en escrow para ser liberados' 
        });
      }

      transaction.status = 'completed';
      transaction.escrow = false;
      transaction.completedAt = new Date();

      // Notificar al vendedor
      transaction.notifications.push({
        recipient: transaction.seller._id,
        message: `Transacción completada. Los fondos han sido liberados.`,
        read: false
      });

      await transaction.save();

      io.emit('transaction_completed', {
        transactionId: transaction._id,
        sellerId: transaction.seller._id.toString(),
        buyerId: transaction.buyer._id.toString()
      });

      res.json({
        message: 'Fondos liberados y transacción completada',
        transaction
      });
    } catch (error) {
      console.error('❌ Error al liberar fondos:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // CANCELAR TRANSACCIÓN
  // ============================================
  router.post('/:id/cancel', auth, async (req, res) => {
    try {
      const { reason } = req.body;
      
      const transaction = await Transaction.findById(req.params.id)
        .populate('property');

      if (!transaction) {
        return res.status(404).json({ error: 'Transacción no encontrada' });
      }

      // Verificar permisos
      const isParticipant = 
        transaction.buyer.toString() === req.user.id ||
        transaction.seller.toString() === req.user.id;

      if (!isParticipant) {
        return res.status(403).json({ error: 'No tienes permiso para cancelar esta transacción' });
      }

      // Solo se puede cancelar en ciertos estados
      if (!['pending_validation', 'pending'].includes(transaction.status)) {
        return res.status(400).json({ 
          error: 'Esta transacción no puede ser cancelada en su estado actual' 
        });
      }

      transaction.status = 'cancelled';
      transaction.cancelledAt = new Date();

      // Volver a marcar propiedad como disponible
      if (transaction.property) {
        transaction.property.available = true;
        await transaction.property.save();
      }

      // Notificar a ambas partes
      const otherParty = transaction.buyer.toString() === req.user.id 
        ? transaction.seller 
        : transaction.buyer;

      transaction.notifications.push({
        recipient: otherParty,
        message: `La transacción fue cancelada. Razón: ${reason || 'No especificada'}`,
        read: false
      });

      await transaction.save();

      io.emit('transaction_cancelled', {
        transactionId: transaction._id,
        cancelledBy: req.user.id
      });

      res.json({
        message: 'Transacción cancelada exitosamente',
        transaction
      });
    } catch (error) {
      console.error('❌ Error al cancelar transacción:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // APELAR TRANSACCIÓN
  // ============================================
  router.post('/:id/appeal', auth, async (req, res) => {
    try {
      const { reason } = req.body;
      
      const transaction = await Transaction.findById(req.params.id);

      if (!transaction) {
        return res.status(404).json({ error: 'Transacción no encontrada' });
      }

      // Verificar permisos
      const isParticipant = 
        transaction.buyer.toString() === req.user.id ||
        transaction.seller.toString() === req.user.id;

      if (!isParticipant) {
        return res.status(403).json({ error: 'No tienes permiso para apelar esta transacción' });
      }

      transaction.status = 'appealed';
      transaction.appeal = {
        status: 'pending',
        reason: reason,
        createdBy: req.user.id,
        createdAt: new Date()
      };

      await transaction.save();

      io.emit('transaction_appealed', {
        transactionId: transaction._id,
        reason: reason
      });

      res.json({
        message: 'Apelación enviada exitosamente',
        transaction
      });
    } catch (error) {
      console.error('❌ Error al apelar transacción:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
