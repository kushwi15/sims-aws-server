const StudentSchema = require('../../models/CoreUser/Student');
const ResultSchema = require('../../models/Attendance_PerformanceSchema/Result');
const ExamSchema = require('../../models/Attendance_PerformanceSchema/Exam');
const ClassSchema = require('../../models/AcademicSchema/Class');
const TeacherSchema = require('../../models/CoreUser/Teacher');
const AdminSchema = require('../../models/CoreUser/Admin');
const SubjectSchema = require('../../models/AcademicSchema/Subject');
const StudentMarksSchema = require('../../models/Attendance_PerformanceSchema/StudentMarks');
const GradeSchema = require('../../models/Attendance_PerformanceSchema/Grade');
const fs = require('fs');
const path = require('path');
const SUBJECTS_CONFIG_PATH = path.join(__dirname, '../../data/subjectsConfig.json');
const db = require('../../config/db');


// Load subjects configuration
let subjectsConfig = {};
try {
  const fileData = fs.readFileSync(SUBJECTS_CONFIG_PATH, 'utf-8');
  subjectsConfig = JSON.parse(fileData);
} catch (err) {
  console.error('Failed to load subjectsConfig from file:', err);
  // Default configuration if file doesn't exist
  subjectsConfig = {
    // 'Mathematics': { maxMarks: 100, passingMarks: 35 },
    // 'Science': { maxMarks: 100, passingMarks: 35 },
    // 'English': { maxMarks: 100, passingMarks: 35 },
    // 'History': { maxMarks: 100, passingMarks: 35 },
    // 'Geography': { maxMarks: 100, passingMarks: 35 }
  };
}

exports.getExamReportOverview = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const ExamModel = connection.model('Exam', ExamSchema);
    const ClassModel = connection.model('Class', ClassSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const AdminModel = connection.model('Admin', AdminSchema);
    const SubjectModel = connection.model('Subject', SubjectSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const StudentMarksModel = connection.model('StudentMarks', StudentMarksSchema);
    const GradeModel = connection.model('Grade', GradeSchema);
    
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    let admin_id;
    let teacher = null;

    // Check if user is a teacher
    if (req.user.role === 'teacher') {
      teacher = await TeacherModel.findOne({ users: req.user._id });
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher profile not found' });
      }
      admin_id = teacher.admin_id;
    }
    // Check if user is an admin
    else if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      const admin = await AdminModel.findOne({ users: req.user._id });
      if (!admin) {
        return res.status(404).json({ message: 'Admin profile not found' });
      }
      admin_id = admin._id;
    } else {
      return res.status(403).json({ message: 'Access denied: Only teachers and admins can access exam reports' });
    }

    const exams = await ExamModel.find({ admin_id });

    // Fetch students based on user role
    let students;
    if (req.user.role === 'teacher' && teacher.class_teacher) {
      // If teacher is a class teacher, only fetch students from their assigned class
      const classTeacherAssignment = teacher.class_teacher;

      // Parse the class_teacher field to get class and section
      // Expected format: "1st-A", "2nd-B", "3rd-C", etc.
      const lastHyphenIndex = classTeacherAssignment.lastIndexOf('-');
      if (lastHyphenIndex === -1) {
        return res.status(400).json({
          message: 'Invalid class teacher assignment format. Expected format: "className-section"'
        });
      }

      const className = classTeacherAssignment.substring(0, lastHyphenIndex);
      const section = classTeacherAssignment.substring(lastHyphenIndex + 1);

      // Find students in the assigned class and section
      students = await StudentModel.find({
        admin_id: teacher.admin_id,
        class_id: className,
        section: section
      });

    } else {
      // For admins or teachers without class assignment, fetch all students
      students = await StudentModel.find({ admin_id });
    }

    const grades = await StudentMarksModel.find({ admin_id }).populate('subject_id').populate({
      path: 'student_id',
      match: { admin_id: admin_id }
    });

    const classes = await ClassModel.find({ admin_id });

    const classIdToName = {};
    classes.forEach(cls => {
      classIdToName[cls._id?.toString() || cls.class_id] = cls.class_name || cls.grade;
    });

    const formattedStudents = students.map(stu => ({
      id: stu.user_id,
      name: stu.full_name,
      class: classIdToName[stu.class_id] || stu.class_id || '',
      section: stu.section || '',
      rollNo: stu.rollNo || stu.rollNumber || '',
      ...stu._doc
    }));

    // Create a map of exam_id to class_id from StudentMarks
    const examClassMap = {};
    grades.forEach(grade => {
      if (grade.exam_id && grade.class_id) {
        examClassMap[grade.exam_id.toString()] = grade.class_id.toString();
      }
    });

    const formattedExams = exams.map(exam => {
      const classId = examClassMap[exam._id.toString()];
      const className = classId ? classIdToName[classId] : '';

      return {
        examId: exam._id,
        examName: exam.exam_name,
        class: className,
        subject: '', // Will be populated from StudentMarks
        status: exam.status || 'Completed',
        maxMarks: exam.maxMarks || 100,
        ...exam._doc
      };
    });

    const formattedGrades = grades
      .filter(grade => grade.student_id) // Filter out grades where student is null
      .map(grade => ({
        studentId: grade.student_id?._id || grade.student_id,
        examId: grade.exam_id?._id || grade.exam_id,
        marks: grade.marks_obtained,
        maxMarks: grade.max_marks,
        subject: grade.subject_id?.name || grade.subject_id,
        classId: grade.class_id?._id || grade.class_id,
        admin_id: admin_id,
      }));

    res.json({
      exams: formattedExams,
      students: formattedStudents,
      grades: formattedGrades
    });
  } catch (err) {
    console.error('Error in getExamReportOverview:', err);
    res.status(500).json({ error: 'Failed to fetch exam report data.' });
  }
};

