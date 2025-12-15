const mongoose = require('mongoose');

const HostelAttendanceSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Night-Out'],
    required: true
  },
  remarks: {
    type: String
  },
  remarksImage: {
    type: String 
  }
}, {
  timestamps: true
});

// module.exports = mongoose.model('HostelAttendance', HostelAttendanceSchema);
module.exports = HostelAttendanceSchema;
