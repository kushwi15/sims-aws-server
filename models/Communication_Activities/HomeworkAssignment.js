const mongoose = require('mongoose');

const HomeworkAssignmentSchema = new mongoose.Schema({
  assignment_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
    index: true,
  },
  subject_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  class_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  teacher_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
  },
  due_date: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  attachment_url: {
    type: String, 
    default: '',
  },
}, {
  timestamps: true
});

module.exports = HomeworkAssignmentSchema;
