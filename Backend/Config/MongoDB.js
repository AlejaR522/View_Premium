const mongoose = require('mongoose');

const connectMongo = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Atlas conectado');
  } catch (err) {
    console.error('❌ Error MongoDB:', err.message);
    process.exit(1);
  }
};

module.exports = connectMongo;