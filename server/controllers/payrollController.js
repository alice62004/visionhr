const Payroll = require('../models/Payroll');

async function getPayrolls(req, res) {
  const payrolls = await Payroll.findAll(req.query.month);
  res.json(payrolls);
}

module.exports = { getPayrolls };
