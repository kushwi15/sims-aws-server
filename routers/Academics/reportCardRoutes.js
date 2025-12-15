const express = require('express');
const router = express.Router();
const reportCardController = require('../../controllers/Academics/reportCardController');
const { protect, checkRole } = require('../../middlewares/authMiddleware');


router.get(
  '/generate/:studentId',
  protect,
  checkRole('teacher', 'admin'),
  reportCardController.generateReportCard
);

router.get('/email/:studentId', protect, checkRole('admin', 'teacher'), reportCardController.generateAndEmailReportCard);
router.get('/:studentId/:examId', protect, checkRole('admin', 'teacher', 'student', 'parent'), reportCardController.generateReportCard);

module.exports = router;
