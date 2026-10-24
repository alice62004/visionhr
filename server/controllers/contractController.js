const Contract = require('../models/Contract');
const Employee = require('../models/Employee');

// Lấy danh sách hợp đồng
async function getContracts(req, res) {
  try {
    const { departmentId, status, type, search } = req.query;
    const filter = { departmentId, status, type, search };

    // Phân quyền dữ liệu
    if (req.user.role === 'employee') {
      // Nhân viên thông thường chỉ xem hợp đồng của chính mình
      if (!req.user.employeeId) {
        return res.json([]);
      }
      filter.employeeId = req.user.employeeId;
    } else if (req.user.role === 'manager') {
      // Trưởng phòng xem hợp đồng của nhân viên trong phòng mình (nếu chưa chỉ định departmentId)
      if (req.user.department && !filter.departmentId) {
        filter.departmentId = req.user.department;
      }
    }

    const contracts = await Contract.findAll(filter);
    res.json(contracts);
  } catch (err) {
    console.error('[ContractController] getContracts error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách hợp đồng.', error: err.message });
  }
}

// Lấy thống kê hợp đồng (Thẻ KPI đầu trang)
async function getContractStats(req, res) {
  try {
    const stats = await Contract.getStats();
    res.json(stats);
  } catch (err) {
    console.error('[ContractController] getContractStats error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy thống kê hợp đồng.', error: err.message });
  }
}

// Lấy chi tiết 1 hợp đồng
async function getContractById(req, res) {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: 'Không tìm thấy hợp đồng yêu cầu.' });
    }

    // Bảo mật: Nếu là nhân viên, chỉ xem hợp đồng của mình
    if (req.user.role === 'employee' && req.user.employeeId !== contract.employeeId) {
      return res.status(403).json({ message: 'Bạn không có quyền xem hợp đồng của nhân viên khác.' });
    }

    res.json(contract);
  } catch (err) {
    console.error('[ContractController] getContractById error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi xem chi tiết hợp đồng.', error: err.message });
  }
}

// Lấy mã hợp đồng gợi ý tự động
async function getNextContractCode(req, res) {
  try {
    const type = req.query.type || 'HDLD';
    const nextCode = await Contract.generateNextCode(type);
    res.json({ nextCode });
  } catch (err) {
    res.status(500).json({ message: 'Không thể sinh mã hợp đồng.', error: err.message });
  }
}

// Tạo mới hợp đồng
async function createContract(req, res) {
  try {
    const {
      contractCode,
      employeeId,
      contractType,
      signDate,
      effectiveDate,
      expireDate,
      baseSalary,
      insuranceSalary,
      standardWorkDays,
      annualLeaveDays,
      salaryPercentage,
      position,
      workLocation,
      note,
      status,
    } = req.body;

    if (!contractCode || !employeeId || !signDate || !effectiveDate) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ: Mã HĐ, Nhân viên, Ngày ký và Ngày hiệu lực.' });
    }

    // Kiểm tra trùng mã hợp đồng
    const existing = await Contract.findByCode(contractCode.trim());
    if (existing) {
      return res.status(400).json({ message: `Mã hợp đồng "${contractCode}" đã tồn tại trên hệ thống.` });
    }

    // Kiểm tra nhân viên tồn tại
    const emp = await Employee.findById(employeeId);
    if (!emp) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên được chỉ định.' });
    }

    const newId = await Contract.create({
      contractCode: contractCode.trim(),
      employeeId,
      contractType: contractType || 'xac_dinh_thoi_han',
      signDate,
      effectiveDate,
      expireDate: expireDate || null,
      baseSalary: Number(baseSalary) || 0,
      insuranceSalary: Number(insuranceSalary) || 0,
      standardWorkDays: Number(standardWorkDays) || 26,
      annualLeaveDays: Number(annualLeaveDays) || 12,
      salaryPercentage: Number(salaryPercentage) || 100,
      position: position || emp.position,
      workLocation: workLocation || 'Trụ sở chính VisionHR',
      note,
      status: status || 'hieu_luc',
    });

    res.status(201).json({ id: newId, message: 'Tạo hợp đồng lao động mới thành công!' });
  } catch (err) {
    console.error('[ContractController] createContract error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi tạo hợp đồng.', error: err.message });
  }
}

