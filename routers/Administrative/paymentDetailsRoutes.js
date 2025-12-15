const express = require("express");
const router = express.Router();
const paymentDetailsController = require("../../controllers/Administrative/paymentDetailsController");
const {protect, checkRole} = require("../../middlewares/authMiddleware");


router.post("/", protect,checkRole("parent","student"), paymentDetailsController.createPaymentRecord);


router.get("/", protect,checkRole("admin","superadmin"), paymentDetailsController.getAllPaymentRecords);


router.get("/student/:studentId", protect,checkRole("admin","superadmin"), paymentDetailsController.getPaymentRecordsByStudent);


router.get("/parent/:parentId", protect,checkRole("admin","superadmin","parent"), paymentDetailsController.getPaymentRecordsByParent);

// New endpoint for parents to get their own payment records
router.get("/my-payments", protect,checkRole("parent"), paymentDetailsController.getMyPaymentRecords);


router.get("/transaction/:transactionId", protect,checkRole("admin","superadmin"), paymentDetailsController.getPaymentByTransactionId);


router.get("/invoice/:invoiceId", protect,checkRole("admin","superadmin"), paymentDetailsController.getPaymentByInvoiceId);

router.get("/fee/:feeId", protect,checkRole("admin","superadmin","parent","student"), paymentDetailsController.getPaymentRecordsByFeeId);


router.patch("/:paymentId/status", protect,checkRole("admin","superadmin"), paymentDetailsController.updatePaymentStatus);


router.get("/statistics", protect,checkRole("admin","superadmin"), paymentDetailsController.getPaymentStatistics);


router.delete("/:paymentId", protect,checkRole("admin","superadmin"), paymentDetailsController.deletePaymentRecord);

module.exports = router; 