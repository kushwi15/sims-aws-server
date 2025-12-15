const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { Schema } = mongoose;
const { v4: uuidv4 } = require("uuid");
const { validatePasswordStrength } = require("../../utils/passwordUtils");

const UserSchema = new Schema({
  user_id: {
    type: String,
    // default: uuidv4,
    unique: true,
    required: true
  },
  full_name: {
    type: String
  },
  studentCount: {
    type: Number,
    default: 0,
  },
  cloudStorageLimite: {
    type: Number,
    default: 0
  },
  storageType: {
    type: String,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
  },
  profileImage: {
    type: String,
  },
  class_id: {
    type: String,
  },
  section: {
    type: String,
  },
  status: {
    type: String,
  },
  subjects_taught: [
    {
      type: String
      // type: mongoose.Schema.Types.ObjectId, ref: 'Subject'
    }
  ],
  assigned_classes: [
    {
      type: String
    }
  ],
  role: {
    type: String,
    enum: ["superadmin", "admin", "teacher", "student", "parent"],
    required: true,
    default: 'student'
  },
  renewalDate: {
    type: Date,
  },
  academicStartYear: {
    type: Date,
  },
  academicEndYear: {
    type: Date,
  },
  is_active: {
    type: Boolean,
    default: true
  },
  last_login: {
    type: Date
  },
  otp: {
    type: String,
  },
  otpExpires: {
    type: Date,
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});


UserSchema.pre('save', async function (next) {

  if (!this.isModified('password')) return next();


  const validation = validatePasswordStrength(this.password);
  if (!validation.isValid) {
    return next(new Error(validation.message));
  }

  try {

    const salt = await bcrypt.genSalt(12);

    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});


UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


UserSchema.methods.needsRehash = async function () {
  return await bcrypt.getRounds(this.password) < 12;
};


UserSchema.methods.changePassword = async function (currentPassword, newPassword) {

  const isCurrentPasswordValid = await this.matchPassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new Error('Current password is incorrect');
  }


  const validation = validatePasswordStrength(newPassword);
  if (!validation.isValid) {
    throw new Error(validation.message);
  }


  this.password = newPassword;
  await this.save();

  return true;
};

module.exports = UserSchema;
