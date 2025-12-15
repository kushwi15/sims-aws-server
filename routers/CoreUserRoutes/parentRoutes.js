const express = require('express');
const router = express.Router();
const parentController = require('../../controllers/CoreUserController/parentController');
const parentPortalController = require('../../controllers/CoreUserController/parentPortalController');
const { protect, checkRole } = require('../../middlewares/authMiddleware');
const { uploadParentProfile } = require('../../middlewares/upload');


router.post(
  '/',
  protect,
  checkRole('admin', 'superadmin','teacher'),
  uploadParentProfile.single('profileImage'),
  parentController.createParent
);


router.get('/', protect,checkRole('admin','teacher','parent'), parentController.getAllParents);
router.get('/:imageFileName', protect,checkRole('admin','teacher','parent'), parentController.getParentByImageFileName);


router.get('/me', protect, checkRole('parent','student'), parentController.getMyParentProfile);
router.get('/count',protect,parentController.getParentCount);
router.get('/dashboard', protect, checkRole('parent'), parentPortalController.getParentDashboard);
router.get('/under-my-admin', protect, checkRole('teacher'), parentController.getAllParentsUnderMyAdmin);

router.get('/:id', protect, parentController.getParentById);


router.put(
  '/:id',
  protect,
  checkRole('admin', 'superadmin','teacher'),
  uploadParentProfile.single('profileImage'),
  parentController.updateParent
);


router.delete(
  '/:id',
  protect,
  checkRole('admin','superadmin','teacher'),
  parentController.deleteParent
);

module.exports = router;
