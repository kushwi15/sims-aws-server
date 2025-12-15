const mongoose = require('mongoose');

const PersonalDiarySchema = new mongoose.Schema({
  teacherId: { type: String, required: true },
  teacherUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  date: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  
}, { timestamps: true });

module.exports = PersonalDiarySchema;