exports.getSubjectsConfig = (req, res) => {
  // Check if user is authenticated
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  // Check if user has appropriate role
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Access denied: Only admins and teachers can access subjects config' });
  }

  res.json(subjectsConfig);
};


exports.updateSubjectsConfig = (req, res) => {
  // Check if user is authenticated
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  // Check if user has admin role
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied: Only admins can update subjects config' });
  }

  const newConfig = req.body;
  if (!newConfig || typeof newConfig !== 'object') {
    return res.status(400).json({ error: 'Invalid config data' });
  }
  subjectsConfig = newConfig;

  try {
    fs.writeFileSync(SUBJECTS_CONFIG_PATH, JSON.stringify(subjectsConfig, null, 2), 'utf-8');
    res.json(subjectsConfig);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save config' });
  }
};

// Create a new result
exports.createResult = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const StudentModel = connection.model('Student', StudentSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const AdminModel = connection.model('Admin', AdminSchema);
    const ClassModel = connection.model('Class', ClassSchema);
    const ResultModel = connection.model('Result', ResultSchema);
    const ExamModel = connection.model('Exam', ExamSchema);
    const SubjectModel = connection.model('Subject', SubjectSchema);
    const StudentMarksModel = connection.model('StudentMarks', StudentMarksSchema);

    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    let admin_id;
    let teacher = null;

    // Check if user is a teacher
    if (req.user.role === 'teacher') {
      teacher = await TeacherModel.findOne({ users: req.user._id });
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher profile not found' });
      }
      admin_id = teacher.admin_id;
    }
    // Check if user is an admin
    else if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      const admin = await AdminModel.findOne({ users: req.user._id });
      if (!admin) {
        return res.status(404).json({ message: 'Admin profile not found' });
      }
      admin_id = admin._id;
    } else {
      return res.status(403).json({ message: 'Access denied: Only teachers and admins can create results' });
    }

    const { id, name, class: className, section, rollNo, marks, examType, subjectName: subjectNameInput } = req.body;
    

    // Derive and validate subjectName
    let derivedSubjectName = subjectNameInput;
    if (!derivedSubjectName && marks && typeof marks === 'object' && marks !== null) {
      const keys = Object.keys(marks);
      if (keys.length > 0) {
        derivedSubjectName = keys[0];
      }
    }
    if (!derivedSubjectName || typeof derivedSubjectName !== 'string' || !derivedSubjectName.trim()) {
      return res.status(400).json({ error: 'Missing required field: subjectName. Provide subjectName or a marks object keyed by subject.' });
    }
    derivedSubjectName = derivedSubjectName.trim();

    // Validate required fields
    if (!id || !name || !className || !section || !rollNo || !marks || !examType) {
      console.log('Missing required fields:', { id, name, className, section, rollNo, marks, examType });
      return res.status(400).json({ error: 'Missing required fields including exam type' });
    }

    // Format class name to ensure it's in the correct format
    let formattedClassName = className.toString();
    let classRecord = await ClassModel.findOne({ class_name: formattedClassName, admin_id });

    // If not found, try adding "Grade " prefix
    if (!classRecord) {
      formattedClassName = formattedClassName.startsWith('Grade ') ? formattedClassName : `Grade ${formattedClassName}`;
      classRecord = await ClassModel.findOne({ class_name: formattedClassName, admin_id });
    }

    // If still not found, try removing "Grade " prefix if it exists
    if (!classRecord && formattedClassName.startsWith('Grade ')) {
      formattedClassName = formattedClassName.replace('Grade ', '');
      classRecord = await ClassModel.findOne({ class_name: formattedClassName, admin_id });
    }
    
    if (!classRecord) {
      return res.status(404).json({ error: `Class "${formattedClassName}" not found. Please create the class first.` });
    }

    const student = await StudentModel.findOne({ user_id: id, admin_id });
    if (!student) {
      return res.status(404).json({ error: `Student with ID "${id}" not found. Please create the student first.` });
    }

    // Find or create exam
    let exam = await ExamModel.findOne({ exam_name: examType, admin_id: adminId });
    
    // if (!exam) {
    //   exam = new ExamModel({
    //     exam_name: examName,
    //     exam_id: `EXAM_${Date.now()}`,
    //     class: formattedClassName,
    //     subject: derivedSubjectName,
    //     status: 'Completed',
    //     maxMarks: 100,
    //     admin_id
    //   });
    //   await exam.save();
    // }

    // Find or create subject
    let subject = await SubjectModel.findOne({ name: derivedSubjectName, admin_id });
    // if (!subject) {
    //   subject = new SubjectModel({
    //     name: derivedSubjectName,
    //     className: formattedClassName,
    //     category: 'Academic',
    //     maxMarks: 100,
    //     passingMarks: 35,
    //     admin_id
    //   });
    //   await subject.save();
    // }

    // Create new result
    const result = new ResultModel({
      id,
      name,
      class: formattedClassName,
      section,
      rollNo,
      marks,
      maxMarks: exam.maxMarks,
      examType,
      teacher_id: teacher ? teacher._id : admin_id,
      admin_id
    });

    // Handle marks - if it's an object with multiple subjects, use the derived subject or first available
    let marksValue = marks;
    if (typeof marks === 'object' && marks !== null) {
      marksValue = marks[derivedSubjectName] ?? Object.values(marks)[0] ?? 0;
    }

    const studentMarks = new StudentMarksModel({
      exam_id: exam._id,
      class_id: classRecord._id,
      subject_id: subject._id,
      student_id: student._id,
      marks_obtained: marksValue,
      max_marks: 100,
      grade: 'A',
      remarks: 'Good',
      teacher_id: teacher ? teacher._id : admin_id,
      admin_id: admin_id
    });

    await studentMarks.save();
    await result.save();
    res.status(201).json({ result, studentMarks });
  } catch (err) {
    console.error('Error in createResult:', err);

    // Handle specific MongoDB errors
    if (err.code === 11000) {
      // Duplicate key error
      return res.status(400).json({ error: 'A result with this ID already exists for this exam type.' });
    }

    if (err.name === 'ValidationError') {
      // Mongoose validation error
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: `Validation error: ${validationErrors.join(', ')}` });
    }

    res.status(500).json({ error: 'Failed to create result.', details: err.message });
  }
};

