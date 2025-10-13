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
app.use('/api/rental-properties', require('./routes/rentalProperty'));
app.use('/api/profile', profileRoutes);

// NO montes rutas que necesitan io aquí. 
// app.use('/api/rental-transactions', rentalTransactionRoutes(io)); // <-- ELIMINADO

// La ruta de transacciones se monta en server.js pasando io:
// app.use('/api/transactions', require('./routes/transaction')(io));

module.exports = app;