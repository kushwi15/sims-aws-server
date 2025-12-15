const express = require('express');
const router = express.Router();
const subjectController = require('../../controllers/Academics/subjectController');
const { protect, checkRole } = require('../../middlewares/authMiddleware');
const { validateObjectId } = require('../../utils/validationUtils');


router.post('/', protect, checkRole('admin', 'superadmin','teacher'), subjectController.createSubject);
router.put('/:id', protect, checkRole('admin', 'superadmin','teacher'), validateObjectId('id'), subjectController.updateSubject);
router.put('/under-my-admin/:id', protect, checkRole('admin', 'superadmin','teacher'), validateObjectId('id'), subjectController.updateSubjectByTeacher);
router.delete('/:id', protect, checkRole('admin', 'superadmin','teacher'), validateObjectId('id'), subjectController.deleteSubject);


router.get('/', protect, checkRole('admin', 'teacher', 'student', 'parent'), subjectController.getAllSubjects);
router.get('/under-my-admin', protect, checkRole('teacher'), subjectController.getAllSubjectsUnderMyAdmin);
router.get('/:id', protect, checkRole('admin', 'teacher', 'student', 'parent'), validateObjectId('id'), subjectController.getSubjectById);

module.exports = router;
