const Leave = require('../models/Leave');

async function getLeaveRequests(req, res) {
  const requests = await Leave.findAll();
  res.json(requests);
}

async function createLeaveRequest(req, res) {
  const employeeId = req.user.employeeId || req.user.id;
  const id = await Leave.create({ ...req.body, employeeId });
  res.status(201).json({ id });
}

async function approveLeaveRequest(req, res) {
  await Leave.approve(req.params.id);
  res.json({ message: 'Đã duyệt đơn nghỉ phép.' });
}

async function rejectLeaveRequest(req, res) {
  const { reason } = req.body;
  await Leave.reject(req.params.id, reason);
  res.json({ message: 'Đã từ chối đơn nghỉ phép.' });
}

module.exports = { getLeaveRequests, createLeaveRequest, approveLeaveRequest, rejectLeaveRequest };
