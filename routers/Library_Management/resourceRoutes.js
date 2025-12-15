const express = require('express');
const router = express.Router();
const resourceController = require('../../controllers/Library_Management/resourceController');
const { protect, checkRole } = require('../../middlewares/authMiddleware');


router.post('/', protect, checkRole('admin', 'superadmin','teacher'), resourceController.createResource);
router.post('/under-my-admin', protect, checkRole('teacher'), resourceController.createResourceUnderMyAdmin);

router.put('/:id', protect, checkRole('admin', 'superadmin','teacher'), resourceController.updateResource);
router.put('/under-my-admin/:id', protect, checkRole('teacher'), resourceController.updateResourceUnderMyAdmin);


router.delete('/:id', protect, checkRole('admin', 'superadmin','teacher'), resourceController.deleteResource);


router.get('/', protect, checkRole('admin', 'teacher', 'student', 'parent'), resourceController.getAllResources);
router.get('/under-my-admin', protect, checkRole('teacher'), resourceController.getAllResourcesUnderMyAdmin);
router.get('/under-my-student', protect, checkRole('student'), resourceController.getAllResourcesByStudent);
router.get('/:id', protect, checkRole('admin', 'teacher', 'student', 'parent'), resourceController.getResourceById);

module.exports = router; 