const ClassSchema = require('../../models/AcademicSchema/Class');
const TeacherSchema = require('../../models/CoreUser/Teacher');
const AdminSchema = require('../../models/CoreUser/Admin');
const mongoose = require('mongoose');
const db = require('../../config/db');

const getClass_DB_Details = async (req) => {
  try {
    // Get the specific database connection for this user
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);

    // Initialize models for the specific database
    const AdminModel = connection.model('Admin', AdminSchema);
    const ClassModel = connection.model('Class', ClassSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);

    return { AdminModel, ClassModel, TeacherModel, adminId, connection };
  } catch (error) {
    throw new Error(`Failed to get database details: ${error.message}`);
  }
}

exports.createClass = async (req, res) => {
  try {

    if (!req.body.class_name) {
      return res.status(400).json({
        message: 'Class name is required'
      });
    }

    // Get the specific database connection for this user
    const { connection,adminId } = await db.getUserSpecificConnection(req.user._id);

    // Initialize models for the specific database
    const ClassModel = connection.model('Class', ClassSchema);

    // Check if class with same name and section already exists
    const existingClass = await ClassModel.findOne({
      class_name: req.body.class_name,
      section: req.body.section,
      admin_id: adminId
    });

    if (existingClass) {
      return res.status(400).json({
        message: 'Class with this name and section already exists'
      });
    }

    // Format teachers details
    const formattedTeachersDetails = req.body.teachers_details?.map(teacher => ({
      ...teacher,
      subjects: Array.isArray(teacher.subjects) ?
        teacher.subjects :
        (teacher.subjects?.split(',').map(s => s.trim()).filter(Boolean) || [])
    })) || [];

    // Create the new class
    const newClass = await ClassModel.create({
      class_name: req.body.class_name,
      strength: req.body.strength,
      section: req.body.section,
      supervisor: req.body.supervisor,
      teachers_details: formattedTeachersDetails,
      admin_id: adminId,
    });

    res.status(201).json(newClass);

  } catch (error) {
    console.error('Error creating class:', error.message);
    res.status(400).json({ message: error.message });
  }
};


