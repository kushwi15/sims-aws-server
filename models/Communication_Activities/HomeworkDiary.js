const mongoose = require('mongoose');

const HomeworkItemSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  homework: { type: String, required: true },
  class_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' }, 
}, { _id: false });

const HomeworkDiarySchema = new mongoose.Schema({
  teacherId: { type: String, required: true },
  teacherUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  date: { type: String, required: true }, 
  classSelected: { type: String, required: true }, 
  sectionSelected: { type: String, required: true }, 
  homeworkItems: { type: [HomeworkItemSchema], required: true },
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
}, { timestamps: true });

module.exports = HomeworkDiarySchema;
