const mongoose = require('mongoose');
const { Schema } = mongoose;
const bcrypt = require("bcryptjs");

const TeacherSchema = new Schema({
  user_id: {
    type: String,
    // ref: 'User',
    // required: true,
    unique: true,
  },
  full_name: {
    type: String,
    // required: true,
  },
  email: {
    type: String
  },
  password: {
    type: String,
    // required:true
  },
  role: {
    type: String
  },
  phone: {
    type: String,
    // required: true,
    match: /^[6-9]\d{9}$/, 
  },
  status:{
    type: String,
    default: "Active",
  },
  address: {
    type: String
  },
  qualification: {
    type: String,
    // required: true,
  },
  // subjects_taught: [
  //   {
  //     type: String 
  //     // type: mongoose.Schema.Types.ObjectId, ref: 'Subject'
  //   }
  // ],
  assigned_classes: [
    {
      type: String
      // type: mongoose.Schema.Types.ObjectId, ref: 'Class'
    }
  ],
  class_teacher: {
    type: String
    // type: mongoose.Schema.Types.ObjectId, ref: 'Class'
  },
  profile_image: {
    type: String, 
    required: false,
  },
  // certificates: [
  //   {
  //     public_id: String,
  //     url: String,
  //   }
  // ],
  joining_date: {
    type: Date,
    default: Date.now,
  },
  salary_details: {
    type: Schema.Types.ObjectId,
    ref: 'Payroll', 
  },
  users: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  admin_id: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
}, { timestamps: true });

TeacherSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = TeacherSchema;
