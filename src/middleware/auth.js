const jwt = require('jsonwebtoken');
const User = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET || 'inmo_secret';

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token requerido' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'Usuario no encontrado' });
    req.user = user; // <-- aquí va el usuario completo con role
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido' });
  }
};