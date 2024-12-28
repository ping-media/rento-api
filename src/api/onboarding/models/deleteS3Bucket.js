require("dotenv").config();


const deleteS3bucket= async (req, res) => {
    

    const { fileName } = req.body;

    if (!fileName) {
        return res.status(400).send({ message: 'File name is required' });
    }

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
    };

    try {
        await s3.send(new DeleteObjectCommand(params));
        res.status(200).send({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).send({ message: 'Failed to delete file from S3', error: error.message });
    }
};