const ResourceSchema = require('../../models/Library_Management/Resource');
const TeacherSchema = require('../../models/CoreUser/Teacher');
const StudentSchema = require('../../models/CoreUser/Student');
const db = require('../../config/db');
const AWS = require('aws-sdk');

exports.getAllResources = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const ResourceModel = connection.model('Resource', ResourceSchema);
    const resources = await ResourceModel.find({ admin_id: adminId }).sort({ createdAt: -1 });
    res.json(resources);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getAllResourcesUnderMyAdmin = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const ResourceModel = connection.model('Resource', ResourceSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);
    const teacher = await TeacherModel.findOne({ users: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    const resources = await ResourceModel.find({ admin_id: adminId }).sort({ createdAt: -1 });
    if (!resources) {
      return res.status(404).json({ message: 'No resources found' });
    }
    res.json(resources);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllResourcesByStudent = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const ResourceModel = connection.model('Resource', ResourceSchema);
    const StudentModel = connection.model('Student', StudentSchema);

    const student = await StudentModel.findOne({ users: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const resources = await ResourceModel.find({ admin_id: adminId }).sort({ createdAt: -1 });
    if (!resources) {
      return res.status(404).json({ message: 'No resources found' });
    }
    res.json(resources);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getResourceById = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const ResourceModel = connection.model('Resource', ResourceSchema);

    const resource = await ResourceModel.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    res.json(resource);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.createResource = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const ResourceModel = connection.model('Resource', ResourceSchema);

    const resource = await ResourceModel.create({ ...req.body, admin_id: adminId });
    res.status(201).json(resource);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
exports.createResourceUnderMyAdmin = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const ResourceModel = connection.model('Resource', ResourceSchema);
    const TeacherModel = connection.model('Teacher', TeacherSchema);

    const teacher = await TeacherModel.findOne({ users: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    const resource = await ResourceModel.create({ ...req.body, admin_id: adminId });
    res.status(201).json(resource);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

exports.updateResource = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const ResourceModel = connection.model('Resource', ResourceSchema);

    const resource = await ResourceModel.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    if (req.body.url !== undefined) {
      if (resource.url) {
        const resourceUrl = resource.url;

        if (resourceUrl) {
          AWS.config.update({
            region: 'ap-south-1', // use your bucket's region
          });

          const s3 = new AWS.S3();
          const url = new URL(resourceUrl);
          const key = decodeURIComponent(url.pathname.substring(1));
          const s3Params = {
            Bucket: 'sims-school-files',
            Key: key
          };
          await s3.deleteObject(s3Params).promise();
        }
      }
      resource.url = req.body.url;
    }

    const updatesToApply = { ...req.body, admin_id: adminId };
    Object.assign(resource, updatesToApply);

    await resource.save();
    res.json(resource);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
exports.updateResourceUnderMyAdmin = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const ResourceModel = connection.model('Resource', ResourceSchema);
    // const TeacherModel = connection.model('Teacher', TeacherSchema);

    const resource = await ResourceModel.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    // const teacher = await TeacherModel.findOne({ users: req.user._id });
    // if (!teacher) {
    //   return res.status(404).json({ message: 'Teacher not found' });
    // }
    if (req.body.url !== undefined) {
      if (resource.url) {
        const resourceUrl = resource.url;

        if (resourceUrl) {
          AWS.config.update({
            region: 'ap-south-1', // use your bucket's region
          });

          const s3 = new AWS.S3();
          const url = new URL(resourceUrl);
          const key = decodeURIComponent(url.pathname.substring(1));
          const s3Params = {
            Bucket: 'sims-school-files',
            Key: key
          };
          await s3.deleteObject(s3Params).promise();
        }
      }
      resource.url = req.body.url;
    }
    
    const updatesToApply = { ...req.body, admin_id: adminId };
    Object.assign(resource, updatesToApply);

    await resource.save();
    res.json(resource);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


exports.deleteResource = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const ResourceModel = connection.model('Resource', ResourceSchema);

    const foundResource = await ResourceModel.findById(req.params.id);
    if (!foundResource) return res.status(404).json({ message: 'Resource not found' });

    const resouceUrl = foundResource.url;
    let publicId = null;
    if (!resouceUrl) {
      publicId = null;
    } else {
      publicId = resouceUrl.split('/').pop().split('.')[0] || null;
    }

    if (publicId) {
      AWS.config.update({
        region: 'ap-south-1', // use your bucket's region
      });

      const s3 = new AWS.S3();
      const url = new URL(resouceUrl);
      const key = decodeURIComponent(url.pathname.substring(1));
      const s3Params = {
        Bucket: 'sims-school-files',
        Key: key
      };
      await s3.deleteObject(s3Params).promise();
    }

    // const resource = await ResourceModel.findByIdAndDelete(req.params.id);
    if (foundResource) {
      await foundResource.deleteOne();
    } else {
      res.status(404).json({ message: "resource not found" });
    }

    res.json({ message: 'Resource deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};