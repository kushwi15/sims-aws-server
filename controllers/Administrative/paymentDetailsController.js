const PaymentDetailsSchema = require("../../models/AdministrativeSchema/PaymentDetails");
const FeeSchema = require("../../models/AdministrativeSchema/Fee");
const db = require('../../config/db');


exports.createPaymentRecord = async (req, res) => {
  try {
    const {
      fee_id,
      student_id,
      student_name,
      class: className,
      section,
      term,
      term_name,
      amount_paid,
      payment_method,
      transaction_id,
      invoice_id,
      paid_by,
      paid_by_name,
      paid_by_role,
      admin_id
    } = req.body;
    const {connection,adminId,userId} = await db.getUserSpecificConnection(req.user._id);
    const PaymentDetailsModel = connection.model('PaymentDetails', PaymentDetailsSchema);

    
    const existingPayment = await PaymentDetailsModel.findOne({ transaction_id });
    if (existingPayment) {
      return res.status(400).json({ 
        message: "Transaction ID already exists. Please use a different transaction ID." 
      });
    }

    
    const existingInvoice = await PaymentDetailsModel.findOne({ invoice_id });
    if (existingInvoice) {
      return res.status(400).json({ 
        message: "Invoice ID already exists. Please generate a new invoice ID." 
      });
    }

    const paymentRecord = new PaymentDetailsModel({
      fee_id,
      student_id,
      student_name,
      class: className,
      section,
      term,
      term_name,
      amount_paid,
      payment_method,
      transaction_id,
      invoice_id,
      paid_by,
      paid_by_model: paid_by_role === 'parent' ? 'Parent' : paid_by_role === 'student' ? 'Student' : 'User',
      paid_by_name,
      paid_by_role,
      admin_id:adminId
    });

    const savedPayment = await paymentRecord.save();
    
    res.status(201).json({
      message: "Payment record created successfully",
      payment: savedPayment
    });
  } catch (err) {
    console.error('Error creating payment record:', err);
    res.status(400).json({ message: err.message });
  }
};


exports.getAllPaymentRecords = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const PaymentDetailsModel = connection.model('PaymentDetails', PaymentDetailsSchema);

    const payments = await PaymentDetailsModel.find({ admin_id: adminId })
      .populate("student_id", "full_name admission_number")
      .populate("fee_id", "amount")
      .populate({
        path: "paid_by",
        select: "full_name name username",
        refPath: "paid_by_model"
      })
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    console.error('Error fetching payment records:', err);
    res.status(500).json({ message: err.message });
  }
};


exports.getPaymentRecordsByStudent = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const PaymentDetailsModel = connection.model('PaymentDetails', PaymentDetailsSchema);
    
    const { studentId } = req.params;
    
    const payments = await PaymentDetailsModel.find({ student_id: studentId })
      .populate("fee_id", "amount")
      .populate({
        path: "paid_by",
        select: "full_name name username",
        refPath: "paid_by_model"
      })
      .sort({ payment_date: -1 });

    res.json(payments);
  } catch (err) {
    console.error('Error fetching student payment records:', err);
    res.status(500).json({ message: err.message });
  }
};


exports.getPaymentRecordsByParent = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const PaymentDetailsModel = connection.model('PaymentDetails', PaymentDetailsSchema);
    const { parentId } = req.params;
    
    // Security check: If the user is a parent, they can only access their own records
    if (req.user.role === 'parent' && req.user._id.toString() !== parentId) {
      return res.status(403).json({ message: "Access denied. You can only view your own payment records." });
    }
    
    const payments = await PaymentDetailsModel.find({ 
      paid_by: parentId,
      paid_by_role: "parent"
    })
      .populate("student_id", "full_name admission_number")
      .populate("fee_id", "amount")
      .populate({
        path: "paid_by",
        select: "full_name name username",
        refPath: "paid_by_model"
      })
      .sort({ payment_date: -1 });

    res.json(payments);
  } catch (err) {
    console.error('Error fetching parent payment records:', err);
    res.status(500).json({ message: err.message });
  }
};


exports.getMyPaymentRecords = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const PaymentDetailsModel = connection.model('PaymentDetails', PaymentDetailsSchema);
    const parentId = req.user._id;
    
    const payments = await PaymentDetailsModel.find({ 
      admin_id: adminId,
      paid_by: parentId,
      paid_by_role: "parent"
    })
      .populate("student_id", "full_name admission_number")
      .populate("fee_id", "amount")
      .populate({
        path: "paid_by",
        select: "full_name name username",
        refPath: "paid_by_model"
      })
      .sort({ payment_date: -1 });

    res.json(payments);
  } catch (err) {
    console.error('Error fetching my payment records:', err);
    res.status(500).json({ message: err.message });
  }
};


