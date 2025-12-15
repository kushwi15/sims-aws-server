const mongoose = require("mongoose");

const MarkSchema = new mongoose.Schema(
  {
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    subject: String,
    exam: String,
    marks_obtained: Number,
    max_marks: Number,
  },
  { timestamps: true }
);

module.exports = MarkSchema;
