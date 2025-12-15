const mongoose = require("mongoose");

const ExamSeatAllocationSchema = new mongoose.Schema(
  {
    allocation_id: {
      type: String,
      required: true,
      unique: true,
    },
    exam_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    hall_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamHall",
      required: true,
    },
    seat_number: {
      type: String,
      required: true,
    },
    invigilator_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

  
    seat_map_url: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// module.exports = mongoose.model("ExamSeatAllocation", ExamSeatAllocationSchema);
module.exports = ExamSeatAllocationSchema;
