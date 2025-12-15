const express = require('express');
const router = express.Router();
const teacherScheduleController = require('../../controllers/Attendance_Performance/teacherScheduleController');
const { protect, checkRole } = require('../../middlewares/authMiddleware');


router.post('/', protect, checkRole('admin', 'teacher'), teacherScheduleController.createSchedule);

router.get('/regular-schedule', protect,checkRole('student'),teacherScheduleController.getRegularSchedulesUnderStudent);

router.get('/', protect, checkRole('admin', 'teacher', 'student', 'parent'), teacherScheduleController.getAllSchedules);

router.get('/teacher/:teacherId', protect, checkRole('admin', 'teacher', 'student', 'parent'), teacherScheduleController.getSchedulesByTeacher);

router.get('/student/:studentId', protect, checkRole('admin', 'teacher', 'student', 'parent'), teacherScheduleController.getSchedulesByStudent);
router.get('/student/home/:studentId', protect, checkRole('admin', 'teacher', 'student', 'parent'), teacherScheduleController.getSchedulesByStudentForHomePage);

router.put('/:scheduleId', protect, checkRole('admin', 'teacher'), teacherScheduleController.updateSchedule);

router.delete('/:scheduleId', protect, checkRole('admin', 'teacher'), teacherScheduleController.deleteSchedule);

module.exports = router; 