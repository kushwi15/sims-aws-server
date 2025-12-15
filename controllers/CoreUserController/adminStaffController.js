const AdminStaff = require('../../models/CoreUser/AdminStaff');
const cloudinary = require('../../config/cloudinary');


exports.createAdminStaff = async (req, res) => {
  try {
    const { admin_id, full_name, phone, department, permissions } = req.body;

    let profileImage = {};
    if (req.file) {
      profileImage = {
        public_id: req.file.filename,
        url: req.file.path,
      };
    }

    const staff = new AdminStaff({
      admin_id,
      full_name,
      phone,
      department,
      permissions,
      profileImage,
    });

    await staff.save();
    res.status(201).json(staff);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


exports.getAllAdminStaff = async (req, res) => {
  try {
    const staff = await AdminStaff.find().populate('admin_id', 'email role');
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getAdminStaffById = async (req, res) => {
  try {
    const staff = await AdminStaff.findById(req.params.id).populate('admin_id', 'email role');
    if (!staff) return res.status(404).json({ message: 'Admin staff not found' });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.updateAdminStaff = async (req, res) => {
  try {
    const staff = await AdminStaff.findById(req.params.id);
    if (!staff) return res.status(404).json({ message: 'Admin staff not found' });

    const { full_name, phone, department, permissions } = req.body;

    if (full_name) staff.full_name = full_name;
    if (phone) staff.phone = phone;
    if (department) staff.department = department;
    if (permissions) staff.permissions = permissions;

    if (req.file) {
      
      staff.profileImage = {
        public_id: req.file.filename,
        url: req.file.path,
      };
    }

    const updated = await staff.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


exports.deleteAdminStaff = async (req, res) => {
  try {
    const staff = await AdminStaff.findById(req.params.id);
    if (!staff) return res.status(404).json({ message: 'Admin staff not found' });

    if (staff.profileImage?.public_id) {
      await cloudinary.uploader.destroy(staff.profileImage.public_id);
    }

    await staff.deleteOne();
    res.json({ message: 'Admin staff deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
