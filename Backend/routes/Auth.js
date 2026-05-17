const express = require('express');
const router = express.Router();
const pool = require('../config/postgres');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dns = require('dns').promises;

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;

let authSchemaReady = null;
const ensureAuthSchema = () => {
  if (!authSchemaReady) {
    authSchemaReady = pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS verification_token TEXT,
        ADD COLUMN IF NOT EXISTS reset_token TEXT,
        ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;
      ALTER TABLE users
        ALTER COLUMN email_verificado SET DEFAULT false;
    `);
  }
  return authSchemaReady;
};

const ensureVerifiedColumn = async () => {
  await ensureAuthSchema();
  await pool.query(`
    UPDATE users
    SET email_verificado = true
    WHERE email_verificado IS NULL
       OR rol = 'admin'
  `);
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const normalizeEmail = (email = '') => email.trim().toLowerCase();
const emailDomainCache = new Map();

const emailHasValidMx = async (email) => {
  const domain = email.split('@')[1];
  if (emailDomainCache.has(domain)) {
    return emailDomainCache.get(domain);
  }

  const records = await dns.resolveMx(domain);
  const isValid = records.length > 0;
  emailDomainCache.set(domain, isValid);
  return isValid;
};

const getTokenKey = () => crypto.createHash('sha256').update(process.env.JWT_SECRET).digest();

const createVerificationToken = (payload) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getTokenKey(), iv);
  const expiresAt = Date.now() + 60 * 60 * 1000;
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify({ ...payload, expiresAt }), 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString('base64url'),
    authTag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
};

const readVerificationToken = (token) => {
  const [ivText, authTagText, encryptedText] = token.split('.');
  if (!ivText || !authTagText || !encryptedText) {
    const error = new Error('Token invalido o ya usado');
    error.name = 'InvalidVerificationToken';
    throw error;
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getTokenKey(),
    Buffer.from(ivText, 'base64url')
  );
  decipher.setAuthTag(Buffer.from(authTagText, 'base64url'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedText, 'base64url')),
    decipher.final(),
  ]);
  const payload = JSON.parse(decrypted.toString('utf8'));

  if (Date.now() > payload.expiresAt) {
    const error = new Error('El enlace de verificacion expiro. Registrate nuevamente.');
    error.name = 'TokenExpiredError';
    throw error;
  }

  return payload;
};

const verifyExistingUserByToken = async (token) => {
  const result = await pool.query(
    `UPDATE users
     SET email_verificado = true, verification_token = null
     WHERE verification_token = $1
     RETURNING id`,
    [token]
  );

  return result.rowCount > 0;
};

router.post('/register', async (req, res) => {
  const { nombre, password } = req.body;
  const email = normalizeEmail(req.body.email);

  try {
    await ensureAuthSchema();

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Completa todos los campos' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Ese correo no existe. Usa un correo existente.' });
    }

    try {
      const validDomain = await emailHasValidMx(email);
      if (!validDomain) {
        return res.status(400).json({ error: 'Ese correo no existe. Usa un correo existente.' });
      }
    } catch {
      return res.status(400).json({ error: 'Ese correo no existe. Usa un correo existente.' });
    }

    const existe = await pool.query('SELECT id, email_verificado FROM users WHERE email = $1', [email]);
    if (existe.rows.length > 0 && existe.rows[0].email_verificado === true) {
      return res.status(400).json({ error: 'Este correo ya esta registrado' });
    }

    const hash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationUrl = `${backendUrl}/api/auth/verify-email/${encodeURIComponent(verificationToken)}`;

    await pool.query(
      `INSERT INTO users
        (nombre, email, password_hash, rol, es_premium, email_verificado, verification_token)
       VALUES ($1, $2, $3, 'user', false, false, $4)
       ON CONFLICT (email)
       DO UPDATE SET
         nombre = EXCLUDED.nombre,
         password_hash = EXCLUDED.password_hash,
         email_verificado = false,
         verification_token = EXCLUDED.verification_token
       WHERE users.email_verificado = false`,
      [nombre, email, hash, verificationToken]
    );

    await transporter.sendMail({
      from: `"View App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verifica tu cuenta en View App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #000;">Hola ${nombre}</h2>
          <p>Gracias por registrarte en <strong>View App</strong>.</p>
          <p>Haz clic en el boton para verificar tu correo:</p>
          <a href="${verificationUrl}"
             style="display: inline-block; background: #000; color: #fff;
                    padding: 12px 24px; border-radius: 24px;
                    text-decoration: none; font-weight: bold; margin: 16px 0;">
            Verificar mi cuenta
          </a>
          <p style="color: #999; font-size: 12px;">
            Si no te registraste, ignora este email.
          </p>
        </div>
      `,
    });

    res.status(201).json({
      mensaje: 'Registro exitoso. Revisa tu correo para verificar tu cuenta.',
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Este correo ya esta registrado' });
    }
    if (err.responseCode === 550 || err.responseCode === 553) {
      return res.status(400).json({ error: 'Ese correo no existe. Usa un correo existente.' });
    }
    res.status(400).json({ error: err.message });
  }
});

router.get('/verify-email/:token', async (req, res) => {
  const token = decodeURIComponent(req.params.token);
  const wantsHtml = req.headers.accept?.includes('text/html');
  const sendVerifiedResponse = () => {
    if (wantsHtml) {
      return res.redirect(`${frontendUrl}/?verified=true`);
    }
    return res.json({ mensaje: 'Cuenta verificada. Ya puedes iniciar sesion.' });
  };

  try {
    await ensureVerifiedColumn();

    const verifiedPendingUser = await verifyExistingUserByToken(token);
    if (verifiedPendingUser) {
      return sendVerifiedResponse();
    }

    let pendingUser;
    try {
      pendingUser = readVerificationToken(token);
    } catch (tokenError) {
      const legacyVerified = await verifyExistingUserByToken(token);
      if (legacyVerified) {
        return sendVerifiedResponse();
      }
      throw tokenError;
    }

    const email = normalizeEmail(pendingUser.email);

    const existe = await pool.query('SELECT id, email_verificado FROM users WHERE email = $1', [email]);
    if (existe.rows.length > 0) {
      if (existe.rows[0].email_verificado === false) {
        await pool.query(
          'UPDATE users SET email_verificado = true, verification_token = null WHERE email = $1',
          [email]
        );
      }
      return sendVerifiedResponse();
    }

    await pool.query(
      `INSERT INTO users
        (nombre, email, password_hash, rol, es_premium, email_verificado)
       VALUES ($1, $2, $3, 'user', false, true)`,
      [pendingUser.nombre, email, pendingUser.password_hash]
    );

    return sendVerifiedResponse();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'El enlace de verificacion expiro. Registrate nuevamente.' });
    }
    if (err.name === 'JsonWebTokenError' || err.name === 'InvalidVerificationToken') {
      return res.status(400).json({ error: 'Token invalido o ya usado' });
    }
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Este correo ya esta registrado' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.delete('/unverified/:email', async (req, res) => {
  try {
    const email = normalizeEmail(req.params.email);

    const result = await pool.query(
      'DELETE FROM users WHERE email = $1 AND COALESCE(email_verificado, false) = false RETURNING id',
      [email]
    );

    res.json({ eliminados: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { password } = req.body;
  const email = normalizeEmail(req.body.email);

  try {
    await ensureVerifiedColumn();

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (user.rol !== 'admin' && user.email_verificado === false) {
      return res.status(401).json({
        error: 'Debes verificar tu correo antes de iniciar sesion',
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Contrasena incorrecta' });

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        es_premium: user.es_premium,
        avatar_url: user.avatar_url,
        descripcion: user.descripcion,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  const email = normalizeEmail(req.body.email);

  try {
    await ensureVerifiedColumn();

    if (!email) {
      return res.status(400).json({ error: 'Escribe tu correo' });
    }

    const result = await pool.query(
      'SELECT id, nombre, email, rol, email_verificado FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'No existe una cuenta con ese correo' });
    }

    if (user.email_verificado === false && user.rol !== 'admin') {
      return res.status(401).json({ error: 'Primero debes verificar tu correo' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetUrl = `${frontendUrl}/reset-password/${encodeURIComponent(resetToken)}`;

    await pool.query(
      `UPDATE users
       SET reset_token = $1,
           reset_token_expires = NOW() + INTERVAL '1 hour'
       WHERE id = $2`,
      [resetToken, user.id]
    );

    await transporter.sendMail({
      from: `"View App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Recupera tu contrasena en View App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #000;">Hola ${user.nombre}</h2>
          <p>Recibimos una solicitud para cambiar tu contrasena.</p>
          <p>Haz clic en el boton para crear una nueva contrasena:</p>
          <a href="${resetUrl}"
             style="display: inline-block; background: #000; color: #fff;
                    padding: 12px 24px; border-radius: 24px;
                    text-decoration: none; font-weight: bold; margin: 16px 0;">
            Cambiar contrasena
          </a>
          <p style="color: #999; font-size: 12px;">
            Este enlace vence en 1 hora. Si no solicitaste este cambio, ignora este correo.
          </p>
        </div>
      `,
    });

    res.json({ mensaje: 'Te enviamos un enlace para recuperar tu contrasena.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reset-password/:token', async (req, res) => {
  const token = decodeURIComponent(req.params.token);
  const { password } = req.body;

  try {
    await ensureVerifiedColumn();

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'La contrasena debe tener al menos 6 caracteres' });
    }

    const result = await pool.query(
      `SELECT id
       FROM users
       WHERE reset_token = $1
         AND reset_token_expires > NOW()`,
      [token]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ error: 'El enlace es invalido o ya expiro' });
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      `UPDATE users
       SET password_hash = $1,
           reset_token = null,
           reset_token_expires = null
       WHERE id = $2`,
      [hash, user.id]
    );

    res.json({ mensaje: 'Contrasena actualizada. Ya puedes iniciar sesion.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/usuarios', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, email, rol, es_premium, avatar_url, descripcion, create_at FROM users ORDER BY create_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/usuarios/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, email, rol, es_premium, avatar_url, descripcion FROM users WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/usuarios/:id', async (req, res) => {
  const { nombre, email, rol, avatar_url, descripcion } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users SET
        nombre = COALESCE($1, nombre),
        email = COALESCE($2, email),
        rol = COALESCE($3, rol),
        avatar_url = COALESCE($4, avatar_url),
        descripcion = COALESCE($5, descripcion)
       WHERE id = $6 RETURNING *`,
      [nombre || null, email || null, rol || null, avatar_url || null, descripcion || null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/usuarios/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
