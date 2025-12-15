const mongoose = require("mongoose");
const { Schema } = mongoose;

const SalarySchema = new Schema({
  teacher_id: {
    type: Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
  },
  base_salary: {
    type: Number,
    required: true,
  },
  allowances: {
    type: Map,
    of: Number,
    default: {},
  },
  deductions: {
    type: Map,
    of: Number,
    default: {},
  },
  bank_account_number: {
    type: String,
    required: true,
  },
  bank_name: {
    type: String,
    required: true,
  },
  salary_slip_url: {
    type: String, 
  },
}, {
  timestamps: true,
});

// module.exports = mongoose.model("Salary", SalarySchema);
module.exports = SalarySchema;
