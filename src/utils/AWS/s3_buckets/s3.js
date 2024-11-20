const AWS = require("aws-sdk");
require('dotenv').config();


/**
 * configure AWS SDK
 * @returns s3 object
 */
async function initS3() {
  await AWS.config.update({
    region: process.env.AWS_S3_REGION,
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
  });
  return new AWS.S3();
}

/**
 * create new bucket
 * @param {String} bucketName
 */
async function createNewBucket(bucketName) {
  try {
    const s3 = await initS3();
    return new Promise((resolve, reject) => {
      s3.createBucket({ Bucket: bucketName }, (err, res) => {
        if (err) {
          return reject(err);
        } else {
          return resolve(res);
        }
      });
    });
  } catch (error) {
    throw new Error(error);
  }
}


/**
 * To delete bucket
 * @param {String} bucketName
 */
async function destroyBucket(bucketName) {
  try {
    const s3 = await initS3();
    return new Promise((resolve, reject) => {
      s3.deleteBucket({ Bucket: bucketName }, (err, res) => {
        if (err) {
          return reject(err);
        } else {
          return resolve(res);
        }
      });
    });
  } catch (error) {
    throw new Error(error);
  }
}

/**
 * list all the buckets
 */
async function getAllBuckets() {
  try {
    const s3 = await initS3();
    return new Promise((resolve, reject) => {
      s3.listBuckets((err, res) => {
        if (err) {
          return reject(err);
        } else {
          return resolve(res);
        }
      });
    });
  } catch (error) {
    throw new Error(error);
  }
}

/**
 * Upload file to bucket
 * @param {String} bucketName
 * @param {Object} data
 */
async function addFileToBucket(bucketName, data) {
  // console.log("inside",data)
  try {
    const s3 = await initS3();
    return new Promise((resolve, reject) => {
      s3.upload(
        { Bucket: bucketName, Key: data.key, Body: data.body ,ACL:"public-read", ContentEncoding: 'base64',ContentType:"image/png"},
        function (err, res) {
          if (err) {
            return reject(err);
          } else {
            return resolve(res);
          }
        }
      );
    });
  } catch (error) {
    throw new Error(error);
  }
}
/**
 * Upload video to bucket
 * @param {String} bucketName
 * @param {Object} data
 */
async function addVideoToBucket(bucketName, data, fileType) {
  try {
    const s3 = await initS3();
    return new Promise((resolve, reject) => {
      s3.upload(
        { 
          Bucket: bucketName, 
          Key: data.key, 
          Body: data.body,
          ACL: "public-read",
          ContentEncoding: "base64",
          ContentType: `video/${fileType}`,
        },
        function (err, res) {
          if (err) {
            return reject(err);
          } else {
            return resolve(res);
          }
        }
      );
    });
  } catch (error) {
    throw new Error(error);
  }
}
/**
 *
 * @param {String} bucketName
 * @param {String} fileName
 */
async function deleteFileFromBucket(bucketName, fileName) {
  try {
    const s3 = await initS3();
    return new Promise((resolve, reject) => {
      s3.deleteObject({ Bucket: bucketName, Key: fileName }, (err, res) => {
        if (err) {
          return reject(err);
        } else {
          return resolve(res);
        }
      });
    });
  } catch (error) {
    throw new Error(error);
  }
}

/**
 * get a file from bucket using filename
 * @param {String} bucketName
 * @param {String} fileName
 */
async function getFileFromBucket(bucketName, fileName) {
  try {
    const s3 = await initS3();
    return new Promise((resolve, reject) => {
      s3.getObject({ Bucket: bucketName, Key: fileName }, (err, res) => {
        if (err) {
          return reject(err);
        } else {
          return resolve(res);
        }
      });
    });
  } catch (error) {
    throw new Error(error);
  }
}

/**
 * get all files from bucket
 * @param {String} bucketName
 */
async function getAllFilesFromBucket(bucketName) {
  try {
    const s3 = await initS3();
    return new Promise((resolve, reject) => {
      s3.listObjects({ Bucket: bucketName }, (err, res) => {
        if (err) {
          return reject(err);
        } else {
          return resolve(res);
        }
      });
    });
  } catch (error) {
    throw new Error(error);
  }
}

// export
module.exports = {
  initS3,
  createNewBucket,
  destroyBucket,
  getAllBuckets,
  addFileToBucket,
  deleteFileFromBucket,
  getFileFromBucket,
  getAllFilesFromBucket,
  addVideoToBucket
};
