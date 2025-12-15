const express = require('express');
const router = express.Router();
const {createSchedule,getAllSchedules ,getScheduleById ,updateSchedule ,deleteSchedule } = require('../../controllers/Examination_Scheduling/examScheduleController');
const { protect, checkRole } = require('../../middlewares/authMiddleware');

router.post('/', protect, checkRole('admin', 'superadmin'), createSchedule);
router.get('/', protect, checkRole('admin', 'teacher', 'student', 'parent'), getAllSchedules);
router.get('/:id',protect,checkRole('admin','superadmin','student', 'parent'),getScheduleById);
router.put('/:id',protect,checkRole('admin','superadmin'),updateSchedule);
router.delete('/:id',protect,checkRole('admin','superadmin'),deleteSchedule);

module.exports = router;
