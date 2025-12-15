const express = require('express');
const router = express.Router();
const teacherAttendanceController = require('../../controllers/Attendance_Performance/teacherAttendanceController');
const { protect, checkRole } = require('../../middlewares/authMiddleware');
const { uploadTeacherProof } = require('../../middlewares/upload');


router.post(
  '/',
  protect,
  checkRole('teacher', 'admin'),
  uploadTeacherProof.single('supportingDocument'),
  teacherAttendanceController.markAttendance
);


router.get(
  '/',
  protect,
  checkRole('admin','teacher'),
  teacherAttendanceController.getAllAttendance
);


router.get(
  '/teacher/:teacherId',
  protect,
  checkRole('admin', 'teacher'),
  teacherAttendanceController.getAttendanceByTeacher
);
router.get(
  '/teacher/:teacherId/under-my-admin',
  protect,
  checkRole('admin', 'teacher'),
  teacherAttendanceController.getAttendanceByTeacherUnderMyAdmin
);

router.get(
  '/teacher/:teacherId/for-teacher',
  protect,
  checkRole('admin', 'teacher'),
  teacherAttendanceController.getAttendanceByAdminForStudent
);

router.put(
  '/:id',
  protect,
  checkRole('admin'),
  uploadTeacherProof.single('supportingDocument'),
  teacherAttendanceController.updateAttendance
);


router.delete(
  '/:id',
  protect,
  checkRole('admin'),
  teacherAttendanceController.deleteAttendance
);

router.get('/monthly-report', protect, checkRole('admin', 'teacher'), teacherAttendanceController.getTeacherMonthlyReport);
router.get('/export/excel/:teacherId', protect, checkRole('admin'), teacherAttendanceController.exportTeacherAttendanceExcel);


router.get(
  '/bulk/date',
  protect,
  checkRole('teacher', 'admin'),
  teacherAttendanceController.getAttendanceByDate
);

router.get(
  '/bulk/date/under-my-admin',
  protect,
  checkRole('teacher', 'admin'),
  teacherAttendanceController.getAttendanceByDateUnderMyAdmin
);


router.post(
  '/bulk',
  protect,
  checkRole('teacher', 'admin'),
  teacherAttendanceController.setBulkAttendance
);

// Route to delete expired attendance records after academic year ends
router.delete(
  '/bulk/expired',
  protect,
  checkRole('admin'),
  teacherAttendanceController.deleteExpiredAttendance
);

module.exports = router;
