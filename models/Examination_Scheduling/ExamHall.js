const mongoose = require('mongoose');

const ExamHallSchema = new mongoose.Schema({
  hall_name: {
    type: String,
    required: true,
    trim: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String, 
    default: '',
  },
}, {
  timestamps: true,
});

// module.exports = mongoose.model('ExamHall', ExamHallSchema);
module.exports = ExamHallSchema;
