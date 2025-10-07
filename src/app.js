const express = require('express');
const cors = require('cors');
const app = express();
const profileRoutes = require('./routes/profile');

// SIRVE ARCHIVOS DE LA CARPETA UPLOADS
app.use('/uploads', express.static('uploads'));

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', require('./routes/passwordReset'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/properties', require('./routes/property'));
app.use('/api/profile', profileRoutes);

// La ruta de transacciones se monta en server.js pasando io:
// app.use('/api/transactions', require('./routes/transaction')(io));

module.exports = app;