const StudentSchema = require('../../models/CoreUser/Student');
const AdminSchema = require('../../models/CoreUser/Admin');
const UserSchema = require('../../models/CoreUser/User');
const TeacherSchema = require('../../models/CoreUser/Teacher');
const ParentSchema = require('../../models/CoreUser/Parent');
const cloudinary = require('../../config/cloudinary');
const bcrypt = require("bcryptjs");
const SubjectSchema = require('../../models/AcademicSchema/Subject');
const ResultSchema = require('../../models/Attendance_PerformanceSchema/Result');
const StudentAttendanceSchema = require('../../models/Attendance_PerformanceSchema/StudentAttendance');
const StudentMarksSchema = require('../../models/Attendance_PerformanceSchema/StudentMarks');
const ClassSchema = require('../../models/AcademicSchema/Class');
const { addStudentToParent, updateStudentParents } = require('../../utils/relationshipUtils');
const mongoose = require('mongoose');
const db = require('../../config/db');
const AWS = require('aws-sdk');

exports.createStudent = async (req, res) => {

  try {
    const {
      user_id,
      password,
      full_name,
      email,
      admission_number,
      date_of_birth,
      gender,
      address,
      parent_id,
      class_id,
      section,
      blood_group,
      medical_notes,
      profile_image,
      contact,
      status,
      student_type,
      previous_school_name,
      previous_school_address,
      previous_school_phone_number,
      previous_school_start_date,
      previous_school_end_date,
      documents,

    } = req.body;

    if (!user_id || !admission_number || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);

    const ClassModel = connection.model('Class', ClassSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const UserModel = connection.model('User', UserSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const ParentModel = connection.model('Parent', ParentSchema);
    if (!ClassModel || !TeacherModel || !UserModel || !StudentModel) {
      return res.status(400).json({ message: "Class or Teacher collection not found" });
    }


    const existingStudent = await StudentModel.findOne({
      $or: [
        { user_id },
        { admission_number }
      ]
    });
    
    if (existingStudent) {
      return res.status(400).json({ message: "Student ID or Admission Number already exists" });
    }

    const existingUser = await UserModel.findOne({ user_id });
    if (existingUser) {
      return res.status(400).json({ message: "User ID already exists in User collection" });
    }

    const newStudent = await UserModel.create({
      user_id,
      full_name,
      email,
      password,
      phone: contact,
      role: 'student',
      profileImage: profile_image,
      class_id,
      section,
      status: "Active",
    });

    const student = await StudentModel.create({
      user_id,
      password,
      role: 'student',
      full_name,
      email,
      admission_number,
      date_of_birth,
      gender,
      address,
      parent_id,
      class_id,
      section,
      blood_group,
      medical_notes,
      profile_image,
      contact,
      status,
      student_type,
      previous_school_name,
      previous_school_address,
      previous_school_phone_number,
      previous_school_start_date,
      previous_school_end_date,
      // documents: docs,
      documents,
      users: newStudent._id,
      status: "Active",
      admin_id: adminId
    });

    if (parent_id && parent_id.length > 0) {
      for (const parentId of parent_id) {
        await addStudentToParent(userId, parentId, student._id);
      }
    }

    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);

    const StudentModel = connection.model('Student', StudentSchema);
    const ParentModel = connection.model('Parent', ParentSchema);

    const students = await StudentModel.find({ admin_id: adminId })
      .populate('user_id', 'email role')
      .populate('parent_id', 'full_name user_id')
      .populate('class_id', 'name')
      .select('-password');

    res.json(students);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({
      message: 'Failed to fetch students',
      error: err.message
    });
  }
};

exports.getStudentsUnderMyAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can access this endpoint' });
    }

    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const ParentModel = connection.model('Parent', ParentSchema);

    // Find the teacher
    const teacher = await TeacherModel.findOne({ users: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }


    // Get all students under the same admin
    const students = await StudentModel.find({ admin_id: teacher.admin_id })
      .populate('parent_id', 'full_name user_id')
      .populate('class_id', 'name')
      .select('-password');

    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStudentsByClassTeacher = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can access this endpoint' });
    }

    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const StudentModel = connection.model('Student', StudentSchema);

    // Find the teacher
    const teacher = await TeacherModel.findOne({ users: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
  

    // Check if teacher is assigned as class teacher
    if (!teacher.class_teacher) {
      return res.status(404).json({ message: 'Teacher is not assigned as a class teacher' });
    }


    const classTeacherAssignment = teacher.class_teacher;

    // Split by the last hyphen to separate class name and section
    const lastHyphenIndex = classTeacherAssignment.lastIndexOf('-');

    const className = classTeacherAssignment.substring(0, lastHyphenIndex).trim();
    const section = classTeacherAssignment.substring(lastHyphenIndex + 1).trim();

    const candidates = new Set();
    candidates.add(className);
    if (className.toLowerCase().startsWith('grade ')) {
      candidates.add(className.substring(6));
    } else {
      candidates.add(`Grade ${className}`);
    }

    let students = await StudentModel.find({
      admin_id: teacher.admin_id,
      class_id: { $in: Array.from(candidates) },
      section: section
    })
      .populate('parent_id', 'full_name user_id')
      .select('-password');

    if (!students || students.length === 0) {
      students = await StudentModel.find({
        admin_id: teacher.admin_id,
        class_id: { $in: Array.from(candidates) },
        $or: [
          { section: section },
          { section: '' },
          { section: { $exists: false } }
        ]
      })
        .populate('parent_id', 'full_name user_id')
        .select('-password');
    }

    res.json(students);
  } catch (err) {
    console.error('Error in getStudentsByClassTeacher:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getStudentById = async (req, res) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }

    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const StudentModel = connection.model('Student', StudentSchema);

    const student = await StudentModel.findById(req.params.id)
      .populate('student_id', 'email role')
      .populate('parent_id', 'full_name user_id')
      .populate('class_id', 'name');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Find the class teacher for this student's class and section
    let classTeacherInfo = null;
    if (student.class_id && student.section) {
      // const Teacher = require('../../models/CoreUser/Teacher');
      const classTeacher = await TeacherModel.findOne({
        admin_id: student.admin_id,
        class_teacher: `${student.class_id}-${student.section}`
      });

      if (classTeacher) {
        classTeacherInfo = {
          user_id: classTeacher.user_id,
          full_name: classTeacher.full_name,
          display_name: `${classTeacher.full_name}(${classTeacher.user_id})`
        };
      }
    }

    // Add class teacher info to the response
    const responseData = {
      ...student.toObject(),
      classTeacher: classTeacherInfo
    };

    res.json(responseData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.updateStudent = async (req, res) => {
  try {
    // Validate the ID format first
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }

    // Get database connection
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);

    if (!connection) {
      return res.status(500).json({ message: 'Failed to establish database connection' });
    }

    // Initialize models
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const UserModel = connection.model('User', UserSchema);

    // Find the student
    const student = await StudentModel.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const updates = req.body;

    // Filter allowed fields
    const allowedFields = [
      'user_id', 'password', 'full_name', 'admission_number', 'email', 'date_of_birth', 'gender', 'address', 'parent_id', 'class_id', 'rollNumber', 'section', 'blood_group', 'medical_notes', 'profile_image', 'contact', 'status', 'student_type', 'previous_school_name', 'previous_school_address', 'previous_school_phone_number', 'previous_school_start_date', 'previous_school_end_date', 'documents'
    ];

    Object.keys(updates).forEach(key => {
      if (!allowedFields.includes(key)) delete updates[key];
    });

    if (updates.profile_image !== undefined) {
      console.log('it is found',updates.profile_image)
      if (student.profile_image) {
        const imageUrl = student.profile_image;

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
      updates.profile_image = req.body.profile_image;
    }

    // Handle documents update
    if (req.files && req.files['documents']) {
      updates.documents = req.files['documents'].map(file => ({
        url: file.path,
        name: file.originalname
      }));
    }

    // Update parent relationships if needed
    if (updates.parent_id) {
      await updateStudentParents(userId, student._id, updates.parent_id);
    }

    // Apply updates to student
    Object.assign(student, updates);
    const updated = await student.save();

    // Update corresponding user record if it exists
    if (student.users) {
      const user = await UserModel.findById(student.users);
      if (user) {
        const userFields = ['user_id', 'password', 'full_name', 'email', 'class_id', 'section', 'profileImage', 'phone', 'status'];
        userFields.forEach(field => {
          if (field === 'profileImage' && updates.profile_image) {
            user.profileImage = updates.profile_image;
          } else if (field === 'password' && updates.password) {
            user.password = updates.password;
          } else if (field === 'phone' && updates.contact) {
            user.phone = updates.contact;
          } else if (field === 'status' && updates.status) {
            user.is_active = updates.status === 'active';
          } else if (updates[field]) {
            user[field] = updates[field];
          }
        });
        await user.save();
      }
    }

    res.json(updated);
  } catch (err) {
    console.error('Error updating student:', err);
    res.status(400).json({ message: err.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }

    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const StudentAttendanceModel = connection.model('StudentAttendance', StudentAttendanceSchema);
    const UserModel = connection.model('User', UserSchema);

    const student = await StudentModel.findById(req.params.id);

    if (!student) return res.status(404).json({ message: 'Student not found' });


    if (student.parent_id && student.parent_id.length > 0) {
      const { removeStudentFromParent } = require('../../utils/relationshipUtils');
      for (const parentId of student.parent_id) {
        await removeStudentFromParent(userId, parentId, student._id);
      }
    }
    const imageUrl = student.profile_image;
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
    //student documents
    const docUrl = student.documents;
    let publicDocId = null;
    if (!docUrl) {
      publicDocId = null;
    } else {
      publicDocId = docUrl.split('/').pop().split('.')[0] || null;
    }

    if (publicDocId) {
      AWS.config.update({
        region: 'ap-south-1', // use your bucket's region
      });

      const s3 = new AWS.S3();
      const url = new URL(docUrl);
      const key = decodeURIComponent(url.pathname.substring(1));
      const s3Params = {
        Bucket: 'sims-school-files',
        Key: key
      };
      await s3.deleteObject(s3Params).promise();
    }

    if (student.users) {
      await UserModel.findByIdAndDelete(student.users);
    }

    await StudentAttendanceModel.deleteMany({ student_id: student._id });

    await student.deleteOne();
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getMyProfile = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can access this' });
    }

    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const StudentAttendanceModel = connection.model('StudentAttendance', StudentAttendanceSchema);
    const ParentModel = connection.model('Parent', ParentSchema);

    const student = await StudentModel.findOne({ user_id: req.user.user_id })
      .populate('parent_id', 'full_name user_id')
      .populate('class_id', 'name');

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Find the class teacher for this student's class and section
    let classTeacherInfo = null;
    if (student.class_id && student.section) {
      // const Teacher = require('../../models/CoreUser/Teacher');
      const classTeacher = await TeacherModel.findOne({
        admin_id: student.admin_id,
        class_teacher: `${student.class_id}-${student.section}`
      });

      if (classTeacher) {
        classTeacherInfo = {
          user_id: classTeacher.user_id,
          full_name: classTeacher.full_name,
          display_name: `${classTeacher.full_name}(${classTeacher.user_id})`
        };
      }
    }

    // Add class teacher info to the response
    const responseData = {
      ...student.toObject(),
      classTeacher: classTeacherInfo
    };

    res.json(responseData);
  } catch (err) {
    console.error('Error in getMyProfile:', err);
    res.status(500).json({ message: err.message });
  }
};


exports.getStudentCount = async (req, res) => {
  try {
    // let adminIdToFilter;

    // if (req.user.role === 'admin') {
    //   adminIdToFilter = req.user._id;
    // } else if (req.user.role === 'super_admin') {
    //   // Superadmin can see all students
    //   adminIdToFilter = null;
    // } else {
    //   return res.status(403).json({ message: 'Unauthorized user' });
    // }

    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const StudentAttendanceModel = connection.model('StudentAttendance', StudentAttendanceSchema);

    // const query = adminIdToFilter ? { admin_id: adminIdToFilter } : {};
    const count = await StudentModel.countDocuments({ admin_id: adminId });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getExamDataForStudent = async (req, res) => {
  try {
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const StudentModel = connection.model('Student', StudentSchema);
    const SubjectModel = connection.model('Subject', SubjectSchema);
    const ResultModel = connection.model('Result', ResultSchema);
    const { examType } = req.query; // Get exam type from query parameters
    const student = await StudentModel.findOne({ user_id: req.params.studentId });

    if (!student) {
      console.log('Student not found for user_id:', req.params.studentId);
      return res.status(404).json({ message: 'Student not found' });
    }

    let className = '';
    let section = '';
    if (student.class_id) {
      className = student.class_id;
      section = student.section || '';
    }

    const subjects = await SubjectModel.find({ className: className, section: section });

    const subjectsConfig = {};
    subjects.forEach(subj => {
      subjectsConfig[subj.name] = {
        maxMarks: subj.maxMarks,
        passingMarks: subj.passingMarks
      };
    });

    // Build query for results
    let query = { id: student.user_id };
    if (examType) {
      query.examType = examType;
    }

    const marksDocs = await ResultModel.find(query);


    // Get marks from the result document for the specific exam type
    let marks = {};
    let maxMarks = {};
    if (marksDocs.length > 0) {
      // If exam type is specified, use the first matching result
      // If no exam type specified, use the first available result
      marks = marksDocs[0].marks || {};
      maxMarks = marksDocs[0].maxMarks || {};
    }



    const response = {
      student: {
        id: student.user_id,
        rollNo: student.admission_number,
        name: student.full_name,
        class: className,
        section: section,
        marks: marks,
        maxMarks: maxMarks
      },
      subjectsConfig,
      examType: examType || 'All'
    };


    res.json(response);
  } catch (err) {
    console.error('Error in getExamDataForStudent:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getStudentByUserId = async (req, res) => {
  try {
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const StudentModel = connection.model('Student', StudentSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const ParentModel = connection.model('Parent', ParentSchema);

    const student = await StudentModel.findOne({ user_id: req.params.userId })
      .populate('parent_id', 'full_name user_id')
      .populate('class_id', 'name');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Find the class teacher for this student's class and section
    let classTeacherInfo = null;
    if (student.class_id && student.section) {
      // const Teacher = require('../../models/CoreUser/Teacher');
      const classTeacher = await TeacherModel.findOne({
        admin_id: student.admin_id,
        class_teacher: `${student.class_id}-${student.section}`
      });

      if (classTeacher) {
        classTeacherInfo = {
          user_id: classTeacher.user_id,
          full_name: classTeacher.full_name,
          display_name: `${classTeacher.full_name}(${classTeacher.user_id})`
        };
      }
    }

    // Add class teacher info to the response
    const responseData = {
      ...student.toObject(),
      classTeacher: classTeacherInfo
    };

    res.json(responseData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
