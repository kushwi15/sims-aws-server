const express = require('express');
const router = express.Router();
const bookController = require('../../controllers/Library_Management/bookController');
const { protect, checkRole } = require('../../middlewares/authMiddleware');


router.post('/', protect, checkRole('admin', 'superadmin'), bookController.createBook);

router.put('/:id', protect, checkRole('admin', 'superadmin'), bookController.updateBook);


router.delete('/:id', protect, checkRole('admin', 'superadmin'), bookController.deleteBook);

router.get('/', protect, checkRole('admin', 'teacher', 'student', 'parent'), bookController.getAllBooks);


router.get('/:id', protect, checkRole('admin', 'teacher', 'student', 'parent'), bookController.getBookById);

module.exports = router;
