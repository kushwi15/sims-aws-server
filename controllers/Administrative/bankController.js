const BankDetailsSchema = require("../../models/AdministrativeSchema/BankDetails");
const cloudinary = require("../../config/cloudinary");
const fs = require("fs");
const ParentSchema = require("../../models/CoreUser/Parent");
const db = require('../../config/db');
const AWS = require('aws-sdk');


exports.uploadBankDetails = async (req, res) => {
  try {

    const { bankName, accountHolderName, accountNumber, ifscCode, upiId, qrFileName } = req.body;
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const BankDetailsModel = connection.model('BankDetails', BankDetailsSchema);

    const data = await BankDetailsModel.create({
      bankName,
      accountHolderName,
      accountNumber,
      ifscCode,
      upiId,
      qrFileName,
      admin_id: userId,
    });

    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getLatestBankDetails = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const BankDetailsModel = connection.model('BankDetails', BankDetailsSchema);
    const all = await BankDetailsModel.find({ admin_id: userId });
    if (!all) return res.status(404).json({ message: 'Bank details not found' });
    res.json(all);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getLatestBankDetailsUnderMyAdmin = async (req, res) => {
  try {
    const { connection, adminId, userId } = await db.getUserSpecificConnection(req.user._id);
    const BankDetailsModel = connection.model('BankDetails', BankDetailsSchema);
    const ParentModel = connection.model('Parent', ParentSchema);
    // const parent = await ParentModel.findOne({ users: req.user._id });
    const all = await BankDetailsModel.find();
    res.json(all);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.deleteBankDetails = async (req, res) => {
  try {
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const BankDetailsModel = connection.model('BankDetails', BankDetailsSchema);
    const deleted = await BankDetailsModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Bank details not found' });

    const imageUrl = deleted.qrFileName;
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

    res.json({ message: 'Bank details deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.updateBankDetails = async (req, res) => {
  try {
    const { connection, adminId } = await db.getUserSpecificConnection(req.user._id);
    const BankDetailsModel = connection.model('BankDetails', BankDetailsSchema);
    const bankinfo = await BankDetailsModel.findById(req.params.id);

    if (req.body.qrFileName !== undefined) {
      if (bankinfo.qrFileName) {
        // first perform delete operation
        const imageUrl = bankinfo.qrFileName;

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
      bankinfo.qrFileName = req.body.qrFileName;
    }

    const updated = {
      bankName: req.body.bankName,
      accountHolderName: req.body.accountHolderName,
      accountNumber: req.body.accountNumber,
      ifscCode: req.body.ifscCode,
      upiId: req.body.upiId,
      qrFileName: bankinfo.qrFileName,
    };

    await bankinfo.save(updated);

    // const updated = await BankDetailsModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    // if (!updated) return res.status(404).json({ message: 'Bank details not found' });
    res.json(bankinfo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
