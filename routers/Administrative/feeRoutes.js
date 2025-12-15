const express = require("express");
const router = express.Router();
const feeController = require("../../controllers/Administrative/feeController");
const { protect, checkRole } = require("../../middlewares/authMiddleware");
const {uploadBankInfoStorage} = require("../../middlewares/upload");


router.post("/", protect, checkRole("admin", "superadmin"), uploadBankInfoStorage.single("receipt"), feeController.createFee);
router.get("/", protect, checkRole("admin", "superadmin","parent"), feeController.getAllFees);
router.get("/:id", protect, checkRole("admin", "superadmin","parent"), feeController.getFeeById);
router.get("/:id/payment-details", protect, checkRole("admin", "superadmin","parent"), feeController.getFeePaymentDetails);
router.put("/:id", protect, checkRole("admin", "superadmin","parent"), feeController.updateFee);
router.delete("/:id", protect, checkRole("admin", "superadmin","parent"), feeController.deleteFee);

router.post(
  "/:id/pay-term",
  protect,
  checkRole("parent", "admin"),
  uploadBankInfoStorage.single("receipt"),
  feeController.payTermFee
);


router.get("/student/:studentId", protect, checkRole("student", "parent", "admin"), feeController.getStudentFees);


router.post("/create-sample", protect, checkRole("admin", "superadmin"), feeController.createSampleFees);

module.exports = router;




