const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
  nombre:    { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  telefono:  { type: String },
  direccion: { type: String },
  empresa:   { type: String },
  notas:     { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Cliente', clienteSchema);