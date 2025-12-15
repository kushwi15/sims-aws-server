const FeeSchema = require("../../models/AdministrativeSchema/Fee");
const PaymentDetailsSchema = require("../../models/AdministrativeSchema/PaymentDetails");
const cloudinary = require("../../config/cloudinary");
const ParentSchema = require('../../models/CoreUser/Parent');
const fs = require("fs");
const StudentSchema = require('../../models/CoreUser/Student');
const db = require('../../config/db');

const mapFeeToFrontend = (fee) => {
  return {
    id: fee._id,
    studentId: fee.student_id?.user_id || fee.student_id?.admission_number || fee.student_id || '',
    studentObjectId: fee.student_id, // Keep the actual ObjectId for updates
    studentName: fee.student_id?.full_name || fee.student_name || '',
    class: fee.class || fee.student_id?.class_id || '',
    section: fee.section || '',
    amount: fee.amount || 0,
    term1Amount: fee.first_term?.amount_due || 0,
    term1Paid: fee.first_term?.status === 'Paid',
    term1Status: fee.first_term?.status || 'Pending',
    term1PaymentDate: fee.first_term?.payment_date ? fee.first_term.payment_date.toISOString().slice(0, 10) : '',
    term1PaymentMethod: fee.first_term?.payment_method || '',
    term1DueDate: fee.first_term?.due_date ? fee.first_term.due_date.toISOString().slice(0, 10) : '',
    term2Amount: fee.second_term?.amount_due || 0,
    term2Paid: fee.second_term?.status === 'Paid',
    term2Status: fee.second_term?.status || 'Pending',
    term2PaymentDate: fee.second_term?.payment_date ? fee.second_term.payment_date.toISOString().slice(0, 10) : '',
    term2PaymentMethod: fee.second_term?.payment_method || '',
    term2DueDate: fee.second_term?.due_date ? fee.second_term.due_date.toISOString().slice(0, 10) : '',
    term3Amount: fee.third_term?.amount_due || 0,
    term3Paid: fee.third_term?.status === 'Paid',
    term3Status: fee.third_term?.status || 'Pending',
    term3PaymentDate: fee.third_term?.payment_date ? fee.third_term.payment_date.toISOString().slice(0, 10) : '',
    term3PaymentMethod: fee.third_term?.payment_method || '',
    term3DueDate: fee.third_term?.due_date ? fee.third_term.due_date.toISOString().slice(0, 10) : '',
    status: fee.overall_status || 'Pending',
  };
};


const calculateTermAmounts = (totalAmount) => {
  const termAmount = Math.round(totalAmount / 3);
  return {
    term1Amount: termAmount,
    term2Amount: termAmount,
    term3Amount: totalAmount - (termAmount * 2)
  };
};


