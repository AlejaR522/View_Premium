const express = require('express');
const router = express.Router();
const Cliente = require('../models/Cliente');
const auth = require('../middleware/AuthMiddleware');

// GET todos
router.get('/', auth, async (req, res) => {
  const clientes = await Cliente.find().sort({ createdAt: -1 });
  res.json(clientes);
});

// GET uno
router.get('/:id', auth, async (req, res) => {
  const cliente = await Cliente.findById(req.params.id);
  if (!cliente) return res.status(404).json({ error: 'No encontrado' });
  res.json(cliente);
});

// POST crear
router.post('/', auth, async (req, res) => {
  try {
    const cliente = new Cliente(req.body);
    await cliente.save();
    res.status(201).json(cliente);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT editar
router.put('/:id', auth, async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(cliente);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE eliminar
router.delete('/:id', auth, async (req, res) => {
  await Cliente.findByIdAndDelete(req.params.id);
  res.json({ mensaje: 'Cliente eliminado' });
});

module.exports = router;