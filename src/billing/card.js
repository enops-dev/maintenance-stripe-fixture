function createCardHandler(stripe) {
  return async function card(req, res) {
    try {
      const { token, customerId } = req.body;
      const src = await stripe.sources.create({ type: 'card', token });
      const saved = await stripe.customers.createSource(customerId, { source: src.id });
      res.json({ id: saved.id });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
}

module.exports = { createCardHandler };
