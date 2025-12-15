const express = require('express');
const router = express.Router();
const assignmentController = require('../../controllers/Academics/assignmentController');
const { protect, checkRole } = require('../../middlewares/authMiddleware');
const { uploadAssignmentFile } = require('../../middlewares/upload');
const { validateObjectId } = require('../../utils/validationUtils');


router.post(
  '/',
  protect,
  checkRole('teacher', 'admin'),
  assignmentController.createAssignment
);

router.post(
  '/under-my-admin',
  protect,
  checkRole('teacher'),
  assignmentController.createAssignmentUnderMyAdmin
);


router.get(
  '/',
  protect,
  checkRole('student', 'teacher', 'admin'),
  assignmentController.getAllAssignments
);

router.get(
  '/under-my-admin',
  protect,
  checkRole('teacher'),
  assignmentController.getAllAssignmentsUnderMyAdmin
);

router.get(
  '/under-my-student',
  protect,
  checkRole('student'),
  assignmentController.getAllAssignmentsUnderStudent
);

router.get(
  '/:id',
  protect,
  checkRole('student', 'teacher', 'admin'),
  validateObjectId('id'),
  assignmentController.getAssignmentById
);


router.put(
  '/:id',
  protect,
  checkRole('teacher', 'admin'),
  uploadAssignmentFile.single('file'),
  validateObjectId('id'),
  assignmentController.updateAssignment
);

router.put(
  '/:id/under-my-admin',
  protect,
  checkRole('teacher', 'admin'),
  uploadAssignmentFile.single('file'),
  validateObjectId('id'),
  assignmentController.updateAssignmentUnderMyAdmin
);


router.delete(
  '/:id',
  protect,
  checkRole('teacher', 'admin'),
  validateObjectId('id'),
  assignmentController.deleteAssignment
);

module.exports = router;
