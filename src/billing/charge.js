function createChargeHandler(stripe) {
  return async function charge(req, res) {
    try {
      const { amount, currency, source } = req.body;
      const result = await stripe.charges.create({ amount, currency, source });
      res.json({ id: result.id, status: result.status });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
}

module.exports = { createChargeHandler };
