const ExamSchema = require('../../models/Attendance_PerformanceSchema/Exam');
const TeacherSchema = require('../../models/CoreUser/Teacher');
const ResultSchema = require('../../models/Attendance_PerformanceSchema/Result');
const db = require('../../config/db');

exports.createExam = async (req, res) => {
  try {
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const ExamModel = connection.model('Exam', ExamSchema);

    const {examType, maxMarks } = req.body;
    let exam = await ExamModel.findOne({ exam_name: examType, admin_id: adminId });
    if(exam){
      return res.status(400).json({ message: 'Exam already exists' });
    }else{
      exam = new ExamModel({
        exam_name: examType,
        exam_id: `EXAM_${Date.now()}`,
        admin_id: adminId,
        maxMarks,
      });
      await exam.save();
      return res.status(201).json(exam);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


exports.getAllExams = async (req, res) => {
  try {
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const ExamModel = connection.model('Exam', ExamSchema);
    const exams = await ExamModel.find({ admin_id: adminId }).sort({ start_date: 1 });
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getExamByExamType = async (req, res) => {
  try {
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const ExamModel = connection.model('Exam', ExamSchema);
    const exams = await ExamModel.find({ exam_name: req.params.examType, admin_id: adminId });
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


exports.getExamById = async (req, res) => {
  try {
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const ExamModel = connection.model('Exam', ExamSchema);

    const exam = await ExamModel.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.updateExam = async (req, res) => {
  try {
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const ExamModel = connection.model('Exam', ExamSchema);
    const exam = await ExamModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json(exam);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateMaxMarks = async (req, res) => {
  
  try {
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const ExamModel = connection.model('Exam', ExamSchema);
    const ResultModel = connection.model('Result', ResultSchema);
    
    const exam = await ExamModel.findOneAndUpdate({ exam_name: req.params.examType, admin_id: adminId }, req.body, { new: true });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const results = await ResultModel.find({ examType: req.params.examType });
    if(!results){
      return res.status(404).json({ message: 'No results found for this exam type' });
    }
    for(let result of results){
      result.maxMarks = req.body.maxMarks;
      await result.save();
    }

    res.json(exam);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}


exports.deleteExam = async (req, res) => {
  try {
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const ExamModel = connection.model('Exam', ExamSchema);
    const deleted = await ExamModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Exam not found' });
    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
