const express = require('express');
const router = express.Router();
const adminStaffController = require('../../controllers/CoreUserController/adminStaffController');
const { protect, checkRole } = require('../../middlewares/authMiddleware');
const { uploadAdminStaffProfile } = require('../../middlewares/upload');


router.post(
  '/',
  protect,
  checkRole('superadmin'),
  uploadAdminStaffProfile.single('profileImage'),
  adminStaffController.createAdminStaff
);


router.get('/', protect, adminStaffController.getAllAdminStaff);
router.get('/:id', protect, adminStaffController.getAdminStaffById);


router.put(
  '/:id',
  protect,
  checkRole('superadmin'),
  uploadAdminStaffProfile.single('profileImage'),
  adminStaffController.updateAdminStaff
);


router.delete(
  '/:id',
  protect,
  checkRole('superadmin'),
  adminStaffController.deleteAdminStaff
);

module.exports = router;
