const mongoose = require("mongoose");

const { Schema } = mongoose;

const ExamSchema = new Schema(
  {
    exam_id: {
      type: String,
      required: true,
      unique: true,
    },
    maxMarks: {
      type: Object,
      required: true,
    },
    exam_name: {
      type: String,
    },
    academic_year: {
      type: String,
    },
    start_date: {
      type: Date,
    },
    end_date: {
      type: Date,
    },
    syllabus_file: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    teacher_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
    },
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  {
    collection: "exams",
  }
);

module.exports = ExamSchema;
