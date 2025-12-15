const express = require('express');
const router = express.Router();
const diaryController = require('../../controllers/Communication_Activities/diaryController');
const { protect } = require('../../middlewares/authMiddleware');


router.get('/homework', protect, diaryController.getHomework);
router.post('/homework', protect, diaryController.createHomework);
router.put('/homework/:id', protect, diaryController.updateHomework);
router.delete('/homework/:id', protect, diaryController.deleteHomework);


router.get('/homework/class/:classId/section/:section', protect, diaryController.getHomeworkByClassSection);
// router.get('/homework/class/:classId/section/:section/under-my-admin', protect, diaryController.getHomeworkByClassSectionUnderMyAdmin);
router.get('/homework/by-class', protect, diaryController.getHomeworkByClassSectionUnderMyAdmin);

router.get('/homework/parent', protect, diaryController.getHomeworkForParent);


router.get('/personal', protect, diaryController.getPersonal);
router.post('/personal', protect, diaryController.createPersonal);
router.put('/personal/:id', protect, diaryController.updatePersonal);
router.delete('/personal/:id', protect, diaryController.deletePersonal);

module.exports = router;