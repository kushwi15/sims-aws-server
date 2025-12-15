const mongoose = require('mongoose');

const AssignmentSubmissionSchema = new mongoose.Schema({
    assignment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true,
    },
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    submitted_at: {
        type: Date,
        default: Date.now,  
    },
    files: [{
        type: String,
        required: true
    }],
    description: {
        type: String,
    },
    remarks: {
        type: String,
    },
    grade: {
        type: String,
        enum: ['A+', 'A', 'B', 'C', 'D', 'F', 'Incomplete'],
    },
    admin_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true,
    },
}, { timestamps: true });

module.exports = AssignmentSubmissionSchema;
