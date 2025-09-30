const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const auth = require('../middleware/auth');

// Publicar propiedad
router.post('/', auth, async (req, res) => {
  const property = new Property({ ...req.body, owner: req.user.id });
  await property.save();
  res.json(property);
});

// Listar propiedades
router.get('/', async (req, res) => {
  const properties = await Property.find({ available: true });
  res.json(properties);
});

module.exports = router;
