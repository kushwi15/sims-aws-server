const express = require('express');
const router = express.Router();
const homeworkController = require('../../controllers/Communication_Activities/homeworkController');
const diaryController = require('../../controllers/Communication_Activities/diaryController');
const { protect, checkRole } = require('../../middlewares/authMiddleware');
const { uploadHomeworkFile } = require('../../middlewares/upload');


router.post(
  '/',
  protect,
  checkRole('teacher'),
  uploadHomeworkFile.single('attachment'),
  homeworkController.createHomework
);


router.get(
  '/',
  protect,
  checkRole('teacher', 'admin', 'student', 'parent'),
  homeworkController.getAllHomework
);


router.get(
  '/:id',
  protect,
  checkRole('teacher', 'admin', 'student', 'parent'),
  homeworkController.getHomeworkById
);


router.put(
  '/:id',
  protect,
  checkRole('teacher', 'admin'),
  uploadHomeworkFile.single('attachment'),
  homeworkController.updateHomework
);


router.delete(
  '/:id',
  protect,
  checkRole('teacher', 'admin'),
  homeworkController.deleteHomework
);


router.get(
  '/student/:studentId',
  protect,
  checkRole('student', 'parent', 'teacher', 'admin'),
  homeworkController.getHomeworkByStudent
);


router.get(
  '/diary/class/:classId/section/:section',
  protect,
  checkRole('student', 'parent', 'teacher', 'admin'),
  diaryController.getHomeworkByClassSection
);

module.exports = router;
