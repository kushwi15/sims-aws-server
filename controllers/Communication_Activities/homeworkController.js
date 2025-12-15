const HomeworkAssignmentSchema = require('../../models/Communication_Activities/HomeworkAssignment');
const StudentSchema = require('../../models/CoreUser/Student');
const db = require('../../config/db');


exports.createHomework = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const HomeworkAssignmentModel = connection.model('HomeworkAssignment', HomeworkAssignmentSchema);
    const { subject_id, class_id, due_date, description } = req.body;

    const assignment = new HomeworkAssignmentModel({
      subject_id,
      class_id,
      teacher_id: req.user._id,
      due_date,
      description,
      attachment_url: req.file?.path || '',
    });

    await assignment.save();
    res.status(201).json(assignment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


exports.getAllHomework = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const HomeworkAssignmentModel = connection.model('HomeworkAssignment', HomeworkAssignmentSchema);
    const { class_id, subject_id } = req.query;

    const filter = {};
    if (class_id) filter.class_id = class_id;
    if (subject_id) filter.subject_id = subject_id;

    const homework = await HomeworkAssignmentModel.find(filter)
      .populate('teacher_id', 'full_name')
      .populate('class_id', 'name')
      .populate('subject_id', 'name');

    res.json(homework);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getHomeworkById = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const HomeworkAssignmentModel = connection.model('HomeworkAssignment', HomeworkAssignmentSchema);
    const assignment = await HomeworkAssignmentModel.findById(req.params.id)
      .populate('teacher_id', 'full_name')
      .populate('class_id', 'name')
      .populate('subject_id', 'name');

    if (!assignment) return res.status(404).json({ message: 'Not found' });
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.updateHomework = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const HomeworkAssignmentModel = connection.model('HomeworkAssignment', HomeworkAssignmentSchema);
    const assignment = await HomeworkAssignmentModel.findById(req.params.id);

    if (!assignment) return res.status(404).json({ message: 'Not found' });
    if (assignment.teacher_id.toString() !== req.user._id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not allowed' });

    const { due_date, description } = req.body;

    if (due_date) assignment.due_date = due_date;
    if (description) assignment.description = description;
    if (req.file) assignment.attachment_url = req.file.path;

    await assignment.save();
    res.json(assignment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


exports.deleteHomework = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const HomeworkAssignmentModel = connection.model('HomeworkAssignment', HomeworkAssignmentSchema);
    const assignment = await HomeworkAssignmentModel.findById(req.params.id);

    if (!assignment) return res.status(404).json({ message: 'Not found' });
    if (assignment.teacher_id.toString() !== req.user._id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not allowed' });

    await assignment.deleteOne();
    res.json({ message: 'Homework deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getHomeworkByStudent = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const HomeworkAssignmentModel = connection.model('HomeworkAssignment', HomeworkAssignmentSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const { studentId } = req.params;
    
    const student = await StudentModel.findOne({ user_id: studentId });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    
    const homework = await HomeworkAssignmentModel.find()
      .populate('teacher_id', 'full_name')
      .populate('class_id', 'name')
      .populate('subject_id', 'name')
      .sort({ due_date: -1 });

    
    const filteredHomework = homework.filter(assignment => {
      const assignmentClassName = assignment.class_id?.name || assignment.class_id;
      return assignmentClassName === student.class_id;
    });

    res.json(filteredHomework);
  } catch (err) {
    console.error('Error in getHomeworkByStudent:', err);
    res.status(500).json({ message: err.message });
  }
};
