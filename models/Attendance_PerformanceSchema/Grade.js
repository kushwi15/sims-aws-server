const mongoose = require("mongoose");

const GradeSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  subject_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  exam_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exam",
    required: true,
  },
  marks_obtained: {
    type: Number,
    required: true,
  },
  max_marks: {
    type: Number,
    required: true,
  },
  grade: {
    type: String,
    enum: ["A", "B", "C", "D", "F"],
    required: true,
  },
  remarks_text: {
    type: String, 
  },
  remarks_file: {
    type: String, 
  },
}, { timestamps: true });

// module.exports = mongoose.model("Grade", GradeSchema);
module.exports = GradeSchema;
