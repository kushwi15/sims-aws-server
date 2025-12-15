const express = require('express');
const router = express.Router();
const { loginStudent, loginParent, loginAdmin, loginTeacher,logoutUser  } = require('../../controllers/CoreUserController/authController');


router.post('/student/login', loginStudent);
router.post('/parent/login', loginParent);
router.post("/admin/login", loginAdmin);
router.post("/teacher/login", loginTeacher);

router.post("/logout", logoutUser);

module.exports = router;
