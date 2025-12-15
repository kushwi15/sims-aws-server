const mongoose = require("mongoose");

const AssignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  class: {
    type:String,
    required:true
  },
  subject: {
    type:String,
    required:true
  },
  teacher_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher"
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ["Pending", "Submitted", "Late"],
    default:"Pending"
  },
  submissions: {
    type: Number,
    default: 0
  },
  graded: {
    type: Number,
  },
  description: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  student_id: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student"
  }],
  student_count: {
    type: Number,
    default: 0
  },
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },

});

module.exports = AssignmentSchema;
