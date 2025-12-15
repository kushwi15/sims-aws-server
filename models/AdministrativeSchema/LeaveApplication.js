const mongoose = require("mongoose");

const LeaveApplicationSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    leave_type: {
      type: String,
      enum: ["Sick Leave", "Casual Leave","Earned Leave","Maternity/Paternity Leave","Sabbatical","Other"],
      required: true,
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    reason: {
      type: String,
      required: true,
    },
    document_url: {
      type: String, 
    },
    document_id: {
      type: String, 
    },
    adminComment: {
      type: String,
      default: '',
    },
    employeeId: {
      type:String,
    },
    student_id:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    },
    applicantName: {
      type: String,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = LeaveApplicationSchema;
