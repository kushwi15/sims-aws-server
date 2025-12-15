const express = require("express");
const router = express.Router();
const adminController = require("../../controllers/CoreUserController/adminController");
const { protect, checkRole } = require("../../middlewares/authMiddleware");


router.post("/", adminController.createAdmin);
router.get("/", adminController.getAllAdmins);
router.put("/:id", adminController.updateAdmin);
router.patch('/:id/status', adminController.updateAdminStatus);
router.get("/user-counts/:userId", adminController.getUserCounts);
// router.get("/user-counts-students-teachers-parents", adminController.getStudentTeacherParentCounts);
router.delete("/:id", adminController.deleteAdmin);


// OTP routes
router.post("/send-otp", adminController.sendOTP);
router.post("/verify-otp", adminController.verifyOTP);
router.post("/reset-password", adminController.resetPassword);

module.exports = router;
