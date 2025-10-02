const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Property = require('../models/Property');
const Transaction = require('../models/Transaction');

// Obtener datos del perfil
router.get('/', auth, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password -verificationCode -verificationCodeExpires');
  res.json(user);
});

// Editar datos del perfil (nombre, avatar)
router.put('/', auth, async (req, res) => {
  const { name, avatar } = req.body;
  const user = await User.findById(req.user.id);
  if (name) user.name = name;
  if (avatar) user.avatar = avatar;
  await user.save();
  res.json({ message: 'Perfil actualizado.' });
});

// Propiedades propias
router.get('/properties', auth, async (req, res) => {
  const properties = await Property.find({ owner: req.user.id });
  res.json(properties);
});

// Transacciones propias
router.get('/transactions', auth, async (req, res) => {
  const txs = await Transaction.find({ $or: [{ buyer: req.user.id }, { seller: req.user.id }] })
    .populate('property buyer seller');
  res.json(txs);
});

module.exports = router;
