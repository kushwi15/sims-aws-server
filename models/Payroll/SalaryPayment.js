const mongoose = require("mongoose");

const SalaryPaymentSchema = new mongoose.Schema({
  payment_id: {
    type: String,
    required: true,
    unique: true,
  },
  salary_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SalaryStructure", 
    required: true,
  },
  month_year: {
    type: String, 
    required: true,
  },
  paid_amount: {
    type: Number,
    required: true,
  },
  payment_date: {
    type: Date,
    required: true,
  },
  payment_method: {
    type: String,
    enum: ["Bank Transfer", "Cash"],
    required: true,
  },
  status: {
    type: String,
    enum: ["Paid", "Pending"],
    default: "Pending",
  },
  proof_url: {
    type: String, 
  }
}, {
  timestamps: true
});

// module.exports = mongoose.model("SalaryPayment", SalaryPaymentSchema);
module.exports = SalaryPaymentSchema;
