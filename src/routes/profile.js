const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Property = require('../models/Property');
const Transaction = require('../models/Transaction');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() }); // Puedes cambiar a disco si prefieres

// Obtener datos del perfil
router.get('/', auth, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password -verificationCode -verificationCodeExpires');
  res.json(user);
});

// Editar datos del perfil (nombre, avatar)
// Ahora acepta avatar como base64 (desde frontend), sin multer
router.put('/', auth, async (req, res) => {
  const { name, avatar } = req.body;
  const user = await User.findById(req.user.id);

  if (name) user.name = name;
  if (avatar) user.avatar = avatar; // avatar puede ser base64 o url según lo envíe el frontend

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

// Guardar verificación
router.post('/verify', auth, upload.fields([
  { name: 'documentFront', maxCount: 1 },
  { name: 'documentBack', maxCount: 1 }
]), async (req, res) => {
  const { nationality, documentType } = req.body;
  const user = await User.findById(req.user.id);

  // Guarda imágenes como base64 (puedes guardar en disco/S3 y solo guardar la URL aquí si lo prefieres)
  const documentFront = req.files['documentFront'] ? req.files['documentFront'][0].buffer.toString('base64') : '';
  const documentBack = req.files['documentBack'] ? req.files['documentBack'][0].buffer.toString('base64') : '';

  user.verification = {
    nationality,
    documentType,
    documentFront,
    documentBack,
    verified: false
  };
  await user.save();
  res.json({ message: 'Información de verificación guardada.' });
});

// Obtener verificación (para mostrar en perfil)
router.get('/verify', auth, async (req, res) => {
  const user = await User.findById(req.user.id).select('verification');
  res.json(user.verification || {});
});

module.exports = router;