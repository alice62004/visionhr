const Overtime = require('../models/Overtime');

async function getOvertimeRequests(req, res) {
  const requests = await Overtime.findAll();
  res.json(requests);
}

async function createOvertimeRequest(req, res) {
  const employeeId = req.user.employeeId || req.user.id;
  const id = await Overtime.create({ ...req.body, employeeId });
  res.status(201).json({ id });
}

async function approveOvertimeRequest(req, res) {
  await Overtime.approve(req.params.id);
  res.json({ message: 'Đã duyệt yêu cầu tăng ca.' });
}

async function rejectOvertimeRequest(req, res) {
  const { reason } = req.body;
  await Overtime.reject(req.params.id, reason);
  res.json({ message: 'Đã từ chối yêu cầu tăng ca.' });
}

module.exports = { getOvertimeRequests, createOvertimeRequest, approveOvertimeRequest, rejectOvertimeRequest };
