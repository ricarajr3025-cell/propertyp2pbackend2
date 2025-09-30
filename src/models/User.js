const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Se crea tras validar el correo
  emailVerified: { type: Boolean, default: false },
  verificationCode: { type: String }, // Código temporal para validación
  verificationCodeExpires: { type: Date }
});

module.exports = mongoose.model('User', userSchema);