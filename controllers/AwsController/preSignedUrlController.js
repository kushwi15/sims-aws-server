const AWS = require('aws-sdk');
require('dotenv').config();

AWS.config.update({
  region: 'ap-south-1',
});

const s3 = new AWS.S3();
const BUCKET_NAME = "sims-school-files";

async function getPrefixStorageSize(bucketName, prefix) {
  let totalSize = 0;
  let continuationToken = undefined;

  do {
    const params = {
      Bucket: bucketName,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    };

    const data = await s3.listObjectsV2(params).promise();

    if (data.Contents) {
      for (const obj of data.Contents) {
        totalSize += obj.Size || 0;
      }
    }

    continuationToken = data.NextContinuationToken;

  } while (continuationToken);

  return totalSize; 
}

exports.generateUrl = async (req, res) => {
  try {
    const { schoolId, folderName, fileName, fileType, cloudStorageLimite, storageType, fileSize } = req.body;

    const unit = (storageType || '').toString().trim().toUpperCase();
    const limit = Number(cloudStorageLimite);
    const sizeOfNewFile = Number(fileSize) || 0;

    const prefix = `${schoolId}/`;

    
    const sizeInBytes = await getPrefixStorageSize(BUCKET_NAME, prefix);

    const multiplier = unit === 'GB'
      ? 1024 * 1024 * 1024
      : unit === 'TB'
      ? 1024 * 1024 * 1024 * 1024
      : unit === 'PB'
      ? 1024 * 1024 * 1024 * 1024 * 1024
      : 1024 * 1024;
    const sizeIn = sizeInBytes / multiplier;
    const limitBytes = Number.isNaN(limit) ? Infinity : limit * multiplier;

    if (limitBytes !== Infinity && sizeInBytes >= limitBytes) {
      return res.status(403).json({
        success: false,
        message: "Sorry... Storage limit exceeded!!!",
        usedGB: sizeIn.toFixed(2)
      });
    }

    if (limitBytes !== Infinity && sizeOfNewFile > 0 && sizeInBytes + sizeOfNewFile > limitBytes) {
      return res.status(403).json({
        success: false,
        message: "Sorry... Storage limit exceeded!!!",
        usedGB: sizeIn.toFixed(2)
      });
    }

    
    const params = {
      Bucket: BUCKET_NAME,
      Key: `${schoolId}/${folderName}/${fileName}`,
      Expires: 60,
      ContentType: fileType,
      ACL: 'public-read'
    };

    const uploadURL = await s3.getSignedUrlPromise('putObject', params);

    res.json({
      success: true,
      message: "Upload allowed",
      uploadURL,
      usedGB: sizeIn.toFixed(2)
    });

  } catch (error) {
    console.error("PreSigned URL Error:", error);
    res.status(500).json({
      success: false,
      message: "Error generating upload URL",
      error: error.message
    });
  }
};
