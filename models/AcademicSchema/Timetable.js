const mongoose = require('mongoose');

const TimetableSchema = new mongoose.Schema({
  class_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    required: true,
  },
  periods: [
    {
      subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
      teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
      start_time: String,
      end_time: String,
    },
  ],
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
  },
}, { timestamps: true });

// module.exports = mongoose.model('Timetable', TimetableSchema);
module.exports = TimetableSchema;
