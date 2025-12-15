const SubjectSchema = require('../../models/AcademicSchema/Subject');
const TeacherSchema = require('../../models/CoreUser/Teacher');
const mongoose = require('mongoose');
const db = require('../../config/db');

exports.createSubject = async (req, res) => {
  try {
    const { name, className, section, teachers, maxMarks, passingMarks, category } = req.body;
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const SubjectModel = connection.model('Subject', SubjectSchema);

    // Validation
    // if (!name || !className || !teachers || teachers.length === 0) {
    //   return res.status(400).json({ message: 'Subject name, class name, and at least one teacher are required' });
    // }
    let validTeachers = [];
    if (teachers) {
      const teacherEmpId = teachers.map(t => t.empId);
      const teacherInfo = await TeacherModel.find({ admin_id: adminId, user_id: teacherEmpId });

      validTeachers = teachers.map(teacher => ({
        name: teacher.name,
        empId: teacher.empId,
        teacher_id: teacherInfo.find(t => t.user_id === teacher.empId).users
      }));

      if (validTeachers.length === 0) {
        return res.status(400).json({ message: 'At least one valid teacher (with name and employee ID) is required' });
      }
    }

    const subjectData = {
      name: name.trim(),
      className: className.trim(),
      section: section.trim(),
      teachers: validTeachers,
      maxMarks: maxMarks || 100,
      passingMarks: passingMarks || 35,
      category: category || '',
      admin_id: adminId,
    };

    const subject = new SubjectModel(subjectData);
    await subject.save();
    res.status(201).json(subject);
  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.getAllSubjects = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const SubjectModel = connection.model('Subject', SubjectSchema);
    const subjects = await SubjectModel.find({ admin_id: adminId }).sort({ createdAt: -1 });
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getAllSubjectsUnderMyAdmin = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const SubjectModel = connection.model('Subject', SubjectSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const teacher = await TeacherModel.findOne({ users: userId });
    const teacherdddd = teacher.class_teacher.split('-');
    const teacherClassName = teacherdddd[0];
    const teacherSection = teacherdddd[1];


    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    let subjects;
    let exactMatchSubjects = await SubjectModel.find({
      className: teacherClassName,
      section: teacherSection,
      admin_id: teacher.admin_id,
    });

    subjects = exactMatchSubjects;

    res.json(subjects);
  } catch (error) {
    console.error('Error in getAllSubjectsUnderMyAdmin:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getSubjectById = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const SubjectModel = connection.model('Subject', SubjectSchema);

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Invalid ObjectId format:', req.params.id);
      return res.status(400).json({ message: 'Invalid subject ID format' });
    }

    const subject = await SubjectModel.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json(subject);
  } catch (error) {
    console.error('Error fetching subject by ID:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const SubjectModel = connection.model('Subject', SubjectSchema);

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Invalid ObjectId format:', req.params.id);
      return res.status(400).json({ message: 'Invalid subject ID format' });
    }

    const { name, className, section, teachers, maxMarks, passingMarks, category } = req.body;

    // Validation
    if (!name || !className || !teachers || teachers.length === 0) {
      return res.status(400).json({ message: 'Subject name, class name, and at least one teacher are required' });
    }

    // Validate teachers array
    const validTeachers = teachers.filter(teacher => teacher.name && teacher.empId);
    if (validTeachers.length === 0) {
      return res.status(400).json({ message: 'At least one valid teacher (with name and employee ID) is required' });
    }

    const updateData = {
      name: name.trim(),
      className: className.trim(),
      section: section.trim(),
      teachers: validTeachers,
      maxMarks: maxMarks || 100,
      passingMarks: passingMarks || 35,
      category: category || ''
    };

    const subject = await SubjectModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json(subject);
  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(400).json({ message: error.message });
  }
};
exports.updateSubjectByTeacher = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const SubjectModel = connection.model('Subject', SubjectSchema);

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Invalid ObjectId format:', req.params.id);
      return res.status(400).json({ message: 'Invalid subject ID format' });
    }

    const { maxMarks } = req.body;

    const updateData = {
      maxMarks: maxMarks || 100,
    };

    const subject = await SubjectModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json(subject);
  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const SubjectModel = connection.model('Subject', SubjectSchema);

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Invalid ObjectId format:', req.params.id);
      return res.status(400).json({ message: 'Invalid subject ID format' });
    }

    const deleted = await SubjectModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Subject not found' });
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ message: error.message });
  }
};
