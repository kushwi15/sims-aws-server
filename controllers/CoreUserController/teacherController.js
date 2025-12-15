const TeacherSchema = require('../../models/CoreUser/Teacher');
const UserSchema = require('../../models/CoreUser/User');
const AdminSchema = require('../../models/CoreUser/Admin');
const StudentSchema = require('../../models/CoreUser/Student');
const ResultSchema = require('../../models/Attendance_PerformanceSchema/Result');
const ClassSchema = require('../../models/AcademicSchema/Class');
const TeacherAttendanceSchema = require('../../models/Attendance_PerformanceSchema/TeacherAttendance');
const StudentAttendanceSchema = require('../../models/Attendance_PerformanceSchema/StudentAttendance');
const AssignmentSchema = require('../../models/AcademicSchema/Assignment');
const HomeworkDiarySchema = require('../../models/Communication_Activities/HomeworkDiary');
const PersonalDiarySchema = require('../../models/Communication_Activities/PersonalDiary');
const AssignmentSubmissionSchema = require('../../models/AcademicSchema/AssignmentSubmission');
const TeacherScheduleSchema = require('../../models/Attendance_PerformanceSchema/TeacherSchedule');
const ExamSchema = require('../../models/Attendance_PerformanceSchema/Exam');
const { deleteImageFromCloudinary } = require('../../config/cloudinary');
const cloudinary = require('cloudinary').v2;
// const bcrypt = require("bcryptjs");
const db = require('../../config/db');
const AWS = require('aws-sdk');

