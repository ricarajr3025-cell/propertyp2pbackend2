const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  nationality: { type: String },           // ej: "Colombia"
  documentType: { type: String, enum: ['cedula_ciudadania', 'pasaporte', 'cedula_extranjeria'] },
  documentFront: { type: String },         // URL o base64
  documentBack: { type: String },          // URL o base64
  verified: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  name: { type: String },
  avatar: { type: String },
  emailVerified: { type: Boolean, default: false },
  verificationCode: { type: String },
  verificationCodeExpires: { type: Date },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  verification: verificationSchema          // <-- Nuevo módulo
});

module.exports = mongoose.model('User', userSchema);