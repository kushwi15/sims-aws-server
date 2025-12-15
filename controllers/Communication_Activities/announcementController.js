const AnnouncementSchema = require('../../models/Communication_Activities/Announcement');
const TeacherSchema = require('../../models/CoreUser/Teacher');
const StudentSchema = require('../../models/CoreUser/Student');
const ParentSchema = require('../../models/CoreUser/Parent');
const UserSchema = require('../../models/CoreUser/User');
const ClassSchema = require('../../models/AcademicSchema/Class');
const db = require('../../config/db');


exports.createAnnouncement = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const AnnouncementModel = connection.model('Announcement', AnnouncementSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const ParentModel = connection.model('Parent', ParentSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const UserModel = connection.model('User', UserSchema);

    const { title, content, target, class: classId, section, startDate, endDate, status, admin_id } = req.body;
    let recipientIds = [];

    if (target && Array.isArray(target)) {
      // Handle array of target values
      for (const targetValue of target) {
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
    } else if (target) {
      // Handle single target value (backward compatibility)
      switch (target) {
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

    const announcement = await AnnouncementModel.create({
      title,
      content,
      target: recipientIds,
      targetGroups: target, // Store the original target groups
      startDate,
      endDate,
      status,
      author_id: req.user._id,
      admin_id: adminId
    });
    res.status(201).json(announcement);
  } catch (error) {
    console.log('not working fine');
    res.status(400).json({ message: error.message });
  }
};

exports.createAnnouncementUnderMyAdmin = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const AnnouncementModel = connection.model('Announcement', AnnouncementSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const ParentModel = connection.model('Parent', ParentSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const UserModel = connection.model('User', UserSchema);
    const ClassModel = connection.model('Class', ClassSchema);

    const teacher = await TeacherModel.findOne({ users: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const { title, content, target, class: classId, section, startDate, endDate, status } = req.body;


    // Convert class ID to class name if needed
    let className = classId;
    if (classId && typeof classId === 'string' && classId.length === 24) {
      // This looks like an ObjectId, try to get the class name
      try {
        const classDoc = await ClassModel.findById(classId);
        if (classDoc) {
          className = classDoc.class_name;

        }
      } catch (error) {
        console.log('Error converting class ID to name:', error);
      }
    }

    // Debug: Check what classes and sections exist in the database
    const allStudents = await StudentModel.find({ admin_id: teacher.admin_id }).select('class_id section');
    const uniqueClasses = [...new Set(allStudents.map(s => s.class_id).filter(Boolean))];
    const uniqueSections = [...new Set(allStudents.map(s => s.section).filter(Boolean))];


    let recipientIds = [];

    if (target && Array.isArray(target)) {
      // Handle array of target values
      for (const targetValue of target) {
        switch (targetValue) {
          case 'all_students':
            let studentQuery = { admin_id: teacher.admin_id };

            // Add class filter if specified
            if (className) {
              studentQuery.class_id = className;
            }

            // Add section filter if specified
            if (section) {
              studentQuery.section = section;
            }


            const students = await StudentModel.find(studentQuery)
              .populate('users', '_id');
            const studentIds = students.map(student => student.users?._id).filter(Boolean);


            recipientIds = [...recipientIds, ...studentIds];
            break;

          case 'all_teachers':
            const teachers = await TeacherModel.find({ admin_id: teacher.admin_id })
              .populate('users', '_id');
            const teacherIds = teachers.map(teacher => teacher.users?._id).filter(Boolean);
            recipientIds = [...recipientIds, ...teacherIds];
            break;

          case 'all_parents':
            // If class or section is specified, get parents of students in that class/section
            if (className || section) {
              let studentQuery = { admin_id: teacher.admin_id };

              if (className) {
                studentQuery.class_id = className;
              }

              if (section) {
                studentQuery.section = section;
              }

              // Get students in the specified class/section
              const students = await StudentModel.find(studentQuery).select('parent_id');
              const parentIds = students.flatMap(student => student.parent_id || []).filter(Boolean);

              // Get parent user IDs
              const parents = await ParentModel.find({
                _id: { $in: parentIds },
                admin_id: teacher.admin_id
              }).populate('users', '_id');

              const parentUserIds = parents.map(parent => parent.users?._id).filter(Boolean);

              recipientIds = [...recipientIds, ...parentUserIds];
            } else {
              // If no class/section specified, get all parents
              const parents = await ParentModel.find({ admin_id: teacher.admin_id })
                .populate('users', '_id');
              const parentIds = parents.map(parent => parent.users?._id).filter(Boolean);
              recipientIds = [...recipientIds, ...parentIds];
            }
            break;

          case 'all':
            const allUsers = await UserModel.find({ is_active: true, admin_id: teacher.admin_id }).select('_id');
            const allUserIds = allUsers.map(user => user._id);
            recipientIds = [...recipientIds, ...allUserIds];
            break;

          default:
            return res.status(400).json({ message: "Invalid group specified" });
        }
      }

      // Remove duplicates
      recipientIds = [...new Set(recipientIds)];
    } else if (target) {
      // Handle single target value (backward compatibility)
      switch (target) {
        case 'all_students':
          let studentQuery = { admin_id: teacher.admin_id };

          // Add class filter if specified
          if (className) {
            studentQuery.class_id = className;
          }

          // Add section filter if specified
          if (section) {
            studentQuery.section = section;
          }


          const students = await StudentModel.find(studentQuery)
            .populate('users', '_id');


          recipientIds = students.map(student => student.users?._id).filter(Boolean);
          break;

        case 'all_teachers':
          const teachers = await TeacherModel.find({ admin_id: teacher.admin_id })
            .populate('users', '_id');
          recipientIds = teachers.map(teacher => teacher.users?._id).filter(Boolean);
          break;

        case 'all_parents':
          // If class or section is specified, get parents of students in that class/section
          if (className || section) {
            let studentQuery = { admin_id: teacher.admin_id };

            if (className) {
              studentQuery.class_id = className;
            }

            if (section) {
              studentQuery.section = section;
            }

            // Get students in the specified class/section
            const students = await StudentModel.find(studentQuery).select('parent_id');
            const parentIds = students.flatMap(student => student.parent_id || []).filter(Boolean);

            // Get parent user IDs
            const parents = await ParentModel.find({
              _id: { $in: parentIds },
              admin_id: teacher.admin_id
            }).populate('users', '_id');

            const parentUserIds = parents.map(parent => parent.users?._id).filter(Boolean);
            recipientIds = parentUserIds;
          } else {
            // If no class/section specified, get all parents
            const parents = await ParentModel.find({ admin_id: teacher.admin_id })
              .populate('users', '_id');
            recipientIds = parents.map(parent => parent.users?._id).filter(Boolean);
          }
          break;

        case 'all':
          const allUsers = await UserModel.find({ is_active: true, admin_id: teacher.admin_id }).select('_id');
          recipientIds = allUsers.map(user => user._id);
          break;

        default:
          return res.status(400).json({ message: "Invalid group specified" });
      }
    }

    const announcement = await AnnouncementModel.create({
      title,
      content,
      target: recipientIds,
      targetGroups: target, // Store the original target groups
      class: classId, // Keep the original class ID for reference
      section: section,
      startDate,
      endDate,
      status,
      author_id: req.user._id,
      admin_id: adminId
    });
    res.status(201).json(announcement);
  } catch (error) {
    console.log('not working fine');
    res.status(400).json({ message: error.message });
  }
};


exports.getAnnouncements = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const AnnouncementModel = connection.model('Announcement', AnnouncementSchema);

    const announcements = await AnnouncementModel.find({ admin_id: adminId })
    .populate('author_id', 'full_name user_id')
    .sort({ publish_date: -1 });

    res.json(announcements);
  } catch (err) {
    console.log('announcements not working fine');
    res.status(500).json({ message: err.message });
  }
};

exports.getAnnouncementsUnderMyAdmin = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const AnnouncementModel = connection.model('Announcement', AnnouncementSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    
    const teacher = await TeacherModel.findOne({ users: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Get all announcements under this admin
    const allAnnouncements = await AnnouncementModel.find({
      admin_id: adminId,
      $or:[{target:teacher.users },{targetGroups: { $in: ['all']}}]
    }).sort({ createdAt: -1 });

    res.json(allAnnouncements);
  } catch (err) {
    console.log('announcements not working fine');
    res.status(500).json({ message: err.message });
  }
};

exports.getAnnouncementsForStudent = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const AnnouncementModel = connection.model('Announcement', AnnouncementSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);

    const student = await StudentModel.findOne({ users: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const teacher = await TeacherModel.findOne({ admin_id: adminId });

    const announcements = await AnnouncementModel.find({
       $or: [{ admin_id: adminId }, { author_id: teacher.users }],
       $or: [{ target: student.users }, { targetGroups: { $in: ['all'] } }]
    }).sort({ publish_date: -1 });

    res.json(announcements);
  } catch (err) {
    console.log('announcements not working fine');
    res.status(500).json({ message: err.message });
  }
};

exports.getAnnouncementsForParent = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const AnnouncementModel = connection.model('Announcement', AnnouncementSchema);
    const ParentModel = connection.model('Parent', ParentSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);

    const parent = await ParentModel.findOne({ users: req.user._id });
    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' });
    }
    const teacher = await TeacherModel.findOne({ admin_id: parent.admin_id });
    
    const announcements = await AnnouncementModel.find({ 
      $or: [{ admin_id: parent.admin_id }, { author_id: teacher.users }],
      $or: [{ target: parent.users }, { targetGroups: { $in: ['all'] } }]
    }).sort({ publish_date: -1 });

    res.json(announcements);
  } catch (err) {
    console.log('announcements not working fine');
    res.status(500).json({ message: err.message });
  }
};

exports.getAnnouncementsCreatedByMe = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const AnnouncementModel = connection.model('Announcement', AnnouncementSchema);

    const announcements = await AnnouncementModel.find({ author_id: req.user._id })
      .sort({ createdAt: -1 })
      .populate('author_id', 'full_name')
      .populate('class', 'class_name');

    res.json(announcements);
  } catch (err) {
    console.log('Error fetching announcements created by me:', err);
    res.status(500).json({ message: err.message });
  }
};