exports.getAllClasses = async (req, res) => {
  try {

    const filter = {};
    if (req.query.grade) filter.grade = req.query.grade;
    if (req.query.search) {
      filter.$or = [
        { class_name: { $regex: req.query.search, $options: 'i' } },
        { supervisor: { $regex: req.query.search, $options: 'i' } },
        { 'teachers_details.name': { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const { ClassModel, adminId } = await getClass_DB_Details(req);

    // Add admin_id filter to only get classes for this admin
    filter.admin_id = adminId;

    const classes = await ClassModel.find(filter);
    res.json(classes);

  } catch (error) {
    console.error('Error fetching classes:', error.message);
    res.status(500).json({ message: error.message });
  }
};
exports.getAllClassesUnderMyAdmin = async (req, res) => {
  try {
    const { TeacherModel, ClassModel } = await getTeacher_DB_Details(req);

    const teacher = await TeacherModel.findOne({ users: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Get teacher's assigned classes and class teacher role
    const assignedClasses = teacher.assigned_classes || [];
    const classTeacher = teacher.class_teacher;

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

      const classes = await ClassModel.find({
        admin_id: teacher.admin_id,
        // class_name: { $in: classFilter } // Commented out to allow all classes under admin
      });
      res.json(classes);
    } else {
      // If no assigned classes, return all classes under the teacher's admin
      // This allows teachers to create assignments for any class under their admin
      const classes = await ClassModel.find({ admin_id: teacher.admin_id });
      res.json(classes);
    }
  } catch (error) {
    console.error('Error fetching classes under admin:', error.message);
    res.status(500).json({ message: error.message });
  }
};
exports.getClassById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid class ID format' });
    }

    const { ClassModel } = await getClass_DB_Details(req);

    const classObj = await ClassModel.findById(req.params.id);
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json(classObj);
  } catch (error) {
    console.error('Error fetching class by ID:', error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.updateClass = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid class ID format' });
    }

    const { ClassModel } = await getClass_DB_Details(req);

    const formattedTeachersDetails = req.body.teachers_details?.map(teacher => ({
      ...teacher,
      subjects: Array.isArray(teacher.subjects) ?
        teacher.subjects :
        (teacher.subjects?.split(',').map(s => s.trim()).filter(Boolean) || [])
    })) || [];

    const updated = await ClassModel.findByIdAndUpdate(
      req.params.id,
      {
        class_name: req.body.class_name,
        strength: req.body.strength,
        section: req.body.section,
        supervisor: req.body.supervisor,
        teachers_details: formattedTeachersDetails
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating class:', error.message);
    res.status(400).json({ message: error.message });
  }
};

exports.deleteClass = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid class ID format' });
    }

    const { ClassModel } = await getClass_DB_Details(req);
    const deleted = await ClassModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.getClassesByGrade = async (req, res) => {
  try {
    const { ClassModel } = await getClass_DB_Details(req);
    const classes = await ClassModel.find({ grade: req.params.grade })
      .sort({ class_name: 1 });
    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes by grade:', error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.getClassesBySubject = async (req, res) => {
  try {
    const { ClassModel } = await getClass_DB_Details(req);
    const subject = req.params.subject.toLowerCase();
    const classes = await ClassModel.find({
      'teachers_details.subjects': {
        $elemMatch: { $regex: subject, $options: 'i' }
      }
    });
    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes by subject:', error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.getClassNames = async (req, res) => {
  try {
    const { ClassModel } = await getClass_DB_Details(req);
    const classes = await ClassModel.find({}, { class_name: 1 }).sort({ class_name: 1 });

    const result = classes.map(cls => ({ value: cls._id, label: cls.class_name }));
    res.json(result);
  } catch (error) {
    console.error('Error fetching class names:', error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.getPredefinedSections = async (req, res) => {
  try {
    const { grade } = req.query;

    // Define predefined sections for different grades
    const predefinedSections = {
      'Nursery': ['Morning Batch', 'Afternoon Batch'],
      'LKG': ['Morning Batch', 'Afternoon Batch'],
      'UKG': ['Morning Batch', 'Afternoon Batch'],
      'Class 1': ['A', 'B', 'C', 'D', 'E', 'F'],
      'Class 2': ['A', 'B', 'C', 'D', 'E', 'F'],
      'Class 3': ['A', 'B', 'C', 'D', 'E', 'F'],
      'Class 4': ['A', 'B', 'C', 'D', 'E', 'F'],
      'Class 5': ['A', 'B', 'C', 'D', 'E', 'F'],
      'Class 6': ['A', 'B', 'C', 'D', 'E', 'F'],
      'Class 7': ['A', 'B', 'C', 'D', 'E', 'F'],
      'Class 8': ['A', 'B', 'C', 'D', 'E', 'F'],
      'Class 9': ['A', 'B', 'C', 'D', 'E', 'F'],
      'Class 10': ['A', 'B', 'C', 'D', 'E', 'F']
    };

    if (grade && predefinedSections[grade]) {
      res.json(predefinedSections[grade]);
    } else {
      // Return all sections if no specific grade is requested
      res.json(predefinedSections);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTeacher_DB_Details = async (req) => {
  try {
    // Get the specific database connection for this user
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);

    // Initialize models for the specific database
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const ClassModel = connection.model('Class', ClassSchema);

    return { TeacherModel, ClassModel, adminId, connection };
  } catch (error) {
    throw new Error(`Failed to get teacher database details: ${error.message}`);
  }
};

exports.getSectionsForTeacherClasses = async (req, res) => {
  try {
    const { TeacherModel, ClassModel } = await getTeacher_DB_Details(req);
    const teacher = await TeacherModel.findOne({ users: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Get teacher's assigned classes and class teacher role
    const assignedClasses = teacher.assigned_classes || [];
    const classTeacher = teacher.class_teacher;

    // If teacher has assigned classes, get sections for those classes
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

      // Get classes and extract unique sections
      const classes = await ClassModel.find({
        admin_id: teacher.admin_id,
        class_name: { $in: classFilter }
      });

      // Extract unique sections from the classes
      const sections = [...new Set(classes.map(cls => cls.section))].sort();

      res.json(sections);
    } else {
      // If no assigned classes, return empty array
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching teacher sections:', error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.getAllClassesForDropdown = async (req, res) => {
  try {
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const ClassModel = connection.model('Class', ClassSchema);
    const classes = await ClassModel.find({}, 'class_name');

    res.json(classes);
  } catch (error) {
    console.log('error ', error);
    res.status(500).json({ message: error.message });
  }
};