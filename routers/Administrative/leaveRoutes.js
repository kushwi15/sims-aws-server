const express = require('express');
const router = express.Router();
const leaveController = require('../../controllers/Administrative/leaveController');
const { protect, checkRole } = require('../../middlewares/authMiddleware');


router.get('/teacher', protect, checkRole('admin', 'superadmin', 'teacher'), leaveController.getAllTeacherLeaves);
router.get('/teacher/under-my-admin', protect, checkRole('admin', 'superadmin', 'teacher'), leaveController.getAllTeacherLeavesUnderMyAdmin);

router.patch('/teacher/:id/status', protect, checkRole('admin', 'superadmin', 'teacher'), leaveController.updateLeaveStatus);


router.patch('/teacher/:id/comment', protect, checkRole('admin', 'superadmin', 'teacher'), leaveController.updateAdminComment);


router.post('/', protect, checkRole('admin', 'superadmin', 'teacher', 'parent', 'student'), leaveController.createLeave);
router.post('/parent', protect, checkRole('parent'), leaveController.createLeaveByParent);



router.get('/student', protect, checkRole('admin', 'superadmin', 'teacher', 'parent'), leaveController.getAllStudentLeaves);


router.get('/parent/children', protect, checkRole('parent'), leaveController.getParentChildrenLeaves);
router.get('/parent/children/under-my-parent', protect, checkRole('parent'), leaveController.getParentChildrenLeavesByParent);
router.patch('/student/:id/status', protect, checkRole('admin', 'superadmin', 'teacher'), leaveController.updateStudentLeaveStatus);
router.patch('/student/:id/comment', protect, checkRole('admin', 'superadmin', 'teacher'), leaveController.updateTeacherComment);

// Route to delete expired leave applications after academic year ends
router.delete('/expired', protect, checkRole('admin'), leaveController.deleteExpiredLeaves);
router.delete('/:leaveId', protect, checkRole('admin','teacher'), leaveController.deleteLeaveApplication);

module.exports = router;