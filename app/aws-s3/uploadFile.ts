import { Request, Response } from 'express';
import fs from 'fs';
import { s3 } from '.';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import db from '../models';
const User = db.user;

export const uploadFile = async (
    source: Express.Multer.File['path'],
    targetName: Express.Multer.File['filename'],
    req: Request,
    res: Response
) => {
    fs.readFile(source, async (err, filedata) => {
        if (!err) {
            const putParams = {
                Bucket: 'img-bucket-friendly-carrier',
                Key: targetName,
                Body: filedata,
                ACL: 'public-read-write',
                ContentType: 'image/jpeg',
            };

            let url = '';

            s3.upload(putParams, undefined, async (err, data) => {
                if (err) {
                    return res.status(500).send({
                        message: err,
                    });
                } else {
                    url = data.Location;

                    await User.updateOne(
                        { _id: req.body.userId },
                        {
                            $set: {
                                avatarImage: data.Location,
                            },
                        },
                        { new: true }
                    );

                    fs.unlink(source, () => {});

                    return res.status(200).send({
                        message: 'Avatar successfully updated',
                        avatar: url,
                    });
                }
            });
        } else {
            res.status(500).send({
                message: err,
            });
        }
    });
};
