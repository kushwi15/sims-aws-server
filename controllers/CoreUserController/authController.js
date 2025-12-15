const UserSchema = require('../../models/CoreUser/User');
const StudentSchema = require('../../models/CoreUser/Student');
const ParentSchema = require('../../models/CoreUser/Parent');
const AdminSchema = require("../../models/CoreUser/Admin");
const TeacherSchema = require('../../models/CoreUser/Teacher');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const db = require('../../config/db');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.loginParent = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { connection } = await db.getUserSpecificConnection(req.user._id);
    const UserModel = connection.model('User', UserSchema);
    const ParentModel = connection.model('Parent', ParentSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const AdminModel = connection.model('Admin', AdminSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const user = await UserModel.findOne({ email });

    if (!user || user.role !== 'parent') {
      return res.status(401).json({ message: 'Invalid credentials or not a parent' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const parentProfile = await ParentModel.findOne({ parent_id: user._id });

    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      parentProfile,
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};



exports.loginStudent = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { connection } = await db.getUserSpecificConnection(req.user._id);
    const UserModel = connection.model('User', UserSchema);
    const ParentModel = connection.model('Parent', ParentSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const AdminModel = connection.model('Admin', AdminSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const user = await UserModel.findOne({ email });

    if (!user || user.role !== 'student') {
      return res.status(401).json({ message: 'Invalid credentials or not a student' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }


    const studentProfile = await StudentModel.findOne({ student_id: user._id })
      .populate('parent_id', 'full_name user_id')
      .populate('class_id', 'name');

    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      studentProfile,
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

exports.loginTeacher = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { connection } = await db.getUserSpecificConnection(req.user._id);
    const UserModel = connection.model('User', UserSchema);
    const ParentModel = connection.model('Parent', ParentSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const AdminModel = connection.model('Admin', AdminSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const user = await UserModel.findOne({ email });

    if (!user || user.role !== 'teacher') {
      return res.status(401).json({ message: 'Invalid credentials or not a teacher' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const teacherProfile = await TeacherModel.findOne({ user_id: user.user_id });

    if (!teacherProfile) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      teacherProfile,
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

exports.loginAdmin = async (req, res) => {
  const { user_id, password } = req.body;
  const { connection } = await db.getUserSpecificConnection(req.user._id);
  const UserModel = connection.model('User', UserSchema);
  const ParentModel = connection.model('Parent', ParentSchema);
  const StudentModel = connection.model('Student', StudentSchema);
  const AdminModel = connection.model('Admin', AdminSchema);
  const TeacherModel = connection.model('Teacher', TeacherSchema);
  const admin = await AdminModel.findOne({ userId: user_id }); // userId, not user_id

  if (!admin) return res.status(404).json({ message: "Admin not found" });

  if (admin.status === "Inactive") {
    return res.status(403).json({ message: "Admin account is inactive" });
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  // Generate token with admin._id and role
  const jwt = require("jsonwebtoken");
  const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: "30d" });

  res.json({ message: "Login successful", token, admin_id: admin._id, role: admin.role });
};


exports.logoutUser = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(400).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const expiry = decoded.exp - Math.floor(Date.now() / 1000); // seconds until expiry

    // store in redis blacklist
    // await redisClient.setEx(`blacklist:${token}`, expiry, "true");

    return res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
