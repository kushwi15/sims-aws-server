const express = require('express');
const router = express.Router();
const controller = require('../../controllers/Academics/assignmentSubmissionController');
const { protect, checkRole } = require('../../middlewares/authMiddleware');
const { uploadAssignmentSubmission } = require('../../middlewares/upload');
const { validateObjectId } = require('../../utils/validationUtils');


router.post(
  '/',
  protect,
  checkRole('student'),
  // uploadAssignmentSubmission.single('file'),
  controller.submitAssignment
);


router.get(
  '/:assignmentId',
  protect,
  checkRole('teacher', 'admin'),
  validateObjectId('assignmentId'),
  controller.getSubmissionsForAssignment
);

router.put(
  '/grade/:id',
  protect,
  checkRole('teacher', 'admin'),
  validateObjectId('id'),
  controller.gradeSubmission
);
router.put(
  '/grade/:id/under-my-admin',
  protect,
  checkRole('teacher', 'admin'),
  validateObjectId('id'),
  controller.gradeSubmissionUnderMyAdmin
);

router.get(
  '/export/:assignmentId',
  protect,
  checkRole('teacher', 'admin'),
  validateObjectId('assignmentId'),
  controller.exportGradesToExcel
);

// Route to delete expired assignment submissions (admin only)
router.delete(
  '/expired',
  protect,
  checkRole('admin'),
  controller.deleteExpiredAssignmentSubmissions
);

module.exports = router;
