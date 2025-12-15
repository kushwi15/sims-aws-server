const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/Attendance_Performance/studentMarksController');
const { protect, checkRole } = require('../../middlewares/authMiddleware');

router.post('/', protect, checkRole('admin', 'teacher'), ctrl.addMarks);
router.get('/:studentId', protect, checkRole('admin', 'teacher', 'student', 'parent'), ctrl.getMarksByStudent);
router.put('/update', protect, checkRole('admin', 'teacher'), ctrl.updateMarks);

module.exports = router;
