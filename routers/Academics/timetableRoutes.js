const express = require('express');
const router = express.Router();
const controller = require('../../controllers/Academics/timetableController');
const { protect, checkRole } = require('../../middlewares/authMiddleware');
const { validateObjectId } = require('../../utils/validationUtils');


router.post(
  '/',
  protect,
  checkRole('admin', 'superadmin'),
  controller.upsertTimetable
);


router.get(
  '/class/:classId',
  protect,
  checkRole('admin', 'teacher', 'student', 'parent'),
  validateObjectId('classId'),
  controller.getTimetableByClass
);


router.get(
  '/export/:classId',
  protect,
  checkRole('admin', 'teacher'),
  validateObjectId('classId'),
  controller.exportTimetablePDF
);

module.exports = router;