exports.getPaymentByTransactionId = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const PaymentDetailsModel = connection.model('PaymentDetails', PaymentDetailsSchema);
    
    const payment = await PaymentDetailsModel.findOne({ transaction_id: transactionId })
      .populate("student_id", "full_name admission_number")
      .populate("fee_id", "amount")
      .populate({
        path: "paid_by",
        select: "full_name name username",
        refPath: "paid_by_model"
      });

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    res.json(payment);
  } catch (err) {
    console.error('Error fetching payment by transaction ID:', err);
    res.status(500).json({ message: err.message });
  }
};


exports.getPaymentByInvoiceId = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const PaymentDetailsModel = connection.model('PaymentDetails', PaymentDetailsSchema);
    
    const payment = await PaymentDetailsModel.findOne({ invoice_id: invoiceId })
      .populate("student_id", "full_name admission_number")
      .populate("fee_id", "amount")
      .populate({
        path: "paid_by",
        select: "full_name name username",
        refPath: "paid_by_model"
      });

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    res.json(payment);
  } catch (err) {
    console.error('Error fetching payment by invoice ID:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getPaymentRecordsByFeeId = async (req, res) => {
  try {
    const { feeId } = req.params;
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const PaymentDetailsModel = connection.model('PaymentDetails', PaymentDetailsSchema);
    
    const payments = await PaymentDetailsModel.find({ fee_id: feeId })
      .populate("student_id", "full_name admission_number")
      .populate("fee_id", "amount")
      .populate({
        path: "paid_by",
        select: "full_name name username",
        refPath: "paid_by_model"
      })
      .sort({ payment_date: -1 });

    res.json(payments);
  } catch (err) {
    console.error('Error fetching payment records by fee ID:', err);
    res.status(500).json({ message: err.message });
  }
};


exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, verification_notes } = req.body;
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const PaymentDetailsModel = connection.model('PaymentDetails', PaymentDetailsSchema);
    const FeeModel = connection.model('Fee', FeeSchema);
    
    const updateData = {
      status,
      verification_notes
    };

    
    if (status === "Verified") {
      updateData.verified_by = req.user.id; 
      updateData.verified_at = new Date();
    }

    const payment = await PaymentDetailsModel.findByIdAndUpdate(
      paymentId,
      updateData,
      { new: true }
    ).populate("student_id", "full_name admission_number")
     .populate("fee_id", "amount")
     .populate({
       path: "paid_by",
       select: "full_name name username",
       refPath: "paid_by_model"
     });

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    // Update the corresponding fee status based on payment status
    if (payment.fee_id) {
      try {
        const fee = await FeeModel.findById(payment.fee_id);
        
        if (fee) {
          const termField = `${payment.term}_term`;
          if (fee[termField]) {
            if (status === "Verified") {
              // Update the specific term status to "Paid"
              fee[termField].status = "Paid";
              fee[termField].amount_paid = payment.amount_paid;
              fee[termField].payment_date = payment.payment_date;
              fee[termField].payment_method = payment.payment_method;
            } else if (status === "Rejected" || status === "Pending") {
              // Revert the term status back to "Pending"
              fee[termField].status = "Pending";
              fee[termField].amount_paid = 0;
              fee[termField].payment_date = null;
              fee[termField].payment_method = "";
            }
            
            // Save the fee to trigger the pre-save middleware that updates overall_status
            await fee.save();
          }
        }
      } catch (feeUpdateError) {
        console.error('Error updating fee status:', feeUpdateError);
        // Don't fail the payment update if fee update fails
      }
    }

    res.json({
      message: "Payment status updated successfully",
      payment
    });
  } catch (err) {
    console.error('Error updating payment status:', err);
    res.status(400).json({ message: err.message });
  }
};


exports.getPaymentStatistics = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const PaymentDetailsModel = connection.model('PaymentDetails', PaymentDetailsSchema);

    const totalPayments = await PaymentDetailsModel.countDocuments();
    const pendingPayments = await PaymentDetailsModel.countDocuments({ status: "Pending" });
    const verifiedPayments = await PaymentDetailsModel.countDocuments({ status: "Verified" });
    const rejectedPayments = await PaymentDetailsModel.countDocuments({ status: "Rejected" });
    
    const totalAmount = await PaymentDetailsModel.aggregate([
      { $group: { _id: null, total: { $sum: "$amount_paid" } } }
    ]);

    const monthlyStats = await PaymentDetailsModel.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$payment_date" },
            month: { $month: "$payment_date" }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount_paid" }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 }
    ]);

    res.json({
      totalPayments,
      pendingPayments,
      verifiedPayments,
      rejectedPayments,
      totalAmount: totalAmount[0]?.total || 0,
      monthlyStats
    });
  } catch (err) {
    console.error('Error fetching payment statistics:', err);
    res.status(500).json({ message: err.message });
  }
};


exports.deletePaymentRecord = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const PaymentDetailsModel = connection.model('PaymentDetails', PaymentDetailsSchema);
    
    const payment = await PaymentDetailsModel.findByIdAndDelete(paymentId);
    
    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    res.json({ message: "Payment record deleted successfully" });
  } catch (err) {
    console.error('Error deleting payment record:', err);
    res.status(400).json({ message: err.message });
  }
}; 