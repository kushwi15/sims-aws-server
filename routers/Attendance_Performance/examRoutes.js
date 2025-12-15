const express = require('express');
const router = express.Router();
const examController = require('../../controllers/Attendance_Performance/examController');
const { protect, checkRole } = require('../../middlewares/authMiddleware');
const { validateObjectId } = require('../../utils/validationUtils');


router.post(
  '/',
  protect,
  checkRole('admin', 'superadmin','teacher'),
  examController.createExam
);

router.get(
  '/',
  protect,
  checkRole('admin', 'teacher', 'student', 'parent'),
  examController.getAllExams
);
router.get(
  '/:examType',
  protect,
  checkRole('admin', 'teacher', 'student', 'parent'),
  examController.getExamByExamType
)

router.get(
  '/:id',
  protect,
  checkRole('admin', 'teacher', 'student', 'parent'),
  validateObjectId('id'),
  examController.getExamById
);

router.put(
  '/type/:examType',
  protect,
  checkRole('admin', 'superadmin','teacher'),
  examController.updateMaxMarks
);
router.put(
  '/:id',
  protect,
  checkRole('admin', 'superadmin','teacher'),
  validateObjectId('id'),
  examController.updateExam
);

router.delete(
  '/:id',
  protect,
  checkRole('admin', 'superadmin','teacher'),
  validateObjectId('id'),
  examController.deleteExam
);

module.exports = router;