// Update an existing result
exports.updateResult = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const AdminModel = connection.model('Admin', AdminSchema);
    const ClassModel = connection.model('Class', ClassSchema);
    const ResultModel = connection.model('Result', ResultSchema);

    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    let admin_id;
    let teacher = null;

    // Check if user is a teacher
    if (req.user.role === 'teacher') {
      teacher = await TeacherModel.findOne({ users: req.user._id });
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher profile not found' });
      }
      admin_id = teacher.admin_id;
    }
    // Check if user is an admin
    else if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      const admin = await AdminModel.findOne({ users: req.user._id });
      if (!admin) {
        return res.status(404).json({ message: 'Admin profile not found' });
      }
      admin_id = admin._id;
    } else {
      return res.status(403).json({ message: 'Access denied: Only teachers and admins can update results' });
    }

    const { id } = req.params;
    const { name, class: className, section, rollNo, marks, maxMarks, examType } = req.body;

    // Format class name to ensure it's in the correct format
    let formattedClassName = className.toString();
    let classRecord = await ClassModel.findOne({ class_name: formattedClassName, admin_id });

    // If not found, try adding "Grade " prefix
    if (!classRecord) {
      formattedClassName = formattedClassName.startsWith('Grade ') ? formattedClassName : `Grade ${formattedClassName}`;
      classRecord = await ClassModel.findOne({ class_name: formattedClassName, admin_id });
    }

    // If still not found, try removing "Grade " prefix if it exists
    if (!classRecord && formattedClassName.startsWith('Grade ')) {
      formattedClassName = formattedClassName.replace('Grade ', '');
      classRecord = await ClassModel.findOne({ class_name: formattedClassName, admin_id });
    }

    // Find and update the result
    const result = await ResultModel.findOneAndUpdate(
      { id, admin_id, examType },
      { name, class: formattedClassName, section, rollNo, marks, maxMarks, examType },
      { new: true, runValidators: true }
    );

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    res.json(result);
  } catch (err) {
    console.error('Error in updateResult:', err);
    res.status(500).json({ error: 'Failed to update result.' });
  }
};

