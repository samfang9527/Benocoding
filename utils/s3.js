
import aws from "aws-sdk";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config({ path:'../.env' });

const region = process.env.AWS_S3_BUCKET_REGION;
const bucketName = process.env.AWS_S3_BUCKET_NAME;
const accessKey = process.env.AWS_S3_ACCESS_KEY;
const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY;

const s3 = new aws.S3({
    region: region,
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
    signatureVersion: 'v4'
})

export async function generateUploadURL(fileExtension) {
    const rawBytes = crypto.randomBytes(16);
    const imageName = rawBytes.toString('hex') + fileExtension;
    
    const params = ({
        Bucket: bucketName,
        Key: imageName,
        Expires: 3600
    })
    console.log(params);
    const uploadURL = await s3.getSignedUrlPromise('putObject', params);
    return uploadURL;
}