const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs'); // <-- Agrega bcrypt

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const RESET_TOKEN_EXPIRY = '1h'; // 1 hora

// Configuración de nodemailer (ajusta con tus credenciales SMTP o Gmail App Password)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER, // tu correo
    pass: process.env.MAIL_PASS, // tu contraseña o app password
  },
});

// 1. Solicitar recuperación de contraseña
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'No existe usuario con ese correo.' });

  // Generar token seguro
  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: RESET_TOKEN_EXPIRY });

  // Enviar email con enlace
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  try {
    await transporter.sendMail({
      from: `"PropertyP2P" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Recupera tu contraseña',
      html: `<p>Haz clic en el siguiente enlace para cambiar tu contraseña:</p>
             <a href="${resetLink}">${resetLink}</a>
             <p>Este enlace expirará en 1 hora.</p>`,
    });
    res.json({ message: 'Correo de recuperación enviado.' });
  } catch (err) {
    console.error('Error al enviar el correo:', err);
    res.status(500).json({ message: 'Error al enviar el correo. Revisa tu configuración SMTP.' });
  }
});

// 2. Resetear contraseña (desde el enlace)
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

    // Hashear la nueva contraseña antes de guardar
    user.password = await bcrypt.hash(password, 10);
    await user.save();
    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    console.error('Error al resetear la contraseña:', err);
    res.status(400).json({ message: 'Token inválido o expirado.' });
  }
});

module.exports = router;