exports.getAllResults = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const AdminModel = connection.model('Admin', AdminSchema);
    const ResultModel = connection.model('Result', ResultSchema);

    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    let admin_id;

    // Check if user is a teacher
    if (req.user.role === 'teacher') {
      const teacher = await TeacherModel.findOne({ users: req.user._id });
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher profile not found' });
      }
      admin_id = teacher.admin_id;
    }
    // Check if user is an admin
    else if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      const admin = await AdminModel.findOne({ users: req.user._id });
      if (!admin) {
        return res.status(404).json({ message: 'Admin profile not found' });
      }
      admin_id = admin._id;
    } else {
      return res.status(403).json({ message: 'Access denied: Only teachers and admins can access exam reports' });
    }

    const { class: classFilter, section, search, gradeCategory, examType } = req.query;
    let query = { admin_id };
    if (classFilter) query.class = classFilter;
    if (section) query.section = section;
    if (examType) query.examType = examType;

    let results = await ResultModel.find(query);

    results = results.map(student => {
      let totalMarksObtained = 0;
      let totalMaxMarks = 0;
      let subjectsAttempted = 0;
      Object.entries(student.marks).forEach(([subject, marks]) => {
        const subjectConf = subjectsConfig[subject];

        if (subjectConf) {
          totalMarksObtained += marks;
          totalMaxMarks += subjectConf.maxMarks;
          subjectsAttempted++;
        }
      });
      const overallPercentage = subjectsAttempted > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;

      let gradeCat = 'Poor';
      if (overallPercentage >= 85) gradeCat = 'Excellent';
      else if (overallPercentage >= 70) gradeCat = 'Good';
      else if (overallPercentage >= 50) gradeCat = 'Average';

      const processedStudent = {
        ...student._doc,
        totalMarksObtained,
        totalMaxMarks,
        overallPercentage: parseFloat(overallPercentage.toFixed(2)),
        gradeCategory: gradeCat
      };

      return processedStudent;
    });

    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(student =>
        student.name.toLowerCase().includes(searchLower) ||
        student.rollNo.toLowerCase().includes(searchLower) ||
        student.id.toLowerCase().includes(searchLower)
      );
    }

    if (gradeCategory) {
      results = results.filter(student => student.gradeCategory === gradeCategory);
    }

    res.json({
      success: true,
      results: results,
      subjectsConfig: subjectsConfig
    });
  } catch (err) {
    console.error('Error in getAllResults:', err);
    res.status(500).json({ error: 'Failed to fetch results.' });
  }
};

