
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config({ path:'../.env' });

const region = process.env.AWS_S3_BUCKET_REGION;
const bucketName = process.env.AWS_S3_BUCKET_NAME;
const accessKey = process.env.AWS_S3_ACCESS_KEY;
const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY;


const s3 = new S3Client({
    region: region,
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey,
    },
    signatureVersion: 'v4'
})

export async function generateUploadURL(fileExtension) {
    try {
        const rawBytes = crypto.randomBytes(16);
        const fileName = rawBytes.toString('hex') + fileExtension;
    
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName
        })
    
        const uploadURL = await getSignedUrl(s3, command, {expiresIn: 60});
        return uploadURL;
    } catch (err) {
        console.error(err);
    }
}