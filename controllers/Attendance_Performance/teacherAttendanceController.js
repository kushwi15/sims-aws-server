const TeacherAttendanceSchema = require('../../models/Attendance_PerformanceSchema/TeacherAttendance');
const moment = require('moment');
const ExcelJS = require('exceljs');
const nodemailer = require('nodemailer');
const TeacherSchema = require('../../models/CoreUser/Teacher');
const db = require('../../config/db');


exports.markAttendance = async (req, res) => {
    try {
        const { teacher_id, date, status, checkIn, checkOut, comment,admin_id } = req.body;
        const {connection,adminId,userId} = await db.getUserSpecificConnection(req.user._id);
        const TeacherAttendanceModel = connection.model('TeacherAttendance', TeacherAttendanceSchema);
        const TeacherModel = connection.model('Teacher', TeacherSchema);

        const attendance = new TeacherAttendanceModel({
            teacher_id,
            date,
            status,
            checkIn,
            checkOut,
            comment,
            proofImage: req.file?.path,
            admin_id: adminId,
        });

        await attendance.save();

        if (status === 'Leave') {
            const teacher = await TeacherModel.findById(teacher_id);

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.HR_EMAIL,
                    pass: process.env.HR_PASSWORD,
                },
            });

            await transporter.sendMail({
                to: process.env.HR_EMAIL,
                subject: `Leave Notification: ${teacher.full_name}`,
                text: `${teacher.full_name} has marked leave for ${date}.`,
            });
        }
        res.status(201).json(attendance);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};


