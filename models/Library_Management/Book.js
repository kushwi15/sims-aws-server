const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  author: String,
  isbn: {
    type: String,
    unique: true,
    required: true,
  },
  publisher: String,
  edition: String,
  category: {
    type: String,
    enum: ["Science", "Fiction", "Reference"],
    required: true,
  },
  total_copies: {
    type: Number,
    required: true,
    min: 1,
  },
  available_copies: {
    type: Number,
    required: true,
    min: 0,
  },
  shelf_location: String,
  added_date: {
    type: Date,
    default: Date.now,
  },
  bookImage: {
    public_id: String,
    url: String,
  },
});

// module.exports = mongoose.model("Book", BookSchema);
module.exports = BookSchema;
