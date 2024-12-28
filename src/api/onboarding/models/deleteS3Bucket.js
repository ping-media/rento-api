require("dotenv").config();

const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

const deleteS3Bucket= async (fileName) => {
    

    //const { fileName } = req.body;

    if (!fileName) {
        return res.status(400).send({ message: 'File name is required' });
    }

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
    };

    try {
        await s3.send(new DeleteObjectCommand(params));
        console.log(`File ${fileName} deleted successfully from S3`);
      } catch (error) {
        console.error(`Error deleting file ${fileName} from S3:`, error.message);
        throw new Error("Failed to delete file from S3");
      }
};

module.exports={deleteS3Bucket}