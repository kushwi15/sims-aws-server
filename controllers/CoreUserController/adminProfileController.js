// const AdminProfile = require('../../models/CoreUser/AdminProfile');
const Admin = require('../CoreUserController/adminController');
const User = require('../CoreUserController/userController');
const bcrypt = require('bcryptjs');


exports.getOwnProfile = async (req, res) => {
  try {
    const admin = await AdminProfile.findById(req.user.id).select('-password');
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    res.json(admin);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};


exports.updateProfile = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file && req.file.path) {
      updates.profileImage = req.file.path;
    }
    const admin = await AdminProfile.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    res.json(admin);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};


exports.changePassword = async (req, res) => {
  // console.log('change user password',req.body);
  try {
    const { currentPassword, newPassword } = req.body;
    if (currentPassword || newPassword) {
      // return res.status(400).json({ message: 'All fields are required.' });
      console.log('currentPassword',currentPassword);
      console.log('newPassword',newPassword);
    }
    const user = await User.findById({_id: req.user.id});
    console.log('user id', user._id);
    // const admin = await Admin.findById({users: user});
    // console.log('user change password ',admin);
    // if (!admin) return res.status(404).json({ message: 'Admin not found' });
    // const isMatch = await admin.comparePassword(currentPassword);
    // if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect.' });
    // admin.password = newPassword;
    // await admin.save();
    // res.json({ message: 'Password changed successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};