require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const AuthNestClient = require('authnest-server');
const cookieParser = require('cookie-parser');

const app = express();
const authnest = new AuthNestClient();

app.use(AuthNestClient.getSecurityMiddlewares());
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => { console.error(err); process.exit(1); });

app.use('/api/authnest', authnest.getRouter());

const PORT = process.env.PORT || 9000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;