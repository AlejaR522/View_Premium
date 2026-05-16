const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./config/postgres');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/premium', require('./routes/premium'));

app.get('/', (req, res) => res.json({ mensaje: '¡Backend funcionando!' }));

app.listen(process.env.PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${process.env.PORT}`);
});