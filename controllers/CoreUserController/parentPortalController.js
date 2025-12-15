const FeeSchema = require('../../models/AdministrativeSchema/Fee');
const StudentAttendanceSchema = require('../../models/Attendance_PerformanceSchema/StudentAttendance');
const MarkSchema = require('../../models/Attendance_PerformanceSchema/Mark');
const StudentSchema = require('../../models/CoreUser/Student');
const ParentSchema = require('../../models/CoreUser/Parent');
const db = require('../../config/db');

exports.getParentDashboard = async (req, res) => {
  try {
    const parentId = req.user._id;
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const StudentModel = connection.model('Student', StudentSchema);
    const ParentModel = connection.model('Parent', ParentSchema);

    const parent = await ParentModel.findOne({ parent_id: parentId });

    const students = await StudentModel.find({ parent_id: parent._id });
    const FeeModel = connection.model('Fee', FeeSchema);
    const AttendanceModel = connection.model('StudentAttendance', StudentAttendanceSchema);
    const MarkModel = connection.model('Mark', MarkSchema);

    const data = [];

    for (let student of students) {
      const fee = await FeeModel.find({ student_id: student._id });
      const attendance = await AttendanceModel.find({ student_id: student._id });
      const marks = await MarkModel.find({ student_id: student._id });

      data.push({
        student,
        fee,
        attendance,
        marks,
      });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
