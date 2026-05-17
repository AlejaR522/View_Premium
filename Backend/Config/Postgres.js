const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Maneja errores de conexión sin crashear el servidor
pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool:', err.message);
});

pool.connect()
  .then(() => console.log('✅ Neon PostgreSQL conectado'))
  .catch(err => console.error('❌ Error Neon:', err.message));

module.exports = pool;