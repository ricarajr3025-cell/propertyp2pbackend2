const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'inmo_secret';

// Configura nodemailer con tu cuenta (usa app password si es Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'TU_CORREO@gmail.com', // pon tu correo aquí
    pass: process.env.EMAIL_PASS || 'TU_APP_PASSWORD' // pon tu app password aquí
  }
});

// Paso 1: Enviar código al correo
router.post('/send-code', async (req, res) => {
  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 dígitos
  const expires = Date.now() + 10 * 60 * 1000; // Expira en 10 minutos

  let user = await User.findOne({ email });
  if (!user) user = new User({ email });
  user.verificationCode = code;
  user.verificationCodeExpires = expires;
  await user.save();

  try {
    await transporter.sendMail({
      from: '"Registro Inmobiliaria P2P" <TU_CORREO@gmail.com>',
      to: email,
      subject: 'Código de verificación',
      text: `Tu código de registro es: ${code}`
    });
    res.json({ message: 'Código enviado al correo.' });
  } catch (e) {
    res.status(500).json({ message: 'Error enviando el correo.' });
  }
});

// Paso 2: Validar código recibido
router.post('/verify-code', async (req, res) => {
  const { email, code } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.verificationCode !== code) {
    return res.status(400).json({ message: 'Código inválido.' });
  }
  if (Date.now() > user.verificationCodeExpires) {
    return res.status(400).json({ message: 'Código expirado.' });
  }
  user.emailVerified = true;
  user.verificationCode = null;
  user.verificationCodeExpires = null;
  await user.save();

  res.json({ message: 'Correo verificado.' });
});

// Paso 3: Registrar usuario con contraseña segura
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  // Verifica que el correo fue validado
  if (!user || !user.emailVerified) {
    return res.status(400).json({ message: 'Correo no verificado.' });
  }
  if (user.password) {
    return res.status(400).json({ message: 'Usuario ya registrado.' });
  }

  // Validación de contraseña segura
  if (
    password.length < 8 ||
    password.length > 128 ||
    !/[0-9]/.test(password) ||
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  ) {
    return res.status(400).json({ message: 'Contraseña insegura.' });
  }

  user.password = await bcrypt.hash(password, 10);
  await user.save();

  // Crea el token JWT
  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET);

  res.json({ token });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }
  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET);
  res.json({ token });
});

module.exports = router;