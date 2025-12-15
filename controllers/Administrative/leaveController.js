const LeaveApplicationSchema = require('../../models/AdministrativeSchema/LeaveApplication');
const ParentSchema = require('../../models/CoreUser/Parent');
const TeacherSchema = require('../../models/CoreUser/Teacher');
const StudentSchema = require("../../models/CoreUser/Student");
const db = require('../../config/db');

exports.getAllTeacherLeaves = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const LeaveApplicationModel = connection.model('LeaveApplication', LeaveApplicationSchema);
    
    const leaves = await LeaveApplicationModel.find({admin_id: adminId}).sort({ requestedAt: -1 });
    res.status(200).json(leaves);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leave requests', details: err.message });
  }
};
exports.getAllTeacherLeavesUnderMyAdmin = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const LeaveApplicationModel = connection.model('LeaveApplication', LeaveApplicationSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    
    const teacher = await TeacherModel.findOne({users: req.user._id});
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }
    
    const leaves = await LeaveApplicationModel.find({admin_id: teacher.admin_id,user_id: teacher.user_id}).sort({ requestedAt: -1 });
  
    res.status(200).json(leaves);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leave requests', details: err.message });
  }
};


exports.updateLeaveStatus = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const LeaveApplicationModel = connection.model('LeaveApplication', LeaveApplicationSchema);

    const { id } = req.params;
    const { status } = req.body;
    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    const leave = await LeaveApplicationModel.findByIdAndUpdate(
      id,
      { status,admin_id: adminId },
      { new: true }
    );
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });
    res.status(200).json(leave);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status', details: err.message });
  }
};


exports.updateAdminComment = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const LeaveApplicationModel = connection.model('LeaveApplication', LeaveApplicationSchema);

    const { id } = req.params;
    const { adminComment } = req.body;
    const leave = await LeaveApplicationModel.findByIdAndUpdate(
      id,
      { adminComment,admin_id: adminId },
      { new: true }
    );
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });
    res.status(200).json(leave);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update comment', details: err.message });
  }
};


exports.getAllStudentLeaves = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const LeaveApplicationModel = connection.model('LeaveApplication', LeaveApplicationSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const ParentModel = connection.model('Parent', ParentSchema);
    
    let filter = { $or: [ { employeeId: null }, { employeeId: '' }, { employeeId: { $exists: false } } ] };
    
    
    if (req.user.role === 'parent') {
      
      const parent = await ParentModel.findOne({ users: req.user._id });
      if (!parent) {
        return res.status(404).json({ error: 'Parent profile not found' });
      }
      
      
      const students = await StudentModel.find({
        parent_id: { $in: [parent._id.toString()] }
      });
      
      const studentIds = students.map(student => student._id.toString());
      
      
      filter = {
        ...filter,
        user_id: { $in: studentIds }
      };
    }
    
    const leaves = await LeaveApplicationModel.find(filter).sort({ requestedAt: -1 }).populate('student_id','class_id section');
    
    res.status(200).json(leaves);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch student leave requests', details: err.message });
  }
};


exports.updateStudentLeaveStatus = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const LeaveApplicationModel = connection.model('LeaveApplication', LeaveApplicationSchema);

    const { id } = req.params;
    const { status } = req.body;
    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    const leave = await LeaveApplicationModel.findByIdAndUpdate(
      id,
      { status,admin_id: adminId },
      { new: true }
    );
    if (!leave) return res.status(404).json({ error: 'Student leave request not found' });
    res.status(200).json(leave);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update student leave status', details: err.message });
  }
};


exports.updateTeacherComment = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const LeaveApplicationModel = connection.model('LeaveApplication', LeaveApplicationSchema);

    const { id } = req.params;
    const { teacherComment } = req.body;
    const leave = await LeaveApplicationModel.findByIdAndUpdate(
      id,
      { adminComment: teacherComment,admin_id: adminId }, 
      { new: true }
    );
    if (!leave) return res.status(404).json({ error: 'Student leave request not found' });
    res.status(200).json(leave);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update teacher comment', details: err.message });
  }
};