// Cập nhật hợp đồng
async function updateContract(req, res) {
  try {
    const { id } = req.params;
    const existing = await Contract.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Không tìm thấy hợp đồng để cập nhật.' });
    }

    const {
      contractCode,
      contractType,
      signDate,
      effectiveDate,
      expireDate,
      baseSalary,
      insuranceSalary,
      standardWorkDays,
      annualLeaveDays,
      salaryPercentage,
      position,
      workLocation,
      note,
      status,
    } = req.body;

    // Kiểm tra trùng mã nếu đổi mã
    if (contractCode && contractCode.trim() !== existing.contractCode) {
      const dup = await Contract.findByCode(contractCode.trim(), id);
      if (dup) {
        return res.status(400).json({ message: `Mã hợp đồng "${contractCode}" đã được sử dụng.` });
      }
    }

    await Contract.update(id, {
      contractCode: contractCode ? contractCode.trim() : existing.contractCode,
      contractType: contractType || existing.contractType,
      signDate: signDate || existing.signDate,
      effectiveDate: effectiveDate || existing.effectiveDate,
      expireDate: expireDate !== undefined ? expireDate : existing.expireDate,
      baseSalary: baseSalary !== undefined ? Number(baseSalary) : existing.baseSalary,
      insuranceSalary: insuranceSalary !== undefined ? Number(insuranceSalary) : existing.insuranceSalary,
      standardWorkDays: standardWorkDays !== undefined ? Number(standardWorkDays) : existing.standardWorkDays,
      annualLeaveDays: annualLeaveDays !== undefined ? Number(annualLeaveDays) : existing.annualLeaveDays,
      salaryPercentage: salaryPercentage !== undefined ? Number(salaryPercentage) : existing.salaryPercentage,
      position: position || existing.position,
      workLocation: workLocation || existing.workLocation,
      note: note !== undefined ? note : existing.note,
      status: status || existing.status,
    });

    res.json({ message: 'Cập nhật thông tin hợp đồng thành công!' });
  } catch (err) {
    console.error('[ContractController] updateContract error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật hợp đồng.', error: err.message });
  }
}

// Gia hạn hợp đồng (Tạo hợp đồng mới tiếp nối và đánh dấu hợp đồng cũ)
async function renewContract(req, res) {
  try {
    const { id } = req.params;
    const oldContract = await Contract.findById(id);
    if (!oldContract) {
      return res.status(404).json({ message: 'Không tìm thấy hợp đồng gốc để gia hạn.' });
    }

    const {
      newContractCode,
      newContractType = 'xac_dinh_thoi_han',
      newEffectiveDate,
      newExpireDate,
      newBaseSalary,
      newInsuranceSalary,
      note,
    } = req.body;

    // Tính ngày hiệu lực mới = ngày hôm sau của ngày hết hạn cũ nếu không truyền
    let effective = newEffectiveDate;
    if (!effective && oldContract.expireDate) {
      const d = new Date(oldContract.expireDate);
      d.setDate(d.getDate() + 1);
      effective = d.toISOString().split('T')[0];
    }

    // Tự sinh mã nếu không có
    const code = newContractCode || (await Contract.generateNextCode(newContractType));

    // 1. Tạo hợp đồng mới
    const newId = await Contract.create({
      contractCode: code,
      employeeId: oldContract.employeeId,
      contractType: newContractType,
      signDate: new Date().toISOString().split('T')[0],
      effectiveDate: effective || new Date().toISOString().split('T')[0],
      expireDate: newExpireDate || null,
      baseSalary: newBaseSalary !== undefined ? Number(newBaseSalary) : oldContract.baseSalary,
      insuranceSalary: newInsuranceSalary !== undefined ? Number(newInsuranceSalary) : oldContract.insuranceSalary,
      standardWorkDays: oldContract.standardWorkDays || 26,
      annualLeaveDays: oldContract.annualLeaveDays || 12,
      salaryPercentage: 100,
      position: oldContract.position,
      workLocation: oldContract.workLocation,
      note: note ? `Gia hạn từ ${oldContract.contractCode}. Ghi chú: ${note}` : `Gia hạn từ hợp đồng ${oldContract.contractCode}`,
      status: 'hieu_luc',
    });

    // 2. Cập nhật ghi chú hợp đồng cũ
    await Contract.update(id, {
      ...oldContract,
      note: `${oldContract.note || ''}\n[Đã gia hạn sang HĐ ${code} vào ${new Date().toLocaleDateString('vi-VN')}]`,
      status: 'het_han',
    });

    res.status(201).json({
      id: newId,
      newContractCode: code,
      message: `Gia hạn thành công! Hợp đồng mới ${code} đã được kích hoạt.`,
    });
  } catch (err) {
    console.error('[ContractController] renewContract error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi gia hạn hợp đồng.', error: err.message });
  }
}

// Chấm dứt / Thanh lý hợp đồng
async function terminateContract(req, res) {
  try {
    const { id } = req.params;
    const { note } = req.body;
    await Contract.terminate(id, note);
    res.json({ message: 'Đã chấm dứt / thanh lý hợp đồng thành công.' });
  } catch (err) {
    console.error('[ContractController] terminateContract error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi chấm dứt hợp đồng.', error: err.message });
  }
}

module.exports = {
  getContracts,
  getContractStats,
  getContractById,
  getNextContractCode,
  createContract,
  updateContract,
  renewContract,
  terminateContract,
};
