const EventSchema = require('../../models/Communication_Activities/Event');
const StudentSchema = require('../../models/CoreUser/Student');
const ParentSchema = require('../../models/CoreUser/Parent');
const TeacherSchema = require('../../models/CoreUser/Teacher');
const UserSchema = require('../../models/CoreUser/User');
const db = require('../../config/db');

exports.createEvent = async (req, res) => {

  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const EventModel = connection.model('Event', EventSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const ParentModel = connection.model('Parent', ParentSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const UserModel = connection.model('User', UserSchema);
    const {title,eventName,description,startDate,endDate,eventType,targetAudience,status} = req.body;
    let recipientIds = [];

    if (targetAudience && Array.isArray(targetAudience)) {
      // Handle array of target values
      for (const targetValue of targetAudience) {
        switch (targetValue) {
          case 'all_students':
            const students = await StudentModel.find({ admin_id: adminId })
              .populate('users', '_id');
            const studentIds = students.map(student => student.users?._id).filter(Boolean);
            recipientIds = [...recipientIds, ...studentIds];
            break;

          case 'all_teachers':
            const teachers = await TeacherModel.find({ admin_id: adminId })
              .populate('users', '_id');
            const teacherIds = teachers.map(teacher => teacher.users?._id).filter(Boolean);
            recipientIds = [...recipientIds, ...teacherIds];
            break;

          case 'all_parents':
            const parents = await ParentModel.find({ admin_id: adminId })
              .populate('users', '_id');
            const parentIds = parents.map(parent => parent.users?._id).filter(Boolean);
            recipientIds = [...recipientIds, ...parentIds];
            break;

          case 'all':
            const allUsers = await UserModel.find({ is_active: true, admin_id: adminId }).select('_id');
            const allUserIds = allUsers.map(user => user._id);
            recipientIds = [...recipientIds, ...allUserIds];
            break;

          default:
            return res.status(400).json({ message: "Invalid group specified" });
        }
      }
      
      // Remove duplicates
      recipientIds = [...new Set(recipientIds)];
    } else if (targetAudience) {
      // Handle single target value (backward compatibility)
      switch (targetAudience) {
        case 'all_students':
          const students = await StudentModel.find({ admin_id: adminId })
            .populate('users', '_id');
          recipientIds = students.map(student => student.users?._id).filter(Boolean);
          break;

        case 'all_teachers':
          const teachers = await TeacherModel.find({ admin_id: adminId })
            .populate('users', '_id');
          recipientIds = teachers.map(teacher => teacher.users?._id).filter(Boolean);
          break;

        case 'all_parents':
          const parents = await ParentModel.find({ admin_id: adminId })
            .populate('users', '_id');
          recipientIds = parents.map(parent => parent.users?._id).filter(Boolean);
          break;

        case 'all':
          const allUsers = await UserModel.find({ is_active: true, admin_id: adminId }).select('_id');
          recipientIds = allUsers.map(user => user._id);
          break;

        default:
          return res.status(400).json({ message: "Invalid group specified" });
      }
    }


    const event = await EventModel.create({
      title,
      eventName,
      description,
      startDate,
      endDate,
      eventType,
      targetGroups: targetAudience, 
      targetAudience: recipientIds,
      status,
      admin_id: adminId,
    });
    res.status(201).json(event);
  } catch (error) {
    console.log('not working fine');
    res.status(400).json({ message: error.message });
  }
};


exports.getAllEvents = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const EventModel = connection.model('Event', EventSchema);
    const events = await EventModel.find({admin_id: adminId}).sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllEventsByStudent = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const StudentModel = connection.model('Student', StudentSchema);
    const EventModel = connection.model('Event', EventSchema);
    const student = await StudentModel.findOne({ users: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const events = await EventModel.find({admin_id: student.admin_id,$or:[{targetAudience: student.users},{targetGroups: { $in: ['all']}}]}).sort({ event_date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getAllEventsByTeacher = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const EventModel = connection.model('Event', EventSchema);
    const teacher = await TeacherModel.findOne({ users: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const events = await EventModel.find({
      admin_id: teacher.admin_id,
      $or: [
        { targetAudience: teacher.users },
        { targetGroups: { $in: ['all'] } }
      ]
    }).sort({ event_date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllEventsByStudentByParent = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const ParentModel = connection.model('Parent', ParentSchema);
    const EventModel = connection.model('Event', EventSchema);
    const parent = await ParentModel.findOne({ users: req.user._id });
    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' });
    }
    const events = await EventModel.find({admin_id: parent.admin_id,$or:[{targetAudience: parent.users},{targetGroups: { $in: ['all']}}]}).sort({ event_date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getEventById = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const EventModel = connection.model('Event', EventSchema);
    const event = await EventModel.findById(req.params.id).populate('admin_id', 'full_name');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.updateEvent = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const EventModel = connection.model('Event', EventSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const ParentModel = connection.model('Parent', ParentSchema);
    const UserModel = connection.model('User', UserSchema);
    const {title, eventName, description, startDate, endDate, eventType, targetAudience, status} = req.body;
    let recipientIds = [];

    if (targetAudience && Array.isArray(targetAudience)) {
      // Handle array of target values
      for (const targetValue of targetAudience) {
        switch (targetValue) {
          case 'all_students':
            const students = await StudentModel.find({ admin_id: req.user._id })
              .populate('users', '_id');
            const studentIds = students.map(student => student.users?._id).filter(Boolean);
            recipientIds = [...recipientIds, ...studentIds];
            break;

          case 'all_teachers':
            const teachers = await TeacherModel.find({ admin_id: req.user._id })
              .populate('users', '_id');
            const teacherIds = teachers.map(teacher => teacher.users?._id).filter(Boolean);
            recipientIds = [...recipientIds, ...teacherIds];
            break;

          case 'all_parents':
            const parents = await ParentModel.find({ admin_id: req.user._id })
              .populate('users', '_id');
            const parentIds = parents.map(parent => parent.users?._id).filter(Boolean);
            recipientIds = [...recipientIds, ...parentIds];
            break;

          case 'all':
            const allUsers = await UserModel.find({ is_active: true, admin_id: req.user._id }).select('_id');
            const allUserIds = allUsers.map(user => user._id);
            recipientIds = [...recipientIds, ...allUserIds];
            break;

          default:
            return res.status(400).json({ message: "Invalid group specified" });
        }
      }
      
      // Remove duplicates
      recipientIds = [...new Set(recipientIds)];
    } else if (targetAudience) {
      // Handle single target value (backward compatibility)
      switch (targetAudience) {
        case 'all_students':
          const students = await StudentModel.find({ admin_id: req.user._id })
            .populate('users', '_id');
          recipientIds = students.map(student => student.users?._id).filter(Boolean);
          break;

        case 'all_teachers':
          const teachers = await TeacherModel.find({ admin_id: req.user._id })
            .populate('users', '_id');
          recipientIds = teachers.map(teacher => teacher.users?._id).filter(Boolean);
          break;

        case 'all_parents':
          const parents = await ParentModel.find({ admin_id: req.user._id })
            .populate('users', '_id');
          recipientIds = parents.map(parent => parent.users?._id).filter(Boolean);
          break;

        case 'all':
          const allUsers = await UserModel.find({ is_active: true, admin_id: req.user._id }).select('_id');
          recipientIds = allUsers.map(user => user._id);
          break;

        default:
          return res.status(400).json({ message: "Invalid group specified" });
      }
    }

    const updateData = {
      title,
      eventName,
      description,
      startDate,
      endDate,
      eventType,
      targetGroups: targetAudience,
      targetAudience: recipientIds,
      status,
      admin_id: adminId,
    };

    const updated = await EventModel.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) return res.status(404).json({ message: 'Event not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


exports.deleteEvent = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const EventModel = connection.model('Event', EventSchema);
    const deleted = await EventModel.findByIdAndDelete(req.params.id,{admin_id: adminId});
    if (!deleted) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
