const mongoose = require("mongoose");
const ResultSchema = new mongoose.Schema({
  
  id: {
    type: String,
    required: true,
  },
  
  name: {
    type: String,
    required: true,
    
  },
  
  class: {
    type: String,
    required: true,
  },
  
  section: {
    type: String,
    required: true,
  },
  
  rollNo: {
    type: String,
    required: true,
    
  },
  
  marks: {
    type: Object,
    required: true,
  },
  maxMarks: {
    type: Object,
    required: true,
  },
  examType: {
    type: String,
    enum: [
      "Formative Assessment 1", 
      "Formative Assessment 2", 
      "Formative Assessment 3",
      "Summative Assessment 1", 
      "Summative Assessment 2", 
      "Summative Assessment 3"
    ],
    required: true,
  },
  teacher_id:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
  },
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
},
{ timestamps: true }
)

// Create compound unique index for id + examType + admin_id to prevent duplicate results for same student and exam type
ResultSchema.index({ id: 1, examType: 1, admin_id: 1 }, { unique: true });

module.exports = ResultSchema;
