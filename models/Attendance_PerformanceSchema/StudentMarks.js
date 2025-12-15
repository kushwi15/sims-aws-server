const mongoose = require('mongoose');

const StudentMarksSchema = new mongoose.Schema({
  // exam_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  class_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  marks_obtained: { type: Number, required: true },
  max_marks: { type: Number, required: true },
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  grade: { type: String }, 
  remarks: { type: String },
}, { timestamps: true });

module.exports = StudentMarksSchema;
