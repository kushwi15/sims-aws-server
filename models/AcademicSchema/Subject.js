const mongoose = require("mongoose");

const SubjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    className: {
      type: String,
      required: true,
      trim: true,
    },
    section:{
      type:String
    },
    category: {
      type: String
    },
    maxMarks: {
      type: Number,
      default: 100
    },
    passingMarks: {
      type: Number,
      default: 35
    },
    teachers: [
      {
        name: {
          type: String,
          // required: true
        },
        empId: {
          type: String,
          // required: true
        },
        teacher_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          // required: true,
        }
      }
    ],
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = SubjectSchema;
