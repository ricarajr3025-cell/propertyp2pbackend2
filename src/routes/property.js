const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento para imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage: storage });

// Publicar propiedad (con imágenes)
router.post('/', auth, upload.array('images', 5), async (req, res) => {
  try {
    // LOGS DETALLADOS
    console.log('--- PUBLICAR PROPIEDAD ---');
    console.log('Usuario autenticado:', req.user ? req.user.id : null);
    console.log('Body recibido:', req.body);
    console.log('Archivos recibidos (req.files):', req.files);

    const { title, description, location, propertyType, price } = req.body;
    const images = req.files ? req.files.map(file => 'uploads/' + file.filename) : [];

    // Validación de campos obligatorios
    if (!title || !description || !location || !propertyType || !price) {
      console.log('Faltan campos obligatorios:', { title, description, location, propertyType, price });
      return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    // Validación de tipo de propiedad
    const allowedTypes = ['Casa', 'Lote', 'Apartamento', 'Edificio', 'Local Comercial'];
    if (!allowedTypes.includes(propertyType)) {
      console.log('Tipo de propiedad no válido:', propertyType);
      return res.status(400).json({ error: "Tipo de propiedad no válido." });
    }

    const property = new Property({
      owner: req.user.id,
      title,
      description,
      location,
      propertyType,
      price,
      images,
      available: true
    });

    await property.save();
    console.log('Propiedad guardada:', property);
    res.status(201).json(property);
  } catch (err) {
    console.error('Error al publicar propiedad:', err);
    res.status(500).json({ error: err.message });
  }
});

// Listar propiedades disponibles con datos del propietario
router.get('/', async (req, res) => {
  try {
    console.log('--- LISTAR PROPIEDADES ---');
    const properties = await Property.find({ available: true }).populate('owner', 'username email');
    console.log('Propiedades enviadas:', properties.length);
    res.json(properties);
  } catch (err) {
    console.error('Error al listar propiedades:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
