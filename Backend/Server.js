const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectMongo = require('./config/mongodb');
require('./config/postgres'); // se conecta al importar

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

connectMongo();

app.use('/api/auth', require('./routes/auth'));
app.use('/api/clientes', require('./routes/clientes'));

app.get('/', (req, res) => res.json({ mensaje: '¡Backend funcionando!' }));

app.listen(process.env.PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${process.env.PORT}`);
});