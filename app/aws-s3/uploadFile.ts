import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Request, Response } from 'express';
import fs from 'fs';
import { s3 } from '.';
import db from '../models';
const User = db.user;

export const uploadFile = async (
    source: Express.Multer.File['path'],
    targetName: Express.Multer.File['filename'],
    req: Request,
    res: Response,
    data: Buffer,
    specificFolder?: string
): Promise<{ ok: boolean; Location?: string }> => {
    const putParams = {
        Bucket: 'img-bucket-friendly-carrier',
        Key: specificFolder ? `${specificFolder}/${targetName}` : targetName,
        Body: data,
        ACL: 'public-read-write',
        ContentType: 'image/jpeg',
    };

    let ok = false;
    let Location = undefined;

    s3.upload(putParams, undefined, async (err, data) => {
        if (err) {
            ok = false;
        } else {
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

            Location = data.Location;
            ok = true;
        }
    });

    return {
        ok,
        Location,
    };
};
