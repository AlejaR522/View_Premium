const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') 
    ? { rejectUnauthorized: false }
    : false
});

pool.connect()
  .then(() => console.log('✅ Neon PostgreSQL conectado'))
  .catch(err => console.error('❌ Error Neon:', err.message));

module.exports = pool;