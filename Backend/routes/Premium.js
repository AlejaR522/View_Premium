const express = require('express');
const router = express.Router();
const pool = require('../config/postgres');
const auth = require('../middleware/authMiddleware');

let premiumSchemaReady = null;

const ensurePremiumSchema = () => {
  if (!premiumSchemaReady) {
    premiumSchemaReady = pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS perfil_bg_color TEXT DEFAULT '#000000';

      CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        nombre TEXT UNIQUE NOT NULL,
        precio NUMERIC(12, 2) NOT NULL DEFAULT 0,
        stock INTEGER NOT NULL DEFAULT 0,
        create_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        cedula TEXT,
        telefono TEXT,
        direccion TEXT,
        rut_pdf_url TEXT,
        rut_pdf_data TEXT,
        create_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ventas (
        id SERIAL PRIMARY KEY,
        cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
        producto_id INTEGER NOT NULL REFERENCES productos(id),
        precio_pagado NUMERIC(12, 2) NOT NULL DEFAULT 0,
        numero_factura TEXT UNIQUE NOT NULL,
        fecha TIMESTAMP DEFAULT NOW()
      );

      INSERT INTO productos (nombre, precio, stock)
      VALUES ('Membresia Premium', 25000, 20)
      ON CONFLICT (nombre) DO NOTHING;
    `);
  }
  return premiumSchemaReady;
};

const isHexColor = (color) => /^#[0-9a-fA-F]{6}$/.test(color || '');

const requireAdmin = async (userId, res) => {
  const result = await pool.query('SELECT rol FROM users WHERE id = $1', [userId]);
  if (result.rows[0]?.rol !== 'admin') {
    res.status(403).json({ error: 'Solo administradores' });
    return false;
  }
  return true;
};

router.post('/activar', auth, async (req, res) => {
  const { cedula, telefono, direccion, rut_pdf_url, rut_pdf_data, perfil_bg_color } = req.body;
  const userId = req.user.id;

  try {
    await ensurePremiumSchema();

    const userResult = await pool.query(
      'SELECT id, es_premium FROM users WHERE id = $1',
      [userId]
    );
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (user.es_premium) return res.status(400).json({ error: 'Ya tienes premium activo' });

    const producto = await pool.query(
      'SELECT * FROM productos WHERE nombre = $1',
      ['Membresia Premium']
    );
    if (!producto.rows[0] || producto.rows[0].stock <= 0) {
      return res.status(400).json({ error: 'No hay membresias disponibles' });
    }

    const color = isHexColor(perfil_bg_color) ? perfil_bg_color : '#000000';
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const cliente = await client.query(
        `INSERT INTO clientes (user_id, cedula, telefono, direccion, rut_pdf_url, rut_pdf_data)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, cedula || null, telefono || null, direccion || null, rut_pdf_url || null, rut_pdf_data || null]
      );

      const numeroFactura = `FACT-${Date.now()}-${userId}`;
      await client.query(
        `INSERT INTO ventas (cliente_id, producto_id, precio_pagado, numero_factura)
         VALUES ($1, $2, $3, $4)`,
        [cliente.rows[0].id, producto.rows[0].id, producto.rows[0].precio, numeroFactura]
      );

      await client.query(
        'UPDATE productos SET stock = stock - 1 WHERE id = $1 AND stock > 0',
        [producto.rows[0].id]
      );

      const updatedUser = await client.query(
        `UPDATE users
         SET es_premium = true,
             perfil_bg_color = $1
         WHERE id = $2
         RETURNING id, nombre, email, rol, es_premium, avatar_url, descripcion, perfil_bg_color`,
        [color, userId]
      );

      await client.query('COMMIT');

      res.json({
        mensaje: 'Premium activado',
        numero_factura: numeroFactura,
        precio: producto.rows[0].precio,
        user: updatedUser.rows[0],
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/clientes', auth, async (req, res) => {
  try {
    await ensurePremiumSchema();
    if (!(await requireAdmin(req.user.id, res))) return;

    const result = await pool.query(`
      SELECT u.id AS user_id, u.nombre, u.email, u.avatar_url, u.perfil_bg_color,
             u.es_premium, c.id, c.cedula, c.telefono, c.direccion, c.rut_pdf_url,
             c.rut_pdf_data IS NOT NULL AS tiene_rut_pdf,
             c.create_at, v.precio_pagado, v.numero_factura, v.fecha
      FROM users u
      LEFT JOIN LATERAL (
        SELECT *
        FROM clientes c
        WHERE c.user_id = u.id
        ORDER BY c.create_at DESC
        LIMIT 1
      ) c ON true
      LEFT JOIN LATERAL (
        SELECT *
        FROM ventas v
        WHERE v.cliente_id = c.id
        ORDER BY v.fecha DESC
        LIMIT 1
      ) v ON true
      WHERE u.es_premium = true
      ORDER BY COALESCE(c.create_at, v.fecha, NOW()) DESC, u.nombre ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/caja', auth, async (req, res) => {
  try {
    await ensurePremiumSchema();
    if (!(await requireAdmin(req.user.id, res))) return;

    const stock = await pool.query('SELECT * FROM productos ORDER BY id ASC');
    const caja = await pool.query(`
      SELECT
        COUNT(*)::int as total_ventas,
        COALESCE(SUM(precio_pagado), 0) as total_ganado
      FROM ventas
    `);
    const historial = await pool.query(`
      SELECT v.id, v.precio_pagado, v.numero_factura, v.fecha,
             p.nombre AS producto, u.nombre, u.email, c.cedula
      FROM ventas v
      JOIN productos p ON v.producto_id = p.id
      JOIN clientes c ON v.cliente_id = c.id
      JOIN users u ON c.user_id = u.id
      ORDER BY v.fecha DESC
    `);

    res.json({
      productos: stock.rows,
      total_ventas: caja.rows[0].total_ventas,
      total_ganado: caja.rows[0].total_ganado,
      historial: historial.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/productos/:id', auth, async (req, res) => {
  const { nombre, precio, stock } = req.body;

  try {
    await ensurePremiumSchema();
    if (!(await requireAdmin(req.user.id, res))) return;

    const result = await pool.query(
      `UPDATE productos
       SET nombre = COALESCE($1, nombre),
           precio = COALESCE($2, precio),
           stock = COALESCE($3, stock)
       WHERE id = $4
       RETURNING *`,
      [nombre || null, precio ?? null, stock ?? null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
