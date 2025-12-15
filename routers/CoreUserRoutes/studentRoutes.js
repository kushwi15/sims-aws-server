const express = require('express');
const router = express.Router();
const {createStudent,getAllStudents,getStudentById,updateStudent,deleteStudent,getMyProfile, getStudentCount, getExamDataForStudent, getStudentByUserId,getStudentsUnderMyAdmin, getStudentsByClassTeacher} = require('../../controllers/CoreUserController/studentController');
const { protect, checkRole } = require('../../middlewares/authMiddleware');
const { validateObjectId } = require('../../utils/validationUtils');
const multer = require('multer');
const { uploadStudentProfile } = require('../../middlewares/upload');


router.post(
  '/',
  protect,
  checkRole('admin', 'superadmin'),
  uploadStudentProfile.fields([
    { name: 'profile_image', maxCount: 1 },
    { name: 'documents', maxCount: 10 }
  ]),
  createStudent
);



router.get('/', protect,getAllStudents);
router.get('/count', protect, checkRole('admin', 'super_admin'), getStudentCount);
router.get('/under-my-admin', protect, checkRole('teacher','admin'), getStudentsUnderMyAdmin);
router.get('/by-class-teacher', protect, checkRole('teacher'), getStudentsByClassTeacher);

router.get('/me', protect, checkRole('student'), getMyProfile);


router.get('/by-userid/:userId', protect, checkRole('student', 'parent', 'teacher', 'admin'), getStudentByUserId);

router.get('/:id', protect, validateObjectId('id'), getStudentById);

router.put(
  '/:id',
  protect,
  uploadStudentProfile.fields([
    { name: 'profile_image', maxCount: 1 },
    { name: 'documents', maxCount: 10 }
  ]),
  validateObjectId('id'),
  updateStudent
);



router.delete('/:id', protect, checkRole('admin','superadmin','teacher'), validateObjectId('id'), deleteStudent);


router.get('/exams/:studentId', protect, checkRole('student', 'parent', 'teacher', 'admin'), getExamDataForStudent);



router.get('/test/exam-data/:studentId', async (req, res) => {
  try {
    const student = await require('../../models/CoreUser/Student').findOne({ user_id: req.params.studentId });
    const subjects = await require('../../models/AcademicSchema/Subject').find();
    const marks = await require('../../models/Attendance_PerformanceSchema/StudentMarks').find({ student_id: student?._id }).populate('subject_id');
    
    res.json({
      student: student ? {
        id: student.user_id,
        name: student.full_name,
        rollNo: student.admission_number
      } : null,
      subjectsCount: subjects.length,
      marksCount: marks.length,
      subjects: subjects.map(s => ({ name: s.name, maxMarks: s.maxMarks })),
      marks: marks.map(m => ({
        subject: m.subject_id?.name,
        marks: m.marks_obtained,
        maxMarks: m.max_marks
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