// Delete expired exam reports after academic year ends
exports.deleteExpiredExamReports = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const ResultModel = connection.model('Result', ResultSchema);
    const ExamModel = connection.model('Exam', ExamSchema);
    const AdminModel = connection.model('Admin', AdminSchema);

    // Check if user is authenticated and is admin
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied: Only admins can delete exam reports' });
    }

    const admin = await AdminModel.findOne({ users: req.user._id });
    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    const { academicEndYear } = req.query;

    if (!academicEndYear) {
      return res.status(400).json({ message: 'Academic end year is required' });
    }

    const academicEndDate = new Date(academicEndYear);
    const currentDate = new Date();

    // Check if current date is past the academic end year
    if (currentDate <= academicEndDate) {
      return res.status(400).json({
        message: 'Cannot delete exam reports before academic year ends'
      });
    }

    // Delete all exam reports up to the academic end year
    const resultDeleteResult = await ResultModel.deleteMany({
      createdAt: { $lte: academicEndDate },
      admin_id: admin._id
    });

    // Also delete related exam records
    const examDeleteResult = await ExamModel.deleteMany({
      createdAt: { $lte: academicEndDate },
      admin_id: admin._id
    });

    res.json({
      message: `${resultDeleteResult.deletedCount} expired exam reports and ${examDeleteResult.deletedCount} expired exam records deleted successfully`,
      deletedResults: resultDeleteResult.deletedCount,
      deletedExams: examDeleteResult.deletedCount
    });
  } catch (err) {
    console.error('Error deleting expired exam reports:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getAllResultsUnderMyAdmin = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const AdminModel = connection.model('Admin', AdminSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const ResultModel = connection.model('Result', ResultSchema);

    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    let admin_id;
    let teacher = null;

    // Check if user is a teacher
    if (req.user.role === 'teacher') {
      teacher = await TeacherModel.findOne({ users: req.user._id });
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher profile not found' });
      }
      admin_id = teacher.admin_id;
    }
    // Check if user is an admin
    else if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      const admin = await AdminModel.findOne({ users: req.user._id });
      if (!admin) {
        return res.status(404).json({ message: 'Admin profile not found' });
      }
      admin_id = admin._id;
    } else {
      return res.status(403).json({ message: 'Access denied: Only teachers and admins can access exam reports' });
    }

    const { class: classFilter, section, search, gradeCategory, examType } = req.query;
    let query = { admin_id };
    if (classFilter) query.class = classFilter;
    if (section) query.section = section;
    if (examType) query.examType = examType;

    let results;

    if (req.user.role === 'teacher' && teacher.class_teacher) {
      // If teacher is a class teacher, only fetch results from their assigned class students
      const classTeacherAssignment = teacher.class_teacher;

      // Parse the class_teacher field to get class and section
      const lastHyphenIndex = classTeacherAssignment.lastIndexOf('-');
      if (lastHyphenIndex === -1) {
        return res.status(400).json({
          message: 'Invalid class teacher assignment format. Expected format: "className-section"'
        });
      }

      const className = classTeacherAssignment.substring(0, lastHyphenIndex);
      const section = classTeacherAssignment.substring(lastHyphenIndex + 1);

      // Find students in the assigned class and section
      const assignedStudents = await StudentModel.find({
        admin_id: teacher.admin_id,
        class_id: className,
        section: section
      });

      const studentIds = assignedStudents.map(student => student.user_id);

      // Filter results to only include students from the assigned class
      results = await ResultModel.find({
        admin_id: teacher.admin_id,
        id: { $in: studentIds }
      });
    } else {
      // For admins or teachers without class assignment, fetch all results
      results = await ResultModel.find(query);
    }

    results = results.map(student => {
      let totalMarksObtained = 0;
      let totalMaxMarks = 0;
      let subjectsAttempted = 0;
      Object.entries(student.marks).forEach(([subject, marks]) => {
        const subjectConf = subjectsConfig[subject];
        if (subjectConf) {
          totalMarksObtained += marks;
          totalMaxMarks += subjectConf.maxMarks;
          subjectsAttempted++;
        }
      });
      const overallPercentage = subjectsAttempted > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;

      let gradeCat = 'Poor';
      if (overallPercentage >= 85) gradeCat = 'Excellent';
      else if (overallPercentage >= 70) gradeCat = 'Good';
      else if (overallPercentage >= 50) gradeCat = 'Average';

      const processedStudent = {
        ...student._doc,
        totalMarksObtained,
        totalMaxMarks,
        overallPercentage: parseFloat(overallPercentage.toFixed(2)),
        gradeCategory: gradeCat
      };
      return processedStudent;
    });

    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(student =>
        student.name.toLowerCase().includes(searchLower) ||
        student.rollNo.toLowerCase().includes(searchLower) ||
        student.id.toLowerCase().includes(searchLower)
      );
    }

    if (gradeCategory) {
      results = results.filter(student => student.gradeCategory === gradeCategory);
    }

    res.json({
      success: true,
      results: results,
      subjectsConfig: subjectsConfig
    });
  } catch (err) {
    console.error('Error in getAllResults:', err);
    res.status(500).json({ error: 'Failed to fetch results.' });
  }
};