exports.createLeave = async (req, res) => {
  try {
    const {
      user_id,
      leave_type,
      start_date,
      end_date,
      reason,
      employeeId,
      applicantName,
      document_url,
      document_id
    } = req.body;
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const LeaveApplicationModel = connection.model('LeaveApplication', LeaveApplicationSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    if (!user_id || !leave_type || !start_date || !end_date || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const teacher = await TeacherModel.findOne({users: req.user._id});
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }
    const leave = await LeaveApplicationModel.create({
      user_id,
      leave_type,
      start_date,
      end_date,
      reason,
      employeeId,
      applicantName,
      document_url,
      document_id,
      admin_id: adminId
    });
    res.status(201).json(leave);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create leave request', details: err.message });
  }
};

exports.createLeaveByParent = async (req, res) => {
  try {
    const {
      user_id,
      leave_type,
      start_date,
      end_date,
      reason,
      employeeId,
      applicantName,
      document_url,
      document_id
    } = req.body;
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const LeaveApplicationModel = connection.model('LeaveApplication', LeaveApplicationSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const ParentModel = connection.model('Parent', ParentSchema);
    const student = await StudentModel.findOne({user_id: user_id});
    if (!student) {
      
      return res.status(404).json({ error: 'Student profile not found' });
    }

    if (!user_id || !leave_type || !start_date || !end_date || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const parent = await ParentModel.findOne({ users: req.user._id });
    if (!parent) {
      return res.status(404).json({ error: 'Parent profile not found' });
    }
    const leave = await LeaveApplicationModel.create({
      user_id,
      leave_type,
      start_date,
      end_date,
      reason,
      student_id: student._id || '',
      applicantName,
      document_url,
      document_id,
      admin_id: adminId
    });
    res.status(201).json(leave);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create leave request', details: err.message });
  }
};


exports.getParentChildrenLeaves = async (req, res) => {
  try {
    const {connection,adminId} = await db.getUserSpecificConnection(req.user._id);
    const LeaveApplicationModel = connection.model('LeaveApplication', LeaveApplicationSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const ParentModel = connection.model('Parent', ParentSchema);
    
    
    const parent = await ParentModel.findOne({ users: req.user._id });
    if (!parent) {
      return res.status(404).json({ error: 'Parent profile not found' });
    }
    
    // Try different approaches to find students
    let students = await StudentModel.find({
      parent_id: { $in: [parent._id.toString()] }
    }).populate('class_id', 'class_name section');
    
    // If no students found with parent_id, try with children array
    if (students.length === 0) {
      
      students = await StudentModel.find({
        _id: { $in: parent.children || [] }
      }).populate('class_id', 'class_name section');
    }
    
    if (students.length === 0) {
      return res.status(200).json([]);
    }
    
    const studentIds = students.map(student => student._id.toString());
    
    // First, let's check all leaves for these students without admin filter
    const allLeavesForStudents = await LeaveApplicationModel.find({
      user_id: { $in: studentIds }
    }).sort({ requestedAt: -1 });
    
    // Try different admin_id filters
    let leaves = await LeaveApplicationModel.find({
      user_id: { $in: studentIds },
      admin_id: req.user._id
    }).sort({ requestedAt: -1 });
    
    // If no leaves found, try with parent's admin_id
    if (leaves.length === 0) {
      leaves = await LeaveApplicationModel.find({
        user_id: { $in: studentIds },
        admin_id: parent.admin_id
      }).sort({ requestedAt: -1 });
      
    }
    
    // If still no leaves found, use all leaves for students
    if (leaves.length === 0 && allLeavesForStudents.length > 0) {
      console.log('No leaves found with admin filters, using all leaves for students');
      leaves = allLeavesForStudents;
    }
    
    const leavesWithStudentInfo = leaves.map(leave => {
      const student = students.find(s => s._id.toString() === leave.user_id);
      return {
        ...leave.toObject(),
        studentInfo: student ? {
          name: student.full_name,
          class: student.class_id?.class_name || student.class_id || 'N/A',
          section: student.section || 'N/A',
          admissionNumber: student.admission_number
        } : null
      };
    });
    
    res.status(200).json(leavesWithStudentInfo);
  } catch (err) {
    console.error('Error in getParentChildrenLeaves:', err);
    res.status(500).json({ error: 'Failed to fetch parent children leave requests', details: err.message });
  }
};
exports.getParentChildrenLeavesByParent = async (req, res) => {
  try {
    const {connection,admnId} = await db.getUserSpecificConnection(req.user._id);
    const ParentModel = connection.model('Parent', ParentSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const LeaveApplicationModel = connection.model('LeaveApplication', LeaveApplicationSchema);
    
    const parent = await ParentModel.findOne({ users: req.user._id });
    if (!parent) {
      return res.status(404).json({ error: 'Parent profile not found' });
    }
    
    const students = await StudentModel.find({
      parent_id: { $in: [parent._id.toString()] }
    }).populate('class_id', 'class_name section');
    
    const studentIds = students.map(student => student.user_id);
    
    // First, let's check if there are any leaves for these students at all
    const allLeavesForStudents = await LeaveApplicationModel.find({
      user_id: { $in: studentIds }
    }).sort({ requestedAt: -1 });
    
    
    // Now check with admin_id filter
    const leaves = await LeaveApplicationModel.find({
      user_id: { $in: studentIds },
      admin_id: parent.admin_id
    }).sort({ requestedAt: -1 });
    
  
    
    // If no leaves found with admin_id filter, try without it
    if (leaves.length === 0) {
      const leavesWithoutAdminFilter = await LeaveApplicationModel.find({
        user_id: { $in: studentIds }
      }).sort({ requestedAt: -1 });
      
      // Use leaves without admin filter if that returns results
      if (leavesWithoutAdminFilter.length > 0) {
        const leavesWithStudentInfoAlt = leavesWithoutAdminFilter.map(leave => {
          const student = students.find(s => s._id.toString() === leave.user_id);
          return {
            ...leave.toObject(),
            studentInfo: student ? {
              name: student.full_name,
              class: student.class_id?.class_name || student.class_id || 'N/A',
              section: student.section || 'N/A',
              admissionNumber: student.admission_number
            } : null
          };
        });
      
        return res.status(200).json(leavesWithStudentInfoAlt);
      }
    }
    
    const leavesWithStudentInfo = leaves.map(leave => {
      const student = students.find(s => s._id.toString() === leave.user_id);
      return {
        ...leave.toObject(),
        studentInfo: student ? {
          name: student.full_name,
          class: student.class_id?.class_name || student.class_id || 'N/A',
          section: student.section || 'N/A',
          admissionNumber: student.admission_number
        } : null
      };
    });
    
    res.status(200).json(leavesWithStudentInfo);
  } catch (err) {
    console.error('Error in getParentChildrenLeavesByParent:', err);
    res.status(500).json({ error: 'Failed to fetch parent children leave requests', details: err.message });
  }
};

// Delete expired leave applications after academic year ends
exports.deleteExpiredLeaves = async (req, res) => {
  try {
    const {connection,admnId} = await db.getUserSpecificConnection(req.user._id);
    const LeaveApplicationModel = connection.model('LeaveApplication', LeaveApplicationSchema);
    
    const { academicEndYear } = req.query;
    
    if (!academicEndYear) {
      return res.status(400).json({ error: 'Academic end year is required' });
    }

    // Convert academicEndYear to Date object
    const academicEndDate = new Date(academicEndYear);
    
    // Delete all leave applications where end_date is before the academic end year
    const result = await LeaveApplicationModel.deleteMany({
      end_date: { $lt: academicEndDate },
      admin_id: req.user._id
    });

    res.status(200).json({
      message: 'Expired leave applications deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error('Error deleting expired leave applications:', err);
    res.status(500).json({ 
      error: 'Failed to delete expired leave applications', 
      details: err.message 
    });
  }
};
exports.deleteLeaveApplication = async (req, res) => {
  try {
    const {connection,admnId} = await db.getUserSpecificConnection(req.user._id);
    const LeaveApplicationModel = connection.model('LeaveApplication', LeaveApplicationSchema);
    
    const { leaveId } = req.params;
    
    if (!leaveId) {
      return res.status(400).json({ error: 'Leave ID is required' });
    }

    const leaveApplication = await LeaveApplicationModel.findById(leaveId);
    if (!leaveApplication) {
      return res.status(404).json({ error: 'Leave application not found' });
    }

    await leaveApplication.deleteOne();

    res.status(200).json({
      message: 'Leave application deleted successfully',
    });
  } catch (err) {
    console.error('Error deleting leave application:', err);
    res.status(500).json({ 
      error: 'Failed to delete leave application', 
      details: err.message 
    });
  }
};