exports.payTermFee = async (req, res) => {
  try {
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const ParentModel = connection.model('Parent', ParentSchema);
    const FeeModel = connection.model('Fee', FeeSchema);
    const PaymentDetailsModel = connection.model('PaymentDetails', PaymentDetailsSchema);
    const { term, amount_paid, payment_date, payment_method, transaction_id, invoice_id, paid_by, paid_by_name, paid_by_role } = req.body;


    const validPaymentMethods = ["Cash", "Cheque", "Online", "Card", "Bank Transfer", "UPI", ""];
    if (payment_method && !validPaymentMethods.includes(payment_method)) {
      return res.status(400).json({
        message: `Invalid payment method. Allowed values: ${validPaymentMethods.join(', ')}`
      });
    }
    const parent = await ParentModel.findOne({ users: req.user._id });
    // const fee = await Fee.findById(req.params.id);
    const fee = await FeeModel.findOne({ admin_id: parent.admin_id });
    if (!fee) return res.status(404).json({ message: "Fee record not found" });

    let receipt_url = "";
    if (req.file) {
      const uploaded = await cloudinary.uploader.upload(req.file.path, {
        folder: "fee_receipts",
      });
      receipt_url = uploaded.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const termData = {
      amount_paid,
      payment_date,
      payment_method,
      receipt_url,
      status: "Paid",
    };


    if (term === "first") fee.first_term = { ...fee.first_term, ...termData };
    else if (term === "second") fee.second_term = { ...fee.second_term, ...termData };
    else if (term === "third") fee.third_term = { ...fee.third_term, ...termData };
    else return res.status(400).json({ message: "Invalid term" });

    await fee.save();


    if (transaction_id && invoice_id) {
      const termNames = {
        "first": "1st Term",
        "second": "2nd Term",
        "third": "3rd Term"
      };

      const paymentRecord = new PaymentDetailsModel({
        fee_id: fee._id,
        student_id: fee.student_id,
        student_name: fee.student_name,
        class: fee.class,
        section: fee.section,
        term,
        term_name: termNames[term],
        amount_paid,
        payment_method,
        transaction_id,
        invoice_id,
        paid_by,
        paid_by_model: paid_by_role === 'parent' ? 'Parent' : paid_by_role === 'student' ? 'Student' : 'User',
        paid_by_name,
        paid_by_role,
        admin_id: parent.admin_id
      });

      await paymentRecord.save();
    }

    res.json(mapFeeToFrontend(fee));
  } catch (err) {
    console.error('Error in payTermFee:', err);
    res.status(400).json({ message: err.message });
  }
};


exports.createFee = async (req, res) => {
  try {
    const {
      student_id,
      student_name,
      class: className,
      section,
      amount,
      first_term,
      second_term,
      third_term,
      admin_id
    } = req.body;

    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const FeeModel = connection.model('Fee', FeeSchema);
    const PaymentDetailsModel = connection.model('PaymentDetails', PaymentDetailsSchema);

    // Calculate term amounts
    const termAmounts = calculateTermAmounts(amount);

    const feeData = {
      student_id,
      student_name,
      class: className,
      section,
      amount,
      first_term: {
        amount_due: first_term?.amount_due || termAmounts.term1Amount,
        status: first_term?.status || 'Pending',
        due_date: first_term?.due_date || null,
        payment_method: first_term?.payment_method || '',
        payment_date: first_term?.payment_date || null,
      },
      second_term: {
        amount_due: second_term?.amount_due || termAmounts.term2Amount,
        status: second_term?.status || 'Pending',
        due_date: second_term?.due_date || null,
        payment_method: second_term?.payment_method || '',
        payment_date: second_term?.payment_date || null,
      },
      third_term: {
        amount_due: third_term?.amount_due || termAmounts.term3Amount,
        status: third_term?.status || 'Pending',
        due_date: third_term?.due_date || null,
        payment_method: third_term?.payment_method || '',
        payment_date: third_term?.payment_date || null,
      },
      admin_id: adminId,
    };

    const fee = await FeeModel.create(feeData);

    // Create PaymentDetails records for any terms that are already paid
    const paymentRecords = [];

    if (first_term?.status === 'Paid' && first_term?.payment_date && first_term?.payment_method) {
      paymentRecords.push({
        fee_id: fee._id,
        student_id: fee.student_id,
        student_name: fee.student_name,
        class: fee.class,
        section: fee.section,
        term: 'first',
        term_name: '1st Term',
        amount_paid: first_term.amount_due || termAmounts.term1Amount,
        payment_date: first_term.payment_date,
        payment_method: first_term.payment_method,
        transaction_id: `TXN_${Date.now()}_1`,
        invoice_id: `INV_${Date.now()}_1`,
        paid_by: student_id,
        paid_by_name: student_name,
        paid_by_role: 'student',
        admin_id: fee.admin_id
      });
    }

    if (second_term?.status === 'Paid' && second_term?.payment_date && second_term?.payment_method) {
      paymentRecords.push({
        fee_id: fee._id,
        student_id: fee.student_id,
        student_name: fee.student_name,
        class: fee.class,
        section: fee.section,
        term: 'second',
        term_name: '2nd Term',
        amount_paid: second_term.amount_due || termAmounts.term2Amount,
        payment_date: second_term.payment_date,
        payment_method: second_term.payment_method,
        transaction_id: `TXN_${Date.now()}_2`,
        invoice_id: `INV_${Date.now()}_2`,
        paid_by: student_id,
        paid_by_name: student_name,
        paid_by_role: 'student',
        admin_id: fee.admin_id
      });
    }

    if (third_term?.status === 'Paid' && third_term?.payment_date && third_term?.payment_method) {
      paymentRecords.push({
        fee_id: fee._id,
        student_id: fee.student_id,
        student_name: fee.student_name,
        class: fee.class,
        section: fee.section,
        term: 'third',
        term_name: '3rd Term',
        amount_paid: third_term.amount_due || termAmounts.term3Amount,
        payment_date: third_term.payment_date,
        payment_method: third_term.payment_method,
        transaction_id: `TXN_${Date.now()}_3`,
        invoice_id: `INV_${Date.now()}_3`,
        paid_by: student_id,
        paid_by_name: student_name,
        paid_by_role: 'student',
        admin_id: fee.admin_id
      });
    }

    // Save all payment records
    if (paymentRecords.length > 0) {
      for (const paymentRecord of paymentRecords) {
        const newPayment = new PaymentDetailsModel(paymentRecord);

        // Auto-verify cash payments
        if (paymentRecord.payment_method === 'Cash') {
          newPayment.status = 'Verified';
          newPayment.verified_by = req.user._id;
          newPayment.verified_at = new Date();
        }

        await newPayment.save();
      }
    }

    res.status(201).json(mapFeeToFrontend(fee));
  } catch (err) {
    console.error('Error creating fee:', err);
    res.status(400).json({ message: err.message });
  }
};


exports.getAllFees = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const FeeModel = connection.model('Fee', FeeSchema);
    const fees = await FeeModel.find({ admin_id: adminId }).populate("student_id", "full_name admission_number class_id user_id");
    const mapped = fees.map(mapFeeToFrontend);
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStudentFees = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const FeeModel = connection.model('Fee', FeeSchema);

    const studentId = req.params.studentId;

    let fees = await FeeModel.find({ student_id: studentId }).populate("student_id", "full_name admission_number class_id user_id");


    if (fees.length === 0) {

      const StudentModel = connection.model('Student', StudentSchema);
      const student = await StudentModel.findById(studentId);

      if (student) {

        fees = await FeeModel.find({ student_name: student.full_name }).populate("student_id", "full_name admission_number class_id user_id");

        if (fees.length === 0) {

          fees = await FeeModel.find({
            $or: [
              { student_name: student.full_name },
              { "student_id.admission_number": student.admission_number }
            ]
          }).populate("student_id", "full_name admission_number class_id user_id");
        }
      }
    }

    const mapped = fees.map(mapFeeToFrontend);
    res.json(mapped);
  } catch (err) {
    console.error('Error in getStudentFees:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateFee = async (req, res) => {
  try {
    const {
      student_id,
      student_name,
      class: className,
      section,
      amount,
      first_term,
      second_term,
      third_term,
    } = req.body;

    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const FeeModel = connection.model('Fee', FeeSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const PaymentDetailsModel = connection.model('PaymentDetails', PaymentDetailsSchema);

    const student = await StudentModel.findOne({ user_id: req.body.student_id }).populate('parent_id', '_id full_name role');
    const stuId = student._id;
    const prtId = student.parent_id.map(a => a._id);

    const existingFee = await FeeModel.findById(req.params.id);
    if (!existingFee) {
      return res.status(404).json({ message: "Fee record not found" });
    }

    const termAmounts = calculateTermAmounts(amount);

    const updateData = {
      student_id: stuId,
      student_name,
      class: className,
      section,
      amount,
      first_term: {
        amount_due: first_term?.amount_due || termAmounts.term1Amount,
        status: first_term?.status || 'Pending',
        due_date: first_term?.due_date || null,
        payment_method: first_term?.payment_method || '',
        payment_date: first_term?.payment_date || null,
      },
      second_term: {
        amount_due: second_term?.amount_due || termAmounts.term2Amount,
        status: second_term?.status || 'Pending',
        due_date: second_term?.due_date || null,
        payment_method: second_term?.payment_method || '',
        payment_date: second_term?.payment_date || null,
      },
      third_term: {
        amount_due: third_term?.amount_due || termAmounts.term3Amount,
        status: third_term?.status || 'Pending',
        due_date: third_term?.due_date || null,
        payment_method: third_term?.payment_method || '',
        payment_date: third_term?.payment_date || null,
      },
    };

    const paymentChanges = [];

    if (first_term?.status !== 'Paid' &&
      first_term?.payment_date &&
      first_term?.payment_method &&
      (existingFee.first_term?.status !== 'Paid' ||
        existingFee.first_term?.payment_date !== first_term?.payment_date)) {
      paymentChanges.push({
        term: 'first',
        term_name: '1st Term',
        amount_paid: first_term.amount_due,
        payment_date: first_term.payment_date,
        payment_method: first_term.payment_method,
        transaction_id: `TXN_${Date.now()}_1`,
        invoice_id: `INV_${Date.now()}_1`,
        paid_by: prtId,
        paid_by_name: student.parent_id[0].full_name,
        paid_by_role: 'parent',
        admin_id: existingFee.admin_id
      });
    }

    if (second_term?.status !== 'Paid' &&
      second_term?.payment_date &&
      second_term?.payment_method &&
      (existingFee.second_term?.status !== 'Paid' ||
        existingFee.second_term?.payment_date !== second_term?.payment_date)) {
      paymentChanges.push({
        term: 'second',
        term_name: '2nd Term',
        amount_paid: second_term.amount_due,
        payment_date: second_term.payment_date,
        payment_method: second_term.payment_method,
        transaction_id: `TXN_${Date.now()}_2`,
        invoice_id: `INV_${Date.now()}_2`,
        paid_by: prtId,
        paid_by_name: student.parent_id[0].full_name,
        paid_by_role: 'parent',
        admin_id: existingFee.admin_id
      });
    }

    if (third_term?.status !== 'Paid' &&
      third_term?.payment_date &&
      third_term?.payment_method &&
      (existingFee.third_term?.status !== 'Paid' ||
        existingFee.third_term?.payment_date !== third_term?.payment_date)) {
      paymentChanges.push({
        term: 'third',
        term_name: '3rd Term',
        amount_paid: third_term.amount_due,
        payment_date: third_term.payment_date,
        payment_method: third_term.payment_method,
        transaction_id: `TXN_${Date.now()}_3`,
        invoice_id: `INV_${Date.now()}_3`,
        paid_by: prtId,
        paid_by_name: student.parent_id[0].full_name,
        paid_by_role: 'parent',
        admin_id: existingFee.admin_id
      });
    }


    const updated = await FeeModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate("student_id", "full_name admission_number class_id user_id");

    if (!updated) return res.status(404).json({ message: "Fee record not found" });

    if (paymentChanges.length > 0) {
      for (const paymentChange of paymentChanges) {
        const paymentRecord = new PaymentDetailsModel({
          fee_id: updated._id,
          student_id: updated.student_id,
          student_name: updated.student_name,
          class: updated.class,
          section: updated.section,
          ...paymentChange
        });

        // Auto-verify cash payments
        if (paymentChange.payment_method === 'Cash') {
          paymentRecord.status = 'Verified';
          paymentRecord.verified_by = req.user._id;
          paymentRecord.verified_at = new Date();

          //Fee Model update
          updated[`${paymentChange.term}_term`].status = 'Paid';
          updated[`${paymentChange.term}_term`].payment_date = paymentChange.payment_date;
          updated[`${paymentChange.term}_term`].payment_method = paymentChange.payment_method;
          updated[`${paymentChange.term}_term`].amount_paid = paymentChange.amount_paid;
          updated[`${paymentChange.term}_term`].payment_date = paymentChange.payment_date;
          await updated.save();
        }

        await paymentRecord.save();
      }
    } else {
      const paymentRecord = new PaymentDetailsModel({
        fee_id: existingFee._id,
        student_id: updated.student_id,
        student_name: updated.student_name,
        class: updated.class,
        section: updated.section,
        term: updateData.term,
        term_name: updateData.term_name,
        amount_paid: updateData.amount_paid,
        payment_method: updateData.payment_method,
        transaction_id: updateData.transaction_id || '',
        invoice_id: updateData.invoice_id || '',
        paid_by: prtId,
        paid_by_model: updateData.paid_by_role === 'parent' ? 'Parent' : updateData.paid_by_role === 'student' ? 'Student' : 'User',
        paid_by_name: updateData.paid_by_name,
        paid_by_role: updateData.paid_by_role,
        admin_id: adminId
      });
      await paymentRecord.save();
    }

    res.json(mapFeeToFrontend(updated));
  } catch (err) {
    console.error('Error updating fee:', err);
    res.status(400).json({ message: err.message });
  }
};


exports.getFeeById = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const FeeModel = connection.model('Fee', FeeSchema);
    const fee = await FeeModel.findById(req.params.id).populate("student_id", "full_name admission_number class_id user_id");
    if (!fee) return res.status(404).json({ message: "Fee record not found" });
    res.json(mapFeeToFrontend(fee));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteFee = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const FeeModel = connection.model('Fee', FeeSchema);
    const deleted = await FeeModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Fee record not found" });

    // Only try to delete from Cloudinary if there's a receipt_url
    if (deleted.receipt_url) {
      const imageUrl = deleted.receipt_url;
      const publicId = imageUrl.split('/').pop().split('.')[0];

      if (publicId) {
        cloudinary.config({
          // secure: true,
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        // await deleteImageFromCloudinary(imageUrl);
        await cloudinary.uploader.destroy(publicId);
      }
    }
    res.json({ message: "Fee record deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.createSampleFees = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const FeeModel = connection.model('Fee', FeeSchema);
    const StudentModel = connection.model('Student', StudentSchema);

    const students = await StudentModel.find().limit(5); // Get first 5 students

    if (students.length === 0) {
      return res.status(404).json({ message: "No students found to create fee records for" });
    }

    const sampleFees = [];

    for (const student of students) {
      const feeData = {
        student_id: student._id,
        student_name: student.full_name,
        class: student.class_id?.class_name || '10',
        section: student.section || 'A',
        amount: 15000, // Total fee amount
        first_term: {
          amount_due: 5000,
          status: 'Due',
          due_date: new Date('2024-06-15'),
          payment_method: '',
          payment_date: null,
        },
        second_term: {
          amount_due: 5000,
          status: 'Due',
          due_date: new Date('2024-09-15'),
          payment_method: '',
          payment_date: null,
        },
        third_term: {
          amount_due: 5000,
          status: 'Due',
          due_date: new Date('2024-12-15'),
          payment_method: '',
          payment_date: null,
        },
      };

      const fee = await FeeModel.create(feeData);
      sampleFees.push(mapFeeToFrontend(fee));
    }

    res.status(201).json({
      message: `Created ${sampleFees.length} sample fee records`,
      fees: sampleFees
    });
  } catch (err) {
    console.error('Error creating sample fees:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getFeePaymentDetails = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const PaymentDetailsModel = connection.model('PaymentDetails', PaymentDetailsSchema);
    const { feeId } = req.params;

    const payments = await PaymentDetailsModel.find({ fee_id: feeId })
      .sort({ payment_date: -1 });

    res.json(payments);
  } catch (err) {
    console.error('Error fetching fee payment details:', err);
    res.status(500).json({ message: err.message });
  }
};