exports.getAllAttendance = async (req, res) => {
    try {
        const {connection,adminId,userId} = await db.getUserSpecificConnection(req.user._id);
        const TeacherAttendanceModel = connection.model('TeacherAttendance', TeacherAttendanceSchema);

        const records = await TeacherAttendanceModel.find({ admin_id: adminId }).populate('teacher_id', 'full_name');
        res.json(records);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


exports.getAttendanceByTeacher = async (req, res) => {
    try {
        const {connection,adminId,userId} = await db.getUserSpecificConnection(req.user._id);
        const TeacherAttendanceModel = connection.model('TeacherAttendance', TeacherAttendanceSchema);

        const records = await TeacherAttendanceModel.find({ teacher_id: req.params.teacherId,admin_id: adminId });
        res.json(records);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAttendanceByTeacherUnderMyAdmin = async (req, res) => {
  try {
        const {connection,adminId,userId} = await db.getUserSpecificConnection(req.user._id);
        const TeacherAttendanceModel = connection.model('TeacherAttendance', TeacherAttendanceSchema);
        const TeacherModel = connection.model('Teacher', TeacherSchema);
      
      const teacher = await TeacherModel.findById(req.params.teacherId);
      if (!teacher) {
          
          return res.status(404).json({ message: 'Teacher not found' });
      }
      
      const records = await TeacherAttendanceModel.find({ teacher_id: teacher._id, admin_id: adminId });
      
      res.json(records);
  } catch (err) {
      console.error('Error in getAttendanceByTeacherUnderMyAdmin:', err);
      res.status(500).json({ message: err.message });
  }
};

exports.getAttendanceByAdminForStudent = async (req, res) => {
  try {
        const {connection,adminId,userId} = await db.getUserSpecificConnection(req.user._id);
        const TeacherAttendanceModel = connection.model('TeacherAttendance', TeacherAttendanceSchema);
        const TeacherModel = connection.model('Teacher', TeacherSchema);
      
      const teacher = await TeacherModel.findById({_id: req.params.teacherId});
      if (!teacher) {
          return res.status(404).json({ message: 'Teacher not found' });
      }
      
      const records = await TeacherAttendanceModel.find({ teacher_id: teacher._id, admin_id: adminId });
      
      res.json(records);
  } catch (err) {
      console.error('Error in getAttendanceByTeacherUnderMyAdmin:', err);
      res.status(500).json({ message: err.message });
  }
};


exports.updateAttendance = async (req, res) => {
    try {
        const {connection,adminId,userId} = await db.getUserSpecificConnection(req.user._id);
        const TeacherAttendanceModel = connection.model('TeacherAttendance', TeacherAttendanceSchema);

        const { status, checkIn, checkOut, comment,admin_id } = req.body;
        const record = await TeacherAttendanceModel.findById(req.params.id);
        if (!record) return res.status(404).json({ message: 'Record not found' });

        if (status) record.status = status;
        if (checkIn !== undefined) record.checkIn = checkIn;
        if (checkOut !== undefined) record.checkOut = checkOut;
        if (comment !== undefined) record.comment = comment;
        if (req.file) record.proofImage = req.file.path;
        record.admin_id = adminId;
        await record.save();
        res.json(record);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};


exports.deleteAttendance = async (req, res) => {
    try {
        const {connection,adminId,userId} = await db.getUserSpecificConnection(req.user._id);
        const TeacherAttendanceModel = connection.model('TeacherAttendance', TeacherAttendanceSchema);

        const record = await TeacherAttendanceModel.findById(req.params.id);
        if (!record) return res.status(404).json({ message: 'Record not found' });

        await record.deleteOne();
        res.json({ message: 'Attendance record deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete expired attendance records after academic year ends
exports.deleteExpiredAttendance = async (req, res) => {
    try {
        const {connection,adminId,userId} = await db.getUserSpecificConnection(req.user._id);
        const TeacherAttendanceModel = connection.model('TeacherAttendance', TeacherAttendanceSchema);

        const { academicEndYear } = req.query;
        
        if (!academicEndYear) {
            return res.status(400).json({ message: 'Academic end year is required' });
        }

        const academicEndDate = new Date(academicEndYear);
        const currentDate = new Date();

        // Check if current date is past the academic end year
        if (currentDate <= academicEndDate) {
            return res.status(400).json({ 
                message: 'Cannot delete attendance records before academic year ends' 
            });
        }

        // Delete all attendance records up to the academic end year
        const result = await TeacherAttendanceModel.deleteMany({
            date: { $lte: academicEndDate },
            admin_id: adminId
        });

        res.json({ 
            message: `${result.deletedCount} expired teacher attendance records deleted successfully`,
            deletedCount: result.deletedCount
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getTeacherMonthlyReport = async (req, res) => {
    const { teacherId, month, year } = req.query;
    const {connection,adminId,userId} = await db.getUserSpecificConnection(req.user._id);
        const TeacherAttendanceModel = connection.model('TeacherAttendance', TeacherAttendanceSchema);

    const startDate = moment(`${year}-${month}-01`).startOf('month').toDate();
    const endDate = moment(startDate).endOf('month').toDate();

    try {
        const records = await TeacherAttendanceModel.find({
            teacher_id: teacherId,
            date: { $gte: startDate, $lte: endDate },
            admin_id: adminId
        });

        const summary = {
            present: records.filter(r => r.status === 'Present').length,
            absent: records.filter(r => r.status === 'Absent').length,
            leave: records.filter(r => r.status === 'Leave').length,
            totalDays: records.length,
        };

        res.json({ summary, records });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.exportTeacherAttendanceExcel = async (req, res) => {
    const {connection, adminId} = await db.getUserSpecificConnection(req.user._id);
    const TeacherAttendanceModel = connection.model('TeacherAttendance', TeacherAttendanceSchema);

    const { teacherId } = req.params;
    const records = await TeacherAttendanceModel.find({ teacher_id: teacherId,admin_id: adminId });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance');

    worksheet.columns = [
        { header: 'Date', key: 'date' },
        { header: 'Status', key: 'status' },
        { header: 'Remarks', key: 'remarks' },
    ];

    records.forEach(r => {
        worksheet.addRow({
            date: r.date.toDateString(),
            status: r.status,
            remarks: r.proofImage ? "Has Document" : ""
        });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=teacher_attendance.xlsx');

    await workbook.xlsx.write(res);
    res.end();
};


exports.getAttendanceByDate = async (req, res) => {
  try {
    const {connection, adminId} = await db.getUserSpecificConnection(req.user._id);
    const TeacherAttendanceModel = connection.model('TeacherAttendance', TeacherAttendanceSchema);

    const { date, subject } = req.query;
    if (!date) return res.status(400).json({ message: 'Date is required' });
    const start = moment(date).startOf('day').toDate();
    const end = moment(date).endOf('day').toDate();
    
    // Build query for attendance records
    const attendanceQuery = {
      date: { $gte: start, $lte: end },
      admin_id: adminId
    };
    
    const records = await TeacherAttendanceModel.find(attendanceQuery)
      .populate({
        path: 'teacher_id',
        select: 'full_name subjects_taught',
        ...(subject && {
          match: {
            subjects_taught: { $in: [subject] }
          }
        })
      });
    
    // Filter out records where teacher doesn't match subject criteria
    const filteredRecords = records.filter(record => record.teacher_id !== null);
    
    res.json(filteredRecords);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getAttendanceByDateUnderMyAdmin = async (req, res) => {
  try {
    const {connection, adminId} = await db.getUserSpecificConnection(req.user._id);
    const TeacherAttendanceModel = connection.model('TeacherAttendance', TeacherAttendanceSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);

    const { date, subject } = req.query;
    if (!date) return res.status(400).json({ message: 'Date is required' });
    const start = moment(date).startOf('day').toDate();
    const end = moment(date).endOf('day').toDate();

    const teacher = await TeacherModel.findOne({users: req.user._id});
    
    // Build query for attendance records
    const attendanceQuery = {
      date: { $gte: start, $lte: end },
      admin_id: teacher.admin_id,
    };
    
    const records = await TeacherAttendanceModel.find(attendanceQuery)
      .populate({
        path: 'teacher_id',
        select: 'full_name subjects_taught',
        ...(subject && {
          match: {
            subjects_taught: { $in: [subject] }
          }
        })
      });
    
    // Filter out records where teacher doesn't match subject criteria
    const filteredRecords = records.filter(record => record.teacher_id !== null);
    
    res.json(filteredRecords);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.setBulkAttendance = async (req, res) => {
  try {
    const {connection, adminId} = await db.getUserSpecificConnection(req.user._id);
    const TeacherAttendanceModel = connection.model('TeacherAttendance', TeacherAttendanceSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);

    const { date, records } = req.body; 
    if (!date || !Array.isArray(records)) {
      return res.status(400).json({ message: 'Date and records array are required' });
    }
    const start = moment(date).startOf('day').toDate();
    const end = moment(date).endOf('day').toDate();
    const results = [];
    for (const rec of records) {
      let attendance = await TeacherAttendanceModel.findOne({
        teacher_id: rec.teacher_id,
        date: { $gte: start, $lte: end },
        admin_id: adminId
      });
      if (attendance) {
        attendance.status = rec.status;
        if (rec.checkIn !== undefined) attendance.checkIn = rec.checkIn;
        if (rec.checkOut !== undefined) attendance.checkOut = rec.checkOut;
        if (rec.comment !== undefined) attendance.comment = rec.comment;
        attendance.admin_id = adminId;
        await attendance.save();
      } else {
        attendance = new TeacherAttendanceModel({
          teacher_id: rec.teacher_id,
          date,
          status: rec.status,
          checkIn: rec.checkIn,
          checkOut: rec.checkOut,
          comment: rec.comment || '',
          admin_id: adminId,
        });
        await attendance.save();
      }
      results.push(attendance);
    }
    res.json({ updated: results.length, records: results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};