const mongoose = require('mongoose');
const { Schema } = mongoose;

const StudentAttendanceSchema = new Schema({
  student_id: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Half Day', 'Leave'],
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
}, { timestamps: true });

module.exports = StudentAttendanceSchema;
