const express = require('express');
const router = express.Router();
const { protect, checkRole } = require('../../middlewares/authMiddleware');
const messageController = require('../../controllers/Communication_Activities/messageController');
const {uploadMessageStorage} = require('../../middlewares/upload');


router.get(
  '/users',
  protect,
  checkRole('admin', 'superadmin','teacher','parent','student'),
  messageController.getUsersForMessaging
);

router.get(
  '/users/under-my-admin',
  protect,
  checkRole('teacher'),
  messageController.getUsersForMessagingUnderMyAdmin
);
router.get('/users/under-my-admin-for-student', protect, checkRole('student','teacher','parent','admin'), messageController.getUsersForMessagingUnderMyAdminForStudent);
router.get('/users/under-my-admin-for-parent', protect, checkRole('parent'), messageController.getUsersForMessagingUnderMyAdminForParent);

router.post(
  "/",
  protect,
  checkRole("parent", "teacher", "admin","student"),
  uploadMessageStorage.array("attachments", 5),
  messageController.sendOrSaveMessage
);

router.post(
  "/under-my-admin",
  protect,
  checkRole('teacher'),
  uploadMessageStorage.array("attachments", 5),
  messageController.sendOrSaveMessageUnderMyAdmin
);

router.post(
  "/under-my-admin-for-student",
  protect,
  checkRole('student'),
  uploadMessageStorage.array("attachments", 5),
  messageController.sendOrSaveMessageUnderMyAdminForStudent
);


router.post(
  "/under-my-admin-for-parent",
  protect,
  checkRole('parent'),
  uploadMessageStorage.array("attachments", 5),
  messageController.sendOrSaveMessageUnderMyAdminForParent
);


router.get(
  '/',
  protect,
  checkRole('parent', 'teacher', 'admin',"student"),
  messageController.getMessages
);

router.get(
  '/msg-under-my-admin',
  protect,
  checkRole('teacher'),
  messageController.getMessagesUnderMyAdmin
);
router.get('/under-my-parent', protect, checkRole('parent'), messageController.getMessagesUnderMyAdminForParent);
router.get('/under-my-student', protect, checkRole('student'), messageController.getMessagesForStudent);
router.get('/under-my-parentt', protect, checkRole('parent'), messageController.getMessagesForParent);
router.get('/msg-under-my-admin-for-student', protect, checkRole('student'), messageController.getMessagesUnderMyAdminForStudent);

router.put('/:id/read-under-my-admin',protect,checkRole('parent', 'teacher', 'admin',"student"),  messageController.markAsReadUnderMyAdmin);

router.put('/:id/read-under-my-admin-for-student',protect,checkRole('student'),  messageController.markAsReadUnderMyAdminForStudent);
router.put('/:id/read-under-my-admin-for-parent',protect,checkRole('parent'),  messageController.markAsReadUnderMyAdminForParent);


router.put('/:id/read',protect, checkRole('parent', 'teacher', 'admin',"student"), messageController.markAsRead);


router.patch('/:id/delete', protect, checkRole('parent', 'teacher', 'admin',"student"), messageController.deleteMessage);

router.patch('/:id/delete-under-my-admin', protect, checkRole('teacher'), messageController.deleteMessageUnderMyAdmin);

router.patch('/:id/delete-under-my-admin-for-student', protect, checkRole('student'), messageController.deleteMessageUnderMyAdminForStudent);
router.patch('/:id/delete-under-my-admin-for-parent', protect, checkRole('parent'), messageController.deleteMessageUnderMyAdminForParent);


router.patch('/:id/undo', protect, checkRole('parent', 'teacher', 'admin',"student"), messageController.undoDelete);

router.patch('/:id/undo-under-my-admin', protect, checkRole('teacher'), messageController.undoDeleteUnderMyAdmin);

router.patch('/:id/undo-under-my-admin-for-student', protect, checkRole('student'), messageController.undoDeleteUnderMyAdminForStudent);
router.patch('/:id/undo-under-my-admin-for-parent', protect, checkRole('parent'), messageController.undoDeleteUnderMyAdminForParent);


router.delete('/:id', protect, checkRole('parent', 'teacher', 'admin',"student"), messageController.permanentDelete);

router.delete('/:id/permanent-delete-under-my-admin', protect, checkRole('teacher'), messageController.permanentDeleteUnderMyAdmin);

router.delete('/:id/permanent-delete-under-my-admin-for-student', protect, checkRole('student'), messageController.permanentDeleteUnderMyAdminForStudent);
router.delete('/:id/permanent-delete-under-my-admin-for-parent', protect, checkRole('parent'), messageController.permanentDeleteUnderMyAdminForParent);



router.patch('/:id/star', protect, checkRole('parent', 'teacher', 'admin',"student"), messageController.toggleStar);

module.exports = router;
