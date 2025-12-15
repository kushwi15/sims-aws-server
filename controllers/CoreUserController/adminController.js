const AdminSchema = require("../../models/CoreUser/Admin");
const UserSchema = require('../../models/CoreUser/User');
const StudentSchema = require('../../models/CoreUser/Student');
const TeacherSchema = require('../../models/CoreUser/Teacher');
const ParentSchema = require('../../models/CoreUser/Parent');
const bcrypt = require("bcryptjs");

const cloudinary = require('cloudinary').v2;
const { sendEmail } = require('../../utils/email');
const PasswordResetTokenSchema = require('../../models/CoreUser/PasswordResetToken');
const db = require('../../config/db');
const dbManager = require('../../config/dbManager');
const AWS = require('aws-sdk');
//Acadamic schema
const ClassSchema = require("../../models/AcademicSchema/Class");
const AssignmentSchema = require("../../models/AcademicSchema/Assignment");
const AssignmentSubmissionSchema = require("../../models/AcademicSchema/AssignmentSubmission");
const SubjectSchema = require("../../models/AcademicSchema/Subject");
//Administrative schema
const BankDetailsSchema = require("../../models/AdministrativeSchema/BankDetails");
const FeeSchema = require("../../models/AdministrativeSchema/Fee");
const LeaveApplicationSchema = require("../../models/AdministrativeSchema/LeaveApplication");
const PaymentDetailsSchema = require("../../models/AdministrativeSchema/PaymentDetails");
//Attendance_PerfomanceSchema
const Exam = require("../../models/Attendance_PerformanceSchema/Exam");
const Result = require("../../models/Attendance_PerformanceSchema/Result");
const StudentAttendance = require("../../models/Attendance_PerformanceSchema/StudentAttendance");
const StudentMarks = require("../../models/Attendance_PerformanceSchema/StudentMarks");
const TeacherAttendance = require("../../models/Attendance_PerformanceSchema/TeacherAttendance");
const TeacherSchedule = require("../../models/Attendance_PerformanceSchema/TeacherSchedule");
//Communication_Activities
const Announcement = require("../../models/Communication_Activities/Announcement");
const Event = require("../../models/Communication_Activities/Event");
const HomeworkDiary = require("../../models/Communication_Activities/HomeworkDiary");
const Message = require("../../models/Communication_Activities/Message");
const PersonalDiary = require("../../models/Communication_Activities/PersonalDiary");
//Examination_scheduling
const ExamSchedule = require("../../models/Examination_Scheduling/ExamSchedule");
//Library_management
const Resource = require("../../models/Library_Management/Resource");
const mongoose = require('mongoose');

