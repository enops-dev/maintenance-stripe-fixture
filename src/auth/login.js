const jwt = require('jsonwebtoken');

const secret = () => process.env.JWT_SECRET || 'dev-secret';

function login(req, res) {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ error: 'username required' });
  const token = jwt.sign({ sub: username }, secret(), { expiresIn: '1h' });
  res.json({ token });
}

function me(req, res) {
  const header = req.headers.authorization || '';
  const token = header.replace(/^Bearer /, '');
  try {
    const payload = jwt.verify(token, secret());
    res.json({ user: payload.sub });
  } catch (err) {
    res.status(401).json({ error: 'invalid token' });
  }
}

module.exports = { login, me };
