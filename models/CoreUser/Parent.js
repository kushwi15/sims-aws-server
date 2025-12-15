const mongoose = require('mongoose');
const { Schema } = mongoose;
const bcrypt = require("bcryptjs");

const ParentSchema = new Schema(
  {
    user_id: {
      // type: mongoose.Schema.Types.ObjectId,
      type:String,
      // ref: 'User',
      required: true,
      unique: true,
    },
    password:{
      type:String,
      required:true,
    },
    full_name: {
      type: String,
      required: true,
    },
    email:{
      type:String
    },
    // password:{
    //   type:String,
    //   required:true,
    // },
    childrenCount:{
      type:Number,
      default:0,
    },
    role:{
      type:String,
      default: 'parent'
    },
    phone: {
      type: String,
      required: true,
    },
    // occupation: {
    //   type: String,
    // },
    address: {
      type: String,
    },
    status:{
      type: String,
      default: "Active",
    },
    // relationship: {
    //   type: String,
    //   enum: ['Mother', 'Father', 'Guardian'],
    //   // required: true,
    // },
    profileImage: {
      type: String, 
    },
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      }
    ],
    users:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
ParentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = ParentSchema;