const { MongoClient } = require('mongodb');
const uri = process.env.MONGO_URI;

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP to email
exports.sendOTP = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const AdminModel = connection.model('Admin', AdminSchema);
    const PasswordResetTokenModel = connection.model('PasswordResetToken', PasswordResetTokenSchema);
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if email exists in the system
    const existingAdmin = await AdminModel.findOne({ email });
    if (!existingAdmin) {
      return res.status(404).json({ message: "Email not found in our system" });
    }

    // Generate OTP and token
    const otp = generateOTP();
    const token = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any existing reset tokens for this email
    await PasswordResetTokenModel.deleteMany({ email });

    // Store OTP and token in database
    const resetToken = new PasswordResetTokenModel({
      email,
      token,
      otp,
      expiresAt,
      userType: 'admin',
      used: false
    });

    await resetToken.save();

    // Email content
    const subject = "OTP Verification - School Management System";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; text-align: center;">OTP Verification</h2>
        <p>Hello,</p>
        <p>You have requested an OTP for your School Management System account.</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p><strong>This OTP will expire in 5 minutes.</strong></p>
        <p>If you didn't request this OTP, please ignore this email.</p>
        <p>Best regards,<br>School Management System Team</p>
      </div>
    `;

    // Send email
    const emailResult = await sendEmail({
      to: email,
      subject,
      html,
      text: `Your OTP is: ${otp}. This OTP will expire in 5 minutes.`
    });

    // For development, if email fails, we still have the OTP stored in Redis
    // The OTP will be logged in console for testing purposes
    if (emailResult.otp) {
      console.log(`=== DEVELOPMENT MODE ===`);
      console.log(`Email: ${email}`);
      console.log(`OTP: ${otp}`);
      console.log(`=== END DEVELOPMENT MODE ===`);
    }

    res.status(200).json({
      message: "OTP sent successfully to your email",
      email: email,
      // For development, include OTP in response if email failed
      ...(emailResult.otp && { developmentOtp: otp })
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const AdminModel = connection.model('Admin', AdminSchema);
    const PasswordResetTokenModel = connection.model('PasswordResetToken', PasswordResetTokenSchema);
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Find the reset token in database
    const resetToken = await PasswordResetTokenModel.findOne({
      email,
      otp,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetToken) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Mark OTP as used
    resetToken.used = true;
    await resetToken.save();

    // Get admin details
    const admin = await AdminModel.findOne({ email }).select('-password');
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json({
      message: "OTP verified successfully",
      admin: admin
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: "Failed to verify OTP. Please try again." });
  }
};

///////////////////Separate database creation using schoolName///////////////////////////


exports.createAdmin = async (req, res) => {
  try {
    const { schoolName, email, userId, password, planType, contactNumber, profileImage, academicStartYear, academicEndYear, studentCount, cloudStorageLimite, storageType } = req.body;

    const now = new Date();
    let renewalDate;
    if (planType === "monthly") {
      renewalDate = new Date(now.setDate(now.getDate() + 30));
    } else if (planType === "yearly") {
      renewalDate = new Date(now.setFullYear(now.getFullYear() + 1));
    }

    // const sanitizedDbName = sanitizeDatabaseName(schoolName);
    const connection = await dbManager.getConnection(schoolName);

    let AdminModel = connection.model('Admin', AdminSchema);
    let UserModel = connection.model('User', UserSchema);

    const newUser = await UserModel.create({
      user_id: userId,
      full_name: schoolName,
      phone: contactNumber,
      profileImage: profileImage,
      academicStartYear,
      academicEndYear,
      email,
      studentCount,
      cloudStorageLimite,
      storageType,
      password,
      role: 'admin',
      is_active: true,
      renewalDate: renewalDate,
      status: "Active",
    });

    const newAdmin = await AdminModel.create({
      schoolName,
      email,
      userId,
      password,
      planType,
      contactNumber,
      profileImage,
      studentCount,
      cloudStorageLimite,
      storageType,
      academicStartYear,
      academicEndYear,
      renewalDate,
      status: "Active",
      users: newUser._id,
    });

    res.status(201).json(newAdmin);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getAllAdmins = async (req, res) => {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const dbList = await client.db().admin().listDatabases();
    const dbNames = dbList.databases
      .filter(db => db.name !== 'admin' && db.name !== 'local' && db.name !== 'config' && db.name !== 'test')
      .map(db => db.name);

    let allAdmins = [];
    for (const dbName of dbNames) {
      const connection = await dbManager.getConnection(dbName);

      const Admin = connection.model('Admin', AdminSchema);

      const admins = await Admin.find({ role: 'admin' }).lean();
      allAdmins.push({ school: dbName, admins });
    }
    res.json({ totalDatabases: dbNames.length, data: allAdmins });
    await client.close();
  } catch (error) {
    console.error('Error fetching all admins:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.updateAdmin = async (req, res) => {
  try {
    const {
      schoolName,
      email,
      userId,
      password,
      status,
      planType,
      contactNumber,
      profileImage,
      startDate,
      endDate,
      academicStartYear,
      academicEndYear,
      studentCount,
      cloudStorageLimite,
      storageType
    } = req.body;

    // First, find the admin across all databases
    const client = new MongoClient(uri);
    await client.connect();
    const dbList = await client.db().admin().listDatabases();
    const dbNames = dbList.databases
      .filter(db => db.name !== 'admin' && db.name !== 'local' && db.name !== 'config' && db.name !== 'test')
      .map(db => db.name);

    let foundAdmin = null;
    let adminConnection = null;
    let AdminModel = null;
    let UserModel = null;

    // Search for the admin in all school databases
    for (const dbName of dbNames) {
      const connection = await dbManager.getConnection(dbName);
      const Admin = connection.model('Admin', AdminSchema);
      const User = connection.model("User", UserSchema);

      const admin = await Admin.findById(req.params.id);

      if (admin) {
        foundAdmin = admin;
        adminConnection = connection;
        AdminModel = Admin;
        UserModel = User;
        break;
      }
    }

    await client.close();

    if (!foundAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const userDoc = await UserModel.findById(foundAdmin.users);
    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    // Store the original password before any modifications
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Update fields
    if (schoolName !== undefined) foundAdmin.schoolName = schoolName;
    if (email !== undefined) foundAdmin.email = email;
    if (userId !== undefined) foundAdmin.userId = userId;
    if (status !== undefined) foundAdmin.status = status;
    if (planType !== undefined) {
      foundAdmin.planType = planType;
      const now = new Date();
      foundAdmin.renewalDate =
        planType === "monthly"
          ? new Date(now.setDate(now.getDate() + 30))
          : new Date(now.setFullYear(now.getFullYear() + 1));
    }
    if (contactNumber !== undefined) foundAdmin.contactNumber = contactNumber;

    if (startDate !== undefined) foundAdmin.startDate = startDate;
    if (endDate !== undefined) foundAdmin.endDate = endDate;
    if (academicStartYear !== undefined) foundAdmin.academicStartYear = academicStartYear;
    if (academicEndYear !== undefined) foundAdmin.academicEndYear = academicEndYear;

    // Update password if provided
    if (hashedPassword) {
      foundAdmin.password = hashedPassword;
      userDoc.password = hashedPassword;
    }

    if (profileImage !== undefined) {
      const deleteOldImage = async (oldImg) => {
        if (oldImg) {
          AWS.config.update({
            region: 'ap-south-1', // use your bucket's region
          });

          const s3 = new AWS.S3();
          const url = new URL(oldImg);
          const key = decodeURIComponent(url.pathname.substring(1));
          const s3Params = {
            Bucket: 'sims-school-files',
            Key: key
          };
          await s3.deleteObject(s3Params).promise();
        }
      }
      if(studentCount !== undefined) foundAdmin.studentCount = studentCount;
      if(cloudStorageLimite !== undefined) foundAdmin.cloudStorageLimite = cloudStorageLimite;
      if(storageType !== undefined) foundAdmin.storageType = storageType;

      // delete admin image
      await deleteOldImage(foundAdmin.profileImage);
      foundAdmin.profileImage = profileImage;

      // delete user image
      await deleteOldImage(userDoc.profileImage);
      userDoc.profileImage = profileImage;
    }

    // Update fields
    if (schoolName !== undefined) userDoc.schoolName = schoolName;
    if (email !== undefined) userDoc.email = email;
    if (userId !== undefined) userDoc.userId = userId;
    if (status !== undefined) userDoc.status = status;
    if (planType !== undefined) {
      userDoc.planType = planType;
      const now = new Date();
      userDoc.renewalDate =
        planType === "monthly"
          ? new Date(now.setDate(now.getDate() + 30))
          : new Date(now.setFullYear(now.getFullYear() + 1));
    }
    if (contactNumber !== undefined) userDoc.contactNumber = contactNumber;

    if (startDate !== undefined) userDoc.startDate = startDate;
    if (endDate !== undefined) userDoc.endDate = endDate;
    if (academicStartYear !== undefined) userDoc.academicStartYear = academicStartYear;
    if (academicEndYear !== undefined) userDoc.academicEndYear = academicEndYear;
    if (studentCount !== undefined) userDoc.studentCount = studentCount;
    if (cloudStorageLimite !== undefined) userDoc.cloudStorageLimite = cloudStorageLimite;
    if(storageType !== undefined) userDoc.storageType = storageType;


    await foundAdmin.save();
    await userDoc.save();

    res.json(foundAdmin);
  } catch (err) {
    console.error('Error updating admin:', err);
    res.status(400).json({ message: err.message });
  }
};


exports.updateAdminStatus = async (req, res) => {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const dbList = await client.db().admin().listDatabases();
    const dbNames = dbList.databases
      .filter(db => db.name !== 'admin' && db.name !== 'local' && db.name !== 'config' && db.name !== 'test')
      .map(db => db.name);

    let foundAdmin = null;
    let foundStudent = null;
    let foundTeacher = null;
    let foundParent = null;
    let adminConnection = null;
    let AdminModel = null;
    let StudentModel = null;
    let ParentModel = null;
    let TeacherModel = null;
    let UserModel = null;

    // Search for the admin in all school databases
    for (const dbName of dbNames) {
      const connection = await dbManager.getConnection(dbName);
      const Admin = connection.model('Admin', AdminSchema);
      const StudentModel = connection.model('Student', StudentSchema);
      const ParentModel = connection.model('Parent', ParentSchema);
      const TeacherModel = connection.model('Teacher', TeacherSchema);
      const UserModel = connection.model('User', UserSchema);

      const admin = await Admin.findById(req.params.id);
      const student = await StudentModel.find({ admin_id: admin._id });
      const teacher = await TeacherModel.find({ admin_id: admin._id });
      const parent = await ParentModel.find({ admin_id: admin._id });
      if (admin) {
        foundAdmin = admin;
        foundStudent = student;
        foundTeacher = teacher;
        foundParent = parent;
        adminConnection = connection;
        AdminModel = Admin;
        StudentModel = StudentModel;
        ParentModel = ParentModel;
        TeacherModel = TeacherModel;
        UserModel = UserModel;
        break;
      }
    }

    const { status } = req.body;
    // const admin = await foundAdmin.findById(req.params.id);

    if (!foundAdmin) return res.status(404).json({ message: "Admin not found" });

    // const student = await Student.find({ admin_id: admin.users });
    // const teacher = await Teacher.find({ admin_id: admin.users });
    // const parent = await Parent.find({ admin_id: admin.users });

    if (!student) {
      res.status(404).json({ message: "students not found" });
    }
    if (!teacher) {
      res.status(404).json({ message: "teachers not found" });
    }
    if (!parent) {
      res.status(404).json({ message: "parents not found" });
    }

    await StudentModel.updateMany({ admin_id: admin._id }, { status });
    await TeacherModel.updateMany({ admin_id: admin._id }, { status });
    await ParentModel.updateMany({ admin_id: admin._id }, { status });

    await UserModel.updateMany({ _id: { $in: student.map(student => student.users) } }, { status });
    await UserModel.updateMany({ _id: { $in: teacher.map(teacher => teacher.users) } }, { status });
    await UserModel.updateMany({ _id: { $in: parent.map(parent => parent.users) } }, { status });


    foundAdmin.status = status;
    await foundAdmin.save();


    await UserModel.findOneAndUpdate(
      { user_id: foundAdmin.userId },
      { status }
    );

    res.json(foundAdmin);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const dbList = await client.db().admin().listDatabases();
    const dbNames = dbList.databases
      .filter(db => db.name !== 'admin' && db.name !== 'local' && db.name !== 'config' && db.name !== 'test')
      .map(db => db.name);

    let foundAdmin = null;
    let adminConnection = null;
    let AdminModel = null;
    let foundUser = null;
    let databaseName = null;

    // Search for the admin in all school databases
    for (const dbName of dbNames) {
      const connection = await dbManager.getConnection(dbName);

      const Admin = connection.model('Admin', AdminSchema);
      const UserModel = connection.model('User', UserSchema);

      const admin = await Admin.findById(req.params.id);
      if (admin) {
        foundAdmin = admin;
        adminConnection = connection;
        AdminModel = Admin;
        foundUser = UserModel;
        databaseName = dbName;
        break;
      }
    }

    // Admin Profile Image delete
    const imageUrl = foundAdmin.profileImage;
    let publicId = null;
    if (!imageUrl) {
      publicId = null;
    } else {
      publicId = imageUrl.split('/').pop().split('.')[0] || null;
      // publicId = `${imageUrl.split('.com/')[1].split('/')[0]}/}`;
    }

    if (publicId) {
      AWS.config.update({
        region: 'ap-south-1', // use your bucket's region
      });

      const s3 = new AWS.S3();
      const url = new URL(imageUrl);
      const key = decodeURIComponent(url.pathname.substring(1));
      const s3Params = {
        Bucket: 'sims-school-files',
        Key: key
      };
      await s3.deleteObject(s3Params).promise();
    }

    if (foundAdmin) {
      await adminConnection.dropDatabase();
    } else {
      res.status(404).json({ message: "Admin not found" });
    }

    res.json({ message: "Admin deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getUserCounts = async (req, res) => {
  try {
    const userId = req.params.userId;

    const { connection, adminId } = await db.getUserSpecificConnection(userId);

    const StudentModel = connection.model('Student', StudentSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const ParentModel = connection.model('Parent', ParentSchema);

    const studentCount = await StudentModel.countDocuments();
    const teacherCount = await TeacherModel.countDocuments();
    const parentCount = await ParentModel.countDocuments();

    res.json({ studentCount, teacherCount, parentCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// exports.getStudentTeacherParentCounts = async (req, res) => {
//   try {
//     const studentCount = await Student.countDocuments();
//     const teacherCount = await Teacher.countDocuments();
//     const parentCount = await Parent.countDocuments();
//     res.json({ studentCount, teacherCount, parentCount });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };


exports.updateExpiredAdminStatuses = async () => {
  const client = new MongoClient(uri);
  await client.connect();
  const dbList = await client.db().admin().listDatabases();
  const dbNames = dbList.databases
    .filter(db => db.name !== 'admin' && db.name !== 'local' && db.name !== 'config' && db.name !== 'test')
    .map(db => db.name);

  let foundAdmin = null;
  let adminConnection = null;
  let AdminModel = null;
  let UserModel = null;

  // Search for the admin in all school databases
  for (const dbName of dbNames) {
    const connection = await dbManager.getConnection(dbName);
    const Admin = connection.model('Admin', AdminSchema);
    const UserModel = connection.model('User', UserSchema);

    const admin = await Admin.findById(req.params.id);
    if (admin) {
      foundAdmin = admin;
      adminConnection = connection;
      AdminModel = Admin;
      UserModel = UserModel;
      break;
    }
  }
  const now = new Date();
  const expiredAdmins = await AdminModel.find({ renewalDate: { $lt: now }, status: 'Active' });
  for (const admin of expiredAdmins) {
    admin.status = 'Inactive';
    await admin.save();
  }
};

// Reset password after OTP verification
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update admin password
    admin.password = hashedPassword;
    await admin.save();

    // Update corresponding User document password
    await User.findByIdAndUpdate(admin.users, { password: hashedPassword });

    // Send confirmation email
    const subject = "Password Reset Successful - School Management System";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #28a745; text-align: center;">Password Reset Successful</h2>
        <p>Hello,</p>
        <p>Your password has been successfully reset for your School Management System account.</p>
        <p>If you didn't perform this action, please contact support immediately.</p>
        <p>Best regards,<br>School Management System Team</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject,
      html,
      text: "Your password has been successfully reset. If you didn't perform this action, please contact support immediately."
    });

    res.status(200).json({ message: "Password reset successfully" });

  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: "Failed to reset password. Please try again." });
  }
};
