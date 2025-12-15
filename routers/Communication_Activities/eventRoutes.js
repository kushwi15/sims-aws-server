const express = require('express');
const router = express.Router();
const eventController = require('../../controllers/Communication_Activities/eventController');
const { protect, checkRole } = require('../../middlewares/authMiddleware');


router.post('/', protect, checkRole('admin', 'superadmin'), eventController.createEvent);
router.put('/:id', protect, checkRole('admin', 'superadmin'), eventController.updateEvent);
router.delete('/:id', protect, checkRole('admin', 'superadmin'), eventController.deleteEvent);
router.get('/under-my-teacher', protect, checkRole('teacher'), eventController.getAllEventsByTeacher);
router.get('/under-my-student', protect, checkRole('student'), eventController.getAllEventsByStudent);

router.get('/under-my-parent', protect, checkRole('parent'), eventController.getAllEventsByStudentByParent);
router.get('/', protect, checkRole('admin', 'teacher', 'student', 'parent'), eventController.getAllEvents);
router.get('/:id', protect, checkRole('admin', 'teacher', 'student', 'parent'), eventController.getEventById);

module.exports = router;
