const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../../utils/email');
const AdminSchema = require('../../models/CoreUser/Admin');
const TeacherSchema = require('../../models/CoreUser/Teacher');
const StudentSchema = require('../../models/CoreUser/Student');
const ParentSchema = require('../../models/CoreUser/Parent');
const AdminStaffSchema = require('../../models/CoreUser/AdminStaff');
const PasswordResetTokenSchema = require('../../models/CoreUser/PasswordResetToken');
const UserSchema = require('../../models/CoreUser/User');
const db = require('../../config/db');
const dbManager = require('../../config/dbManager');

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate secure token
const generateToken = () => {
  return require('crypto').randomBytes(32).toString('hex');
};

// Find user by email across all user types
const findUserByEmail = async (email) => {
  // Get connection without requiring user authentication
  const { MongoClient } = require('mongodb');
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const dbList = await client.db().admin().listDatabases();
    const dbNames = dbList.databases
      .filter(db => db.name !== 'admin' && db.name !== 'local' && db.name !== 'config' && db.name !== 'test')
      .map(db => db.name);
    
    // Search for the user in all school databases
    for (const dbName of dbNames) {
      const connection = await dbManager.getConnection(dbName);
      
      const AdminModel = connection.model('Admin', AdminSchema);
      const admin = await AdminModel.findOne({ email });
      if (admin) return { user: admin, type: 'admin', connection };
      
      const TeacherModel = connection.model('Teacher', TeacherSchema);
      const teacher = await TeacherModel.findOne({ email });
      if (teacher) return { user: teacher, type: 'teacher', connection };
      
      const StudentModel = connection.model('Student', StudentSchema);
      const student = await StudentModel.findOne({ email });
      if (student) return { user: student, type: 'student', connection };
      
      const ParentModel = connection.model('Parent', ParentSchema);
      const parent = await ParentModel.findOne({ email });
      if (parent) return { user: parent, type: 'parent', connection };
      
      const AdminStaffModel = connection.model('AdminStaff', AdminStaffSchema);
      const adminStaff = await AdminStaffModel.findOne({ email });
      if (adminStaff) return { user: adminStaff, type: 'admin', connection };
    }
    
    return null;
  } finally {
    await client.close();
  }
};

