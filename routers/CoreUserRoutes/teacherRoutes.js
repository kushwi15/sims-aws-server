const express = require('express');
const router = express.Router();
const {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  getTeacherProfile,
  getTeacherCount,
  searchTeachers,
  getTeacherDashboard,
  getTeacherByUserId,
  getAllTeachersForStudent,
} = require('../../controllers/CoreUserController/teacherController');

const { protect, adminOnly, checkRole } = require('../../middlewares/authMiddleware');
const { uploadProfile } = require('../../middlewares/upload');


router.post(
  '/',
  protect,
  checkRole('admin', 'superadmin'),
  uploadProfile.fields([
    { name: 'profile_image', maxCount: 1 },
    { name: 'certificates', maxCount: 5 },
  ]),
  createTeacher
);
// router.post("/delete-cancel-image", deleteCancelEditImage);

router.get('/', protect, getAllTeachers);
router.get('/count', protect, getTeacherCount);
router.get('/search', protect, searchTeachers);
router.get('/profile', protect, checkRole('teacher'), getTeacherProfile);
router.get('/dashboard', protect, checkRole('teacher'), getTeacherDashboard);
router.get('/:id', protect, getTeacherById);
router.get('/by-userid/:userId', protect, checkRole('teacher', 'admin'), getTeacherByUserId);

router.put(
  '/:id',
  protect,
  checkRole('admin', 'superadmin'),
  uploadProfile.fields([
    { name: 'profile_image', maxCount: 1 },
    { name: 'certificates', maxCount: 5 },
  ]),
  updateTeacher
);

router.delete('/:id', protect, checkRole('admin','superadmin'), deleteTeacher);


module.exports = router;
