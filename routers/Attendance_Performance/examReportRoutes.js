const express = require('express');
const router = express.Router();
const examReportController = require('../../controllers/Attendance_Performance/examReportController');
const { protect, checkRole } = require('../../middlewares/authMiddleware');


router.get('/overview', protect, checkRole('admin', 'teacher'), examReportController.getExamReportOverview);


router.get('/results', protect, checkRole('admin', 'teacher'), examReportController.getAllResults);

router.get('/results-under-my-admin', protect, checkRole('admin', 'teacher'), examReportController.getAllResultsUnderMyAdmin);

// Result management routes
router.post('/result', protect, checkRole('admin', 'teacher'), examReportController.createResult);
router.put('/result/:id', protect, checkRole('admin', 'teacher'), examReportController.updateResult);

router.get('/subjects-config', protect, checkRole('admin', 'teacher'), examReportController.getSubjectsConfig);

router.put('/subjects-config', protect, checkRole('admin'), examReportController.updateSubjectsConfig);

// Delete expired exam reports route
router.delete('/expired', protect, checkRole('admin'), examReportController.deleteExpiredExamReports);

module.exports = router;