exports.getAnnouncementById = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const AnnouncementModel = connection.model('Announcement', AnnouncementSchema);

    const announcement = await AnnouncementModel.findById(req.params.id, { admin_id: adminId }).populate('author_id', 'full_name');
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
    res.json(announcement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.updateAnnouncement = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const AnnouncementModel = connection.model('Announcement', AnnouncementSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const ParentModel = connection.model('Parent', ParentSchema);
    const UserModel = connection.model('User', UserSchema);

    const { title, content, target, startDate, endDate, status } = req.body;
    let recipientIds = [];

    if (target && Array.isArray(target)) {
      // Handle array of target values
      for (const targetValue of target) {
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
    }

    const updateData = {
      title,
      content,
      target: recipientIds,
      targetGroups: target, // Store the original target groups
      startDate,
      endDate,
      status,
      admin_id: req.user._id
    };

    const updated = await AnnouncementModel.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) return res.status(404).json({ message: 'Announcement not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateAnnouncementUnderMyAdmin = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const AnnouncementModel = connection.model('Announcement', AnnouncementSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const ParentModel = connection.model('Parent', ParentSchema);
    const UserModel = connection.model('User', UserSchema);

    const teacher = await TeacherModel.findOne({ users: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const { title, content, target, startDate, endDate, status } = req.body;
    let recipientIds = [];

    if (target && Array.isArray(target)) {
      // Handle array of target values
      for (const targetValue of target) {
        switch (targetValue) {
          case 'all_students':
            const students = await StudentModel.find({ admin_id: teacher.admin_id })
              .populate('users', '_id');
            const studentIds = students.map(student => student.users?._id).filter(Boolean);
            recipientIds = [...recipientIds, ...studentIds];
            break;

          case 'all_teachers':
            const teachers = await TeacherModel.find({ admin_id: teacher.admin_id })
              .populate('users', '_id');
            const teacherIds = teachers.map(teacher => teacher.users?._id).filter(Boolean);
            recipientIds = [...recipientIds, ...teacherIds];
            break;

          case 'all_parents':
            const parents = await ParentModel.find({ admin_id: teacher.admin_id })
              .populate('users', '_id');
            const parentIds = parents.map(parent => parent.users?._id).filter(Boolean);
            recipientIds = [...recipientIds, ...parentIds];
            break;

          case 'all':
            const allUsers = await UserModel.find({ is_active: true, admin_id: teacher.admin_id }).select('_id');
            const allUserIds = allUsers.map(user => user._id);
            recipientIds = [...recipientIds, ...allUserIds];
            break;

          default:
            return res.status(400).json({ message: "Invalid group specified" });
        }
      }

      // Remove duplicates
      recipientIds = [...new Set(recipientIds)];
    }

    const updateData = {
      title,
      content,
      target: recipientIds,
      targetGroups: target, // Store the original target groups
      startDate,
      endDate,
      status,
      admin_id: teacher.admin_id
    };

    const updated = await AnnouncementModel.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) return res.status(404).json({ message: 'Announcement not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


exports.deleteAnnouncement = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const AnnouncementModel = connection.model('Announcement', AnnouncementSchema);

    const deleted = await AnnouncementModel.findByIdAndDelete(req.params.id, { admin_id: req.user._id });
    if (!deleted) return res.status(404).json({ message: 'Announcement not found' });
    res.json({ message: 'Announcement deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
