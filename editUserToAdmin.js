const mongoose = require('mongoose');
const User = require('./src/models/User'); // Ajusta la ruta si tu modelo está en otro lugar
require('dotenv').config();

async function makeAdmin(email) {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/property-p2p');
  const user = await User.findOne({ email });
  if (!user) {
    console.log('Usuario no encontrado');
  } else {
    user.role = 'admin';
    await user.save();
    console.log(`Usuario ${email} actualizado a admin`);
  }
  mongoose.disconnect();
}

// Cambia el correo por el del usuario que quieres editar
makeAdmin('thedefiantsistem@proton.me');
