const TeacherScheduleSchema = require('../../models/Attendance_PerformanceSchema/TeacherSchedule');
const mongoose = require('mongoose');
const StudentSchema = require('../../models/CoreUser/Student');
const TeacherSchema = require('../../models/CoreUser/Teacher');
const db = require('../../config/db');

exports.getSchedulesByTeacher = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const TeacherScheduleModel = connection.model('TeacherSchedule', TeacherScheduleSchema);

    const { teacherId } = req.params;

    if (!teacherId) {
      return res.status(400).json({ error: 'Teacher ID is required' });
    }

    const schedules = await TeacherScheduleModel.find({ teacherId: teacherId });

    res.json(schedules);
  } catch (err) {
    console.error('Error in getSchedulesByTeacher:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.createSchedule = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const TeacherScheduleModel = connection.model('TeacherSchedule', TeacherScheduleSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);

    const { teacherId, dayOfWeek, period, subject, startTime, endTime, admin_id, teacher_id } = req.body;

    const teacher = await TeacherModel.findOne({ users: req.user._id });

    // Validate required fields
    if (!teacherId || !dayOfWeek || !period || !subject || !startTime || !endTime) {
      return res.status(400).json({
        error: 'All fields are required: teacherId, dayOfWeek, classId, subject, startTime, endTime'
      });
    }
    const classTeacherInfo = teacher.class_teacher;

    const classesInfo = classTeacherInfo.split('-');
    const className = classesInfo[0];
    const sectionName = classesInfo[1];


    const schedule = new TeacherScheduleModel({
      teacherId,
      dayOfWeek,
      period,
      className,
      sectionName,
      subject,
      startTime,
      endTime,
      createdAt: new Date(),
      admin_id: adminId,
      teacher_id: teacher._id
    });

    await schedule.save();

    res.status(201).json(schedule);
  } catch (err) {
    console.error('Error in createSchedule:', err);
    res.status(400).json({ error: err.message });
  }
};
exports.getRegularSchedulesUnderStudent = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const TeacherScheduleModel = connection.model('TeacherSchedule', TeacherScheduleSchema);
    const StudentModel = connection.model('Student', StudentSchema);

    const student = await StudentModel.findOne({ users: req.user._id });
    
    if (!student) {
      return res.status(400).json({ error: 'Student not found' });
    }

    const classStudentInfo = student.class_id;
    const sectionStudentInfo = student.section;

    const regularSchedules = await TeacherScheduleModel.find({
      className: classStudentInfo,
      sectionName: sectionStudentInfo,
      admin_id: adminId
    });
  
    if (regularSchedules.length === 0) {
      return res.status(400).json({ error: 'Regular schedules not found' });
    }
    res.json(regularSchedules);

  } catch (err) {
    console.error('Error in getRegularSchedulesUnderStudent:', err);
    res.status(500).json({ error: err.message });
  }
}

exports.updateSchedule = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const TeacherScheduleModel = connection.model('TeacherSchedule', TeacherScheduleSchema);

    const { scheduleId } = req.params;

    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
      return res.status(400).json({ error: 'Invalid schedule ID format' });
    }


    const schedule = await TeacherScheduleModel.findByIdAndUpdate(
      scheduleId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json(schedule);
  } catch (err) {
    console.error('Error in updateSchedule:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const TeacherScheduleModel = connection.model('TeacherSchedule', TeacherScheduleSchema);

    const { scheduleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
      return res.status(400).json({ error: 'Invalid schedule ID format' });
    }



    const schedule = await TeacherScheduleModel.findByIdAndDelete(scheduleId);

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json({ message: 'Schedule deleted successfully' });
  } catch (err) {
    console.error('Error in deleteSchedule:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.getAllSchedules = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const TeacherScheduleModel = connection.model('TeacherSchedule', TeacherScheduleSchema);

    const { period, teacherId } = req.query;
    let filter = {};

    if (period) {
      filter.period = period;
    }

    if (teacherId) {
      filter.teacherId = teacherId;
    }

    const schedules = await TeacherScheduleModel.find(filter).sort({ dayOfWeek: 1, startTime: 1 });

    res.json(schedules);
  } catch (err) {
    console.error('Error in getAllSchedules:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getSchedulesByStudent = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const TeacherScheduleModel = connection.model('TeacherSchedule', TeacherScheduleSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);

    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }
    // First, get the student's class ID
    const student = await StudentModel.findOne({ user_id: studentId });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (!student.class_id) {
      return res.status(404).json({ error: 'Student is not assigned to any class' });
    }

    const teacher = await TeacherModel.findOne({ admin_id: adminId })

    const schedules = await TeacherScheduleModel.find({ period: student.class_id, admin_id: adminId })
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.json(schedules);
  } catch (err) {
    console.error('Error in getSchedulesByStudent:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getSchedulesByStudentForHomePage = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const TeacherScheduleModel = connection.model('TeacherSchedule', TeacherScheduleSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);

    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }


    // First, get the student's class ID

    const student = await StudentModel.findOne({ user_id: studentId });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (!student.class_id) {
      return res.status(404).json({ error: 'Student is not assigned to any class' });
    }

    const teacher = await TeacherModel.findOne({ admin_id: adminId }) || {};


    // Get all schedules for the student's class
    const schedules = await TeacherScheduleModel.find({ className: student.class_id, admin_id: teacher.admin_id,createdAt:{$gte: new Date(new Date().setDate(new Date().getDate() - 1))}})
      .sort({ dayOfWeek: 1, startTime: 1 });
    // const schedules = await TeacherSchedule.find({teacher_id : teacher._id, })


    res.json(schedules);
  } catch (err) {
    console.error('Error in getSchedulesByStudent:', err);
    res.status(500).json({ error: err.message });
  }
};