const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const Property = require('../models/Property');

// Listar todos los usuarios
router.get('/users', adminAuth, async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// Listar todas las propiedades
router.get('/properties', adminAuth, async (req, res) => {
  const properties = await Property.find();
  res.json(properties);
});

// Eliminar usuario
router.delete('/users/:id', adminAuth, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'Usuario eliminado' });
});

// Eliminar propiedad
router.delete('/properties/:id', adminAuth, async (req, res) => {
  await Property.findByIdAndDelete(req.params.id);
  res.json({ message: 'Propiedad eliminada' });
});

module.exports = router;
