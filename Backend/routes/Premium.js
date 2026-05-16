
const express = require('express');
const router = express.Router();
const pool = require('../config/postgres');
const auth = require('../middleware/authMiddleware');

// POST — usuario se vuelve premium
router.post('/activar', auth, async (req, res) => {
  const { cedula, telefono, direccion, rut_pdf_url } = req.body;
  const userId = req.user.id;

  try {
    // 1. Verificar stock disponible
    const producto = await pool.query(
      'SELECT * FROM productos WHERE nombre = $1',
      ['Membresía Premium']
    );
    if (producto.rows[0].stock <= 0) {
      return res.status(400).json({ error: 'No hay membresías disponibles' });
    }

    // 2. Guardar cliente
    const cliente = await pool.query(
      `INSERT INTO clientes (user_id, cedula, telefono, direccion, rut_pdf_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, cedula, telefono, direccion, rut_pdf_url || null]
    );

    // 3. Registrar venta
    const numeroFactura = `FACT-${Date.now()}`;
    await pool.query(
      `INSERT INTO ventas (cliente_id, producto_id, precio_pagado, numero_factura)
       VALUES ($1, $2, $3, $4)`,
      [cliente.rows[0].id, producto.rows[0].id, producto.rows[0].precio, numeroFactura]
    );

    // 4. Descontar stock
    await pool.query(
      'UPDATE productos SET stock = stock - 1 WHERE id = $1',
      [producto.rows[0].id]
    );

    // 5. Marcar usuario como premium
    await pool.query(
      'UPDATE users SET es_premium = true WHERE id = $1',
      [userId]
    );

    res.json({ 
      mensaje: 'Premium activado', 
      numero_factura: numeroFactura,
      precio: producto.rows[0].precio
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET — clientes premium (para admin)
router.get('/clientes', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.nombre, u.email, u.avatar_url,
             v.precio_pagado, v.numero_factura, v.fecha
      FROM clientes c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN ventas v ON v.cliente_id = c.id
      ORDER BY c.create_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET — inventario y caja (para admin)
router.get('/caja', auth, async (req, res) => {
  try {
    const stock = await pool.query('SELECT * FROM productos');
    const caja = await pool.query(`
      SELECT 
        COUNT(*) as total_ventas,
        SUM(precio_pagado) as total_ganado
      FROM ventas
    `);
    const historial = await pool.query(`
      SELECT v.*, u.nombre, u.email, c.cedula
      FROM ventas v
      JOIN clientes c ON v.cliente_id = c.id
      JOIN users u ON c.user_id = u.id
      ORDER BY v.fecha DESC
    `);
    res.json({
      productos: stock.rows,
      total_ventas: caja.rows[0].total_ventas,
      total_ganado: caja.rows[0].total_ganado,
      historial: historial.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;