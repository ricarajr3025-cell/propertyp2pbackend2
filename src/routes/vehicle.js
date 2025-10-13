const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Almacena imágenes igual que propiedades
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage: storage });

// Publicar vehículo (igual que propiedad)
router.post('/', auth, upload.array('images', 5), async (req, res) => {
  try {
    const { title, description, price, category, location } = req.body;
    const images = req.files ? req.files.map(file => 'uploads/' + file.filename) : [];
    if (!title || !description || !price || !category) {
      return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }
    const allowedCategories = [
      'Auto', 'Moto', 'Camioneta', 'Camión', 'Bus', 'Bicicleta', 'Cuatrimoto', 'SUV', 'Pickup', 'Van', 'Tractor', 'Otro'
    ];
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ error: "Categoría de vehículo no válida." });
    }
    const vehicle = new Vehicle({
      owner: req.user.id,
      title,
      description,
      price,
      category,
      location,
      images
    });
    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar vehículos publicados
router.get('/', async (req, res) => {
  try {
    const vehicles = await Vehicle.find().populate('owner', 'username email');
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener un solo vehículo por ID (detalle)
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('owner', 'username email phone whatsapp');
    if (!vehicle) return res.status(404).json({ error: 'No encontrado' });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

