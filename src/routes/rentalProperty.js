const express = require('express');
const router = express.Router();
const RentalProperty = require('../models/RentalProperty');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configuración de multer para subir imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage: storage });

// ============================================
// OBTENER TODAS LAS PROPIEDADES EN ALQUILER (público)
// ============================================
router.get('/', async (req, res) => {
  try {
    const properties = await RentalProperty.find()
      .populate('owner', 'name email username avatar whatsapp')
      .sort({ createdAt: -1 });
    res.json(properties);
  } catch (err) {
    console.error('Error al obtener propiedades en alquiler:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// OBTENER UNA PROPIEDAD EN ALQUILER POR ID (público)
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const property = await RentalProperty.findById(req.params.id)
      .populate('owner', 'name email username avatar whatsapp phone');
    
    if (!property) {
      return res.status(404).json({ error: 'Propiedad en alquiler no encontrada' });
    }
    
    res.json(property);
  } catch (err) {
    console.error('Error al obtener propiedad en alquiler:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// CREAR PROPIEDAD EN ALQUILER (requiere autenticación)
// ============================================
router.post('/', auth, upload.array('images', 10), async (req, res) => {
  try {
    const { title, description, price, location, propertyType } = req.body;
    const images = req.files ? req.files.map(file => 'uploads/' + file.filename) : [];
    
    if (!title || !description || !price || !propertyType) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const property = new RentalProperty({
      owner: req.user.id,
      title,
      description,
      price,
      location,
      propertyType,
      images,
      available: true
    });

    await property.save();
    res.status(201).json(property);
  } catch (err) {
    console.error('Error al crear propiedad en alquiler:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ACTUALIZAR PROPIEDAD EN ALQUILER (requiere autenticación)
// ============================================
router.put('/:id', auth, async (req, res) => {
  try {
    const property = await RentalProperty.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ error: 'Propiedad en alquiler no encontrada' });
    }

    if (property.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para editar esta propiedad' });
    }

    const { title, description, price, location, propertyType, available } = req.body;
    
    if (title) property.title = title;
    if (description) property.description = description;
    if (price) property.price = price;
    if (location) property.location = location;
    if (propertyType) property.propertyType = propertyType;
    if (typeof available !== 'undefined') property.available = available;

    await property.save();
    res.json(property);
  } catch (err) {
    console.error('Error al actualizar propiedad en alquiler:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ELIMINAR PROPIEDAD EN ALQUILER (requiere autenticación)
// ============================================
router.delete('/:id', auth, async (req, res) => {
  try {
    const property = await RentalProperty.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ error: 'Propiedad en alquiler no encontrada' });
    }

    if (property.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta propiedad' });
    }

    await property.deleteOne();
    res.json({ message: 'Propiedad en alquiler eliminada correctamente' });
  } catch (err) {
    console.error('Error al eliminar propiedad en alquiler:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
