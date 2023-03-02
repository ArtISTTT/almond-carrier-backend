import { Response } from 'express';
import fs from 'fs';
import { s3 } from '.';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const uploadFile = async (
    source: Express.Multer.File['path'],
    targetName: Express.Multer.File['filename'],
    res: Response
) => {
    console.log('preparing to upload...');

    fs.readFile(source, async (err, filedata) => {
        if (!err) {
            const putParams = {
                Bucket: 'img-bucket-friendly-carrier',
                Key: targetName,
                Body: filedata,
            };

            await s3
                .putObject(putParams, (err, data) => {
                    if (err) {
                        console.log('Could nor upload the file. Error :', err);

                        return res.status(500).send({
                            message: err,
                        });
                    } else {
                        console.log(data);
                        fs.unlink(source, () => {}); // Deleting the file from uploads folder(Optional).Do Whatever you prefer.
                        console.log('Successfully uploaded the file');
                    }
                })
                .promise();

            const uri = await getSignedUrl(s3, { expiresIn: 36000 });

            return res.status(200).send({
                message: 'Avatar successfully updated',
                avatar: '',
            });
        } else {
            res.status(500).send({
                message: err,
            });
        }
    });
};
