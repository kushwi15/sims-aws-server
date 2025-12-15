const HomeworkSubmissionSchema = require('../../models/Communication_Activities/HomeworkSubmission');
const db = require('../../config/db');

exports.submitHomework = async (req, res) => {
  try {
    const {connection,adminId,userId} = await db.getUserSpecificConnection(req.user._id);
    const HomeworkSubmissionModel = connection.model('HomeworkSubmission', HomeworkSubmissionSchema);
    const { assignment_id } = req.body;

    const submission = new HomeworkSubmissionModel({
      assignment_id,
      student_id: req.user._id,
      file_url: req.file.path,
    });

    await submission.save();
    res.status(201).json(submission);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getSubmissionsForAssignment = async (req, res) => {
  try {
    const {connection,adminId,userId} = await db.getUserSpecificConnection(req.user._id);
    const HomeworkSubmissionModel = connection.model('HomeworkSubmission', HomeworkSubmissionSchema);
    const submissions = await HomeworkSubmissionModel.find({ assignment_id: req.params.assignmentId })
      .populate('student_id', 'full_name');
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
