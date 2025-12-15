

const mongoose = require('mongoose');

const TeacherAttendanceSchema = new mongoose.Schema({
  // attendance_id: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   default: () => new mongoose.Types.ObjectId(),
  // },
  teacher_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Leave', 'Half Day', 'Late'],
    required: true,
  },
  checkIn: {
    type: String, 
  },
  checkOut: {
    type: String, 
  },
  comment: {
    type: String,
  },
  proofImage: {
    type: String, 
  },
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = TeacherAttendanceSchema;
