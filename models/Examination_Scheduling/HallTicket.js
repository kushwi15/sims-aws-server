const mongoose = require("mongoose");

const HallTicketSchema = new mongoose.Schema({
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
  exam_date: {
    type: Date,
    required: true,
  },
  generated_at: {
    type: Date,
    default: Date.now,
  },
  download_url: {
    type: String,
    required: true, 
  },
  status: {
    type: String,
    enum: ["Generated", "Reissued"],
    default: "Generated",
  },
});

// module.exports = mongoose.model("HallTicket", HallTicketSchema);
module.exports = HallTicketSchema;
