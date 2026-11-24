const express = require('express');
const defaultStripe = require('./stripe-client');
const { createChargeHandler } = require('./billing/charge');
const { createCardHandler } = require('./billing/card');
const { login, me } = require('./auth/login');

function createApp(stripe = defaultStripe) {
  const app = express();
  app.use(express.json());
  app.get('/health', (req, res) => res.json({ ok: true }));
  app.post('/billing/charge', createChargeHandler(stripe));
  app.post('/billing/card', createCardHandler(stripe));
  app.post('/auth/login', login);
  app.get('/auth/me', me);
  return app;
}

module.exports = { createApp };
