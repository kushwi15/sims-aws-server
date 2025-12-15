const express = require('express');
const router = express.Router();
const adminProfileController = require('../../controllers/CoreUserController/adminProfileController');
const userController = require('../../controllers/CoreUserController/userController');
const { protect } = require('../../middlewares/authMiddleware');


router.get('/me', protect, adminProfileController.getOwnProfile);


router.put('/:id',protect, adminProfileController.updateProfile);


router.post('/change-password', protect, userController.changePassword);

module.exports = router;