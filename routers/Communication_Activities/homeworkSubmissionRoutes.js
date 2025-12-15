const express = require('express');
const router = express.Router();
const submissionController = require('../../controllers/Communication_Activities/homeworkSubmissionController');
const { protect, checkRole } = require('../../middlewares/authMiddleware');
const { uploadHomeworkSubmission } = require('../../middlewares/upload');


router.post(
  '/',
  protect,
  checkRole('student'),
  uploadHomeworkSubmission.single('file'),
  submissionController.submitHomework
);


router.get(
  '/assignment/:assignmentId',
  protect,
  checkRole('teacher', 'admin'),
  submissionController.getSubmissionsForAssignment
);

module.exports = router;
