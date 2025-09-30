const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/properties', require('./routes/property'));

// La ruta de transacciones se monta en server.js pasando io:
// app.use('/api/transactions', require('./routes/transaction')(io));

module.exports = app;