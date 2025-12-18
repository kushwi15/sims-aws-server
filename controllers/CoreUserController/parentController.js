const ParentSchema = require('../../models/CoreUser/Parent');
const StudentSchema = require('../../models/CoreUser/Student');
const StudentAttendanceSchema = require('../../models/Attendance_PerformanceSchema/StudentAttendance');
const cloudinary = require('../../config/cloudinary');
const UserSchema = require('../../models/CoreUser/User');
const ClassSchema = require('../../models/AcademicSchema/Class');
const bcrypt = require("bcryptjs");
const { getParentStudents, removeStudentFromParent } = require('../../utils/relationshipUtils');
const TeacherSchema = require('../../models/CoreUser/Teacher');
const db = require('../../config/db');
const AWS = require('aws-sdk');


exports.createParent = async (req, res) => {
  try {
    const { user_id, full_name, email, password, phone, address, childrenCount, profileImage, admin_id } = req.body;

    if (!user_id || !full_name || !email || !password || !phone) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const UserModel = connection.model('User', UserSchema);
    const ParentModel = connection.model('Parent', ParentSchema);

    const existingUser = await UserModel.findOne({ user_id });
    if (existingUser) {
      return res.status(400).json({ message: 'User ID already exists' });
    }

    const newUser = await UserModel.create({
      user_id,
      full_name,
      email,
      password,
      phone,
      role: 'parent',
      profileImage,
      status: "Active",
    });


    const parent = await ParentModel.create({
      user_id,
      full_name,
      email,
      password,
      phone,
      role: 'parent',
      profileImage,
      childrenCount: childrenCount || 1,
      address: address || '',
      users: newUser._id,
      status: "Active",
      admin_id: adminId
    });

    res.status(201).json({
      message: 'Parent created successfully',
      parent,
      user: {
        id: newUser._id,
        user_id: newUser.user_id,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error('Error creating parent:', err);
    res.status(400).json({
      message: err.message.includes('duplicate key') ?
        'Duplicate user_id or email' :
        'Failed to create parent',
      error: err.message
    });
  }
};

exports.getAllParents = async (req, res) => {
  try {
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const ParentModel = connection.model('Parent', ParentSchema);

    const parents = await ParentModel.find({ admin_id: adminId })
      .populate('children', 'user_id full_name admission_number class_id email contact status')
      .select('-__v');
    res.json(parents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getParentByImageFileName = async (req, res) => {
  try {
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const ParentModel = connection.model('Parent', ParentSchema);
    const UserModel = connection.model('User', UserSchema);
    const StudentModel = connection.model('Student', StudentSchema);

    const student = await StudentModel.find();
    for(let s of student){
      let studentProfileImage = s.profile_image.split('/').pop() || '';
      if(studentProfileImage === encodeURI(req.params.imageFileName)){
        return res.status(409).json({error: 'Conflict',message:'Profile image already exist on the same name, please choose another name'});
      }
    }

    const parent = await ParentModel.find();
    for(let p of parent){
      let parentProfileImage = p.profileImage.split('/').pop() || '';

      if(parentProfileImage === encodeURI(req.params.imageFileName)){
        return res.status(409).json({error: 'Conflict',message:'Profile image already exist on the same name, please choose another name'});
      }
    }
    
    const user = await UserModel.find();
    for(let u of user){
      let userProfileImage = u.profileImage.split('/').pop() || '';
      if(userProfileImage === encodeURI(req.params.imageFileName)){
        return res.status(409).json({error: 'Conflict',message:'Profile image already exist on the same name, please choose another name'});
      }
    }
  
    res.json({message:'Profile image is good'});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllParentsUnderMyAdmin = async (req, res) => {
  try {
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const ParentModel = connection.model('Parent', ParentSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);

    const teacher = await TeacherModel.findOne({ users: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Check if teacher is assigned as class teacher
    if (!teacher.class_teacher) {
      return res.status(404).json({ message: 'Teacher is not assigned as a class teacher' });
    }

    const classTeacherAssignment = teacher.class_teacher;

    // Split by the last hyphen to separate class name and section
    const lastHyphenIndex = classTeacherAssignment.lastIndexOf('-');

    const className = classTeacherAssignment.substring(0, lastHyphenIndex);
    const section = classTeacherAssignment.substring(lastHyphenIndex + 1);

    // const parents = await ParentModel.find({ admin_id: adminId })
    //   .populate('children', 'user_id full_name admission_number class_id email contact status')
    //   .select('-__v');
    const parents = await ParentModel.find({ admin_id: adminId })
      .populate({ path: 'children', match: { class_id: className, section: section } })
      .select('-__v');

    const filteredParents = parents.filter(parent => parent.children.length > 0);

    res.json(filteredParents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

exports.getParentById = async (req, res) => {
  try {
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const ParentModel = connection.model('Parent', ParentSchema);

    const parent = await ParentModel.findById(req.params.id)
      .populate('children', 'user_id full_name admission_number class_id email contact status');

    if (!parent) return res.status(404).json({ message: 'Parent not found' });

    res.json(parent);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateParent = async (req, res) => {
  try {
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const ParentModel = connection.model('Parent', ParentSchema);
    const UserModel = connection.model('User', UserSchema);

    const parent = await ParentModel.findById(req.params.id);
    if (!parent) return res.status(404).json({ message: 'Parent not found' });

    const {
      full_name,
      phone,
      address
    } = req.body;

    if (parent.users) {
      const user = await UserModel.findById(parent.users);
      if (user) {
        const userFields = ['full_name', 'phone', 'address'];
        userFields.forEach(field => {
          if (field === 'full_name' && req.body.full_name) {
            user.full_name = req.body.full_name;
          }
          else if (field === 'phone' && req.body.phone) {
            user.phone = req.body.phone;
          }
          else if (field === 'address' && req.body.address) {
            user.address = req.body.address;
          }
        });
        await user.save();
      }
    }

    if (full_name) parent.full_name = full_name;
    if (phone) parent.phone = phone;
    if (address) parent.address = address;

    if (req.body.profileImage !== undefined) {
      if (parent.profileImage) {
        const imageUrl = parent.profileImage;

        if (imageUrl) {
          AWS.config.update({
            region: 'eu-north-1', // use your bucket's region
          });

          const s3 = new AWS.S3();
          const url = new URL(imageUrl);
          const key = decodeURIComponent(url.pathname.substring(1));
          const s3Params = {
            Bucket: 'sims-school',
            Key: key
          };
          await s3.deleteObject(s3Params).promise();
        }
      }
      parent.profileImage = req.body.profileImage;
    }

    const updated = await parent.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteParent = async (req, res) => {
  try {
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const ParentModel = connection.model('Parent', ParentSchema);
    const UserModel = connection.model('User', UserSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const StudentAttendanceModel = connection.model('StudentAttendance', StudentAttendanceSchema);

    const parent = await ParentModel.findById(req.params.id);
    if (!parent) return res.status(404).json({ message: 'Parent not found' });

    const imageUrl = parent.profileImage;
    let publicId = null;
    if (!imageUrl) {
      publicId = null;
    } else {
      publicId = imageUrl.split('/').pop().split('.')[0] || null;
    }

    if (publicId) {
      AWS.config.update({
        region: 'eu-north-1', // use your bucket's region
      });

      const s3 = new AWS.S3();
      const url = new URL(imageUrl);
      const key = decodeURIComponent(url.pathname.substring(1));
      const s3Params = {
        Bucket: 'sims-school',
        Key: key
      };
      await s3.deleteObject(s3Params).promise();
    }

    if (parent.users) {
      await UserModel.findByIdAndDelete(parent.users);
    }

    const students = await StudentModel.find({ _id: { $in: parent.children } });

    for (const student of students) {
      //student profile image
      const imageUrl = student.profile_image;
      let publicId = null;
      if (!imageUrl) {
        publicId = null;
      } else {
        publicId = imageUrl.split('/').pop().split('.')[0] || null;
      }

      if (publicId) {
        AWS.config.update({
          region: 'eu-north-1', // use your bucket's region
        });

        const s3 = new AWS.S3();
        const url = new URL(imageUrl);
        const key = decodeURIComponent(url.pathname.substring(1));
        const s3Params = {
          Bucket: 'sims-school',
          Key: key
        };
        await s3.deleteObject(s3Params).promise();
      }
      //student documents
      const docUrl = student.documents;
      let publicDocId = null;
      if (!docUrl) {
        publicDocId = null;
      } else {
        publicDocId = docUrl.split('/').pop().split('.')[0] || null;
      }

      if (publicDocId) {
        AWS.config.update({
          region: 'eu-north-1', // use your bucket's region
        });

        const s3 = new AWS.S3();
        const url = new URL(docUrl);
        const key = decodeURIComponent(url.pathname.substring(1));
        const s3Params = {
          Bucket: 'sims-school',
          Key: key
        };
        await s3.deleteObject(s3Params).promise();
      }

      if (student.users) {
        await UserModel.findByIdAndDelete(student.users);
      }
      await StudentAttendanceModel.deleteMany({ student_id: student._id });
      await student.deleteOne();
    }

    await parent.deleteOne();
    res.json({ message: 'Parent deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyParentProfile = async (req, res) => {
  try {

    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied: Parents only' });
    }
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const ParentModel = connection.model('Parent', ParentSchema);
    const StudentModel = connection.model('Student', StudentSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);

    const parent = await ParentModel.findOne({ users: req.user._id });

    if (!parent) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }


    if (!req.user.is_active) {
      return res.status(403).json({ message: 'Parent account is inactive' });
    }


    const students = await StudentModel.find({
      parent_id: { $in: [parent._id.toString()] }
    });


    const studentsWithClassDetails = await Promise.all(
      students.map(async (student) => {
        let classDetails = null;
        if (student.class_id) {
          try {
            const ClassModel = connection.model('Class', ClassSchema);
            classDetails = await ClassModel.findOne({ class_name: student.class_id });
          } catch (err) {
            console.error('Error fetching class details:', err);
          }
        }
        const classTeacher = classDetails ? `${classDetails.class_name}-${classDetails.section}` : 'N/A';
        const teacher = await TeacherModel.findOne({ class_teacher: classTeacher, admin_id: parent.admin_id });

        if(!teacher){
          return {
            ...student.toObject(),
            class_id: classDetails,
            teacher: null,
            teacherName: null,
          };
        }

        return {
          ...student.toObject(),
          class_id: classDetails,
          teacher: teacher.user_id,
          teacherName: teacher.full_name,
        };
      })
    );

    res.json({
      parent,
      linkedStudents: studentsWithClassDetails,
    });
  } catch (err) {
    console.error('Error in getMyParentProfile:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getParentCount = async (req, res) => {
  try {
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const ParentModel = connection.model('Parent', ParentSchema);

    // let adminIdToFilter;

    // if (req.user.role === 'admin') {
    //   adminIdToFilter = req.user._id;
    // } else if (req.user.role === 'super_admin') {
    //   // Superadmin can see all parents
    //   adminIdToFilter = null;
    // } else {
    //   return res.status(403).json({ message: 'Unauthorized user' });
    // }

    // const query = adminIdToFilter ? { admin_id: adminIdToFilter } : {};
    const count = await ParentModel.countDocuments({ admin_id: adminId });

    res.json({ count });
  } catch (err) {
    console.error('Error in getParentCount:', err);
    res.status(500).json({
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};