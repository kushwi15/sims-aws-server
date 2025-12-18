const AWS = require('aws-sdk');
require('dotenv').config();

AWS.config.update({
  region: 'eu-north-1',
});

const s3 = new AWS.S3();

const BUCKET_NAME = "sims-school";

/**
 * Calculate total size of files under a prefix (folder)
 * @param {string} bucketName 
 * @param {string} prefix 
 * @returns {Promise<number>}
 */
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
        totalSize += obj.Size || 0; // each file size in bytes
      }
    }

    continuationToken = data.NextContinuationToken;
    
  } while (continuationToken);

  return totalSize;
}

exports.calculatePrefixSize = async (req, res) => {
  try {
    const { prefixName } = req.body || {};
    const inputPrefix = typeof prefixName === 'string' && prefixName.length ? prefixName : '';

    // Normalize prefix to always end with '/'
    const normalizedPrefix = inputPrefix.endsWith('/') ? inputPrefix : `${inputPrefix}/`;

    const sizeInBytes = await getPrefixStorageSize(BUCKET_NAME, normalizedPrefix);
    const sizeInMB = (sizeInBytes / 1024 / 1024).toFixed(5);
    const sizeInGB = (sizeInBytes / 1024 / 1024 / 1024).toFixed(5);
    const sizeInTB = (sizeInBytes / 1024 / 1024 / 1024 / 1024).toFixed(5);

    return res.status(200).json({
      success: true,
      prefix: normalizedPrefix,
      size: {
        bytes: sizeInBytes,
        megabytes: `${sizeInMB} MB`,
        gigabytes: `${sizeInGB} GB`,
        terabytes: `${sizeInTB} TB`
      }
    });

  } catch (error) {
    console.error("S3 Size Calculation Error:", error);

    return res.status(500).json({
      success: false,
      message: "Error calculating folder size.",
      details: error.message || error.code
    });
  }
};
