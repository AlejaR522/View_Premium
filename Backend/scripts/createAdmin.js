require('dotenv').config();

const bcrypt = require('bcryptjs');
const pool = require('../config/postgres');

const args = process.argv.slice(2);

const getArg = (name) => {
  const prefix = `--${name}=`;
  const arg = args.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length).trim() : '';
};

const nombre = getArg('nombre') || 'Admin';
const email = getArg('email').toLowerCase();
const password = getArg('password');

const main = async () => {
  if (!email || !password) {
    console.log('Uso: npm run create-admin -- --email=admin@correo.com --password=TuClave --nombre=Admin');
    process.exitCode = 1;
    return;
  }

  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS verification_token TEXT;
    ALTER TABLE users
      ALTER COLUMN email_verificado SET DEFAULT false;
  `);

  const hash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users
      (nombre, email, password_hash, rol, es_premium, email_verificado, verification_token)
     VALUES ($1, $2, $3, 'admin', false, true, null)
     ON CONFLICT (email)
     DO UPDATE SET
       nombre = EXCLUDED.nombre,
       password_hash = EXCLUDED.password_hash,
       rol = 'admin',
       email_verificado = true,
       verification_token = null
     RETURNING id, nombre, email, rol`,
    [nombre, email, hash]
  );

  console.log('Admin listo:', result.rows[0]);
};

main()
  .catch((err) => {
    console.error('Error creando admin:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