// Request password reset
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      console.log(' No email provided');
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const userData = await findUserByEmail(email);
    if (!userData) {
      console.log(' User not found for email:', email);
      return res.status(404).json({ message: 'User not found with this email' });
    }

    const { user, type, connection } = userData;
    console.log(' User found:', type, user.name || user.firstName || 'Unknown');

    // Check if user is active
    if (user.status !== 'Active') {
      console.log('User account inactive:', user.status);
      return res.status(400).json({ message: 'Account is inactive. Please contact support.' });
    }

    const PasswordResetTokenModel = connection.model('PasswordResetToken', PasswordResetTokenSchema);

    // Generate OTP and token
    const otp = generateOTP();
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log(' Generated OTP:', otp, 'for email:', email);

    // Delete any existing reset tokens for this email
    await PasswordResetTokenModel.deleteMany({ email });

    // Store OTP and token in database
    const resetToken = new PasswordResetTokenModel({
      email,
      token,
      otp,
      expiresAt,
      userType: type,
      used: false
    });

    await resetToken.save();
    console.log('OTP stored in database for email:', email);

    // Send email with OTP
    const emailSubject = 'Password Reset OTP - School Management System';
    const emailText = `Your password reset OTP is: ${otp}\n\nThis OTP will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Password Reset Request</h2>
        <p>Hello ${user.name || user.firstName || 'User'},</p>
        <p>You have requested to reset your password for the School Management System.</p>
        <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h3 style="color: #1F2937; margin: 0; font-size: 24px; letter-spacing: 4px;">${otp}</h3>
        </div>
        <p><strong>This OTP will expire in 10 minutes.</strong></p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #E5E7EB;">
        <p style="color: #6B7280; font-size: 14px;">This is an automated message from the School Management System.</p>
      </div>
    `;

    console.log(' Attempting to send email to:', email);
    const emailResult = await sendEmail({
      to: email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml
    });
    console.log('Email send result:', emailResult);

    res.status(200).json({
      message: 'Password reset OTP sent to your email',
      email: email // Return email for frontend reference
    });

  } catch (error) {
    console.error(' Password reset request error:', error);
    res.status(500).json({ message: 'Failed to send password reset email' });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Find user by email to get the connection
    const userData = await findUserByEmail(email);
    if (!userData) {
      return res.status(404).json({ message: 'User not found with this email' });
    }
    
    const { connection } = userData;
    const PasswordResetTokenModel = connection.model('PasswordResetToken', PasswordResetTokenSchema);

    // Find the reset token in database
    const resetToken = await PasswordResetTokenModel.findOne({
      email,
      otp,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetToken) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Generate JWT token for password reset
    const jwtToken = jwt.sign(
      { 
        userId: resetToken._id,
        email,
        userType: resetToken.userType
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Mark OTP as used
    resetToken.used = true;
    await resetToken.save();

    res.status(200).json({
      message: 'OTP verified successfully',
      token: jwtToken
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const { userId, email, userType } = decoded;

    // Find user by email to get the connection
    const userData = await findUserByEmail(email);
    if (!userData) {
      return res.status(404).json({ message: 'User not found with this email' });
    }
    
    const { connection } = userData;
    const PasswordResetTokenModel = connection.model('PasswordResetToken', PasswordResetTokenSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const ParentModel = connection.model('Parent', ParentSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const AdminModel = connection.model('Admin', AdminSchema);
    const UserModel = connection.model('User', UserSchema);

    // Find the reset token
    const resetToken = await PasswordResetTokenModel.findById(userId);
    // if (!resetToken || resetToken.used) {
    //   return res.status(400).json({ message: 'Invalid or used reset token' });
    // }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Find user by email and type
    if (!userData || userData.type !== userType) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { user } = userData;
    const userDataa = user.users?._id;
    console.log('userDataa', userDataa);

    console.log('userType', user._id);

    // Update password based on user type
    let updatedUser;
    let updatedUserr;
    switch (userType) {
      case 'admin':
        updatedUser = await AdminModel.findByIdAndUpdate(
          user._id, 
          { password: hashedPassword },
          { new: true }
        );
        if (userDataa) {
          updatedUserr = await UserModel.findByIdAndUpdate(
            userDataa,
            { password: hashedPassword },
            { new: true }
          );
        }
        break;
      case 'teacher':
        updatedUser = await TeacherModel.findByIdAndUpdate(
          user._id,
          { password: hashedPassword },
          { new: true }
        );
        break;
      case 'student':
        updatedUser = await StudentModel.findByIdAndUpdate(
          user._id,
          { password: hashedPassword },
          { new: true }
        );
        break;
      case 'parent':
        updatedUser = await ParentModel.findByIdAndUpdate(
          user._id,
          { password: hashedPassword },
          { new: true }
        );
        break;
      default:
        return res.status(400).json({ message: 'Invalid user type' });
    }

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the reset token
    await PasswordResetTokenModel.findByIdAndDelete(userId);

    // Send confirmation email
    const emailSubject = 'Password Reset Successful - School Management System';
    const emailText = `Your password has been successfully reset.\n\nIf you didn't perform this action, please contact support immediately.`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Password Reset Successful</h2>
        <p>Hello ${updatedUser.name || updatedUser.firstName || 'User'},</p>
        <p>Your password has been successfully reset for the School Management System.</p>
        <div style="background-color: #ECFDF5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <p style="margin: 0; color: #065F46;"><strong>✅ Password reset completed successfully</strong></p>
        </div>
        <p>You can now login with your new password.</p>
        <p><strong>If you didn't perform this action, please contact support immediately.</strong></p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #E5E7EB;">
        <p style="color: #6B7280; font-size: 14px;">This is an automated message from the School Management System.</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml
    });

    res.status(200).json({
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

// Resend OTP
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const userData = await findUserByEmail(email);
    if (!userData) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    const { user, type, connection } = userData;
    const PasswordResetTokenModel = connection.model('PasswordResetToken', PasswordResetTokenSchema);

    // Check if user is active
    if (user.status !== 'Active') {
      return res.status(400).json({ message: 'Account is inactive. Please contact support.' });
    }

    // Generate new OTP and token
    const otp = generateOTP();
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing reset tokens for this email
    await PasswordResetTokenModel.deleteMany({ email });

    // Store new OTP and token in database
    const resetToken = new PasswordResetTokenModel({
      email,
      token,
      otp,
      expiresAt,
      userType: type,
      used: false
    });

    await resetToken.save();

    // Send new OTP email
    const emailSubject = 'New Password Reset OTP - School Management System';
    const emailText = `Your new password reset OTP is: ${otp}\n\nThis OTP will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">New Password Reset OTP</h2>
        <p>Hello ${user.name || user.firstName || 'User'},</p>
        <p>You have requested a new password reset OTP for the School Management System.</p>
        <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h3 style="color: #1F2937; margin: 0; font-size: 24px; letter-spacing: 4px;">${otp}</h3>
        </div>
        <p><strong>This OTP will expire in 10 minutes.</strong></p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #E5E7EB;">
        <p style="color: #6B7280; font-size: 14px;">This is an automated message from the School Management System.</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml
    });

    res.status(200).json({
      message: 'New OTP sent to your email'
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to resend OTP' });
  }
};

// Test email functionality
const testEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    console.log(' Testing email functionality for:', email);

    // Generate test OTP
    const testOtp = generateOTP();
    console.log(' Test OTP generated:', testOtp);

    // Send test email
    const emailResult = await sendEmail({
      to: email,
      subject: 'Test Email - School Management System',
      text: `This is a test email. Your test OTP is: ${testOtp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Test Email</h2>
          <p>This is a test email to verify email functionality.</p>
          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h3 style="color: #1F2937; margin: 0; font-size: 24px; letter-spacing: 4px;">${testOtp}</h3>
          </div>
          <p>If you can see this email, the email system is working correctly.</p>
        </div>
      `
    });

    console.log(' Test email result:', emailResult);

    res.status(200).json({
      message: 'Test email sent successfully',
      email: email,
      testOtp: testOtp,
      result: emailResult
    });

  } catch (error) {
    console.error(' Test email error:', error);
    res.status(500).json({ message: 'Failed to send test email', error: error.message });
  }
};

module.exports = {
  requestPasswordReset,
  verifyOTP,
  resetPassword,
  resendOTP,
  testEmail
};
