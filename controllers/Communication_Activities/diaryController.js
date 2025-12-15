const HomeworkDiarySchema = require('../../models/Communication_Activities/HomeworkDiary');
const PersonalDiarySchema = require('../../models/Communication_Activities/PersonalDiary');
const StudentSchema = require('../../models/CoreUser/Student');
const TeacherSchema = require('../../models/CoreUser/Teacher');
const ParentSchema = require('../../models/CoreUser/Parent');
const db = require('../../config/db');


exports.getHomework = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const HomeworkDiaryModel = connection.model('HomeworkDiary', HomeworkDiarySchema);
    
    const teacherId = (req.user && (req.user.user_id || req.user._id)) || req.query.teacherId || req.body.teacherId;
    if (!teacherId) {
      return res.status(400).json({ message: 'Teacher ID not found in user data' });
    }
    
    const entries = await HomeworkDiaryModel.find({ teacherId }).sort({ date: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getHomeworkByClassSection = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const HomeworkDiaryModel = connection.model('HomeworkDiary', HomeworkDiarySchema);
    const ParentModel = connection.model('Parent', ParentSchema);

    const { classId, section } = req.params;
    if (!classId || !section) {
      return res.status(400).json({ message: 'Class and section are required' });
    }
    
    const parent = await ParentModel.findOne({users:req.user._id});
    if(!parent){
      return res.status(404).json({ message: 'Parent not found' });
    }

    const entries = await HomeworkDiaryModel.find({
      classSelected: classId,
      sectionSelected: section,
      admin_id: adminId
    }).sort({ date: -1 });
  
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getHomeworkByClassSectionUnderMyAdmin = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const HomeworkDiaryModel = connection.model('HomeworkDiary', HomeworkDiarySchema);
    const StudentModel = connection.model('Student', StudentSchema);
    
    const student = await StudentModel.findOne({ users: req.user._id });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Now try the specific query
    const entries = await HomeworkDiaryModel.find({
      classSelected: student.class_id,
      sectionSelected: student.section,
      admin_id: adminId
    }).sort({ date: -1 });
    
    res.json(entries);
  } catch (err) {
    console.error('Error in getHomeworkByClassSectionUnderMyAdmin:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.createHomework = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const HomeworkDiaryModel = connection.model('HomeworkDiary', HomeworkDiarySchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    
    const teacherId = (req.user && (req.user.user_id || req.user._id)) || req.body.teacherId;
    const teacher = await TeacherModel.findOne({users: req.user._id});

    if (!teacherId) {
      return res.status(400).json({ message: 'Teacher ID not found in user data' });
    }
  
    const entry = await HomeworkDiaryModel.create({
      ...req.body,
      teacherId,
      teacherUserId: teacher._id,
      admin_id: adminId
    });
    res.status(201).json(entry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateHomework = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const HomeworkDiaryModel = connection.model('HomeworkDiary', HomeworkDiarySchema);
    
    const teacherId = (req.user && (req.user.user_id || req.user._id)) || req.body.teacherId;
    if (!teacherId) {
      return res.status(400).json({ message: 'Teacher ID not found in user data' });
    }
    
    
    const existingEntry = await HomeworkDiaryModel.findById(req.params.id);
    if (!existingEntry) {
      return res.status(404).json({ message: 'Homework entry not found' });
    }
    
    if (existingEntry.teacherId !== teacherId) {
      return res.status(403).json({ message: 'Access denied: You can only update your own homework entries' });
    }
    
    const updated = await HomeworkDiaryModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteHomework = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const HomeworkDiaryModel = connection.model('HomeworkDiary', HomeworkDiarySchema);
    
    const teacherId = (req.user && (req.user.user_id || req.user._id)) || req.body.teacherId;
    if (!teacherId) {
      return res.status(400).json({ message: 'Teacher ID not found in user data' });
    }
    
    
    const existingEntry = await HomeworkDiaryModel.findById(req.params.id);
    if (!existingEntry) {
      return res.status(404).json({ message: 'Homework entry not found' });
    }
    
    if (existingEntry.teacherId !== teacherId) {
      return res.status(403).json({ message: 'Access denied: You can only delete your own homework entries' });
    }
    
    const deleted = await HomeworkDiaryModel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getPersonal = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const PersonalDiaryModel = connection.model('PersonalDiary', PersonalDiarySchema);
    
    const teacherId = (req.user && (req.user.user_id || req.user._id)) || req.query.teacherId || req.body.teacherId;
    if (!teacherId) {
      return res.status(400).json({ message: 'Teacher ID not found in user data' });
    }
    
    const notes = await PersonalDiaryModel.find({ teacherId }).sort({ date: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createPersonal = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const PersonalDiaryModel = connection.model('PersonalDiary', PersonalDiarySchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    
    const teacherId = (req.user && (req.user.user_id || req.user._id)) || req.body.teacherId;
    const teacher = await TeacherModel.findOne({users: req.user._id});
    if (!teacherId) {
      return res.status(400).json({ message: 'Teacher ID not found in user data' });
    }
    
    const note = await PersonalDiaryModel.create({
      ...req.body,
      teacherId,
      teacherUserId: teacher._id,
      admin_id: teacher.admin_id
    });
    res.status(201).json(note);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updatePersonal = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const PersonalDiaryModel = connection.model('PersonalDiary', PersonalDiarySchema);
    
    const teacherId = (req.user && (req.user.user_id || req.user._id)) || req.body.teacherId;
    if (!teacherId) {
      return res.status(400).json({ message: 'Teacher ID not found in user data' });
    }
    
    
    const existingNote = await PersonalDiaryModel.findById(req.params.id);
    if (!existingNote) {
      return res.status(404).json({ message: 'Personal note not found' });
    }
    
    if (existingNote.teacherId !== teacherId) {
      return res.status(403).json({ message: 'Access denied: You can only update your own personal notes' });
    }
    
    const updated = await PersonalDiaryModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deletePersonal = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const PersonalDiaryModel = connection.model('PersonalDiary', PersonalDiarySchema);
    
    const teacherId = (req.user && (req.user.user_id || req.user._id)) || req.body.teacherId;
    if (!teacherId) {
      return res.status(400).json({ message: 'Teacher ID not found in user data' });
    }
    
    
    const existingNote = await PersonalDiaryModel.findById(req.params.id);
    if (!existingNote) {
      return res.status(404).json({ message: 'Personal note not found' });
    }
    
    if (existingNote.teacherId !== teacherId) {
      return res.status(403).json({ message: 'Access denied: You can only delete your own personal notes' });
    }
    
    await PersonalDiaryModel.findByIdAndDelete(req.params.id);

    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getHomeworkForParent = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const HomeworkDiaryModel = connection.model('HomeworkDiary', HomeworkDiarySchema);
    const ParentModel = connection.model('Parent', ParentSchema);
    
    const userId = req.user._id; 
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in user data' });
    }
    
    const parent = await ParentModel.findOne({ users: userId }).populate('children');
    
    if (!parent) {
      console.log('Parent not found for user ID:', userId);
      return res.status(404).json({ message: 'Parent profile not found' });
    }

    if (!parent.children || parent.children.length === 0) {
      return res.json({
        children: [],
        homeworkByChild: {}
      });
    }

    const entries = await HomeworkDiaryModel.find({}).sort({ date: -1 });

    
    const homeworkByChild = {};
    parent.children.forEach(child => {
      
      homeworkByChild[child._id] = entries.filter(entry => 
        entry.homeworkItems.some(item => {
          
          if (item.class_id && child.class_id) {
            return item.class_id.toString() === child.class_id.toString();
          }
          
          return item.subject && child.class_id?.name && 
                 item.subject.toLowerCase().includes(child.class_id.name.toLowerCase());
        })
      );
    });

    res.json({
      children: parent.children,
      homeworkByChild
    });
  } catch (err) {
    console.error('Error in getHomeworkForParent:', err);
    res.status(500).json({ message: err.message });
  }
};