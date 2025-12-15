const AssignmentSubmissionSchema = require('../../models/AcademicSchema/AssignmentSubmission');
const AssignmentSchema = require('../../models/AcademicSchema/Assignment');
const StudentSchema = require('../../models/CoreUser/Student');
const { sendEmail } = require('../../utils/email');
const { sendSMS } = require('../../utils/sms');
const ExcelJS = require('exceljs');
const TeacherSchema = require('../../models/CoreUser/Teacher');
const db = require('../../config/db');
const AWS = require('aws-sdk');

exports.submitAssignment = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const StudentModel = connection.model('Student', StudentSchema);
    const AssignmentModel = connection.model('Assignment', AssignmentSchema);
    const AssignmentSubmissionModel = connection.model('AssignmentSubmission', AssignmentSubmissionSchema);
    const { assignment_id, files, description, admin_id } = req.body;

    // For students, we need to get the admin_id from their student profile
    let submissionAdminId = adminId;
    if (req.user.role === 'student') {
      const student = await StudentModel.findOne({ user_id: req.user.user_id });
      if (student && student.admin_id) {
        submissionAdminId = student.admin_id;
      } else {
        console.error('Student not found or admin_id missing for user_id:', req.user.user_id);
        return res.status(400).json({ message: 'Student profile not found or admin_id missing' });
      }
    }

    const newSubmission = new AssignmentSubmissionModel({
      assignment_id,
      student_id: req.user._id,
      files,
      description,
      admin_id: adminId
    });

    await newSubmission.save();

    // Update the assignment status to "Submitted" for this student
    const assignment = await AssignmentModel.findById(assignment_id);
    if (assignment) {
      assignment.student_id.push(req.user._id);
      await assignment.save();
    }

    res.status(201).json(newSubmission);
  } catch (error) {
    console.error('Error in submitAssignment:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.getSubmissionsForAssignment = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const AssignmentSubmissionModel = connection.model('AssignmentSubmission', AssignmentSubmissionSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);

    const submissions = await AssignmentSubmissionModel.find({ assignment_id: req.params.assignmentId, admin_id: adminId })
      .populate('student_id', 'user_id full_name class_id section')
      .populate('assignment_id', 'subject');

    res.json(submissions);
  } catch (error) {
    console.error('Error in getSubmissionsForAssignment:', error);
    res.status(500).json({ message: error.message });
  }
};
exports.gradeSubmission = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const AssignmentSubmissionModel = connection.model('AssignmentSubmission', AssignmentSubmissionSchema);
    const { grade, remarks, admin_id } = req.body;

    const submission = await AssignmentSubmissionModel.findById(req.params.id).populate('student_id');
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    submission.grade = grade;
    submission.remarks = remarks;
    submission.admin_id = req.user._id;
    await submission.save();


    const student = submission.student_id;
    const message = `📘 Your assignment has been graded.\nGrade: ${grade}\nRemarks: ${remarks || 'N/A'}`;

    if (student.email) {
      await sendEmail({
        to: student.email,
        subject: 'Assignment Graded',
        text: message,
      });
    }

    if (student.phone) {
      await sendSMS(student.phone, message);
    }

    res.json({ message: 'Graded and student notified', submission });
  } catch (error) {
    console.error('Error in gradeSubmission:', error);
    res.status(500).json({ message: error.message });
  }
};
exports.gradeSubmissionUnderMyAdmin = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const AssignmentSubmissionModel = connection.model('AssignmentSubmission', AssignmentSubmissionSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);

    const teacher = await TeacherModel.findOne({ users: req.user._id });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    const { grade, remarks } = req.body;

    const submission = await AssignmentSubmissionModel.findById(req.params.id).populate('student_id');
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    submission.grade = grade;
    submission.remarks = remarks;
    submission.admin_id = teacher.admin_id;
    await submission.save();


    const student = submission.student_id;
    const message = `📘 Your assignment has been graded.\nGrade: ${grade}\nRemarks: ${remarks || 'N/A'}`;

    if (student.email) {
      await sendEmail({
        to: student.email,
        subject: 'Assignment Graded',
        text: message,
      });
    }

    if (student.phone) {
      await sendSMS(student.phone, message);
    }

    res.json({ message: 'Graded and student notified', submission });
  } catch (error) {
    console.error('Error in gradeSubmission:', error);
    res.status(500).json({ message: error.message });
  }
};
exports.exportGradesToExcel = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const AssignmentSubmissionModel = connection.model('AssignmentSubmission', AssignmentSubmissionSchema);
    const { assignmentId } = req.params;

    const submissions = await AssignmentSubmissionModel.find({ assignment_id: assignmentId })
      .populate('student_id', 'full_name email');

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Assignment Grades');


    sheet.columns = [
      { header: 'Student Name', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Grade', key: 'grade', width: 10 },
      { header: 'Remarks', key: 'remarks', width: 40 },
      { header: 'Submitted At', key: 'submitted', width: 20 },
    ];

    submissions.forEach((sub) => {
      sheet.addRow({
        name: sub.student_id.full_name,
        email: sub.student_id.email,
        grade: sub.grade || 'N/A',
        remarks: sub.remarks || '',
        submitted: sub.submitted_at.toLocaleString(),
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="grades_${assignmentId}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: 'Failed to export grades', error: error.message });
  }
};

// Delete assignment submissions older than 2 months
exports.deleteExpiredAssignmentSubmissions = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const AssignmentSubmissionModel = connection.model('AssignmentSubmission', AssignmentSubmissionSchema);
    // Calculate the date 2 months ago from now
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const submissions = await AssignmentSubmissionModel.find({
      createdAt: { $lt: twoMonthsAgo }
    });
    // Delete assignment submitted files from S3
    for (const file of submissions) {
      for (const f of file.files) {
        AWS.config.update({
          region: 'ap-south-1', // use your bucket's region
        });

        const s3 = new AWS.S3();
        const url = new URL(f);
        const key = decodeURIComponent(url.pathname.substring(1));
        const s3Params = {
          Bucket: 'sims-school-files',
          Key: key
        };
        await s3.deleteObject(s3Params).promise();
      }
    }

    // Find and delete submissions older than 2 months
    const result = await AssignmentSubmissionModel.deleteMany({
      createdAt: { $lt: twoMonthsAgo }
    });

    if (res) {
      res.json({
        message: `Successfully deleted ${result.deletedCount} expired assignment submissions`,
        deletedCount: result.deletedCount
      });
    }

    return result;
  } catch (error) {
    console.error('Error deleting expired assignment submissions:', error);
    if (res) {
      res.status(500).json({ message: 'Failed to delete expired assignment submissions', error: error.message });
    }
    throw error;
  }
};

