const express = require('express');
const router = express.Router();
const announcementController = require('../../controllers/Communication_Activities/announcementController');
const { protect, checkRole } = require('../../middlewares/authMiddleware');


router.post('/', protect, checkRole('admin', 'superadmin'), announcementController.createAnnouncement);
router.post('/under-my-admin', protect, checkRole('teacher'), announcementController.createAnnouncementUnderMyAdmin);

router.get('/', protect, checkRole('admin', 'student', 'teacher', 'parent'), announcementController.getAnnouncements);
router.get('/under-my-admin', protect, checkRole('teacher'), announcementController.getAnnouncementsUnderMyAdmin);
router.get('/created-by-me', protect, checkRole('teacher'), announcementController.getAnnouncementsCreatedByMe);
router.get('/under-my-student', protect, checkRole('student'), announcementController.getAnnouncementsForStudent);
router.get('/under-my-parent', protect, checkRole('parent'), announcementController.getAnnouncementsForParent);

router.get('/:id', protect, checkRole('admin', 'student', 'teacher', 'parent'), announcementController.getAnnouncementById);


router.put('/:id', protect, checkRole('admin', 'superadmin'), announcementController.updateAnnouncement);
router.put('/:id/under-my-admin', protect, checkRole('teacher'), announcementController.updateAnnouncementUnderMyAdmin);

router.delete('/:id', protect, checkRole('admin', 'superadmin','teacher'), announcementController.deleteAnnouncement);

module.exports = router;
