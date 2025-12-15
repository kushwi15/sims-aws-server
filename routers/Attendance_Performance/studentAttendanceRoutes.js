const express = require('express');
const router = express.Router();
const attendanceController = require('../../controllers/Attendance_Performance/studentAttendanceController');
const { protect, checkRole } = require('../../middlewares/authMiddleware');
const { uploadProof } = require('../../middlewares/upload');


router.post(
  '/',
  protect,
  checkRole('teacher', 'admin'),
  uploadProof.single('proofImage'),
  attendanceController.markAttendance
);


router.get(
  '/',
  protect,
  checkRole('teacher', 'admin'),
  attendanceController.getAllAttendance
);
router.get('/under-my-admin', protect, checkRole('teacher','admin'), attendanceController.getAllAttendanceUnderMyAdmin);


router.get(
  '/student/:studentId',
  protect,
  checkRole('teacher', 'admin', 'parent', 'student'),
  attendanceController.getAttendanceByStudent
);
router.get('/student/:studentId/under-my-admin', protect, checkRole('admin','student'), attendanceController.getAttendanceByStudentUnderMyAdmin);
router.get('/student/:studentId/for-student', protect, checkRole('admin','student'), attendanceController.getAttendanceByMyAdminForStudent);
router.get('/student/:studentId/under-my-parent', protect, checkRole('parent'), attendanceController.getAttendanceByStudentUnderParent);

router.get('/monthly-report', protect, checkRole('teacher', 'admin', 'parent'), attendanceController.getMonthlyReport);


router.get(
  '/bulk/date',
  protect,
  checkRole('teacher', 'admin'),
  attendanceController.getAttendanceByDate
);

router.get(
  '/date-range/under-my-admin',
  protect,
  checkRole('teacher', 'admin'),
  attendanceController.getAttendanceByDateRangeUnderMyAdmin
);


router.post(
  '/bulk',
  protect,
  checkRole('teacher', 'admin'),
  attendanceController.setBulkAttendance
);

router.post(
  '/under-my-admin',
  protect,
  checkRole('teacher', 'admin'),
  uploadProof.single('proofImage'),
  attendanceController.markAttendanceUnderMyAdmin
);  


router.put(
  '/:id',
  protect,
  checkRole('teacher', 'admin'),
  uploadProof.single('proofImage'),
  attendanceController.updateAttendance
);


router.delete(
  '/:id',
  protect,
  checkRole('admin'),
  attendanceController.deleteAttendance
);

// Route to delete expired attendance records after academic year ends
router.delete(
  '/bulk/expired',
  protect,
  checkRole('admin', 'teacher'),
  attendanceController.deleteExpiredAttendance
);

module.exports = router;
