const UserSchema = require('../../models/CoreUser/User');
const AdminSchema = require("../../models/CoreUser/Admin");
const dbManager = require('../../config/dbManager');
const db = require('../../config/db');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getHomeworkByClassSectionUnderMyAdmin } = require('../Communication_Activities/diaryController');

const { MongoClient } = require('mongodb');
const uri = process.env.MONGO_URI;

exports.register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });


    const newUser = new User({ email, password, role });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { user_id, password } = req.body;
    const client = new MongoClient(uri);
    await client.connect();
    const dbList = await client.db().admin().listDatabases();
    const dbNames = dbList.databases
      .filter(db => db.name !== 'admin' && db.name !== 'local' && db.name !== 'config' && db.name !== 'test')
      .map(db => db.name);

    let foundUser = null;
    let userConnection = null;
    let UserModel = null;

    // Search for the user in all school databases
    for (const dbName of dbNames) {
      const connection = await dbManager.getConnection(dbName);
      UserModel = connection.model('User', UserSchema);

      const user = await UserModel.findOne({ user_id });
      if (user) {
        foundUser = user;
        userConnection = connection;
        UserModel = UserModel;
        break;
      }
    }

    //finding admin
    const AdminModel = userConnection.model('Admin', AdminSchema);
    const admin = await AdminModel.find();


    const userprofile = {
      _id: foundUser._id,
      schoolId: admin[0].userId,
      studentCount: admin[0].studentCount,
      cloudStorageLimite: admin[0].cloudStorageLimite,
      storageType: admin[0].storageType,
      user_id: foundUser.user_id,
      full_name: foundUser.full_name,
      email: foundUser.email,
      phone: foundUser.phone,
      profileImage: foundUser.profileImage,
      role: foundUser.role,
      subjects_taught: foundUser.subjects_taught,
      assigned_classes: foundUser.assigned_classes,
      is_active: foundUser.is_active,
      renewalDate: foundUser.renewalDate,
      class_id: foundUser.class_id,
      section: foundUser.section,
      status: foundUser.status,
      academicStartYear: foundUser.academicStartYear,
      academicEndYear: foundUser.academicEndYear,
    }

    await client.close();

    if (!foundUser) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await foundUser.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: foundUser._id, role: foundUser.role }, process.env.JWT_SECRET, { expiresIn: "30d" });

    foundUser.last_login = new Date();
    await foundUser.save();


    res.status(200).json({ token, role: foundUser.role,userprofile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const {connection} = await db.getUserSpecificConnection(req.user._id);
    const UserModel = connection.model('User', UserSchema);
    const user = await UserModel.findOne({ user_id: req.user.user_id }).select("-password");
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const {connection,adminId,userId} = await db.getUserSpecificConnection(req.user._id);
    const UserModel = connection.model('User', UserSchema);
    const AdminModel = connection.model('Admin', AdminSchema);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const admin = await AdminModel.findOne({ users: req.user.id });
    admin.password = newPassword;

    await user.changePassword(currentPassword, newPassword);
    await admin.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
