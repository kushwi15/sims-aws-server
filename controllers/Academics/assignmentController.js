const AssignmentSchema = require('../../models/AcademicSchema/Assignment');
const mongoose = require('mongoose');
const TeacherSchema = require('../../models/CoreUser/Teacher');
const StudentSchema = require('../../models/CoreUser/Student');
const ClassSchema = require('../../models/AcademicSchema/Class');
const AdminSchema = require('../../models/CoreUser/Admin');
const AssignmentSubmissionSchema = require('../../models/AcademicSchema/AssignmentSubmission');
const db = require('../../config/db');
const AWS = require('aws-sdk');

exports.createAssignment = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const AdminModel = connection.model('Admin', AdminSchema);
    const ClassModel = connection.model('Class', ClassSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const AssignmentModel = connection.model('Assignment', AssignmentSchema);

    if (!adminId) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const classId = await ClassModel.find({ admin_id: userId, class_name: req.body.class, section: req.body.section });

    if (!classId) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const studentCount = await StudentModel.countDocuments({ admin_id: adminId, class_id: req.body.class, section: req.body.section });
    if (studentCount === 0) {
      return res.status(404).json({ message: 'No students found in this class and section' });
    }

    const newAssignment = new AssignmentModel({
      class: req.body.class,
      subject: req.body.subject,
      title: req.body.title,
      description: req.body.description,
      dueDate: req.body.dueDate,
      section: req.body.section,
      student_count: studentCount,
      file: req.body.file,
      admin_id: adminId
    });
    const savedAssignment = await newAssignment.save();
    res.status(201).json(savedAssignment);
  } catch (error) {
    console.error("Error creating assignment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.createAssignmentUnderMyAdmin = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const AssignmentModel = connection.model('Assignment', AssignmentSchema);
    const ClassModel = connection.model('Class', ClassSchema);

    const teacher = await TeacherModel.findOne({ users: userId });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Validate required fields
    if (!req.body.subject) {
      return res.status(400).json({ message: 'Subject is required' });
    }

    const targetClass = await ClassModel.find({ admin_id: adminId, class_name: req.body.class, section: req.body.section });

    if (!targetClass) {
      return res.status(404).json({ message: 'Class not found' });
    }
    const studentCount = await StudentModel.countDocuments({ admin_id: adminId, class_id: req.body.class, section: req.body.section });
    if (studentCount === 0) {
      return res.status(404).json({ message: 'No students found in this class and section' });
    }


    req.body.admin_id = teacher.admin_id;
    req.body.teacher_id = teacher._id; // Set the teacher_id to the current teacher
    req.body.student_count = studentCount;

    const newAssignment = new AssignmentModel(req.body);
    const savedAssignment = await newAssignment.save();

    // Populate the saved assignment to return complete data
    const populatedAssignment = await AssignmentModel.findById(savedAssignment._id);

    res.status(201).json(populatedAssignment);
  } catch (error) {
    console.error("Error creating assignment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.getAllAssignments = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const AssignmentModel = connection.model('Assignment', AssignmentSchema);
    const ClassModel = connection.model('Class', ClassSchema);

    let filter = {};
    // If user is a student, filter by class and section without admin_id restriction
    if (req.user.role === 'student') {
      // Use the user's class_id and section from their profile
      const userClassId = req.user.class_id;
      const userSection = req.user.section;

      if (userClassId) {
        // Handle both class ID and class name
        // First try to find by ObjectId (if it's a valid ObjectId)
        if (mongoose.Types.ObjectId.isValid(userClassId)) {
          filter.class = userClassId;
        } else {
          // If not a valid ObjectId, try to find by class_name
          const classDoc = await ClassModel.findOne({ class_name: userClassId });
          if (classDoc) {
            filter.class = classDoc._id;
          } else {
            console.log('Class not found for:', userClassId);
          }
        }
      }

      if (userSection) {
        filter.section = userSection;
      }

      // Also check query parameters if provided (for backward compatibility)
      if (req.query.class && !userClassId) {

        if (mongoose.Types.ObjectId.isValid(req.query.class)) {
          filter.class = req.query.class;
        } else {
          const classDoc = await ClassModel.findOne({ class_name: req.query.class });
          if (classDoc) {
            filter.class = classDoc._id;
          }
        }
      }
      if (req.query.section && !userSection) {
        filter.section = req.query.section;
      }
    } else {
      // For teachers and admins, filter by admin_id
      filter.admin_id = adminId;
      if (req.query.class) filter.class = req.query.class;
      if (req.query.section) filter.section = req.query.section;
    }

    const assignments = await AssignmentModel.find(filter);

    res.status(200).json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.getAllAssignmentsUnderMyAdmin = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const AssignmentModel = connection.model('Assignment', AssignmentSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const ClassModel = connection.model('Class', ClassSchema);

    const teacher = await TeacherModel.findOne({ users: userId });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Get teacher's assigned classes and class teacher role
    const assignedClasses = teacher.assigned_classes || [];
    const classTeacher = teacher.class_teacher;

    // Build filter based on teacher's assigned classes
    let filter = { admin_id: teacher.admin_id };

    // If teacher has assigned classes, filter by those classes
    if (assignedClasses.length > 0 || classTeacher) {
      const classFilter = [];

      // Add assigned classes
      if (assignedClasses.length > 0) {
        classFilter.push(...assignedClasses);
      }

      // Add class teacher class if different from assigned classes
      if (classTeacher && !assignedClasses.includes(classTeacher)) {
        classFilter.push(classTeacher);
      }

      // Find class documents to get ObjectIds
      const classDocs = await ClassModel.find({
        class_name: { $in: classFilter },
        admin_id: teacher.admin_id
      });

      const classIds = classDocs.map(cls => cls._id);

      if (classIds.length > 0) {
        filter.class = { $in: classIds };
      }
    }

    const assignments = await AssignmentModel.find(filter);

    res.status(200).json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.getAllAssignmentsUnderStudent = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const AssignmentModel = connection.model('Assignment', AssignmentSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const ClassModel = connection.model('Class', ClassSchema);

    const student = await StudentModel.findOne({ users: userId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const assignments = await AssignmentModel.find({ class: student.class_id, section: student.section, admin_id: adminId })
      .populate("class", "class_name")
      .populate("subject", "name");

    res.status(200).json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAssignmentById = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const AssignmentModel = connection.model('Assignment', AssignmentSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const ClassModel = connection.model('Class', ClassSchema);


    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid assignment ID format' });
    }

    const assignment = await AssignmentModel.findById(req.params.id)
      .populate("class", "class_name")
      .populate("subject", "name");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    res.status(200).json(assignment);
  } catch (error) {
    console.error("Error fetching assignment by ID:", error);

    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid assignment ID" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.updateAssignment = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const AssignmentModel = connection.model('Assignment', AssignmentSchema);
    const ClassModel = connection.model('Class', ClassSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid assignment ID format' });
    }

    if (!adminId) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const classId = await ClassModel.find({ admin_id: adminId, class_name: req.body.class, section: req.body.section });
    // Check if user is a teacher and verify permissions
    if (req.user.role === 'teacher') {
      const teacher = await TeacherModel.findOne({ users: userId });
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }

      // Get the assignment to check permissions
      const assignment = await AssignmentModel.findById(req.params.id);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      // Check if teacher owns this assignment or has permission for the class
      const assignedClasses = teacher.assigned_classes || [];
      const classTeacher = teacher.class_teacher;

      classId = await ClassModel.find({ admin_id: adminId, class_name: req.body.class, section: req.body.section });

      if (!classId) {
        return res.status(404).json({ message: 'Class not found' });
      }

      const hasPermission = assignment.teacher_id?.toString() === teacher._id.toString() ||
        assignedClasses.includes(classId[0].class_name) ||
        (classTeacher && classTeacher === classId[0].class_name);

      if (!hasPermission) {
        return res.status(403).json({
          message: 'You can only update assignments for classes you are assigned to'
        });
      }
    }

    const updatedAssignment = await AssignmentModel.findByIdAndUpdate(
      req.params.id,

      {
        class: classId[0].class_name,
        subject: req.body.subject,
        title: req.body.title,
        description: req.body.description,
        dueDate: req.body.dueDate,
        section: req.body.section,
        file: req.body.file,
      },
      { new: true, runValidators: true }
    );

    if (!updatedAssignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.status(200).json(updatedAssignment);
  } catch (error) {
    console.error("Error updating assignment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateAssignmentUnderMyAdmin = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const AssignmentModel = connection.model('Assignment', AssignmentSchema);
    const ClassModel = connection.model('Class', ClassSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid assignment ID format' });
    }

    const teacher = await TeacherModel.findOne({ users: userId });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Get the assignment to check permissions
    const assignment = await AssignmentModel.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Check if teacher owns this assignment or has permission for the class
    const assignedClasses = teacher.assigned_classes || [];
    const classTeacher = teacher.class_teacher;

    const classId = await ClassModel.find({ admin_id: adminId, class_name: req.body.class, section: req.body.section });

    if (!classId) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const hasPermission = assignment.teacher_id?.toString() === teacher._id.toString() ||
      assignedClasses.includes(classId[0].class_name) ||
      (classTeacher && classTeacher === classId[0].class_name);

    if (!hasPermission) {
      return res.status(403).json({
        message: 'You can only update assignments for classes you are assigned to'
      });
    }

    const updatedAssignment = await AssignmentModel.findByIdAndUpdate(
      req.params.id,

      {
        class: classId[0].class_name,
        subject: req.body.subject,
        title: req.body.title,
        description: req.body.description,
        dueDate: req.body.dueDate,
        section: req.body.section,
        file: req.body.file,
      },
      { new: true, runValidators: true }
    );

    if (!updatedAssignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.status(200).json(updatedAssignment);
  } catch (error) {
    console.error("Error updating assignment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.deleteAssignment = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const AssignmentModel = connection.model('Assignment', AssignmentSchema);
    const AssignmentSubmissionModel = connection.model('AssignmentSubmission', AssignmentSubmissionSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid assignment ID format' });
    }

    const assignment = await AssignmentModel.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Check if user is a teacher and verify permissions
    if (req.user.role === 'teacher') {
      const teacher = await TeacherModel.findOne({ users: userId });
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }

      // Get the assignment to check permissions
      const assignment = await AssignmentModel.findById(req.params.id);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

    }
    const submissions = await AssignmentSubmissionModel.find({
      assignment_id: assignment._id
    });
    // Delete assignment submitted files from S3
    for (const file of submissions) {
      for (const f of file.files) {
        AWS.config.update({
          region: 'eu-north-1', // use your bucket's region
        });

        const s3 = new AWS.S3();
        const url = new URL(f);
        const key = decodeURIComponent(url.pathname.substring(1));
        const s3Params = {
          Bucket: 'sims-school',
          Key: key
        };
        await s3.deleteObject(s3Params).promise();
      }
    }
    // deleting assignment submissions
    await AssignmentSubmissionModel.deleteMany({ assignment_id: assignment._id });

    const deletedAssignment = await AssignmentModel.findByIdAndDelete(req.params.id);

    if (!deletedAssignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.status(200).json({ message: "Assignment deleted successfully" });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

