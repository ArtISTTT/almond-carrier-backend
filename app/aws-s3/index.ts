import aws from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { keys } from './keys';

export let s3 = new aws.S3();

export const updateAWSConfig = () => {
    aws.config.update({
        accessKeyId: process.env.IAM_ACCESS_ID,
        secretAccessKey: process.env.IAM_SECRET,
        region: 'us-east-1',
    });

    s3 = new aws.S3();
};

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(
            null,
            `${new Date().toISOString()}_${
                req.body.userId
            }_${file.originalname.replace(' ', '')}`
        );
    },
});

export const upload = multer({
    storage,
});
