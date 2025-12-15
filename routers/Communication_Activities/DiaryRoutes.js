const express = require('express');
const router = express.Router();
const diaryController = require('../../controllers/Communication_Activities/diaryController');
const { protect } = require('../../middlewares/authMiddleware');

// Homework Diary
router.get('/homework', protect, diaryController.getHomework);
router.post('/homework', protect, diaryController.createHomework);
router.put('/homework/:id', protect, diaryController.updateHomework);
router.delete('/homework/:id', protect, diaryController.deleteHomework);

// Personal Diary
router.get('/personal', protect, diaryController.getPersonal);
router.post('/personal', protect, diaryController.createPersonal);
router.put('/personal/:id', protect, diaryController.updatePersonal);
router.delete('/personal/:id', protect, diaryController.deletePersonal);

module.exports = router;