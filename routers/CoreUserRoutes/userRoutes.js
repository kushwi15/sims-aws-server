const express = require("express");
const router = express.Router();
const {register,login,getProfile,changePassword} =  require('../../controllers/CoreUserController/userController')
const { verifyToken, authorizeRoles,protect,checkRole } = require("../../middlewares/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/profile", verifyToken, getProfile);
router.post("/change-password", verifyToken, changePassword);

// Example of role-based access control
// router.get("/admin-only", verifyToken, authorizeRoles("admin"), (req, res) => {
//   res.send("Hello Admin");
// });

module.exports = router;
