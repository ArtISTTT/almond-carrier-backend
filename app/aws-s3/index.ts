import aws from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { keys } from './keys';

aws.config.update({
    accessKeyId: keys.iam_access_id,
    secretAccessKey: keys.iam_secret,
    region: 'us-east-1',
});

export const s3 = new aws.S3();

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