exports.createTeacher = async (req, res) => {
  try {
    const {
      user_id,
      full_name,
      email,
      password,
      phone,
      address,
      qualification,
      class_teacher,
      profile_image
    } = req.body;

    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const UserModel = connection.model('User', UserSchema);
    const AdminModel = connection.model('Admin', AdminSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);

    const newTeacher = await UserModel.create({
      user_id,
      full_name,
      email,
      password,
      phone,
      role: 'teacher',
      profileImage: profile_image,
      status: "Active",
    });

    const teacher = await TeacherModel.create({
      user_id,
      full_name,
      email,
      password,
      role: 'teacher',
      phone,
      address,
      qualification,
      class_teacher,
      profile_image,
      users: newTeacher._id,
      status: "Active",
      admin_id: adminId
    });

    res.status(201).json(teacher, newTeacher);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


exports.getAllTeachers = async (req, res) => {
  try {
    // Only return teachers created by the logged-in admin
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const teachers = await TeacherModel.find({ admin_id: adminId._id }).populate('user_id', 'email full_name');
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getTeacherById = async (req, res) => {
  try {
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const teacher = await TeacherModel.findById(req.params.id).populate('user_id', 'email full_name');
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    res.json(teacher);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.updateTeacher = async (req, res) => {
  try {
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const UserModel = connection.model('User', UserSchema);
    const foundTeacher = await TeacherModel.findById(req.params.id);
    if (!foundTeacher) return res.status(404).json({ message: 'Teacher not found' });

    const {
      full_name,
      phone,
      class_teacher,
      email,
      password,
      address,
      profile_image
    } = req.body;

    if (profile_image !== undefined) {
      if (foundTeacher.profile_image) {
        // first perform delete operation
        const imageUrl = foundTeacher.profile_image;

        if (imageUrl) {
          AWS.config.update({
            region: 'ap-south-1', // use your bucket's region
          });

          const s3 = new AWS.S3();
          const url = new URL(imageUrl);
          const key = decodeURIComponent(url.pathname.substring(1));
          const s3Params = {
            Bucket: 'sims-school-files',
            Key: key
          };
          await s3.deleteObject(s3Params).promise();
        }
      }
      foundTeacher.profile_image = profile_image;
    }

    const updatesToApply = { ...req.body };

    Object.assign(foundTeacher, updatesToApply);

    const updatedTeacher = await foundTeacher.save();
    await UserModel.updateOne({ _id: foundTeacher.users }, { ...req.body });
    res.json(updatedTeacher);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteTeacher = async (req, res) => {
  try {
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const UserModel = connection.model('User', UserSchema);
    const AssignmentModel = connection.model('Assignment', AssignmentSchema);
    const AssignmentSubmissionModel = connection.model('AssignmentSubmission', AssignmentSubmissionSchema);
    const HomeworkDiaryModel = connection.model('HomeworkDiary', HomeworkDiarySchema);
    const PersonalDiaryModel = connection.model('PersonalDiary', PersonalDiarySchema);
    const foundTeacher = await TeacherModel.findById(req.params.id);
    if (!foundTeacher) return res.status(404).json({ message: 'Teacher not found' });

    const imageUrl = foundTeacher.profile_image;
    let publicId = null;
    if (!imageUrl) {
      publicId = null;
    } else {
      publicId = imageUrl.split('/').pop().split('.')[0] || null;
    }

    if (publicId) {
      AWS.config.update({
        region: 'ap-south-1', // use your bucket's region
      });

      const s3 = new AWS.S3();
      const url = new URL(imageUrl);
      const key = decodeURIComponent(url.pathname.substring(1));
      const s3Params = {
        Bucket: 'sims-school-files',
        Key: key
      };
      await s3.deleteObject(s3Params).promise();
    }

    if (foundTeacher.users) {
      await UserModel.findByIdAndDelete(foundTeacher.users);
    }

    //find assignments for the teacher id
    const assignments = await AssignmentModel.find({
      teacher_id: foundTeacher._id
    });
    // Delete assignments submitted by the teacher
    await AssignmentSubmissionModel.deleteMany({
      assignment_id: assignments.map(assignment => assignment._id)
    });
    // Delete assignments created by the teacher
    await AssignmentModel.deleteMany({
      teacher_id: foundTeacher._id
    });
    
    await HomeworkDiaryModel.deleteMany({
      $or: [
        { teacherUserId: foundTeacher._id },
        { teacherId: foundTeacher.user_id }
      ]
    });

    await PersonalDiaryModel.deleteMany({
      $or: [
        { teacherUserId: foundTeacher._id },
        { teacherId: foundTeacher.user_id }
      ]
    });

    await foundTeacher.deleteOne();
    res.json({ message: 'Teacher deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTeacherProfile = async (req, res) => {
  try {
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const TeacherModel = connection.model('Teacher', TeacherSchema);

    const teacherProfile = await TeacherModel.findOne({ user_id: req.user.user_id });

    if (!teacherProfile) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    if (teacherProfile.status !== 'Active') {
      return res.status(403).json({ message: 'Teacher account is inactive' });
    }

    res.status(200).json(teacherProfile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getTeacherDashboard = async (req, res) => {
  try {
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const AssignmentModel = connection.model('Assignment', AssignmentSchema);
    const AssignmentSubmissionModel = connection.model('AssignmentSubmission', AssignmentSubmissionSchema);
    const StudentAttendanceModel = connection.model('StudentAttendance', StudentAttendanceSchema);
    const ResultModel = connection.model('Result', ResultSchema);
    const ClassModel = connection.model('Class', ClassSchema);
    const StudentModel = connection.model('Student', StudentSchema);

    const teacherProfile = await TeacherModel.findOne({ users: req.user._id });

    if (!teacherProfile) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const assignedClasses = teacherProfile.assigned_classes || [];

    const assignments = await AssignmentModel.find({
      teacher_id: teacherProfile._id
    });

    const assignmentIds = assignments.map(assignment => assignment._id);
    const submissions = await AssignmentSubmissionModel.find({
      assignment_id: { $in: assignmentIds }
    }).populate('student_id', 'full_name');


    const classIds = assignedClasses.map(classId => classId.toString());
    const students = await StudentModel.find({
      class_id: { $in: classIds }
    });
    const studentIds = students.map(student => student._id);


    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendanceData = await StudentAttendanceModel.find({
      student_id: { $in: studentIds },
      date: { $gte: thirtyDaysAgo }
    });


    const examResults = await ResultModel.find({
      student_id: { $in: studentIds }
    }).populate('exam_id', 'exam_name subject');


    const totalStudents = students.length;
    const totalAssignments = assignments.length;
    const pendingSubmissions = submissions.filter(sub => !sub.grade || sub.grade === 'Incomplete').length;
    const gradedSubmissions = submissions.filter(sub => sub.grade && sub.grade !== 'Incomplete').length;


    const totalAttendanceRecords = attendanceData.length;
    const presentRecords = attendanceData.filter(record => record.status === 'Present').length;
    const attendancePercentage = totalAttendanceRecords > 0 ? (presentRecords / totalAttendanceRecords) * 100 : 0;


    const classGrades = {};
    examResults.forEach(result => {
      const student = students.find(s => s._id.toString() === result.student_id.toString());
      if (student && student.class_id) {
        const classId = student.class_id.toString();
        if (!classGrades[classId]) {
          classGrades[classId] = { total: 0, count: 0 };
        }
        if (result.marks && result.maxMarks) {
          classGrades[classId].total += (result.marks / result.maxMarks) * 100;
          classGrades[classId].count += 1;
        }
      }
    });


    const classes = await ClassModel.find({ _id: { $in: Object.keys(classGrades) } });
    const classNames = {};
    classes.forEach(cls => {
      classNames[cls._id.toString()] = cls.class_name || cls.grade;
    });

    const averageGradesByClass = Object.keys(classGrades).map(classId => ({
      name: classNames[classId] || `Class ${classId}`,
      grade: classGrades[classId].count > 0 ? Math.round(classGrades[classId].total / classGrades[classId].count) : 0
    }));


    const recentAssignments = assignments.slice(0, 8).map(assignment => {
      const assignmentSubmissions = submissions.filter(sub =>
        sub.assignment_id.toString() === assignment._id.toString()
      );
      const totalSubs = assignmentSubmissions.length;
      const completedSubs = assignmentSubmissions.filter(sub =>
        sub.grade && sub.grade !== 'Incomplete'
      ).length;

      let status = 'Pending';
      if (completedSubs === totalSubs && totalSubs > 0) {
        status = 'Completed';
      } else if (new Date(assignment.dueDate) < new Date()) {
        status = 'Late';
      }

      return {
        id: assignment._id,
        assignment: assignment.title,
        class: assignment.class || 'N/A',
        section: assignment.section || 'N/A',
        subject: assignment.subject || 'N/A',
        dueDate: assignment.dueDate,
        status: status
      };
    });


    const weeklyAttendance = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekAttendance = attendanceData.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= weekStart && recordDate <= weekEnd;
      });

      const weekPresent = weekAttendance.filter(record => record.status === 'Present').length;
      const weekAbsent = weekAttendance.filter(record => record.status === 'Absent').length;

      weeklyAttendance.push({
        name: `Week ${4 - i}`,
        present: weekPresent,
        absent: weekAbsent
      });
    }

    const dashboardData = {
      statistics: {
        totalClasses: assignedClasses.length,
        totalStudents: totalStudents,
        totalAssignments: totalAssignments,
        pendingSubmissions: pendingSubmissions,
        gradedSubmissions: gradedSubmissions,
        attendancePercentage: Math.round(attendancePercentage)
      },
      assignments: recentAssignments,
      gradeChart: averageGradesByClass,
      attendanceChart: weeklyAttendance
    };

    res.status(200).json(dashboardData);
  } catch (err) {
    console.error('Error fetching teacher dashboard:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getTeacherCount = async (req, res) => {
  try {
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const TeacherModel = connection.model('Teacher', TeacherSchema);

    // let adminIdToFilter;

    // if (req.user.role === 'admin') {
    //   adminIdToFilter = req.user._id;
    // } else if (req.user.role === 'super_admin') {
    //   // Superadmin can see all teachers
    //   adminIdToFilter = null;
    // } else {
    //   return res.status(403).json({ message: 'Unauthorized user' });
    // }

    // const query = adminIdToFilter ? { admin_id: adminIdToFilter } : {};
    const count = await TeacherModel.countDocuments({ admin_id: adminId });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.searchTeachers = async (req, res) => {
  try {
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);

    const TeacherModel = connection.model('Teacher', TeacherSchema);

    const { query } = req.query;
    if (!query) return res.json([]);
    const teachers = await TeacherModel.find({
      admin_id: adminId._id,
      $or: [
        { user_id: { $regex: query, $options: 'i' } },
        { full_name: { $regex: query, $options: 'i' } }
      ]
    }).select('user_id full_name');
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getTeacherByUserId = async (req, res) => {
  try {
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const TeacherModel = connection.model('Teacher', TeacherSchema);

    // Try to find by user_id first (string field)
    let teacher = await TeacherModel.findOne({ user_id: req.params.userId })
      .populate('users', 'full_name user_id');

    // If not found, try to find by users reference
    if (!teacher) {

      teacher = await TeacherModel.findOne({ users: req.params.userId })
        .populate('users', 'full_name user_id');
    }

    if (!teacher) {

      return res.status(404).json({ message: 'Teacher not found' });
    }


    res.json(teacher);
  } catch (err) {
    console.error('Error in getTeacherByUserId:', err);
    res.status(500).json({ message: err.message });
  }
};
