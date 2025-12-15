
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const AdminSchema = new mongoose.Schema(
  {
    schoolName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      // unique: true,
    },
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    planType: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true,
    },
    renewalDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    role: {
      type: String,
      enum: ["admin", "super_admin"],
      default: "admin",
    },
    contactNumber: {
      type: String,
      required: false,
    },
    academicStartYear: {
      type: Date,
      required: true,
    },
    academicEndYear: {
      type: Date,
      required: true,
    },
    profileImage: {
      type: String, 
      required: false,
    },
    studentCount: {
      type: Number,
      default: 0,
    },
    cloudStorageLimite: {
      type: Number,
      default: 0
    },
    storageType:{
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    users:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
  },
  { timestamps: true }
);


AdminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = AdminSchema;
