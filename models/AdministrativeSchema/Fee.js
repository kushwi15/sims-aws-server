
const mongoose = require("mongoose");

const termSchema = new mongoose.Schema({
  amount_due: {
    type: Number,
    default: 0
  },
  amount_paid: {
    type: Number,
    default: 0
  },
  payment_date: Date,
  payment_method: {
    type: String,
    enum: ["Cash", "Cheque", "Online", "Card", "Bank Transfer", "UPI", ""],
    default: ""
  },
  due_date: Date,
  receipt_url: String,
  status: {
    type: String,
    enum: ["Paid", "Pending", "Overdue"],
    default: "Pending",
  },
});

const FeeSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    student_name: { 
      type: String,
    },
    class: { 
      type: String,
    },
    section: { 
      type: String,
    },
    amount: { 
      type: Number,
      required: true
    },
    first_term: termSchema,
    second_term: termSchema,
    third_term: termSchema,
    overall_status: {
      type: String,
      enum: ["Paid", "Partial", "Pending", "Overdue",],
      default: "Pending",
    },
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  { timestamps: true }
);


FeeSchema.pre('save', function(next) {
  const statuses = [
    this.first_term?.status,
    this.second_term?.status,
    this.third_term?.status,
  ];
  
  if (statuses.every(s => s === "Paid")) {
    this.overall_status = "Paid";
  } else if (statuses.some(s => s === "Overdue")) {
    this.overall_status = "Overdue";
  } else if (statuses.some(s => s === "Paid")) {
    this.overall_status = "Partial";
  } else {
    this.overall_status = "Pending";
  }
  
  next();
});

module.exports = FeeSchema;
