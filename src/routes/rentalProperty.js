const express = require('express');
const router = express.Router();
const RentalProperty = require('../models/RentalProperty');
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

// Publicar propiedad en alquiler
router.post('/', auth, upload.array('images', 5), async (req, res) => {
  try {
    const { title, description, location, propertyType, price } = req.body;
    const images = req.files ? req.files.map(file => 'uploads/' + file.filename) : [];

    // Validación de campos obligatorios
    if (!title || !description || !location || !propertyType || !price) {
      return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    const allowedTypes = ['Casa', 'Lote', 'Apartamento', 'Edificio', 'Local Comercial', 'Bodega'];
    if (!allowedTypes.includes(propertyType)) {
      return res.status(400).json({ error: "Tipo de propiedad no válido." });
    }

    const rentalProperty = new RentalProperty({
      owner: req.user.id,
      title,
      description,
      location,
      propertyType,
      price,
      images,
      available: true
    });

    await rentalProperty.save();
    res.status(201).json(rentalProperty);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar propiedades en alquiler disponibles
router.get('/', async (req, res) => {
  try {
    const properties = await RentalProperty.find({ available: true }).populate('owner', 'username email');
    res.json(properties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
